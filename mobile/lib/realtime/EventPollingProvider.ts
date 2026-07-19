import type { ShoppingEvent } from "@/features/shopping-item/schemas";
import { MetricNames } from "@shared/metrics/names";
import { intervalTierFromMs } from "@shared/metrics/tags";
import { getMetrics } from "@/lib/metrics";

import { loadEventCursor, saveEventCursor } from "./cursor-store";
import type {
  EventPollingCallbacks,
  EventPollingProvider,
} from "./types";

const INTERVAL_HOT_MS = 3_000;
const INTERVAL_WARM_MS = 5_000;
const INTERVAL_COLD_MS = 10_000;
const IDLE_WARM_MS = 30_000;
const IDLE_COLD_MS = 120_000;
const MAX_PAGES = 20;
const MAX_EVENTS = 1_000;

/**
 * Adaptive event poller for a single active list.
 *
 * @see types.ts ADR — events are refresh signals only.
 */
export function createEventPollingProvider(
  callbacks: EventPollingCallbacks,
): EventPollingProvider {
  let listId: string | null = null;
  let running = false;
  let paused = false;
  let inFlight = false;
  let pendingPoll = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  /** Wall time of last processed non-empty event batch (or start). */
  let lastNonEmptyAt = Date.now();
  let destroyed = false;
  /** True until first fully drained seed (no cursor → catch up without toast). */
  let seeding = false;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const intervalForIdle = (idleMs: number): number => {
    if (idleMs >= IDLE_COLD_MS) return INTERVAL_COLD_MS;
    if (idleMs >= IDLE_WARM_MS) return INTERVAL_WARM_MS;
    return INTERVAL_HOT_MS;
  };

  const emitIntervalTier = (delayMs: number) => {
    const metrics = getMetrics();
    metrics.histogram(MetricNames.realtimePollIntervalMs, delayMs);
    const tier = intervalTierFromMs(delayMs);
    if (tier === "hot") {
      metrics.increment(MetricNames.realtimePollIntervalTierHot);
    } else if (tier === "warm") {
      metrics.increment(MetricNames.realtimePollIntervalTierWarm);
    } else {
      metrics.increment(MetricNames.realtimePollIntervalTierCold);
    }
  };

  const scheduleNext = (delayMs: number) => {
    clearTimer();
    if (!running || paused || destroyed || !listId) return;
    emitIntervalTier(delayMs);
    timer = setTimeout(() => {
      timer = null;
      void runPoll();
    }, delayMs);
  };

  const advanceCursor = async (
    activeListId: string,
    events: ShoppingEvent[],
  ) => {
    const last = events[events.length - 1];
    if (!last) return;
    await saveEventCursor(activeListId, {
      lastEventId: last.id,
      lastUpdatedAt: last.createdAt,
    });
  };

  const runPoll = async () => {
    if (destroyed || !running || paused || !listId) return;
    if (inFlight) {
      pendingPoll = true;
      return;
    }
    if (!callbacks.isOnline()) {
      scheduleNext(INTERVAL_HOT_MS);
      return;
    }

    const activeListId = listId;
    inFlight = true;
    const metrics = getMetrics();
    const pollStarted = Date.now();
    metrics.increment(MetricNames.realtimePollRequests);

    try {
      let cursor = await loadEventCursor(activeListId);
      const bootstrap = seeding || cursor == null;
      let after = cursor?.lastEventId ?? null;
      const collected: ShoppingEvent[] = [];
      let pages = 0;
      let hitCap = false;

      while (pages < MAX_PAGES && collected.length < MAX_EVENTS) {
        if (listId !== activeListId || destroyed || paused) break;

        const page = await callbacks.fetchPage(activeListId, after);
        pages += 1;

        if (page.events.length > 0) {
          collected.push(...page.events);
          after = page.events[page.events.length - 1]?.id ?? after;
        }

        if (!page.nextCursor) break;

        if (pages >= MAX_PAGES || collected.length >= MAX_EVENTS) {
          hitCap = true;
          break;
        }
      }

      metrics.timing(
        MetricNames.realtimePollLatencyMs,
        Date.now() - pollStarted,
      );

      if (hitCap) {
        metrics.increment(MetricNames.realtimePollDrainCap);
        if (__DEV__) {
          console.warn(
            "[realtime]",
            "Event drain cap hit",
            { listId: activeListId, pages, events: collected.length },
          );
        }
      }

      if (listId !== activeListId || destroyed) return;

      if (collected.length > 0) {
        metrics.increment(MetricNames.realtimePollWithEvents);
        metrics.histogram(
          MetricNames.realtimeEventsPerResponse,
          collected.length,
        );
        if (bootstrap) {
          metrics.increment(MetricNames.realtimeSeedingBatches);
        } else {
          metrics.increment(
            MetricNames.realtimeEventsDelivered,
            collected.length,
          );
        }
        await advanceCursor(activeListId, collected);
        lastNonEmptyAt = Date.now();
        callbacks.onBatch(collected, {
          listId: activeListId,
          bootstrap,
        });
        if (!hitCap) seeding = false;
        scheduleNext(INTERVAL_HOT_MS);
      } else {
        metrics.increment(MetricNames.realtimePollEmpty);
        seeding = false;
        const idleMs = Date.now() - lastNonEmptyAt;
        scheduleNext(intervalForIdle(idleMs));
      }
    } catch (error) {
      metrics.increment(MetricNames.realtimePollFailures);
      metrics.timing(
        MetricNames.realtimePollLatencyMs,
        Date.now() - pollStarted,
      );
      callbacks.onError?.(error);
      // Network / server error: stay hot, do not grow idle backoff.
      scheduleNext(INTERVAL_HOT_MS);
    } finally {
      inFlight = false;
      if (pendingPoll) {
        pendingPoll = false;
        void runPoll();
      }
    }
  };

  const start = (nextListId: string) => {
    if (destroyed) return;
    if (listId === nextListId && running) return;
    if (listId && listId !== nextListId) {
      stop();
    }
    listId = nextListId;
    running = true;
    paused = false;
    lastNonEmptyAt = Date.now();
    getMetrics().gauge(MetricNames.realtimeActivePollers, 1);
    void (async () => {
      const existing = await loadEventCursor(nextListId);
      seeding = existing == null;
      void runPoll();
    })();
  };

  const stop = () => {
    running = false;
    paused = false;
    pendingPoll = false;
    clearTimer();
    listId = null;
    getMetrics().gauge(MetricNames.realtimeActivePollers, 0);
  };

  const pause = () => {
    paused = true;
    pendingPoll = false;
    clearTimer();
    getMetrics().gauge(MetricNames.realtimeActivePollers, 0);
  };

  const resume = () => {
    if (!running || !listId || destroyed) return;
    paused = false;
    getMetrics().gauge(MetricNames.realtimeActivePollers, 1);
    void runPoll();
  };

  const pollNow = () => {
    if (destroyed || !running || !listId) return;
    getMetrics().increment(MetricNames.realtimePollNow);
    paused = false;
    clearTimer();
    void runPoll();
  };

  const destroy = () => {
    destroyed = true;
    stop();
  };

  return {
    start,
    stop,
    pollNow,
    isRunning: () => running && !paused && listId != null,
    getCurrentListId: () => listId,
    destroy,
    pause,
    resume,
  };
}

export type EventPollingProviderInstance = ReturnType<
  typeof createEventPollingProvider
>;

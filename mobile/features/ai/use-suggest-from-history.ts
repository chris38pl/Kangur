import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAppResult } from "@/components/AppResultProvider";
import {
  abandonSuggestFromHistory,
  applySuggestFromHistory,
  suggestFromHistory,
} from "@/features/ai/api";
import type { SuggestFromHistoryResponse } from "@/features/ai/schemas";
import {
  bumpAiCreditsOptimistic,
  invalidateAiCredits,
} from "@/features/billing/ai-credits-query";
import {
  patchShoppingListItemCount,
  refreshWorkspaceListIndex,
} from "@/features/shopping-list/refresh-workspace-list-index";
import {
  getCreditShortage,
  isInsufficientCreditsError,
} from "@/lib/ai/insufficientCredits";
import { ApiClientError } from "@/lib/api/client";
import { isHistorySuggestionsEnabled } from "@/lib/featureGates";
import { finishTaskAndOpen } from "@/lib/navigation";

type Options = {
  workspaceId: string | null | undefined;
  /**
   * When set, accepted products are appended to this list and the screen stays.
   * Omit to create a new list and open it.
   */
  appendToListId?: string;
  onApplied?: (result: { listId: string; applied: number }) => void;
};

export function useSuggestFromHistory({
  workspaceId,
  appendToListId,
  onApplied,
}: Options) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const {
    show,
    showError,
    showInsufficientCredits,
    visible: resultVisible,
  } = useAppResult();
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState<SuggestFromHistoryResponse | null>(null);
  const requestIdRef = useRef(0);
  const onAppliedRef = useRef(onApplied);
  onAppliedRef.current = onApplied;

  const showAlreadyOnList = useCallback(() => {
    show({
      variant: "info",
      title: t("ai.historyAlreadyOnListTitle"),
      description: t("ai.historyAlreadyOnListBody"),
    });
  }, [show, t]);

  const close = useCallback(async () => {
    requestIdRef.current += 1;
    if (loading) {
      setLoading(false);
      setRun(null);
      return;
    }
    const current = run;
    setRun(null);
    if (!current || !workspaceId) return;
    try {
      const token = await getToken();
      if (!token) return;
      await abandonSuggestFromHistory(token, workspaceId, current.runId);
    } catch {
      // Best-effort abandon
    }
  }, [getToken, loading, run, workspaceId]);

  const start = useCallback(async () => {
    if (!workspaceId) return;
    if (!isHistorySuggestionsEnabled()) {
      showError({
        title: t("ai.suggestErrorTitle"),
        description: t("ai.suggestFeatureDisabled"),
      });
      return;
    }

    const requestId = ++requestIdRef.current;
    setRun(null);
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");

      const result = await suggestFromHistory(
        token,
        workspaceId,
        appendToListId ? { listId: appendToListId } : undefined,
      );
      if (requestIdRef.current !== requestId) {
        try {
          await abandonSuggestFromHistory(token, workspaceId, result.runId);
        } catch {
          // best-effort
        }
        return;
      }
      bumpAiCreditsOptimistic(queryClient, workspaceId);
      void invalidateAiCredits(queryClient, workspaceId);
      setRun(result);
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      setRun(null);
      if (
        error instanceof ApiClientError &&
        error.code === "HISTORY_ALREADY_ON_LIST"
      ) {
        showAlreadyOnList();
        return;
      }
      if (isInsufficientCreditsError(error)) {
        const shortage = getCreditShortage(error) ?? {
          needed: 1,
          remaining: 0,
        };
        showInsufficientCredits({
          ...shortage,
          description: t("ai.insufficientCreditsBody"),
        });
        return;
      }
      if (error instanceof ApiClientError) {
        if (error.code === "NOT_FOUND" || error.status === 404) {
          showError({
            title: t("ai.suggestErrorTitle"),
            description: t("ai.suggestNoHistory"),
          });
          return;
        }
        if (error.code === "FORBIDDEN" || error.status === 403) {
          showError({
            title: t("ai.suggestErrorTitle"),
            description: t("ai.suggestFeatureDisabled"),
          });
          return;
        }
      }
      showError({
        title: t("ai.suggestErrorTitle"),
        description: t("ai.suggestUnavailable"),
        primaryLabel: t("common.tryAgain"),
        secondaryLabel: t("common.return"),
        onPrimary: () => {
          void start();
        },
      });
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [
    appendToListId,
    getToken,
    queryClient,
    showAlreadyOnList,
    showError,
    showInsufficientCredits,
    t,
    workspaceId,
  ]);

  const confirm = useCallback(
    async (acceptedIds: string[]) => {
      if (!workspaceId || !run || acceptedIds.length === 0) return;
      setBusy(true);
      try {
        const token = await getToken();
        if (!token) throw new Error("Missing auth token");

        const result = await applySuggestFromHistory(token, workspaceId, {
          runId: run.runId,
          acceptedProposalRowIds: acceptedIds,
        });

        setRun(null);

        if (appendToListId) {
          patchShoppingListItemCount(
            queryClient,
            workspaceId,
            result.list.id,
            result.applied,
          );
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ["shopping-list", result.list.id],
            }),
            queryClient.invalidateQueries({
              queryKey: ["shopping-items", result.list.id],
            }),
            invalidateAiCredits(queryClient, workspaceId),
          ]);
          void refreshWorkspaceListIndex(queryClient, workspaceId);
        } else {
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ["shopping-lists", workspaceId],
            }),
            queryClient.invalidateQueries({
              queryKey: ["shopping-lists-history", workspaceId],
            }),
            queryClient.invalidateQueries({
              queryKey: ["shopping-items", result.list.id],
            }),
            invalidateAiCredits(queryClient, workspaceId),
          ]);
          finishTaskAndOpen(`/list/${result.list.id}` as never);
        }

        onAppliedRef.current?.({
          listId: result.list.id,
          applied: result.applied,
        });
      } catch (error) {
        if (
          error instanceof ApiClientError &&
          error.code === "HISTORY_ALREADY_ON_LIST"
        ) {
          const runId = run.runId;
          setRun(null);
          try {
            const token = await getToken();
            if (token) {
              await abandonSuggestFromHistory(token, workspaceId, runId);
            }
          } catch {
            // best-effort
          }
          showAlreadyOnList();
          return;
        }
        if (error instanceof ApiClientError) {
          if (error.code === "CONFLICT" || error.status === 409) {
            setRun(null);
            showError({
              title: t("ai.suggestErrorTitle"),
              description: t("ai.suggestAlreadyApplied"),
            });
            return;
          }
          if (error.code === "NOT_FOUND" || error.status === 404) {
            showError({
              title: t("ai.suggestErrorTitle"),
              description: t("ai.suggestApplyNotFound"),
              secondaryLabel: t("common.return"),
              primaryLabel: t("common.tryAgain"),
              onPrimary: () => {
                void confirm(acceptedIds);
              },
            });
            return;
          }
        }
        showError({
          title: t("ai.suggestErrorTitle"),
          description: t("ai.suggestApplyFailed"),
          secondaryLabel: t("common.return"),
          primaryLabel: t("common.tryAgain"),
          onPrimary: () => {
            void confirm(acceptedIds);
          },
        });
      } finally {
        setBusy(false);
      }
    },
    [
      appendToListId,
      getToken,
      queryClient,
      run,
      showAlreadyOnList,
      showError,
      t,
      workspaceId,
    ],
  );

  return {
    loading,
    busy,
    run,
    resultVisible,
    start,
    close,
    confirm,
  };
}

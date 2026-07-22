/**
 * Product analytics event catalogue (M13.11).
 * Naming: snake_case, past tense, no mobile_/backend_ prefixes.
 * Always emit via Analytics.track — never raw PostHog SDK.
 */

export const ANALYTICS_SCHEMA_VERSION = 1 as const;

export type AiImportSource = "screenshot" | "text" | "clipboard";

type WorkspaceIdProps = { workspace_id: string };
type ListIdProps = { list_id: string };
type RequestIdProps = { request_id?: string };

export type EventPropsMap = {
  account_created: { auth_provider?: string };
  workspace_created: { is_default_home: boolean } & WorkspaceIdProps;
  first_list_created: WorkspaceIdProps & ListIdProps;
  first_shopping_session: WorkspaceIdProps & ListIdProps;
  first_ai_import: WorkspaceIdProps & { source: AiImportSource };
  shopping_started: WorkspaceIdProps &
    ListIdProps & { item_count: number; request_id?: string };
  shopping_finished: WorkspaceIdProps &
    ListIdProps & {
      item_count: number;
      duration_sec?: number;
    };
  shopping_cancelled: WorkspaceIdProps & ListIdProps & { item_count: number };
  ai_import_started: WorkspaceIdProps &
    ListIdProps &
    RequestIdProps & { source: AiImportSource };
  ai_import_edited: WorkspaceIdProps &
    ListIdProps &
    RequestIdProps & { edited_count: number };
  ai_import_accepted: WorkspaceIdProps &
    ListIdProps &
    RequestIdProps & {
      source: AiImportSource;
      proposal_item_count: number;
      credit_cost?: number;
    };
  ai_import_rejected: WorkspaceIdProps &
    ListIdProps &
    RequestIdProps & { source: AiImportSource };
  ai_import_failed: WorkspaceIdProps &
    ListIdProps &
    RequestIdProps & {
      source?: AiImportSource;
      code?: string;
    };
  history_ai_generate_started: WorkspaceIdProps;
  history_ai_generate_reviewed: WorkspaceIdProps & { run_id: string };
  history_ai_generate_applied: WorkspaceIdProps & {
    run_id: string;
    list_id: string;
  };
  history_ai_generate_cancelled: WorkspaceIdProps & { run_id: string };
  invitation_sent: WorkspaceIdProps;
  invitation_accepted: WorkspaceIdProps;
  paywall_viewed: WorkspaceIdProps & { surface?: string };
  checkout_started: WorkspaceIdProps;
  subscription_activated: WorkspaceIdProps;
  subscription_cancelled: WorkspaceIdProps;
  subscription_expired: WorkspaceIdProps;
  history_opened: Record<string, never>;
  history_search: { had_query: boolean };
  history_repeat: { source_list_id: string };
  history_repeat_completed: {
    source_list_id: string;
    new_list_id: string;
  };
  history_restore: { list_id: string };
  /** Backend AI model call cost (no prompt/content). */
  ai_model_completed: WorkspaceIdProps &
    RequestIdProps & {
      provider: string;
      model: string;
      latency_ms: number;
      tokens?: number;
      estimated_cost_usd?: number;
      ok: boolean;
    };
  meal_proposal_generated: WorkspaceIdProps &
    ListIdProps & { meal_count: 1 | 2 };
  meal_proposal_accepted: WorkspaceIdProps &
    ListIdProps & { meal_count: 1 | 2 };
  meal_proposal_failed: WorkspaceIdProps &
    ListIdProps & { code: string };
  // Future (M20–M22) — names reserved; do not emit until owned in matrix + UI
  recipe_discovery_opened: Record<string, never>;
  recipe_card_liked: { card_index: number };
  recipe_card_rejected: { card_index: number };
  /** @deprecated Prefer meal_proposal_accepted */
  recipe_to_list_accepted: WorkspaceIdProps & ListIdProps;
  store_recommendation_shown: WorkspaceIdProps & ListIdProps;
  store_recommendation_selected: WorkspaceIdProps &
    ListIdProps & { chain_id?: string };
};

export type EventName = keyof EventPropsMap;

export type AnalyticsBaseProps = {
  schemaVersion: typeof ANALYTICS_SCHEMA_VERSION;
};

export type TrackProps<E extends EventName> = EventPropsMap[E] &
  Partial<AnalyticsBaseProps>;

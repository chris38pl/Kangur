/**
 * Event ownership matrix (M13.11).
 * Every new event MUST be added here before implementation.
 * Same name must not fire from both sides on the happy path.
 */

export type EventEmitter = "mobile" | "backend" | "mobile_or_backend_failure";

/** Ownership SoT — see roadmap M13.11 / implementation plan. */
export const EVENT_OWNERSHIP = {
  account_created: "backend",
  workspace_created: "backend",
  first_list_created: "mobile",
  first_shopping_session: "mobile",
  first_ai_import: "mobile",
  shopping_started: "mobile",
  shopping_finished: "mobile",
  shopping_cancelled: "mobile",
  ai_import_started: "mobile",
  ai_import_edited: "mobile",
  ai_import_accepted: "mobile",
  ai_import_rejected: "mobile",
  ai_import_failed: "mobile_or_backend_failure",
  history_ai_generate_started: "backend",
  history_ai_generate_reviewed: "backend",
  history_ai_generate_applied: "backend",
  history_ai_generate_cancelled: "backend",
  invitation_sent: "backend",
  invitation_accepted: "backend",
  paywall_viewed: "mobile",
  checkout_started: "mobile",
  subscription_activated: "backend",
  subscription_cancelled: "backend",
  subscription_expired: "backend",
  history_opened: "mobile",
  history_search: "mobile",
  history_repeat: "mobile",
  history_repeat_completed: "mobile",
  history_restore: "mobile",
  meal_proposal_generated: "backend",
  meal_proposal_accepted: "mobile",
  meal_proposal_failed: "mobile_or_backend_failure",
  // Future placeholders (emit later)
  recipe_discovery_opened: "mobile",
  recipe_card_liked: "mobile",
  recipe_card_rejected: "mobile",
  recipe_to_list_accepted: "mobile",
  store_recommendation_shown: "mobile",
  store_recommendation_selected: "mobile",
  ai_model_completed: "backend",
} as const satisfies Record<string, EventEmitter>;

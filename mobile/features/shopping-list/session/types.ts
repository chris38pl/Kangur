import type { ShoppingCategory, ItemStatus } from "@/features/shopping-item/schemas";

export type SessionState =
  | "IDLE"
  | "STARTING"
  | "ACTIVE"
  | "FINISHING"
  | "ENDED";

export type SessionSnapshot = {
  sessionVersion: 1;
  listId: string;
  workspaceId: string;
  state: SessionState;
  startedAt: string;
  updatedAt: string;
  /** Server shopping session id (M09.5) */
  serverSessionId?: string;
  /** Local hide after finish-offline before server archive lands */
  locallyHidden?: boolean;
};

export type SessionItemPatch = {
  itemId: string;
  status: ItemStatus;
};

export type SessionAddItem = {
  clientId: string;
  name: string;
  amount?: string;
  note?: string;
  category: ShoppingCategory;
};

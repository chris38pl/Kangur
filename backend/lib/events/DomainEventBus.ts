export type DomainEventType =
  | "InvitationCreated"
  | "ShoppingListCreated"
  | "ShoppingListDeleted"
  | "ShoppingStarted"
  | "ShoppingFinished"
  | "NotificationCreated";

export type DomainEvent =
  | {
      type: "InvitationCreated";
      workspaceId: string;
      workspaceName: string;
      workspaceIcon: string;
      invitationId: string;
      inviteeEmail: string;
      actorUserId: string;
      actorDisplayName: string;
    }
  | {
      type: "ShoppingListCreated";
      workspaceId: string;
      listId: string;
      listName: string;
      listEmoji: string;
      itemCount: number;
      actorUserId: string;
      actorDisplayName: string;
    }
  | {
      type: "ShoppingListDeleted";
      workspaceId: string;
      listId: string;
      listName: string;
      listEmoji: string;
      actorUserId: string;
      actorDisplayName: string;
    }
  | {
      type: "ShoppingStarted";
      workspaceId: string;
      workspaceName: string;
      workspaceIcon: string;
      listId: string;
      listName: string;
      listEmoji: string;
      sessionId: string;
      actorUserId: string;
      actorDisplayName: string;
    }
  | {
      type: "ShoppingFinished";
      workspaceId: string;
      workspaceName: string;
      workspaceIcon: string;
      listId: string;
      listName: string;
      listEmoji: string;
      sessionId: string;
      actorUserId: string;
      actorDisplayName: string;
      unavailableCount: number;
      boughtCount: number;
      itemCount: number;
    }
  | {
      type: "NotificationCreated";
      notificationId: string;
      recipientUserId: string;
      title: string;
      body: string;
      payloadType: string;
      payloadSchemaVersion: number;
      payload: unknown;
    };

type Handler = (event: DomainEvent) => Promise<void>;

const handlers = new Map<DomainEventType, Handler[]>();

export const domainEventBus = {
  subscribe(type: DomainEventType, handler: Handler): void {
    const list = handlers.get(type) ?? [];
    list.push(handler);
    handlers.set(type, list);
  },

  async publish(event: DomainEvent): Promise<void> {
    const list = handlers.get(event.type) ?? [];
    if (list.length === 0) return;

    const results = await Promise.allSettled(list.map((h) => h(event)));
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("[events]", "HandlerFailed", {
          type: event.type,
          error: result.reason,
        });
      }
    }
  },
};

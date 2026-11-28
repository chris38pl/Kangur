export type DomainEventType =
  | "InvitationCreated"
  | "ShoppingListCreated"
  | "ShoppingListDeleted"
  | "ShoppingStarted"
  | "ShoppingFinished"
  | "WorkspaceMemberJoined"
  | "NotificationCreated";

/**
 * People are passed by id. Each notification picks the actor's name for its own recipient
 * (language, two people of one name), so events carry no display names.
 */
export type DomainEvent =
  | {
      type: "InvitationCreated";
      workspaceId: string;
      workspaceName: string;
      workspaceIcon: string;
      invitationId: string;
      /** The Kangur account the address belongs to, if any (found in Clerk or Kangur). */
      inviteeUserId: string | null;
      actorUserId: string;
    }
  | {
      type: "ShoppingListCreated";
      workspaceId: string;
      listId: string;
      listName: string;
      listEmoji: string;
      itemCount: number;
      actorUserId: string;
    }
  | {
      type: "ShoppingListDeleted";
      workspaceId: string;
      listId: string;
      listName: string;
      listEmoji: string;
      actorUserId: string;
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
      unavailableCount: number;
      boughtCount: number;
      itemCount: number;
    }
  | {
      /** Someone joined through an invitation: the inviter hears about it (app 1.0.9+). */
      type: "WorkspaceMemberJoined";
      workspaceId: string;
      workspaceName: string;
      workspaceIcon: string;
      invitationId: string;
      inviterUserId: string;
      memberUserId: string;
    }
  | {
      type: "NotificationCreated";
      notificationId: string;
      recipientUserId: string;
      notificationType: string;
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

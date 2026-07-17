import { Prisma } from "@prisma/client";

export async function appendShoppingEvent(
  tx: Prisma.TransactionClient,
  input: {
    listId: string;
    actorUserId: string;
    type:
      | "list_created"
      | "item_created"
      | "item_updated"
      | "item_status_changed"
      | "ai_applied";
    payload?: Prisma.InputJsonValue | null;
  },
) {
  await tx.shoppingEvent.create({
    data: {
      listId: input.listId,
      actorUserId: input.actorUserId,
      type: input.type,
      payload:
        input.payload === undefined || input.payload === null
          ? Prisma.JsonNull
          : input.payload,
    },
  });
}

export function toShoppingItemDto(item: {
  id: string;
  clientId: string | null;
  listId: string;
  name: string;
  normalizedName: string | null;
  amount: string | null;
  note: string | null;
  category: string;
  status: string;
  sortOrder: number;
  addedByUserId: string;
  updatedByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    clientId: item.clientId,
    listId: item.listId,
    name: item.name,
    normalizedName: item.normalizedName,
    amount: item.amount,
    note: item.note,
    category: item.category,
    status: item.status,
    sortOrder: item.sortOrder,
    addedByUserId: item.addedByUserId,
    updatedByUserId: item.updatedByUserId,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function toShoppingEventDto(event: {
  id: string;
  listId: string;
  actorUserId: string;
  type: string;
  payload: unknown;
  createdAt: Date;
}) {
  return {
    id: event.id,
    listId: event.listId,
    actorUserId: event.actorUserId,
    type: event.type,
    payload: event.payload,
    createdAt: event.createdAt.toISOString(),
  };
}

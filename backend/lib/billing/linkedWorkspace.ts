/**
 * One store subscription (Apple originalTransactionId, Google purchase token)
 * belongs to one workspace. A later verify must not grant Premium elsewhere.
 */
export function isStoreSubscriptionLinkedElsewhere(
  existingWorkspaceId: string | null | undefined,
  requestedWorkspaceId: string,
): boolean {
  return (
    typeof existingWorkspaceId === "string" &&
    existingWorkspaceId.length > 0 &&
    existingWorkspaceId !== requestedWorkspaceId
  );
}

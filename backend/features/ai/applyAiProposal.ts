import { Prisma } from "@prisma/client";
import { z } from "zod";

import { debitAiCredits } from "@/lib/aiCredits";
import { authorizeList } from "@/lib/authorize";
import { conflict, notFound } from "@/lib/auth/errors";
import { appendShoppingEvent } from "@/lib/events/appendShoppingEvent";
import { prisma } from "@/lib/prisma";

import { toShoppingItemDto } from "../shopping-item/toShoppingItemDto";
import { ApplyAiProposalBodySchema } from "./schemas";

type ApplyBody = z.infer<typeof ApplyAiProposalBodySchema>;

export async function applyAiProposal(input: {
  listId: string;
  userId: string;
  body: ApplyBody;
}) {
  const { list } = await authorizeList(input.listId, input.userId);
  const run = await prisma.aiIngestRun.findUnique({
    where: { id: input.body.runId },
  });

  if (!run || run.listId !== list.id) {
    throw notFound("AI run not found.");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      for (const operation of input.body.operations) {
        if (operation.op === "ignore") continue;

        if (operation.op === "create") {
          const last = await tx.shoppingItem.findFirst({
            where: { listId: list.id },
            orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
            select: { sortOrder: true },
          });

          await tx.shoppingItem.create({
            data: {
              listId: list.id,
              clientId: operation.clientId ?? null,
              name: operation.name.trim(),
              normalizedName: operation.name.trim().toLowerCase(),
              amount: operation.amount ?? null,
              note: operation.note ?? null,
              category: operation.category,
              status: "pending",
              sortOrder: (last?.sortOrder ?? -1) + 1,
              addedByUserId: input.userId,
              updatedByUserId: input.userId,
            },
          });
          continue;
        }

        const target = await tx.shoppingItem.findUnique({
          where: { id: operation.targetItemId },
        });

        if (!target || target.listId !== list.id) {
          throw notFound("Target item not found.");
        }

        await tx.shoppingItem.update({
          where: { id: target.id },
          data: {
            ...(operation.name !== undefined
              ? {
                  name: operation.name.trim(),
                  normalizedName: operation.name.trim().toLowerCase(),
                }
              : {}),
            ...(operation.amount !== undefined ? { amount: operation.amount } : {}),
            ...(operation.note !== undefined ? { note: operation.note } : {}),
            ...(operation.category !== undefined
              ? { category: operation.category }
              : {}),
            ...(operation.op === "update" && operation.status !== undefined
              ? { status: operation.status }
              : {}),
            updatedByUserId: input.userId,
          },
        });
      }

      await appendShoppingEvent(tx, {
        listId: list.id,
        actorUserId: input.userId,
        type: "ai_applied",
        payload: {
          runId: run.id,
          appliedOperations: input.body.operations.filter((op) => op.op !== "ignore")
            .length,
        },
      });

      await tx.aiIngestRun.update({
        where: { id: run.id },
        data: {
          status: "applied",
          appliedAt: new Date(),
        },
      });

      const items = await tx.shoppingItem.findMany({
        where: {
          listId: list.id,
          status: { not: "removed" },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });

      const applied = input.body.operations.filter(
        (op) => op.op !== "ignore",
      ).length;

      if (applied > 0) {
        await debitAiCredits(list.workspaceId, run.source, tx);
      }

      return {
        applied,
        items: items.map(toShoppingItemDto),
      };
    });

    return result;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict("Item clientId already exists.");
    }
    throw error;
  }
}

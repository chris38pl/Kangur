import { Prisma } from "@prisma/client";
import { z } from "zod";

import { authorizeList } from "@/lib/authorize";
import { conflict, notFound, validationError } from "@/lib/auth/errors";
import { appendShoppingEvent } from "@/lib/events/appendShoppingEvent";
import { prisma } from "@/lib/prisma";

import { maybePublishShoppingListCreated } from "../shopping-list/maybePublishShoppingListCreated";
import { toShoppingItemDto } from "../shopping-item/toShoppingItemDto";
import { applyUntitledListTitleFromProposal } from "./applyUntitledListTitle";
import {
  AiProposalSchema,
  ApplyAiProposalBodySchema,
  MealProposalSchema,
  type ProposalOperation,
} from "./schemas";

type ApplyBody = z.infer<typeof ApplyAiProposalBodySchema>;

const MAX_AMOUNT_CHARS = 64;
const MAX_NOTE_CHARS = 240;

function capNullable(value: string | null | undefined, max: number) {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function storedOperationsByRowId(
  proposalJson: unknown,
): Map<string, ProposalOperation> {
  const listProposal = AiProposalSchema.safeParse(proposalJson);
  if (listProposal.success) {
    return new Map(
      listProposal.data.operations.map((op) => [op.proposalRowId, op]),
    );
  }

  const mealProposal = MealProposalSchema.safeParse(proposalJson);
  if (mealProposal.success) {
    return new Map(
      mealProposal.data.operations.map((op) => [op.proposalRowId, op]),
    );
  }

  throw validationError("Stored AI proposal is invalid.");
}

export async function applyAiProposal(input: {
  listId: string;
  userId: string;
  body: ApplyBody;
}) {
  const { list } = await authorizeList(input.listId, input.userId);
  const run = await prisma.aiProposalRun.findUnique({
    where: { id: input.body.runId },
  });

  if (!run || run.listId !== list.id) {
    throw notFound("AI run not found.");
  }

  if (run.status !== "proposed") {
    throw conflict("AI run is no longer proposed.");
  }

  const byRowId = storedOperationsByRowId(run.proposal);

  const rehydrated = input.body.operations.map((decision) => {
    const stored = byRowId.get(decision.proposalRowId);
    if (!stored) {
      throw validationError("Invalid proposalRowId.", {
        proposalRowId: decision.proposalRowId,
      });
    }

    if (decision.op === "ignore") {
      return { op: "ignore" as const, proposalRowId: decision.proposalRowId };
    }

    const name = stored.name.trim();
    const amount = capNullable(stored.amount, MAX_AMOUNT_CHARS);
    const note = capNullable(stored.note, MAX_NOTE_CHARS);
    const category = stored.category;

    if (decision.op === "create") {
      return {
        op: "create" as const,
        proposalRowId: decision.proposalRowId,
        clientId: decision.clientId,
        name,
        amount,
        note,
        category,
      };
    }

    if (decision.op === "merge") {
      return {
        op: "merge" as const,
        proposalRowId: decision.proposalRowId,
        targetItemId: decision.targetItemId,
        name,
        amount,
        note,
        category,
      };
    }

    return {
      op: "update" as const,
      proposalRowId: decision.proposalRowId,
      targetItemId: decision.targetItemId,
      name,
      amount,
      note,
      category,
      status: decision.status,
    };
  });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const claimed = await tx.aiProposalRun.updateMany({
        where: { id: run.id, status: "proposed" },
        data: {
          status: "applied",
          appliedAt: new Date(),
        },
      });

      if (claimed.count !== 1) {
        throw conflict("AI run is no longer proposed.");
      }

      const creates = rehydrated.filter((op) => op.op === "create");
      const mutations = rehydrated.filter(
        (op) => op.op === "update" || op.op === "merge",
      );

      if (creates.length > 0) {
        const last = await tx.shoppingItem.findFirst({
          where: { listId: list.id },
          orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
          select: { sortOrder: true },
        });
        let nextSort = (last?.sortOrder ?? -1) + 1;

        const seen = new Set<string>();
        const uniqueCreates = creates.filter((op) => {
          if (op.op !== "create") return false;
          const key = op.name.trim().toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        const existing = await tx.shoppingItem.findMany({
          where: {
            listId: list.id,
            status: { not: "removed" },
            normalizedName: { in: [...seen] },
          },
          select: { normalizedName: true },
        });
        const existingNames = new Set(
          existing.map((row) => row.normalizedName),
        );

        const toInsert = uniqueCreates.filter((op) => {
          if (op.op !== "create") return false;
          return !existingNames.has(op.name.trim().toLowerCase());
        });

        if (toInsert.length > 0) {
          await tx.shoppingItem.createMany({
            data: toInsert.map((op) => {
              const sortOrder = nextSort;
              nextSort += 1;
              if (op.op !== "create") {
                throw new Error("Unexpected non-create in toInsert");
              }
              return {
                listId: list.id,
                clientId: op.clientId ?? null,
                name: op.name.trim(),
                normalizedName: op.name.trim().toLowerCase(),
                amount: op.amount ?? null,
                note: op.note ?? null,
                category: op.category,
                status: "pending" as const,
                sortOrder,
                addedByUserId: input.userId,
                updatedByUserId: input.userId,
              };
            }),
            skipDuplicates: true,
          });
        }
      }

      for (const operation of mutations) {
        const target = await tx.shoppingItem.findUnique({
          where: { id: operation.targetItemId },
        });

        if (!target || target.listId !== list.id) {
          throw notFound("Target item not found.");
        }

        await tx.shoppingItem.update({
          where: { id: target.id },
          data: {
            name: operation.name.trim(),
            normalizedName: operation.name.trim().toLowerCase(),
            amount: operation.amount ?? null,
            note: operation.note ?? null,
            category: operation.category,
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
          appliedOperations: rehydrated.filter((op) => op.op !== "ignore")
            .length,
        },
      });

      const items = await tx.shoppingItem.findMany({
        where: {
          listId: list.id,
          status: { not: "removed" },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });

      const applied = rehydrated.filter((op) => op.op !== "ignore").length;

      return {
        applied,
        items: items.map(toShoppingItemDto),
      };
    });

    await applyUntitledListTitleFromProposal({
      listId: list.id,
      proposal: run.proposal,
    });

    if (result.applied > 0) {
      await maybePublishShoppingListCreated({
        listId: list.id,
        actorUserId: input.userId,
      });
    }

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

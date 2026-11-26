import { Prisma } from "@prisma/client";
import { z } from "zod";

import { authorizeList } from "@/lib/authorize";
import { conflict, notFound, validationError } from "@/lib/auth/errors";
import { appendShoppingEvent } from "@/lib/events/appendShoppingEvent";
import { MEAL_PROPOSAL_TYPE } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

import { maybePublishShoppingListCreated } from "../shopping-list/maybePublishShoppingListCreated";
import { toShoppingItemDto } from "../shopping-item/toShoppingItemDto";
import { applyUntitledListTitleFromProposal } from "./applyUntitledListTitle";
import { excludeRepeatedCreates } from "./excludeRepeatedCreates";
import {
  AiProposalSchema,
  ApplyAiProposalBodySchema,
  MealProposalSchema,
  type ProposalOperation,
} from "./schemas";
import {
  MEAL_ROWS_PER_DISH_VERSION,
  joinKeptMealRows,
} from "./mealIngredientOperations";
import { resolveWorkspaceOutputLanguage } from "./outputLanguage";

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

/**
 * Meal runs since MEAL_ROWS_PER_DISH_VERSION hold one row per dish, and the
 * rows the user kept are joined here. Older meal runs hold one row per
 * ingredient, already joined, and are applied as stored, like an import.
 */
function holdsMealRowsPerDish(run: {
  proposalType: string;
  proposalVersion: number;
}): boolean {
  return (
    run.proposalType === MEAL_PROPOSAL_TYPE &&
    run.proposalVersion >= MEAL_ROWS_PER_DISH_VERSION
  );
}

/**
 * The kept rows of a meal run, one operation per ingredient. A merge joins
 * with the list item as it is now, so an edit made during the review stays.
 * The note "na A i B" is in the language of the user who asked for the meals,
 * the language the dish titles were written in.
 */
async function keptMealOperations(input: {
  proposal: unknown;
  listId: string;
  workspaceId: string;
  requestedByUserId: string;
  decisions: ApplyBody["operations"];
}) {
  const stored = MealProposalSchema.safeParse(input.proposal);
  if (!stored.success) {
    throw validationError("Stored AI proposal is invalid.");
  }

  const targetIds = [
    ...new Set(
      input.decisions.flatMap((decision) =>
        decision.op === "merge" ? [decision.targetItemId] : [],
      ),
    ),
  ];
  const [targets, language] = await Promise.all([
    targetIds.length > 0
      ? prisma.shoppingItem.findMany({
          where: { id: { in: targetIds }, listId: input.listId },
          select: { id: true, amount: true, note: true },
        })
      : Promise.resolve([]),
    resolveWorkspaceOutputLanguage(input.workspaceId, input.requestedByUserId),
  ]);

  return joinKeptMealRows({
    meals: stored.data.meals,
    rows: stored.data.operations,
    decisions: input.decisions,
    targets: new Map(targets.map((item) => [item.id, item])),
    language,
  });
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

  const decided = input.body.operations.map((decision) => {
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

  // A meal run holds one row per dish. The rows the user kept become one item
  // per ingredient, with the amounts, notes and dish names of those rows only.
  const rehydrated: (typeof decided)[number][] = holdsMealRowsPerDish(run)
    ? [
        ...(
          await keptMealOperations({
            proposal: run.proposal,
            listId: list.id,
            workspaceId: list.workspaceId,
            requestedByUserId: run.userId,
            decisions: input.body.operations,
          })
        ).map((op) => ({
          ...op,
          name: op.name.trim(),
          amount: capNullable(op.amount, MAX_AMOUNT_CHARS),
          note: capNullable(op.note, MAX_NOTE_CHARS),
        })),
        ...decided.filter((op) => op.op === "update"),
      ]
    : decided;

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

      const creates = rehydrated.flatMap((op) =>
        op.op === "create" ? [op] : [],
      );
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

        // One name can hold two products ("Mleko" 2% and "Mleko" bez laktozy):
        // only a row with the same name, amount and note is a repeat.
        const itemsOnList = await tx.shoppingItem.findMany({
          where: { listId: list.id, status: { not: "removed" } },
          select: { name: true, amount: true, note: true },
        });
        const toInsert = excludeRepeatedCreates(creates, itemsOnList);

        if (toInsert.length > 0) {
          await tx.shoppingItem.createMany({
            data: toInsert.map((op) => {
              const sortOrder = nextSort;
              nextSort += 1;
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

import { prisma } from "../lib/prisma.js";

export type RecapQuestionCompletionQueryInput = {
  userId: string;
  labKey?: string;
  traceIds?: string[];
};

export type RecapQuestionCompletionInput = {
  userId: string;
  traceId: string;
  labKey: string;
  questionIndex: number;
  completed: boolean;
};

export type UserRecapQuestionCompletionSummary = {
  traceId: string;
  labKey: string;
  questionIndex: number;
  questionKey: string;
  completed: boolean;
  completedAt: string | null;
  updatedAt: string;
};

type RecapQuestionCompletionRepositoryItem = {
  traceId: string;
  labKey: string;
  questionIndex: number;
  questionKey: string;
  isCompleted: boolean;
  completedAt: Date | null;
  updatedAt: Date;
};

type RecapQuestionCompletionRepositoryUpsertInput = {
  userId: bigint;
  traceId: string;
  labKey: string;
  questionIndex: number;
  questionKey: string;
  completed: boolean;
  completedAt: Date | null;
};

export type LabRecapQuestionCompletionsRepository = {
  findUserQuestionCompletions(input: {
    userId: bigint;
    labKey?: string;
    traceIds?: string[];
  }): Promise<RecapQuestionCompletionRepositoryItem[]>;
  upsertQuestionCompletion(
    input: RecapQuestionCompletionRepositoryUpsertInput,
  ): Promise<RecapQuestionCompletionRepositoryItem>;
};

export type LabRecapQuestionCompletionsService = {
  listUserQuestionCompletions(
    input: RecapQuestionCompletionQueryInput,
  ): Promise<UserRecapQuestionCompletionSummary[]>;
  setQuestionCompletion(
    input: RecapQuestionCompletionInput,
  ): Promise<UserRecapQuestionCompletionSummary>;
};

export function createRecapQuestionKey(questionIndex: number) {
  return `question-${questionIndex}`;
}

function toBigIntId(id: string) {
  return BigInt(id);
}

function toUserRecapQuestionCompletionSummary(
  item: RecapQuestionCompletionRepositoryItem,
): UserRecapQuestionCompletionSummary {
  return {
    traceId: item.traceId,
    labKey: item.labKey,
    questionIndex: item.questionIndex,
    questionKey: item.questionKey,
    completed: item.isCompleted,
    completedAt: item.completedAt?.toISOString() ?? null,
    updatedAt: item.updatedAt.toISOString(),
  };
}

function createDefaultLabRecapQuestionCompletionsRepository(): LabRecapQuestionCompletionsRepository {
  return {
    async findUserQuestionCompletions(input) {
      return prisma.labRecapQuestionCompletion.findMany({
        where: {
          userId: input.userId,
          ...(input.labKey
            ? {
                labKey: input.labKey,
              }
            : {}),
          ...(input.traceIds && input.traceIds.length > 0
            ? {
                traceId: {
                  in: input.traceIds,
                },
              }
            : {}),
        },
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          traceId: true,
          labKey: true,
          questionIndex: true,
          questionKey: true,
          isCompleted: true,
          completedAt: true,
          updatedAt: true,
        },
      });
    },

    async upsertQuestionCompletion(input) {
      return prisma.labRecapQuestionCompletion.upsert({
        where: {
          userId_traceId_questionKey: {
            userId: input.userId,
            traceId: input.traceId,
            questionKey: input.questionKey,
          },
        },
        create: {
          userId: input.userId,
          traceId: input.traceId,
          labKey: input.labKey,
          questionIndex: input.questionIndex,
          questionKey: input.questionKey,
          isCompleted: input.completed,
          completedAt: input.completedAt,
        },
        update: {
          labKey: input.labKey,
          questionIndex: input.questionIndex,
          isCompleted: input.completed,
          completedAt: input.completedAt,
        },
        select: {
          traceId: true,
          labKey: true,
          questionIndex: true,
          questionKey: true,
          isCompleted: true,
          completedAt: true,
          updatedAt: true,
        },
      });
    },
  };
}

export function createLabRecapQuestionCompletionsService(
  repository: LabRecapQuestionCompletionsRepository =
    createDefaultLabRecapQuestionCompletionsRepository(),
): LabRecapQuestionCompletionsService {
  return {
    async listUserQuestionCompletions(input) {
      const records = await repository.findUserQuestionCompletions({
        userId: toBigIntId(input.userId),
        ...(input.labKey ? { labKey: input.labKey } : {}),
        ...(input.traceIds ? { traceIds: input.traceIds } : {}),
      });

      return records.map(toUserRecapQuestionCompletionSummary);
    },

    async setQuestionCompletion(input) {
      const now = new Date();
      const record = await repository.upsertQuestionCompletion({
        userId: toBigIntId(input.userId),
        traceId: input.traceId,
        labKey: input.labKey,
        questionIndex: input.questionIndex,
        questionKey: createRecapQuestionKey(input.questionIndex),
        completed: input.completed,
        completedAt: input.completed ? now : null,
      });

      return toUserRecapQuestionCompletionSummary(record);
    },
  };
}


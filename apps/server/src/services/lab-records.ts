import type { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma.js";

export type LearningProgressInput = {
  userId: string;
  labKey: string;
  variantKey: string;
  status: string;
  notes?: string;
};

export type VerificationRecordInput = {
  userId: string;
  labKey: string;
  variantKey: string;
  result: string;
  summary: string;
  details?: unknown;
};

export type LabRecordResult = {
  labKey: string;
  variantKey: string;
  status?: string;
  result?: string;
};

export type UserLearningProgressSummary = {
  labKey: string;
  title: string;
  variantKey: string;
  status: string;
  updatedAt: string;
};

export type UserVerificationSummary = {
  labKey: string;
  title: string;
  variantKey: string;
  result: string;
  summary: string;
  createdAt: string;
};

export type UserLabRecordSummary = {
  progress: UserLearningProgressSummary[];
  verifications: UserVerificationSummary[];
};

export type LabRecordsService = {
  recordLearningProgress(input: LearningProgressInput): Promise<LabRecordResult>;
  recordVerification(input: VerificationRecordInput): Promise<LabRecordResult>;
  listUserLabRecords(input: { userId: string }): Promise<UserLabRecordSummary>;
};

export class LabRecordError extends Error {
  constructor(
    message: string,
    public readonly code: "lab-database-record-not-found",
  ) {
    super(message);
  }
}

async function findLabIdByKey(labKey: string) {
  const lab = await prisma.lab.findUnique({
    where: {
      labKey,
    },
    select: {
      id: true,
    },
  });

  if (!lab) {
    throw new LabRecordError(
      "lab database record not found",
      "lab-database-record-not-found",
    );
  }

  return lab.id;
}

function toBigIntId(id: string) {
  return BigInt(id);
}

export function createLabRecordsService(): LabRecordsService {
  return {
    async recordLearningProgress(input) {
      const labId = await findLabIdByKey(input.labKey);
      const userId = toBigIntId(input.userId);
      const now = new Date();

      await prisma.learningProgress.upsert({
        where: {
          userId_labId: {
            userId,
            labId,
          },
        },
        create: {
          userId,
          labId,
          currentVariantKey: input.variantKey,
          status: input.status,
          startedAt: now,
          lastViewedAt: now,
          completedAt: input.status === "completed" ? now : null,
          notes: input.notes,
        },
        update: {
          currentVariantKey: input.variantKey,
          status: input.status,
          lastViewedAt: now,
          completedAt: input.status === "completed" ? now : undefined,
          notes: input.notes,
        },
      });

      return {
        labKey: input.labKey,
        variantKey: input.variantKey,
        status: input.status,
      };
    },

    async recordVerification(input) {
      const labId = await findLabIdByKey(input.labKey);
      const userId = toBigIntId(input.userId);
      const now = new Date();

      await prisma.verificationRecord.create({
        data: {
          userId,
          labId,
          variantKey: input.variantKey,
          verificationType: "manual",
          result: input.result,
          summary: input.summary,
          detailsJson:
            input.details === undefined
              ? undefined
              : (input.details as Prisma.InputJsonValue),
          triggeredBy: "user",
        },
      });

      await prisma.learningProgress.upsert({
        where: {
          userId_labId: {
            userId,
            labId,
          },
        },
        create: {
          userId,
          labId,
          currentVariantKey: input.variantKey,
          status: "completed",
          startedAt: now,
          lastViewedAt: now,
          completedAt: now,
          notes: input.summary,
        },
        update: {
          currentVariantKey: input.variantKey,
          status: "completed",
          lastViewedAt: now,
          completedAt: now,
          notes: input.summary,
        },
      });

      return {
        labKey: input.labKey,
        variantKey: input.variantKey,
        result: input.result,
      };
    },

    async listUserLabRecords(input) {
      const userId = toBigIntId(input.userId);
      const [progress, verifications] = await Promise.all([
        prisma.learningProgress.findMany({
          where: {
            userId,
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 10,
          include: {
            lab: {
              select: {
                labKey: true,
                title: true,
              },
            },
          },
        }),
        prisma.verificationRecord.findMany({
          where: {
            userId,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
          include: {
            lab: {
              select: {
                labKey: true,
                title: true,
              },
            },
          },
        }),
      ]);

      return {
        progress: progress.map((item) => ({
          labKey: item.lab.labKey,
          title: item.lab.title,
          variantKey: item.currentVariantKey,
          status: item.status,
          updatedAt: item.updatedAt.toISOString(),
        })),
        verifications: verifications.map((item) => ({
          labKey: item.lab.labKey,
          title: item.lab.title,
          variantKey: item.variantKey,
          result: item.result,
          summary: item.summary,
          createdAt: item.createdAt.toISOString(),
        })),
      };
    },
  };
}

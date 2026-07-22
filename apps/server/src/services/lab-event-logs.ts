import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma.js";

export type LabEventPhase = "attack" | "defense" | "normal";
export type LabEventType =
  | "request"
  | "validation"
  | "blocked"
  | "success"
  | "failure";
export type LabEventActorPerspective = "attacker" | "user" | "system";
export type LabEventDecision = "accepted" | "blocked" | "failed";
export type LabEventRiskLevel = "low" | "medium" | "high" | "critical";

export type LabEventInput = {
  traceId?: string;
  userId?: string;
  labKey: string;
  variantKey: string;
  phase: LabEventPhase;
  eventType: LabEventType;
  actorPerspective: LabEventActorPerspective;
  method: string;
  path: string;
  inputSummary?: unknown;
  decision: LabEventDecision;
  signal: string;
  statusCode: number;
  message: string;
  riskLevel: LabEventRiskLevel;
};

export type LabEventRecordResult = {
  traceId: string;
  persisted: boolean;
  labId: string | null;
  errorMessage?: string;
};

export type UserLabEventLogSummary = {
  traceId: string;
  labKey: string;
  title: string;
  variantKey: string;
  phase: LabEventPhase;
  eventType: LabEventType;
  actorPerspective: LabEventActorPerspective;
  decision: LabEventDecision;
  signal: string;
  statusCode: number;
  message: string;
  riskLevel: LabEventRiskLevel;
  createdAt: string;
};

type LabEventLogCreateInput = Omit<
  LabEventInput,
  "traceId" | "userId" | "inputSummary"
> & {
  traceId: string;
  userId?: bigint;
  labId: bigint | null;
  inputSummaryJson?: Prisma.InputJsonValue;
};

type LabEventLogQueryInput = {
  userId: string;
  labKey?: string;
  phase?: LabEventPhase;
  riskLevel?: LabEventRiskLevel;
  take?: number;
};

type LabEventLogRepositoryItem = {
  traceId: string;
  labKey: string;
  variantKey: string;
  phase: string;
  eventType: string;
  actorPerspective: string;
  decision: string;
  signal: string;
  statusCode: number;
  message: string;
  riskLevel: string;
  createdAt: Date;
  lab: {
    title: string;
  } | null;
};

export type LabEventLogsRepository = {
  findLabIdByKey(labKey: string): Promise<bigint | null>;
  createLabEventLog(input: LabEventLogCreateInput): Promise<void>;
  findUserLabEventLogs(
    input: LabEventLogQueryInput,
  ): Promise<LabEventLogRepositoryItem[]>;
};

export type LabEventLogsLogger = Pick<Console, "info" | "warn">;

export type LabEventLogsService = {
  recordLabEvent(input: LabEventInput): Promise<LabEventRecordResult>;
  listUserLabEventLogs(input: LabEventLogQueryInput): Promise<UserLabEventLogSummary[]>;
};

// 统一事件日志安全摘要的兜底脱敏：按 key 名匹配凭据类与常见 PII，
// 命中即替换为 [redacted]。各实验 service 已在源头做主脱敏，这里是纵深防御。
const sensitiveInputKeyPattern =
  /password|token|secret|authorization|cookie|credential|email|phone|mobile|passport|idcard/i;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "unknown lab event log error";
}

function toOptionalBigInt(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
}

function sanitizeInputSummary(
  value: unknown,
  depth = 0,
): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return "[null]";
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : String(value);
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    if (depth >= 3) {
      return "[truncated]";
    }

    return value
      .slice(0, 20)
      .map((item) => sanitizeInputSummary(item, depth + 1) ?? null);
  }

  if (typeof value === "object") {
    if (depth >= 3) {
      return "[truncated]";
    }

    const sanitized: Record<string, Prisma.InputJsonValue> = {};

    for (const [key, item] of Object.entries(value)) {
      if (sensitiveInputKeyPattern.test(key)) {
        sanitized[key] = "[redacted]";
        continue;
      }

      const sanitizedItem = sanitizeInputSummary(item, depth + 1);

      if (sanitizedItem !== undefined) {
        sanitized[key] = sanitizedItem;
      }
    }

    return sanitized;
  }

  return String(value);
}

function normalizeTraceId(traceId: string | undefined) {
  const normalized = traceId?.trim();

  return normalized ? normalized.slice(0, 64) : randomUUID();
}

function escapeLogValue(value: string) {
  return value.replaceAll('"', '\\"');
}

function formatLabEventLogLine(input: LabEventInput & { traceId: string }) {
  return `[LAB_EVENT] trace=${input.traceId} lab=${input.labKey} variant=${input.variantKey} phase=${input.phase} decision=${input.decision} signal=${input.signal} message="${escapeLogValue(input.message)}"`;
}

function formatLabEventStoreFailureLine(input: {
  traceId: string;
  labKey: string;
  errorMessage: string;
}) {
  return `[LAB_EVENT_STORE_FAILED] trace=${input.traceId} lab=${input.labKey} error="${escapeLogValue(input.errorMessage)}"`;
}

function createDefaultLabEventLogsRepository(): LabEventLogsRepository {
  return {
    async findLabIdByKey(labKey) {
      const lab = await prisma.lab.findUnique({
        where: {
          labKey,
        },
        select: {
          id: true,
        },
      });

      return lab?.id ?? null;
    },

    async createLabEventLog(input) {
      await prisma.labEventLog.create({
        data: {
          traceId: input.traceId,
          userId: input.userId,
          labId: input.labId,
          labKey: input.labKey,
          variantKey: input.variantKey,
          phase: input.phase,
          eventType: input.eventType,
          actorPerspective: input.actorPerspective,
          method: input.method,
          path: input.path,
          inputSummaryJson: input.inputSummaryJson,
          decision: input.decision,
          signal: input.signal,
          statusCode: input.statusCode,
          message: input.message,
          riskLevel: input.riskLevel,
        },
      });
    },

    async findUserLabEventLogs(input) {
      const take = Math.min(Math.max(input.take ?? 10, 1), 30);
      const userId = toOptionalBigInt(input.userId);

      if (!userId) {
        return [];
      }

      return prisma.labEventLog.findMany({
        where: {
          userId,
          ...(input.labKey
            ? {
                labKey: input.labKey,
              }
            : {}),
          ...(input.phase
            ? {
                phase: input.phase,
              }
            : {}),
          ...(input.riskLevel
            ? {
                riskLevel: input.riskLevel,
              }
            : {}),
        },
        orderBy: {
          createdAt: "desc",
        },
        take,
        select: {
          traceId: true,
          labKey: true,
          variantKey: true,
          phase: true,
          eventType: true,
          actorPerspective: true,
          decision: true,
          signal: true,
          statusCode: true,
          message: true,
          riskLevel: true,
          createdAt: true,
          lab: {
            select: {
              title: true,
            },
          },
        },
      });
    },
  };
}

function toUserLabEventLogSummary(
  item: LabEventLogRepositoryItem,
): UserLabEventLogSummary {
  return {
    traceId: item.traceId,
    labKey: item.labKey,
    title: item.lab?.title ?? item.labKey,
    variantKey: item.variantKey,
    phase: item.phase as LabEventPhase,
    eventType: item.eventType as LabEventType,
    actorPerspective: item.actorPerspective as LabEventActorPerspective,
    decision: item.decision as LabEventDecision,
    signal: item.signal,
    statusCode: item.statusCode,
    message: item.message,
    riskLevel: item.riskLevel as LabEventRiskLevel,
    createdAt: item.createdAt.toISOString(),
  };
}

export function createLabEventLogsService(
  repository: LabEventLogsRepository = createDefaultLabEventLogsRepository(),
  logger: LabEventLogsLogger = console,
): LabEventLogsService {
  return {
    async recordLabEvent(input) {
      const traceId = normalizeTraceId(input.traceId);
      const eventInput = {
        ...input,
        traceId,
      };

      logger.info(formatLabEventLogLine(eventInput));

      try {
        const {
          inputSummary,
          userId: rawUserId,
          ...persistableEventInput
        } = eventInput;
        const labId = await repository.findLabIdByKey(input.labKey);

        await repository.createLabEventLog({
          ...persistableEventInput,
          userId: toOptionalBigInt(rawUserId),
          labId,
          inputSummaryJson: sanitizeInputSummary(inputSummary),
        });

        return {
          traceId,
          persisted: true,
          labId: labId?.toString() ?? null,
        };
      } catch (error) {
        const errorMessage = getErrorMessage(error);

        // 数据库日志是学习复盘能力，不能反过来阻断实验主流程。
        logger.warn(
          formatLabEventStoreFailureLine({
            traceId,
            labKey: input.labKey,
            errorMessage,
          }),
        );

        return {
          traceId,
          persisted: false,
          labId: null,
          errorMessage,
        };
      }
    },

    async listUserLabEventLogs(input) {
      const events = await repository.findUserLabEventLogs(input);

      return events.map(toUserLabEventLogSummary);
    },
  };
}

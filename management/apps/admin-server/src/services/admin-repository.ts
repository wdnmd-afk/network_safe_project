import { prisma } from "../lib/prisma.js";

export type StoredAdminUser = {
  id: string;
  username: string;
  passwordHash: string;
  displayName: string;
  role: string;
  status: string;
};

export type EventRecord = {
  id: string;
  traceId: string;
  userId: string | null;
  username: string | null;
  labKey: string;
  labTitle: string | null;
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
};

export type EventQuery = {
  labKey?: string;
  variantKey?: string;
  phase?: string;
  riskLevel?: string;
  decision?: string;
  userId?: string;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
};

export type LabRecord = {
  labKey: string;
  title: string;
  categoryCode: string;
  categoryName: string;
  severity: string;
  mode: string;
  status: string;
  isEnabled: boolean;
  variants: { variantKey: string; title: string; isEnabled: boolean }[];
};

export type LearnerRecord = {
  id: string;
  username: string;
  displayName: string;
  role: string;
  status: string;
  progressCount: number;
  completedCount: number;
  verificationCount: number;
  eventCount: number;
  lastActivityAt: Date | null;
};

export type LearnerProgressRecord = {
  labKey: string;
  labTitle: string;
  variantKey: string;
  status: string;
  updatedAt: Date;
};

export type LearnerVerificationRecord = {
  labKey: string;
  labTitle: string;
  variantKey: string;
  result: string;
  summary: string;
  createdAt: Date;
};

export type LearnerRecapRecord = {
  labKey: string;
  traceId: string;
  isCompleted: boolean;
};

export type AuditRecord = {
  id: string;
  adminUserId: string | null;
  action: string;
  targetType: string;
  targetKey: string;
  beforeJson: unknown;
  afterJson: unknown;
  createdAt: Date;
};

export type AuditInput = {
  adminUserId: string | null;
  action: string;
  targetType: string;
  targetKey: string;
  before: { isEnabled: boolean } | null;
  after: { isEnabled: boolean } | null;
};

export type ToggleResult = {
  before: { isEnabled: boolean };
  after: { isEnabled: boolean };
};

export type OverviewCounts = {
  labs: number;
  enabledLabs: number;
  categories: number;
  variants: number;
  enabledVariants: number;
  learners: number;
  events: number;
  blocked: number;
  byRisk: Record<string, number>;
};

export type AdminRepository = {
  findUserByUsername(username: string): Promise<StoredAdminUser | null>;
  findUserById(id: string): Promise<StoredAdminUser | null>;

  readOverviewCounts(): Promise<OverviewCounts>;
  countEventsByDay(since: Date): Promise<{ date: string; count: number }[]>;

  listEvents(query: EventQuery): Promise<{ items: EventRecord[]; total: number }>;
  listTraceEvents(traceId: string): Promise<EventRecord[]>;

  listLabs(filter: {
    category?: string;
    isEnabled?: boolean;
  }): Promise<LabRecord[]>;
  setLabEnabled(
    labKey: string,
    isEnabled: boolean,
    audit: AuditInput,
  ): Promise<ToggleResult | null>;
  setVariantEnabled(
    labKey: string,
    variantKey: string,
    isEnabled: boolean,
    audit: AuditInput,
  ): Promise<ToggleResult | null>;

  listLearners(): Promise<LearnerRecord[]>;
  findLearner(id: string): Promise<
    | {
        learner: LearnerRecord;
        progress: LearnerProgressRecord[];
        verifications: LearnerVerificationRecord[];
        recap: LearnerRecapRecord[];
      }
    | null
  >;

  createAuditLog(input: AuditInput): Promise<void>;
  listAuditLogs(input: {
    page: number;
    pageSize: number;
    action?: string;
  }): Promise<{ items: AuditRecord[]; total: number }>;

  ping(): Promise<void>;
};

const userSelect = {
  id: true,
  username: true,
  passwordHash: true,
  displayName: true,
  role: true,
  status: true,
} as const;

function toStoredUser(user: {
  id: bigint;
  username: string;
  passwordHash: string;
  displayName: string;
  role: string;
  status: string;
}): StoredAdminUser {
  return {
    // BigInt 统一序列化为字符串，与主项目 user-repository.ts 的处理一致
    id: user.id.toString(),
    username: user.username,
    passwordHash: user.passwordHash,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
  };
}

const eventSelect = {
  id: true,
  traceId: true,
  userId: true,
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
  // 刻意不 select inputSummaryJson / method / path：这三列不得外传
  user: { select: { username: true } },
  lab: { select: { title: true } },
} as const;

type RawEventRow = {
  id: bigint;
  traceId: string;
  userId: bigint | null;
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
  user: { username: string } | null;
  lab: { title: string } | null;
};

function toEventRecord(row: RawEventRow): EventRecord {
  return {
    id: row.id.toString(),
    traceId: row.traceId,
    userId: row.userId === null ? null : row.userId.toString(),
    username: row.user?.username ?? null,
    labKey: row.labKey,
    labTitle: row.lab?.title ?? null,
    variantKey: row.variantKey,
    phase: row.phase,
    eventType: row.eventType,
    actorPerspective: row.actorPerspective,
    decision: row.decision,
    signal: row.signal,
    statusCode: row.statusCode,
    message: row.message,
    riskLevel: row.riskLevel,
    createdAt: row.createdAt,
  };
}

function toAuditRecord(row: {
  id: bigint;
  adminUserId: bigint | null;
  action: string;
  targetType: string;
  targetKey: string;
  beforeJson: unknown;
  afterJson: unknown;
  createdAt: Date;
}): AuditRecord {
  return {
    id: row.id.toString(),
    adminUserId: row.adminUserId === null ? null : row.adminUserId.toString(),
    action: row.action,
    targetType: row.targetType,
    targetKey: row.targetKey,
    beforeJson: row.beforeJson,
    afterJson: row.afterJson,
    createdAt: row.createdAt,
  };
}

export function createPrismaAdminRepository(
  client: typeof prisma = prisma,
): AdminRepository {
  function eventWhere(query: EventQuery) {
    return {
      ...(query.labKey ? { labKey: query.labKey } : {}),
      ...(query.variantKey ? { variantKey: query.variantKey } : {}),
      ...(query.phase ? { phase: query.phase } : {}),
      ...(query.riskLevel ? { riskLevel: query.riskLevel } : {}),
      ...(query.decision ? { decision: query.decision } : {}),
      ...(query.userId ? { userId: BigInt(query.userId) } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {}),
    };
  }

  return {
    async findUserByUsername(username) {
      const user = await client.user.findUnique({
        where: { username },
        select: userSelect,
      });

      return user ? toStoredUser(user) : null;
    },

    async findUserById(id) {
      const user = await client.user.findUnique({
        where: { id: BigInt(id) },
        select: userSelect,
      });

      return user ? toStoredUser(user) : null;
    },

    async readOverviewCounts() {
      const [
        labs,
        enabledLabs,
        categories,
        variants,
        enabledVariants,
        learners,
        events,
        blocked,
        riskGroups,
      ] = await Promise.all([
        client.lab.count(),
        client.lab.count({ where: { isEnabled: true } }),
        client.labCategory.count(),
        client.labVariant.count(),
        client.labVariant.count({ where: { isEnabled: true } }),
        client.user.count(),
        client.labEventLog.count(),
        client.labEventLog.count({ where: { decision: "blocked" } }),
        client.labEventLog.groupBy({
          by: ["riskLevel"],
          _count: { _all: true },
        }),
      ]);

      const byRisk: Record<string, number> = {};

      for (const group of riskGroups) {
        byRisk[group.riskLevel] = group._count._all;
      }

      return {
        labs,
        enabledLabs,
        categories,
        variants,
        enabledVariants,
        learners,
        events,
        blocked,
        byRisk,
      };
    },

    async countEventsByDay(since) {
      // 按天分桶需要 DATE() 截断，Prisma 的 groupBy 不支持，故走原生查询。
      // DATE() 使用 MySQL 会话时区，本机单时区环境可接受。
      const rows = await client.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT DATE(created_at) AS day, COUNT(*) AS count
        FROM lab_event_logs
        WHERE created_at >= ${since}
        GROUP BY DATE(created_at)
        ORDER BY day ASC
      `;

      return rows.map((row) => ({
        date:
          row.day instanceof Date
            ? row.day.toISOString().slice(0, 10)
            : String(row.day),
        count: Number(row.count),
      }));
    },

    async listEvents(query) {
      const where = eventWhere(query);
      const [rows, total] = await Promise.all([
        client.labEventLog.findMany({
          where,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          select: eventSelect,
        }),
        client.labEventLog.count({ where }),
      ]);

      return {
        items: rows.map((row) => toEventRecord(row as RawEventRow)),
        total,
      };
    },

    async listTraceEvents(traceId) {
      const rows = await client.labEventLog.findMany({
        where: { traceId },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: eventSelect,
      });

      return rows.map((row) => toEventRecord(row as RawEventRow));
    },

    async listLabs(filter) {
      const rows = await client.lab.findMany({
        where: {
          ...(filter.category ? { category: { code: filter.category } } : {}),
          ...(filter.isEnabled === undefined
            ? {}
            : { isEnabled: filter.isEnabled }),
        },
        orderBy: [{ labKey: "asc" }],
        select: {
          labKey: true,
          title: true,
          severity: true,
          mode: true,
          status: true,
          isEnabled: true,
          category: { select: { code: true, name: true } },
          variants: {
            orderBy: { variantKey: "asc" },
            select: { variantKey: true, title: true, isEnabled: true },
          },
        },
      });

      return rows.map((row) => ({
        labKey: row.labKey,
        title: row.title,
        categoryCode: row.category.code,
        categoryName: row.category.name,
        severity: row.severity,
        mode: row.mode,
        status: row.status,
        isEnabled: row.isEnabled,
        variants: row.variants,
      }));
    },

    async setLabEnabled(labKey, isEnabled, audit) {
      const existing = await client.lab.findUnique({
        where: { labKey },
        select: { id: true, isEnabled: true },
      });

      if (!existing) {
        return null;
      }

      const before = { isEnabled: existing.isEnabled };
      const after = { isEnabled };

      // 启停写入与审计写入必须同事务：否则会出现改了配置却没有审计记录的状态
      await client.$transaction([
        client.lab.update({
          where: { labKey },
          data: { isEnabled },
        }),
        client.adminAuditLog.create({
          data: {
            adminUserId: audit.adminUserId === null ? null : BigInt(audit.adminUserId),
            action: audit.action,
            targetType: "lab",
            targetKey: labKey,
            beforeJson: before,
            afterJson: after,
          },
        }),
      ]);

      return { before, after };
    },

    async setVariantEnabled(labKey, variantKey, isEnabled, audit) {
      const lab = await client.lab.findUnique({
        where: { labKey },
        select: { id: true },
      });

      if (!lab) {
        return null;
      }

      const existing = await client.labVariant.findUnique({
        where: { labId_variantKey: { labId: lab.id, variantKey } },
        select: { id: true, isEnabled: true },
      });

      if (!existing) {
        return null;
      }

      const before = { isEnabled: existing.isEnabled };
      const after = { isEnabled };

      await client.$transaction([
        client.labVariant.update({
          where: { id: existing.id },
          data: { isEnabled },
        }),
        client.adminAuditLog.create({
          data: {
            adminUserId: audit.adminUserId === null ? null : BigInt(audit.adminUserId),
            action: audit.action,
            targetType: "variant",
            targetKey: `${labKey}:${variantKey}`,
            beforeJson: before,
            afterJson: after,
          },
        }),
      ]);

      return { before, after };
    },

    async listLearners() {
      const [users, completedGroups, lastActivityGroups] = await Promise.all([
        client.user.findMany({
          orderBy: { id: "asc" },
          select: {
            id: true,
            username: true,
            displayName: true,
            role: true,
            status: true,
            _count: {
              select: {
                learningProgresses: true,
                verificationRecords: true,
                labEventLogs: true,
              },
            },
          },
        }),
        client.learningProgress.groupBy({
          by: ["userId"],
          where: { status: "completed" },
          _count: { _all: true },
        }),
        client.labEventLog.groupBy({
          by: ["userId"],
          _max: { createdAt: true },
        }),
      ]);

      const completedByUser = new Map(
        completedGroups.map((group) => [
          group.userId.toString(),
          group._count._all,
        ]),
      );
      const lastActivityByUser = new Map(
        lastActivityGroups.map((group) => [
          group.userId?.toString() ?? "",
          group._max.createdAt,
        ]),
      );

      return users.map((user) => {
        const id = user.id.toString();

        return {
          id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          status: user.status,
          progressCount: user._count.learningProgresses,
          completedCount: completedByUser.get(id) ?? 0,
          verificationCount: user._count.verificationRecords,
          eventCount: user._count.labEventLogs,
          lastActivityAt: lastActivityByUser.get(id) ?? null,
        };
      });
    },

    async findLearner(id) {
      const userId = BigInt(id);
      const user = await client.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          role: true,
          status: true,
          _count: {
            select: {
              learningProgresses: true,
              verificationRecords: true,
              labEventLogs: true,
            },
          },
        },
      });

      if (!user) {
        return null;
      }

      const [progress, verifications, recap, completedCount, lastActivity] =
        await Promise.all([
          client.learningProgress.findMany({
            where: { userId },
            orderBy: { updatedAt: "desc" },
            take: 100,
            select: {
              currentVariantKey: true,
              status: true,
              updatedAt: true,
              lab: { select: { labKey: true, title: true } },
            },
          }),
          client.verificationRecord.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 100,
            select: {
              variantKey: true,
              result: true,
              summary: true,
              createdAt: true,
              lab: { select: { labKey: true, title: true } },
            },
          }),
          client.labRecapQuestionCompletion.findMany({
            where: { userId },
            take: 500,
            select: {
              labKey: true,
              traceId: true,
              isCompleted: true,
            },
          }),
          client.learningProgress.count({
            where: { userId, status: "completed" },
          }),
          client.labEventLog.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
          }),
        ]);

      return {
        learner: {
          id: user.id.toString(),
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          status: user.status,
          progressCount: user._count.learningProgresses,
          completedCount,
          verificationCount: user._count.verificationRecords,
          eventCount: user._count.labEventLogs,
          lastActivityAt: lastActivity?.createdAt ?? null,
        },
        progress: progress.map((row) => ({
          labKey: row.lab.labKey,
          labTitle: row.lab.title,
          variantKey: row.currentVariantKey,
          status: row.status,
          updatedAt: row.updatedAt,
        })),
        verifications: verifications.map((row) => ({
          labKey: row.lab.labKey,
          labTitle: row.lab.title,
          variantKey: row.variantKey,
          result: row.result,
          summary: row.summary,
          createdAt: row.createdAt,
        })),
        // 只取题目级完成情况；LT-055 的知识点三列属 LT-056，本轮不读
        recap,
      };
    },

    async createAuditLog(input) {
      await client.adminAuditLog.create({
        data: {
          adminUserId:
            input.adminUserId === null ? null : BigInt(input.adminUserId),
          action: input.action,
          targetType: input.targetType,
          targetKey: input.targetKey,
          beforeJson: input.before ?? undefined,
          afterJson: input.after ?? undefined,
        },
      });
    },

    async listAuditLogs(input) {
      const where = input.action ? { action: input.action } : {};
      const [rows, total] = await Promise.all([
        client.adminAuditLog.findMany({
          where,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        client.adminAuditLog.count({ where }),
      ]);

      return { items: rows.map((row) => toAuditRecord(row)), total };
    },

    async ping() {
      await client.$queryRaw`SELECT 1`;
    },
  };
}

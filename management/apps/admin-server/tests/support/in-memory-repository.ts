import type {
  AdminRepository,
  AuditInput,
  AuditRecord,
  EventQuery,
  EventRecord,
  LabRecord,
  LearnerProgressRecord,
  LearnerRecapRecord,
  LearnerRecord,
  LearnerVerificationRecord,
  StoredAdminUser,
  ToggleResult,
} from "../../src/services/admin-repository.js";

export type SeedData = {
  users: StoredAdminUser[];
  labs: LabRecord[];
  events: EventRecord[];
  progress: (LearnerProgressRecord & { userId: string })[];
  verifications: (LearnerVerificationRecord & { userId: string })[];
  recap: (LearnerRecapRecord & { userId: string })[];
  learners: LearnerRecord[];
};

/**
 * 仅用于测试的内存仓储。
 *
 * 接口与 Prisma 实现同构，因此 API 测试不必连库；真实 Prisma 实现由 E2E 覆盖。
 * 启停与审计写入在同一方法内完成，与 Prisma 实现的事务语义保持一致。
 */
export function createInMemoryRepository(seed: SeedData) {
  const auditLogs: AuditRecord[] = [];
  let auditId = 1n;
  // 深拷贝，避免用例之间通过共享对象互相污染
  const state: SeedData = structuredClone(seed);

  function findLab(labKey: string) {
    return state.labs.find((lab) => lab.labKey === labKey);
  }

  const repository: AdminRepository = {
    async findUserByUsername(username) {
      return state.users.find((user) => user.username === username) ?? null;
    },

    async findUserById(id) {
      return state.users.find((user) => user.id === id) ?? null;
    },

    async readOverviewCounts() {
      const enabledVariants = state.labs.flatMap((lab) =>
        lab.variants.filter((variant) => variant.isEnabled),
      ).length;
      const byRisk: Record<string, number> = {};

      for (const event of state.events) {
        byRisk[event.riskLevel] = (byRisk[event.riskLevel] ?? 0) + 1;
      }

      return {
        labs: state.labs.length,
        enabledLabs: state.labs.filter((lab) => lab.isEnabled).length,
        categories: new Set(state.labs.map((lab) => lab.categoryCode)).size,
        variants: state.labs.flatMap((lab) => lab.variants).length,
        enabledVariants,
        learners: state.learners.length,
        events: state.events.length,
        blocked: state.events.filter((event) => event.decision === "blocked").length,
        byRisk,
      };
    },

    async countEventsByDay(since) {
      const counts = new Map<string, number>();

      for (const event of state.events) {
        if (event.createdAt.getTime() < since.getTime()) {
          continue;
        }

        const key = event.createdAt.toISOString().slice(0, 10);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }

      return [...counts.entries()].map(([date, count]) => ({ date, count }));
    },

    async listEvents(query: EventQuery) {
      const filtered = state.events.filter((event) => {
        if (query.labKey && event.labKey !== query.labKey) return false;
        if (query.variantKey && event.variantKey !== query.variantKey) return false;
        if (query.phase && event.phase !== query.phase) return false;
        if (query.riskLevel && event.riskLevel !== query.riskLevel) return false;
        if (query.decision && event.decision !== query.decision) return false;
        if (query.userId && event.userId !== query.userId) return false;
        if (query.from && event.createdAt.getTime() < query.from.getTime()) return false;
        if (query.to && event.createdAt.getTime() > query.to.getTime()) return false;
        return true;
      });

      const sorted = [...filtered].sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
      );
      const start = (query.page - 1) * query.pageSize;

      return {
        items: sorted.slice(start, start + query.pageSize),
        total: sorted.length,
      };
    },

    async listTraceEvents(traceId) {
      return state.events
        .filter((event) => event.traceId === traceId)
        .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
    },

    async listLabs(filter) {
      return state.labs.filter((lab) => {
        if (filter.category && lab.categoryCode !== filter.category) return false;
        if (filter.isEnabled !== undefined && lab.isEnabled !== filter.isEnabled) {
          return false;
        }
        return true;
      });
    },

    async setLabEnabled(labKey, isEnabled, audit: AuditInput) {
      const lab = findLab(labKey);

      if (!lab) {
        return null;
      }

      const result: ToggleResult = {
        before: { isEnabled: lab.isEnabled },
        after: { isEnabled },
      };

      lab.isEnabled = isEnabled;
      pushAudit(audit, result);

      return result;
    },

    async setVariantEnabled(labKey, variantKey, isEnabled, audit) {
      const variant = findLab(labKey)?.variants.find(
        (item) => item.variantKey === variantKey,
      );

      if (!variant) {
        return null;
      }

      const result: ToggleResult = {
        before: { isEnabled: variant.isEnabled },
        after: { isEnabled },
      };

      variant.isEnabled = isEnabled;
      pushAudit(audit, result);

      return result;
    },

    async listLearners() {
      return state.learners;
    },

    async findLearner(id) {
      const learner = state.learners.find((item) => item.id === id);

      if (!learner) {
        return null;
      }

      return {
        learner,
        progress: state.progress.filter((row) => row.userId === id),
        verifications: state.verifications.filter((row) => row.userId === id),
        recap: state.recap.filter((row) => row.userId === id),
      };
    },

    async createAuditLog(input) {
      pushAudit(input, null);
    },

    async listAuditLogs(input) {
      const filtered = input.action
        ? auditLogs.filter((log) => log.action === input.action)
        : auditLogs;
      const sorted = [...filtered].sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
      );
      const start = (input.page - 1) * input.pageSize;

      return {
        items: sorted.slice(start, start + input.pageSize),
        total: sorted.length,
      };
    },

    async ping() {
      return;
    },
  };

  function pushAudit(input: AuditInput, result: ToggleResult | null) {
    auditLogs.push({
      id: (auditId++).toString(),
      adminUserId: input.adminUserId,
      action: input.action,
      targetType: input.targetType,
      targetKey: input.targetKey,
      beforeJson: result?.before ?? input.before,
      afterJson: result?.after ?? input.after,
      createdAt: new Date(),
    });
  }

  return { repository, auditLogs, state };
}

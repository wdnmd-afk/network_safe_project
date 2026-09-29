/**
 * 管理端前后端共用契约。
 *
 * 枚举取值严格对齐主项目 apps/server/src/services/lab-event-logs.ts，
 * 由 tests/contract.test.ts 读取主项目源码做一致性断言，不允许在这里自行扩展。
 */

export const eventPhases = ["attack", "defense", "normal"] as const;
export const eventDecisions = ["accepted", "blocked", "failed"] as const;
export const eventRiskLevels = ["low", "medium", "high", "critical"] as const;
export const eventActorPerspectives = ["attacker", "user", "system"] as const;
export const variantKeys = ["vuln", "fixed"] as const;

export type EventPhase = (typeof eventPhases)[number];
export type EventDecision = (typeof eventDecisions)[number];
export type EventRiskLevel = (typeof eventRiskLevels)[number];
export type EventActorPerspective = (typeof eventActorPerspectives)[number];
export type VariantKey = (typeof variantKeys)[number];

export const auditActions = [
  "auth.login.success",
  "auth.login.failure",
  "lab.enable",
  "lab.disable",
  "variant.enable",
  "variant.disable",
] as const;
export const auditTargetTypes = ["session", "lab", "variant"] as const;

export type AuditAction = (typeof auditActions)[number];
export type AuditTargetType = (typeof auditTargetTypes)[number];

export const pagination = {
  defaultPage: 1,
  defaultPageSize: 20,
  maxPageSize: 100,
} as const;

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ApiError = {
  status: "error";
  message: string;
};

export type AdminUser = {
  id: string;
  username: string;
  displayName: string;
};

export type LoginResponse = {
  status: "ok";
  token: string;
  user: AdminUser;
  expiresAt: string;
};

export type AvailabilitySource = "database" | "metadata-fallback";

/**
 * 事件字段 = 主项目 UserLabEventLogSummary 的 13 个字段 + id/userId/username。
 * 刻意不含 inputSummaryJson、method、path：这三列在库里存在但不得外传。
 */
export type AdminEvent = {
  id: string;
  traceId: string;
  userId: string | null;
  username: string | null;
  labKey: string;
  title: string;
  variantKey: string;
  phase: EventPhase;
  eventType: string;
  actorPerspective: EventActorPerspective;
  decision: EventDecision;
  signal: string;
  statusCode: number;
  message: string;
  riskLevel: EventRiskLevel;
  createdAt: string;
};

export type TraceDetail = {
  traceId: string;
  events: AdminEvent[];
  startedAt: string;
  endedAt: string;
  durationMs: number;
};

export type OverviewResponse = {
  status: "ok";
  labs: { total: number; enabled: number; categories: number };
  variants: { total: number; enabled: number };
  events: {
    total: number;
    blocked: number;
    blockRate: number;
    byRisk: Record<EventRiskLevel, number>;
    daily: { date: string; count: number }[];
  };
  learners: number;
  /**
   * 主站状态由管理端请求主站 /api/platform-info 得到。
   * 主站数据库退化时启停配置不生效，管理端必须把这一点显性提示出来。
   */
  mainSite: {
    reachable: boolean;
    availabilitySource: AvailabilitySource | null;
  };
};

export type AdminLabVariant = {
  variantKey: string;
  title: string;
  isEnabled: boolean;
};

export type AdminLab = {
  labKey: string;
  title: string;
  categoryCode: string;
  categoryName: string;
  severity: string;
  mode: string;
  status: string;
  isEnabled: boolean;
  variants: AdminLabVariant[];
};

export type LearnerSummary = {
  id: string;
  username: string;
  displayName: string;
  role: string;
  status: string;
  progressCount: number;
  completedCount: number;
  verificationCount: number;
  eventCount: number;
  lastActivityAt: string | null;
};

export type LearnerDetail = {
  learner: LearnerSummary;
  progress: {
    labKey: string;
    title: string;
    variantKey: string;
    status: string;
    updatedAt: string;
  }[];
  verifications: {
    labKey: string;
    title: string;
    variantKey: string;
    result: string;
    summary: string;
    createdAt: string;
  }[];
  recap: {
    labKey: string;
    traceCount: number;
    completedQuestions: number;
  }[];
};

export type AuditLogItem = {
  id: string;
  adminUserId: string | null;
  action: AuditAction;
  targetType: AuditTargetType;
  targetKey: string;
  before: { isEnabled: boolean } | null;
  after: { isEnabled: boolean } | null;
  createdAt: string;
};

export function isOneOf<T extends string>(
  values: readonly T[],
  value: unknown,
): value is T {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}

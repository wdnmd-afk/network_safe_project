import {
  auditActions,
  eventDecisions,
  eventPhases,
  eventRiskLevels,
  isOneOf,
  pagination,
  variantKeys,
  type AdminEvent,
  type AuditLogItem,
  type EventActorPerspective,
  type EventDecision,
  type EventPhase,
  type EventRiskLevel,
  type TraceDetail,
} from "@nsm/shared";

import type { AuditRecord, EventQuery, EventRecord } from "./admin-repository.js";

/**
 * 查询参数解析一律「非法即 400」，不做静默纠正：
 * 静默把 pageSize=1000 改成 100 会让调用方误以为拿到了全量。
 */
export class QueryError extends Error {}

type RawQuery = Record<string, unknown>;

function readSingle(query: RawQuery, key: string) {
  const value = query[key];

  if (value === undefined) {
    return undefined;
  }

  // Express 会把重复参数解析成数组，这里只接受单值
  if (typeof value !== "string") {
    throw new QueryError(`${key} must be a single value`);
  }

  return value;
}

function readPositiveInt(
  query: RawQuery,
  key: string,
  fallback: number,
  max?: number,
) {
  const text = readSingle(query, key);

  if (text === undefined || text === "") {
    return fallback;
  }

  if (!/^\d+$/.test(text)) {
    throw new QueryError(`${key} must be a positive integer`);
  }

  const value = Number(text);

  if (!Number.isSafeInteger(value) || value < 1 || (max !== undefined && value > max)) {
    throw new QueryError(
      max === undefined
        ? `${key} must be >= 1`
        : `${key} must be between 1 and ${max}`,
    );
  }

  return value;
}

function readEnum<T extends string>(
  query: RawQuery,
  key: string,
  values: readonly T[],
): T | undefined {
  const text = readSingle(query, key);

  if (text === undefined || text === "") {
    return undefined;
  }

  if (!isOneOf(values, text)) {
    throw new QueryError(`${key} must be one of ${values.join(", ")}`);
  }

  return text;
}

// labKey 形如 web.xss / business-logic.workflow-bypass；只允许固定字符集，拒绝自由文本
const labKeyPattern = /^[a-z0-9-]+\.[a-z0-9-]+$/;

export function isValidLabKey(value: string) {
  return value.length <= 128 && labKeyPattern.test(value);
}

function readLabKey(query: RawQuery) {
  const text = readSingle(query, "labKey");

  if (text === undefined || text === "") {
    return undefined;
  }

  if (!isValidLabKey(text)) {
    throw new QueryError("labKey is invalid");
  }

  return text;
}

function readUserId(query: RawQuery) {
  const text = readSingle(query, "userId");

  if (text === undefined || text === "") {
    return undefined;
  }

  if (!/^\d{1,20}$/.test(text)) {
    throw new QueryError("userId must be numeric");
  }

  return text;
}

function readDate(query: RawQuery, key: string) {
  const text = readSingle(query, key);

  if (text === undefined || text === "") {
    return undefined;
  }

  // 只接受 ISO 日期或日期时间，避免 Date 构造器对任意字符串的宽松解析
  if (!/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2})?)?$/.test(text)) {
    throw new QueryError(`${key} must be an ISO date`);
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    throw new QueryError(`${key} must be an ISO date`);
  }

  return date;
}

export function parsePagination(query: RawQuery) {
  return {
    page: readPositiveInt(query, "page", pagination.defaultPage),
    pageSize: readPositiveInt(
      query,
      "pageSize",
      pagination.defaultPageSize,
      pagination.maxPageSize,
    ),
  };
}

export function parseEventQuery(query: RawQuery): EventQuery {
  const from = readDate(query, "from");
  const to = readDate(query, "to");

  if (from && to && from.getTime() > to.getTime()) {
    throw new QueryError("from must not be later than to");
  }

  return {
    ...parsePagination(query),
    labKey: readLabKey(query),
    variantKey: readEnum(query, "variantKey", variantKeys),
    phase: readEnum(query, "phase", eventPhases),
    riskLevel: readEnum(query, "riskLevel", eventRiskLevels),
    decision: readEnum(query, "decision", eventDecisions),
    userId: readUserId(query),
    from,
    to,
  };
}

export function parseLabFilter(query: RawQuery) {
  const category = readSingle(query, "category");
  const enabled = readSingle(query, "isEnabled");

  if (category !== undefined && category !== "" && !/^[a-z0-9-]{1,64}$/.test(category)) {
    throw new QueryError("category is invalid");
  }

  if (enabled !== undefined && enabled !== "" && enabled !== "true" && enabled !== "false") {
    throw new QueryError("isEnabled must be true or false");
  }

  return {
    category: category || undefined,
    isEnabled: enabled === "true" ? true : enabled === "false" ? false : undefined,
  };
}

export function parseAuditQuery(query: RawQuery) {
  return {
    ...parsePagination(query),
    action: readEnum(query, "action", auditActions),
  };
}

/** PATCH 请求体只接受 { isEnabled: boolean }，多余字段一律拒绝 */
export function parseToggleBody(body: unknown) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new QueryError("body must be { isEnabled: boolean }");
  }

  const keys = Object.keys(body);

  if (keys.length !== 1 || keys[0] !== "isEnabled") {
    throw new QueryError("body must be { isEnabled: boolean }");
  }

  const value = (body as { isEnabled: unknown }).isEnabled;

  if (typeof value !== "boolean") {
    throw new QueryError("isEnabled must be a boolean");
  }

  return value;
}

export function toAdminEvent(record: EventRecord): AdminEvent {
  return {
    id: record.id,
    traceId: record.traceId,
    userId: record.userId,
    username: record.username,
    labKey: record.labKey,
    title: record.labTitle ?? record.labKey,
    variantKey: record.variantKey,
    phase: record.phase as EventPhase,
    eventType: record.eventType,
    actorPerspective: record.actorPerspective as EventActorPerspective,
    decision: record.decision as EventDecision,
    signal: record.signal,
    statusCode: record.statusCode,
    message: record.message,
    riskLevel: record.riskLevel as EventRiskLevel,
    createdAt: record.createdAt.toISOString(),
  };
}

/** 空 trace 返回 null，由路由层转成 404 */
export function buildTraceDetail(
  traceId: string,
  records: EventRecord[],
): TraceDetail | null {
  if (records.length === 0) {
    return null;
  }

  const events = [...records]
    .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
    .map(toAdminEvent);
  const startedAt = events[0].createdAt;
  const endedAt = events[events.length - 1].createdAt;

  return {
    traceId,
    events,
    startedAt,
    endedAt,
    durationMs: Math.max(Date.parse(endedAt) - Date.parse(startedAt), 0),
  };
}

export function computeBlockRate(blocked: number, total: number) {
  if (total === 0) {
    return 0;
  }

  // 保留一位小数的百分比；分母为 0 时返回 0，避免 NaN 进入响应
  return Math.round((blocked / total) * 1000) / 10;
}

export function normalizeRiskCounts(byRisk: Record<string, number>) {
  const result = {} as Record<EventRiskLevel, number>;

  for (const level of eventRiskLevels) {
    result[level] = byRisk[level] ?? 0;
  }

  return result;
}

/** 近 N 日按日补零，确保趋势图的横轴连续 */
export function fillDailySeries(
  rows: { date: string; count: number }[],
  days: number,
  now = new Date(),
) {
  const counts = new Map(rows.map((row) => [row.date, row.count]));
  const series: { date: string; count: number }[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setUTCHours(0, 0, 0, 0);
    day.setUTCDate(day.getUTCDate() - offset);
    const key = day.toISOString().slice(0, 10);
    series.push({ date: key, count: counts.get(key) ?? 0 });
  }

  return series;
}

function readToggleSnapshot(value: unknown): { isEnabled: boolean } | null {
  if (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { isEnabled?: unknown }).isEnabled === "boolean"
  ) {
    return { isEnabled: (value as { isEnabled: boolean }).isEnabled };
  }

  return null;
}

export function toAuditLogItem(record: AuditRecord): AuditLogItem {
  return {
    id: record.id,
    adminUserId: record.adminUserId,
    action: record.action as AuditLogItem["action"],
    targetType: record.targetType as AuditLogItem["targetType"],
    targetKey: record.targetKey,
    // 只回传 isEnabled 快照，即使库里被写入了其它字段也不透出
    before: readToggleSnapshot(record.beforeJson),
    after: readToggleSnapshot(record.afterJson),
    createdAt: record.createdAt.toISOString(),
  };
}

/** 登录失败审计里记录的用户名：截断且只保留可打印字符，密码任何情况下都不记录 */
export function sanitizeAuditUsername(value: unknown) {
  if (typeof value !== "string") {
    return "(invalid)";
  }

  const printable = value.replace(/[^\x20-\x7E]/g, "").trim();

  return printable ? printable.slice(0, 64) : "(empty)";
}

/** 按 labKey 汇总复盘完成情况：trace 数与已完成题数 */
export function summarizeRecap(
  rows: { labKey: string; traceId: string; isCompleted: boolean }[],
) {
  const groups = new Map<string, { traces: Set<string>; completed: number }>();

  for (const row of rows) {
    const group = groups.get(row.labKey) ?? { traces: new Set(), completed: 0 };
    group.traces.add(row.traceId);

    if (row.isCompleted) {
      group.completed += 1;
    }

    groups.set(row.labKey, group);
  }

  return [...groups.entries()]
    .map(([labKey, group]) => ({
      labKey,
      traceCount: group.traces.size,
      completedQuestions: group.completed,
    }))
    .sort((left, right) => left.labKey.localeCompare(right.labKey));
}

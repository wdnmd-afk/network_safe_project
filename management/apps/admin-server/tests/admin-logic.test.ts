import assert from "node:assert/strict";
import { test } from "node:test";

import {
  QueryError,
  buildTraceDetail,
  computeBlockRate,
  fillDailySeries,
  isValidLabKey,
  normalizeRiskCounts,
  parseAuditQuery,
  parseEventQuery,
  parseLabFilter,
  parsePagination,
  parseToggleBody,
  sanitizeAuditUsername,
  summarizeRecap,
  toAdminEvent,
  toAuditLogItem,
} from "../src/services/admin-logic.js";
import type { AuditRecord, EventRecord } from "../src/services/admin-repository.js";

function createEvent(overrides: Partial<EventRecord> = {}): EventRecord {
  return {
    id: "1",
    traceId: "trace-1",
    userId: "2",
    username: "demo_user",
    labKey: "web.xss",
    labTitle: "XSS",
    variantKey: "vuln",
    phase: "attack",
    eventType: "success",
    actorPerspective: "attacker",
    decision: "accepted",
    signal: "xss-executed",
    statusCode: 200,
    message: "ok",
    riskLevel: "high",
    createdAt: new Date("2026-09-16T02:00:00.000Z"),
    ...overrides,
  };
}

test("分页默认值来自共享契约，越界与非法值抛错", () => {
  assert.deepEqual(parsePagination({}), { page: 1, pageSize: 20 });
  assert.deepEqual(parsePagination({ page: "3", pageSize: "50" }), {
    page: 3,
    pageSize: 50,
  });

  for (const query of [
    { pageSize: "101" },
    { pageSize: "0" },
    { page: "-1" },
    { page: "1.5" },
    { page: "abc" },
    { page: ["1", "2"] },
  ]) {
    assert.throws(() => parsePagination(query), QueryError);
  }
});

test("事件筛选只接受固定枚举与合法 labKey", () => {
  const parsed = parseEventQuery({
    labKey: "business-logic.workflow-bypass",
    variantKey: "fixed",
    phase: "defense",
    riskLevel: "critical",
    decision: "blocked",
    userId: "12",
  });

  assert.equal(parsed.labKey, "business-logic.workflow-bypass");
  assert.equal(parsed.variantKey, "fixed");
  assert.equal(parsed.phase, "defense");
  assert.equal(parsed.riskLevel, "critical");
  assert.equal(parsed.decision, "blocked");
  assert.equal(parsed.userId, "12");

  // 自由文本不得进入查询：带分号、引号、空格一律拒绝
  for (const labKey of ["web.xss;DROP TABLE", "web.xss'", "web xss", "web", "..xss"]) {
    assert.equal(isValidLabKey(labKey), false, `${labKey} 应被拒绝`);
    assert.throws(() => parseEventQuery({ labKey }), QueryError);
  }
});

test("时间范围支持 ISO 日期并校验先后顺序", () => {
  const parsed = parseEventQuery({ from: "2026-09-01", to: "2026-09-16" });

  assert.equal(parsed.from?.toISOString(), "2026-09-01T00:00:00.000Z");
  assert.equal(parsed.to?.toISOString(), "2026-09-16T00:00:00.000Z");

  assert.throws(
    () => parseEventQuery({ from: "2026-09-16", to: "2026-09-01" }),
    QueryError,
  );
  assert.throws(() => parseEventQuery({ from: "yesterday" }), QueryError);
  assert.throws(() => parseEventQuery({ to: "2026-13-45" }), QueryError);
});

test("实验筛选与审计筛选同样是白名单", () => {
  assert.deepEqual(parseLabFilter({}), {
    category: undefined,
    isEnabled: undefined,
  });
  assert.deepEqual(parseLabFilter({ category: "web", isEnabled: "false" }), {
    category: "web",
    isEnabled: false,
  });

  assert.throws(() => parseLabFilter({ category: "web'; DROP" }), QueryError);
  assert.throws(() => parseLabFilter({ isEnabled: "yes" }), QueryError);
  assert.throws(() => parseAuditQuery({ action: "lab.drop" }), QueryError);

  assert.equal(parseAuditQuery({ action: "lab.disable" }).action, "lab.disable");
});

test("PATCH 请求体只接受单一 isEnabled 布尔字段", () => {
  assert.equal(parseToggleBody({ isEnabled: true }), true);
  assert.equal(parseToggleBody({ isEnabled: false }), false);

  for (const body of [
    null,
    undefined,
    [],
    "false",
    {},
    { isEnabled: "true" },
    { isEnabled: true, action: "lab.enable" },
  ]) {
    assert.throws(() => parseToggleBody(body), QueryError);
  }
});

test("事件映射补齐 lab 标题并序列化时间", () => {
  const mapped = toAdminEvent(createEvent({ labTitle: null }));

  // 元数据缺失时退回 labKey，避免前端出现 undefined
  assert.equal(mapped.title, "web.xss");
  assert.equal(mapped.createdAt, "2026-09-16T02:00:00.000Z");
  assert.equal(mapped.userId, "2");
});

test("trace 归并按时间排序并计算耗时，空 trace 返回 null", () => {
  const detail = buildTraceDetail("trace-1", [
    createEvent({ id: "2", createdAt: new Date("2026-09-16T02:00:05.000Z") }),
    createEvent({ id: "1", createdAt: new Date("2026-09-16T02:00:00.000Z") }),
  ]);

  assert.ok(detail);
  assert.deepEqual(
    detail.events.map((event) => event.id),
    ["1", "2"],
  );
  assert.equal(detail.durationMs, 5000);
  assert.equal(buildTraceDetail("trace-1", []), null);
});

test("阻断率与风险分布做补零处理", () => {
  assert.equal(computeBlockRate(0, 0), 0);
  assert.equal(computeBlockRate(1, 3), 33.3);
  assert.equal(computeBlockRate(2, 2), 100);

  assert.deepEqual(normalizeRiskCounts({ high: 2 }), {
    low: 0,
    medium: 0,
    high: 2,
    critical: 0,
  });
});

test("近 7 日序列按日补零且保持升序", () => {
  const series = fillDailySeries(
    [{ date: "2026-09-15", count: 3 }],
    3,
    new Date("2026-09-16T10:00:00.000Z"),
  );

  assert.deepEqual(series, [
    { date: "2026-09-14", count: 0 },
    { date: "2026-09-15", count: 3 },
    { date: "2026-09-16", count: 0 },
  ]);
});

test("审计条目只回传 isEnabled 快照", () => {
  const record: AuditRecord = {
    id: "9",
    adminUserId: "1",
    action: "variant.disable",
    targetType: "variant",
    targetKey: "web.xss:vuln",
    beforeJson: { isEnabled: true },
    afterJson: { isEnabled: false },
    createdAt: new Date("2026-09-16T02:00:00.000Z"),
  };

  assert.deepEqual(toAuditLogItem(record), {
    id: "9",
    adminUserId: "1",
    action: "variant.disable",
    targetType: "variant",
    targetKey: "web.xss:vuln",
    before: { isEnabled: true },
    after: { isEnabled: false },
    createdAt: "2026-09-16T02:00:00.000Z",
  });

  // 即使库中被写入额外字段，也不透出
  const polluted = toAuditLogItem({
    ...record,
    afterJson: { isEnabled: false, note: "secret" },
  });

  assert.deepEqual(polluted.after, { isEnabled: false });

  // 非快照结构一律视为空，而不是原样回传
  assert.equal(toAuditLogItem({ ...record, beforeJson: "oops" }).before, null);
});

test("登录失败审计里的用户名被截断且不含密码", () => {
  assert.equal(sanitizeAuditUsername("admin"), "admin");
  assert.equal(sanitizeAuditUsername("  spaced  "), "spaced");
  assert.equal(sanitizeAuditUsername("a".repeat(200)).length, 64);
  // 控制字符被剔除；非 ASCII 同样不写入审计，全部剔除后记为 (empty)
  assert.equal(sanitizeAuditUsername("ad\u0000min"), "admin");
  assert.equal(sanitizeAuditUsername("管理员"), "(empty)");
  assert.equal(sanitizeAuditUsername(undefined), "(invalid)");
  assert.equal(sanitizeAuditUsername("   "), "(empty)");
});

test("复盘按 labKey 汇总 trace 数与完成题数", () => {
  const summary = summarizeRecap([
    { labKey: "web.xss", traceId: "t1", isCompleted: true },
    { labKey: "web.xss", traceId: "t1", isCompleted: false },
    { labKey: "web.xss", traceId: "t2", isCompleted: true },
    { labKey: "auth.idor", traceId: "t3", isCompleted: false },
  ]);

  assert.deepEqual(summary, [
    { labKey: "auth.idor", traceCount: 1, completedQuestions: 0 },
    { labKey: "web.xss", traceCount: 2, completedQuestions: 2 },
  ]);
  assert.deepEqual(summarizeRecap([]), []);
});

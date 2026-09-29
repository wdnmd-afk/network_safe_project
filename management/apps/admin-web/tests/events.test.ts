import { describe, expect, it } from "vitest";

import type { AdminEvent } from "@nsm/shared";

import {
  buildEventListParams,
  createEmptyEventFilters,
  hasActiveFilters,
  summarizeEventPage,
  totalPages,
} from "../src/modules/events";

function createEvent(overrides: Partial<AdminEvent> = {}): AdminEvent {
  return {
    id: "1",
    traceId: "trace-1",
    userId: "2",
    username: "demo_user",
    labKey: "web.xss",
    title: "XSS",
    variantKey: "vuln",
    phase: "attack",
    eventType: "success",
    actorPerspective: "attacker",
    decision: "accepted",
    signal: "xss-executed",
    statusCode: 200,
    message: "ok",
    riskLevel: "high",
    createdAt: "2026-09-16T02:00:00.000Z",
    ...overrides,
  };
}

describe("事件筛选参数", () => {
  it("空筛选只发送分页参数", () => {
    const params = buildEventListParams(createEmptyEventFilters(), 1, 20);

    expect(params).toEqual({ page: 1, pageSize: 20 });
  });

  it("空串不进入请求，否则服务端会当成非法枚举返回 400", () => {
    const filters = { ...createEmptyEventFilters(), phase: "", riskLevel: "" };
    const params = buildEventListParams(filters, 2, 50);

    expect("phase" in params).toBe(false);
    expect("riskLevel" in params).toBe(false);
    expect(params.page).toBe(2);
    expect(params.pageSize).toBe(50);
  });

  it("labKey 与 userId 去空格后发送", () => {
    const params = buildEventListParams(
      { ...createEmptyEventFilters(), labKey: "  web.xss  ", userId: " 2 " },
      1,
      20,
    );

    expect(params.labKey).toBe("web.xss");
    expect(params.userId).toBe("2");
  });

  it("hasActiveFilters 反映是否有筛选条件", () => {
    expect(hasActiveFilters(createEmptyEventFilters())).toBe(false);
    expect(
      hasActiveFilters({ ...createEmptyEventFilters(), decision: "blocked" }),
    ).toBe(true);
  });
});

describe("事件页摘要", () => {
  it("按风险、结果、阶段计数并统计链路数", () => {
    const summary = summarizeEventPage([
      createEvent({ id: "1", decision: "accepted", riskLevel: "high" }),
      createEvent({ id: "2", decision: "blocked", riskLevel: "low" }),
      createEvent({
        id: "3",
        decision: "blocked",
        riskLevel: "critical",
        phase: "defense",
        traceId: "trace-2",
      }),
    ]);

    expect(summary.total).toBe(3);
    expect(summary.traces).toBe(2);
    expect(summary.byDecision.blocked).toBe(2);
    expect(summary.byPhase.attack).toBe(2);
    expect(summary.byPhase.defense).toBe(1);
    expect(summary.byRisk.critical).toBe(1);
    expect(summary.byRisk.medium).toBe(0);
  });

  it("空列表返回全零而不是 undefined", () => {
    const summary = summarizeEventPage([]);

    expect(summary.total).toBe(0);
    expect(summary.traces).toBe(0);
    expect(summary.byRisk.low).toBe(0);
  });
});

describe("总页数", () => {
  it("向上取整且至少一页", () => {
    expect(totalPages(0, 20)).toBe(1);
    expect(totalPages(1, 20)).toBe(1);
    expect(totalPages(21, 20)).toBe(2);
    expect(totalPages(100, 20)).toBe(5);
  });
});

import type { AdminEvent, EventDecision, EventPhase, EventRiskLevel } from "@nsm/shared";

import type { EventListFilters } from "../api/admin";

export type EventFilterState = {
  labKey: string;
  variantKey: string;
  phase: string;
  riskLevel: string;
  decision: string;
  userId: string;
  from: string;
  to: string;
};

export function createEmptyEventFilters(): EventFilterState {
  return {
    labKey: "",
    variantKey: "",
    phase: "",
    riskLevel: "",
    decision: "",
    userId: "",
    from: "",
    to: "",
  };
}

/**
 * 把界面筛选状态转成请求参数。
 *
 * 空串表示「不筛」，必须剔除而不是发送空值——发送空串会被服务端当成
 * 非法枚举而返回 400。
 */
export function buildEventListParams(
  filters: EventFilterState,
  page: number,
  pageSize: number,
): EventListFilters {
  const params: EventListFilters = { page, pageSize };

  if (filters.labKey.trim()) params.labKey = filters.labKey.trim();
  if (filters.variantKey) params.variantKey = filters.variantKey;
  if (filters.phase) params.phase = filters.phase;
  if (filters.riskLevel) params.riskLevel = filters.riskLevel;
  if (filters.decision) params.decision = filters.decision;
  if (filters.userId.trim()) params.userId = filters.userId.trim();
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;

  return params;
}

export function hasActiveFilters(filters: EventFilterState) {
  return Object.values(filters).some((value) => value !== "");
}

/** 当前页的事件统计，用于列表上方的摘要条 */
export function summarizeEventPage(items: AdminEvent[]) {
  const byRisk: Record<EventRiskLevel, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  const byDecision: Record<EventDecision, number> = {
    accepted: 0,
    blocked: 0,
    failed: 0,
  };
  const byPhase: Record<EventPhase, number> = {
    attack: 0,
    defense: 0,
    normal: 0,
  };

  for (const event of items) {
    byRisk[event.riskLevel] += 1;
    byDecision[event.decision] += 1;
    byPhase[event.phase] += 1;
  }

  return {
    total: items.length,
    byRisk,
    byDecision,
    byPhase,
    traces: new Set(items.map((event) => event.traceId)).size,
  };
}

export function totalPages(total: number, pageSize: number) {
  if (pageSize <= 0) {
    return 1;
  }

  return Math.max(Math.ceil(total / pageSize), 1);
}

import type {
  AdminEvent,
  AdminLab,
  AdminUser,
  AuditAction,
  AuditLogItem,
  LearnerDetail,
  LearnerSummary,
  LoginResponse,
  OverviewResponse,
  Paginated,
  TraceDetail,
} from "@nsm/shared";

import { request, toQueryString } from "./client";

export type EventListFilters = {
  page?: number;
  pageSize?: number;
  labKey?: string;
  variantKey?: string;
  phase?: string;
  riskLevel?: string;
  decision?: string;
  userId?: string;
  from?: string;
  to?: string;
};

export function login(input: { username: string; password: string }) {
  return request<LoginResponse>("/api/admin/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchCurrentAdmin() {
  return request<{ status: "ok"; user: AdminUser }>("/api/admin/auth/me");
}

export function logout() {
  return request<{ status: "ok" }>("/api/admin/auth/logout", {
    method: "POST",
  });
}

export function fetchOverview() {
  return request<OverviewResponse>("/api/admin/overview");
}

export function fetchEvents(filters: EventListFilters = {}) {
  return request<Paginated<AdminEvent>>(
    `/api/admin/events${toQueryString(filters)}`,
  );
}

export function fetchTrace(traceId: string) {
  return request<{ status: "ok"; trace: TraceDetail }>(
    `/api/admin/events/traces/${encodeURIComponent(traceId)}`,
  );
}

export function fetchLabs(filter: { category?: string; isEnabled?: boolean } = {}) {
  return request<{ status: "ok"; items: AdminLab[]; total: number }>(
    `/api/admin/labs${toQueryString(filter)}`,
  );
}

export function setLabEnabled(labKey: string, isEnabled: boolean) {
  return request<{
    status: "ok";
    before: { isEnabled: boolean };
    after: { isEnabled: boolean };
  }>(`/api/admin/labs/${encodeURIComponent(labKey)}`, {
    method: "PATCH",
    body: JSON.stringify({ isEnabled }),
  });
}

export function setVariantEnabled(
  labKey: string,
  variantKey: string,
  isEnabled: boolean,
) {
  return request<{
    status: "ok";
    before: { isEnabled: boolean };
    after: { isEnabled: boolean };
  }>(
    `/api/admin/labs/${encodeURIComponent(labKey)}/variants/${encodeURIComponent(variantKey)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ isEnabled }),
    },
  );
}

export function fetchLearners() {
  return request<{ status: "ok"; items: LearnerSummary[]; total: number }>(
    "/api/admin/learners",
  );
}

export function fetchLearner(userId: string) {
  return request<
    { status: "ok" } & Omit<LearnerDetail, "learner"> & {
        learner: LearnerSummary;
      }
  >(`/api/admin/learners/${encodeURIComponent(userId)}`);
}

export function fetchAuditLogs(
  filters: { page?: number; pageSize?: number; action?: AuditAction } = {},
) {
  return request<Paginated<AuditLogItem>>(
    `/api/admin/audit-logs${toQueryString(filters)}`,
  );
}

export function fetchHealth() {
  return request<{ status: string; database: string }>("/api/admin/health");
}

export type { AdminEvent, AdminLab, AuditLogItem, LearnerSummary, OverviewResponse };

import { afterEach, describe, expect, it, vi } from "vitest";

import { submitMisconfigurationAudit } from "../src/api/misconfiguration-lab";
import {
  defaultMisconfigurationAuditPolicyKey,
  defaultMisconfigurationConfigCaseKey,
} from "../src/labs/misconfiguration";

describe("misconfiguration lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts only fixed config case and audit policy keys", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            configCaseKey: defaultMisconfigurationConfigCaseKey,
            auditPolicyKey: defaultMisconfigurationAuditPolicyKey,
            configSummary: {
              configCaseKey: defaultMisconfigurationConfigCaseKey,
              title: "调试入口开启摘要",
              exposureCategory: "debug-surface",
              visibleInVulnerableVariant: true,
              recommendedPolicyKey: "least-exposure-policy",
              learningNotes: "观察调试入口默认开启时的暴露面风险。",
            },
            audit: {
              exposureCategory: "debug-surface",
              exposureState: "visible",
              authRequired: false,
              corsPolicyStatus: "not-applicable",
              errorReportingStatus: "not-applicable",
              matchedControlledSample: true,
              riskIndicatorCount: 1,
              riskIndicators: ["debug-surface-visible"],
              auditActions: ["audit-missing"],
              recommendedAction: "切换到修复版观察暴露面收敛。",
            },
            signal: "misconfiguration-debug-surface-visible",
            decision: "accepted",
            message: "debug surface visible",
            nextStep: "compare fixed",
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const result = await submitMisconfigurationAudit(
      "vuln",
      "local-session-token",
      {
        configCaseKey: defaultMisconfigurationConfigCaseKey,
        auditPolicyKey: defaultMisconfigurationAuditPolicyKey,
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/infrastructure/misconfiguration/vuln/audit",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          configCaseKey: defaultMisconfigurationConfigCaseKey,
          auditPolicyKey: defaultMisconfigurationAuditPolicyKey,
        }),
      },
    );

    const requestBody = String(fetchMock.mock.calls[0]?.[1]?.body);

    expect(JSON.parse(requestBody)).toEqual({
      configCaseKey: defaultMisconfigurationConfigCaseKey,
      auditPolicyKey: defaultMisconfigurationAuditPolicyKey,
    });
    expect(requestBody).not.toContain("configText");
    expect(requestBody).not.toContain("host");
    expect(requestBody).not.toContain("port");
    expect(requestBody).not.toContain("path");
    expect(requestBody).not.toContain("url");
    expect(requestBody).not.toContain("password");
    expect(requestBody).not.toContain("cookie");
    expect(requestBody).not.toContain("certificate");
    expect(requestBody).not.toContain("nginxConfig");
    expect(result.result.signal).toBe(
      "misconfiguration-debug-surface-visible",
    );
  });

  it("returns blocked response body for controlled admin status decisions", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            variantKey: "fixed",
            configCaseKey: "public-admin-status",
            auditPolicyKey: "authenticated-admin-only",
            configSummary: {
              configCaseKey: "public-admin-status",
              title: "公开管理状态页摘要",
              exposureCategory: "admin-status",
              visibleInVulnerableVariant: true,
              recommendedPolicyKey: "authenticated-admin-only",
              learningNotes: "观察管理状态公开时的内部状态外显风险。",
            },
            audit: {
              exposureCategory: "admin-status",
              exposureState: "blocked",
              authRequired: true,
              corsPolicyStatus: "not-applicable",
              errorReportingStatus: "not-applicable",
              matchedControlledSample: true,
              riskIndicatorCount: 0,
              riskIndicators: [],
              auditActions: ["admin-auth-required", "exposure-reduced"],
              recommendedAction: "保持管理入口认证、授权和来源限制。",
            },
            signal: "misconfiguration-auth-required",
            decision: "blocked",
            message: "authentication required",
            nextStep: "review logs",
            blockedReason: "authentication-required",
          },
        }),
        {
          status: 403,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const result = await submitMisconfigurationAudit(
      "fixed",
      "local-session-token",
      {
        configCaseKey: "public-admin-status",
        auditPolicyKey: "authenticated-admin-only",
      },
    );

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe("misconfiguration-auth-required");
  });
});

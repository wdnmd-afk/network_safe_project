import { describe, expect, it } from "vitest";

import type { MisconfigurationResult } from "../src/api/misconfiguration-lab";
import {
  createMisconfigurationLearningProgress,
  createMisconfigurationVerificationRecord,
  defaultMisconfigurationAuditPolicyKey,
  defaultMisconfigurationConfigCaseKey,
  defaultMisconfigurationFixedAuditPolicyKey,
  defaultMisconfigurationFixedConfigCaseKey,
  formatMisconfigurationSignal,
  getDefaultMisconfigurationAuditPolicyKey,
  getDefaultMisconfigurationConfigCaseKey,
  getMisconfigurationObservationRows,
  getMisconfigurationVariantConfig,
  getRecommendedMisconfigurationAuditPolicyKey,
  misconfigurationAuditPolicyOptions,
  misconfigurationConfigCaseOptions,
  misconfigurationReviewChecklist,
} from "../src/labs/misconfiguration";

function createMisconfigurationResult(
  variantKey: MisconfigurationResult["variantKey"],
  signal: MisconfigurationResult["signal"],
): MisconfigurationResult {
  const blocked = signal === "misconfiguration-auth-required";
  const fixed = variantKey === "fixed";
  const configCaseKey = blocked
    ? "public-admin-status"
    : defaultMisconfigurationConfigCaseKey;
  const auditPolicyKey = blocked
    ? "authenticated-admin-only"
    : fixed
      ? defaultMisconfigurationFixedAuditPolicyKey
      : defaultMisconfigurationAuditPolicyKey;

  return {
    status: blocked ? "blocked" : "ok",
    variantKey,
    configCaseKey,
    auditPolicyKey,
    configSummary: {
      configCaseKey,
      title: blocked ? "公开管理状态页摘要" : "调试入口开启摘要",
      exposureCategory: blocked ? "admin-status" : "debug-surface",
      visibleInVulnerableVariant: true,
      recommendedPolicyKey: auditPolicyKey,
      learningNotes: "观察固定配置审计差异。",
    },
    audit: {
      exposureCategory: blocked ? "admin-status" : "debug-surface",
      exposureState: blocked ? "blocked" : fixed ? "reduced" : "visible",
      authRequired: blocked,
      corsPolicyStatus: "not-applicable",
      errorReportingStatus: "not-applicable",
      matchedControlledSample: true,
      riskIndicatorCount: fixed || blocked ? 0 : 1,
      riskIndicators: fixed || blocked ? [] : ["debug-surface-visible"],
      auditActions: blocked
        ? ["admin-auth-required", "exposure-reduced"]
        : fixed
          ? ["exposure-reduced", "debug-disabled"]
          : ["audit-missing"],
      recommendedAction: blocked
        ? "保持管理入口认证、授权和来源限制，不允许公开访问固定管理状态样例。"
        : fixed
          ? "保留该审计策略，并在复盘中确认日志只记录固定 key 和学习信号。"
          : "切换到修复版，观察固定审计策略如何收敛该暴露面。",
    },
    signal,
    decision: blocked ? "blocked" : "accepted",
    message: "misconfiguration observation",
    nextStep: "compare variants",
    ...(blocked ? { blockedReason: "authentication-required" } : {}),
  };
}

describe("配置错误前端实验模型", () => {
  it("为配置风险观察版和配置审计复盘版提供不同教学信号", () => {
    expect(getMisconfigurationVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      perspective: "攻击方观察",
      badge: "调试入口、目录索引、CORS、管理状态和错误信息暴露",
    });
    expect(getMisconfigurationVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      perspective: "防御方复盘",
      badge: "最小暴露面、认证要求、CORS 收敛和安全错误信息",
    });
  });

  it("暴露固定配置样例和固定审计策略", () => {
    expect(defaultMisconfigurationConfigCaseKey).toBe(
      "debug-console-exposed",
    );
    expect(defaultMisconfigurationAuditPolicyKey).toBe("exposure-review");
    expect(defaultMisconfigurationFixedConfigCaseKey).toBe(
      "debug-console-exposed",
    );
    expect(defaultMisconfigurationFixedAuditPolicyKey).toBe(
      "least-exposure-policy",
    );
    expect(getDefaultMisconfigurationConfigCaseKey("vuln")).toBe(
      "debug-console-exposed",
    );
    expect(getDefaultMisconfigurationConfigCaseKey("fixed")).toBe(
      "debug-console-exposed",
    );
    expect(getDefaultMisconfigurationAuditPolicyKey("vuln")).toBe(
      "exposure-review",
    );
    expect(getDefaultMisconfigurationAuditPolicyKey("fixed")).toBe(
      "least-exposure-policy",
    );
    expect(misconfigurationConfigCaseOptions.map((item) => item.key)).toEqual([
      "debug-console-exposed",
      "directory-index-enabled",
      "wildcard-cors-with-credentials",
      "public-admin-status",
      "verbose-error-detail",
      "default-credential-hint-visible",
    ]);
    expect(misconfigurationAuditPolicyOptions.map((item) => item.key)).toEqual([
      "exposure-review",
      "least-exposure-policy",
      "authenticated-admin-only",
      "strict-cors-audit",
      "safe-error-reporting",
    ]);
  });

  it("按变体给出推荐审计策略", () => {
    expect(
      getRecommendedMisconfigurationAuditPolicyKey(
        "wildcard-cors-with-credentials",
        "vuln",
      ),
    ).toBe("exposure-review");
    expect(
      getRecommendedMisconfigurationAuditPolicyKey(
        "wildcard-cors-with-credentials",
        "fixed",
      ),
    ).toBe("strict-cors-audit");
    expect(
      getRecommendedMisconfigurationAuditPolicyKey(
        "public-admin-status",
        "fixed",
      ),
    ).toBe("authenticated-admin-only");
    expect(
      getRecommendedMisconfigurationAuditPolicyKey(
        "verbose-error-detail",
        "fixed",
      ),
    ).toBe("safe-error-reporting");
  });

  it("为不同变体生成固定样例观察说明", () => {
    const vulnerableRows = getMisconfigurationObservationRows("vuln");
    const fixedRows = getMisconfigurationObservationRows("fixed");

    expect(vulnerableRows).toHaveLength(6);
    expect(fixedRows).toHaveLength(6);
    expect(vulnerableRows[0]).toMatchObject({
      key: "debug-console-exposed",
      title: "调试入口开启摘要",
    });
    expect(vulnerableRows[0]!.focus).toContain("攻击方可见");
    expect(fixedRows[3]!.focus).toContain("认证");
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(
      createMisconfigurationLearningProgress(
        getMisconfigurationVariantConfig("vuln"),
      ),
    ).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 配置错误风险观察版",
    });
  });

  it("生成配置风险观察版和配置审计复盘版验证记录载荷", () => {
    const vulnerableResult = createMisconfigurationResult(
      "vuln",
      "misconfiguration-debug-surface-visible",
    );
    const fixedResult = createMisconfigurationResult(
      "fixed",
      "misconfiguration-auth-required",
    );

    expect(
      createMisconfigurationVerificationRecord(
        getMisconfigurationVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "配置风险观察版展示了固定配置样例中的暴露面风险信号。",
      details: {
        signal: "misconfiguration-debug-surface-visible",
        configCaseKey: "debug-console-exposed",
        auditPolicyKey: "exposure-review",
        exposureCategory: "debug-surface",
        exposureState: "visible",
        authRequired: false,
        corsPolicyStatus: "not-applicable",
        errorReportingStatus: "not-applicable",
        riskIndicatorCount: 1,
        riskIndicators: ["debug-surface-visible"],
        auditActions: ["audit-missing"],
        recommendedAction:
          "切换到修复版，观察固定审计策略如何收敛该暴露面。",
      },
    });
    expect(
      createMisconfigurationVerificationRecord(
        getMisconfigurationVariantConfig("fixed"),
        fixedResult,
      ),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary:
        "配置审计复盘版展示了固定配置样例的暴露面收敛或认证阻断信号。",
      details: {
        signal: "misconfiguration-auth-required",
        configCaseKey: "public-admin-status",
        auditPolicyKey: "authenticated-admin-only",
        exposureCategory: "admin-status",
        exposureState: "blocked",
        authRequired: true,
        corsPolicyStatus: "not-applicable",
        errorReportingStatus: "not-applicable",
        riskIndicatorCount: 0,
        riskIndicators: [],
        auditActions: ["admin-auth-required", "exposure-reduced"],
        recommendedAction:
          "保持管理入口认证、授权和来源限制，不允许公开访问固定管理状态样例。",
      },
    });
  });

  it("静态文案保持固定样例和无真实基础设施边界", () => {
    const combined = JSON.stringify({
      configs: [
        getMisconfigurationVariantConfig("vuln"),
        getMisconfigurationVariantConfig("fixed"),
      ],
      configCases: misconfigurationConfigCaseOptions,
      policies: misconfigurationAuditPolicyOptions,
      checklist: misconfigurationReviewChecklist,
    });

    expect(
      formatMisconfigurationSignal("misconfiguration-auth-required"),
    ).toBe("管理入口已要求认证");
    expect(combined).toContain("固定");
    expect(combined).toContain("不连接真实基础设施");
    expect(combined).not.toContain("http://");
    expect(combined).not.toContain("https://");
    expect(combined).not.toContain("configText");
    expect(combined).not.toContain("nginxConfig");
  });
});

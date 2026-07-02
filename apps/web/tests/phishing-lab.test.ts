import { describe, expect, it } from "vitest";

import type { PhishingResult } from "../src/api/phishing-lab";
import {
  createPhishingLearningProgress,
  createPhishingVerificationRecord,
  defaultPhishingCaseKey,
  defaultPhishingFixedDefenseChecklistKey,
  defaultPhishingFixedReviewModeKey,
  defaultPhishingReviewModeKey,
  defaultPhishingVulnerableDefenseChecklistKey,
  formatPhishingSignal,
  getDefaultPhishingDefenseChecklistKey,
  getDefaultPhishingReviewModeKey,
  getPhishingCaseObservationRows,
  getPhishingVariantConfig,
  phishingCaseOptions,
  phishingDefenseChecklistOptions,
  phishingReviewChecklist,
  phishingReviewModeOptions,
} from "../src/labs/phishing";

function createPhishingResult(
  variantKey: PhishingResult["variantKey"],
  signal: PhishingResult["signal"],
): PhishingResult {
  const blocked = signal === "phishing-reporting-flow-applied";

  return {
    status: blocked ? "blocked" : "ok",
    variantKey,
    caseKey: defaultPhishingCaseKey,
    reviewModeKey: blocked
      ? defaultPhishingFixedReviewModeKey
      : defaultPhishingReviewModeKey,
    defenseChecklistKey: blocked
      ? defaultPhishingFixedDefenseChecklistKey
      : defaultPhishingVulnerableDefenseChecklistKey,
    caseSummary: {
      caseKey: defaultPhishingCaseKey,
      title: "账号安全提醒线索卡",
      surfaceCue: "安全提醒与凭据请求",
      businessContext: "固定账号安全提醒案例",
      riskLevel: "high",
      indicatorLabels: ["相似域名", "凭据请求", "紧急语气"],
      learningNotes: "观察显示名可信时的误判。",
    },
    inspection: {
      caseAllowed: true,
      reviewModeAllowed: true,
      checklistAllowed: true,
      indicatorCount: 3,
      riskIndicators: [
        "domain-lookalike",
        "credential-request",
        "urgency-signal",
      ],
      matchedControlledCase: true,
      surfaceBias: !blocked,
      checklistApplied: blocked,
      recommendedAction: blocked
        ? "report-isolate-and-confirm"
        : "surface-release-observed",
      riskLevel: "high",
    },
    signal,
    decision: blocked ? "blocked" : "accepted",
    message: "phishing observation",
    nextStep: "compare variants",
    ...(blocked ? { blockedReason: "phishing-risk-checklist-applied" } : {}),
  };
}

describe("网络钓鱼识别前端实验模型", () => {
  it("为误判观察版和识别复盘版提供不同教学信号", () => {
    expect(getPhishingVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      perspective: "攻击方观察",
      badge: "表面可信、紧急诱导和检查缺失",
    });
    expect(getPhishingVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      perspective: "防御方复盘",
      badge: "逐项复核、举报隔离和二次确认",
    });
  });

  it("暴露固定案例、固定观察模式和固定检查清单", () => {
    expect(defaultPhishingCaseKey).toBe("account-security-alert");
    expect(defaultPhishingReviewModeKey).toBe("surface-only");
    expect(defaultPhishingVulnerableDefenseChecklistKey).toBe("none");
    expect(defaultPhishingFixedReviewModeKey).toBe("reporting-flow");
    expect(defaultPhishingFixedDefenseChecklistKey).toBe(
      "report-isolate-confirm",
    );
    expect(getDefaultPhishingReviewModeKey("vuln")).toBe("surface-only");
    expect(getDefaultPhishingReviewModeKey("fixed")).toBe("reporting-flow");
    expect(getDefaultPhishingDefenseChecklistKey("vuln")).toBe("none");
    expect(getDefaultPhishingDefenseChecklistKey("fixed")).toBe(
      "report-isolate-confirm",
    );
    expect(phishingCaseOptions.map((item) => item.key)).toEqual([
      "invoice-urgent-review",
      "account-security-alert",
      "hr-benefit-update",
      "internal-security-newsletter",
    ]);
    expect(phishingReviewModeOptions.map((item) => item.key)).toEqual([
      "surface-only",
      "indicator-review",
      "reporting-flow",
    ]);
    expect(phishingDefenseChecklistOptions.map((item) => item.key)).toEqual([
      "none",
      "sender-domain-check",
      "report-isolate-confirm",
      "safe-release-check",
    ]);
  });

  it("为不同变体生成固定案例观察说明", () => {
    const vulnerableRows = getPhishingCaseObservationRows("vuln");
    const fixedRows = getPhishingCaseObservationRows("fixed");

    expect(vulnerableRows).toHaveLength(4);
    expect(fixedRows).toHaveLength(4);
    expect(vulnerableRows[1]).toMatchObject({
      key: "account-security-alert",
      title: "账号安全提醒线索卡",
    });
    expect(vulnerableRows[1]!.focus).toContain("相似域名");
    expect(fixedRows[1]!.focus).toContain("举报隔离");
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(createPhishingLearningProgress(getPhishingVariantConfig("vuln"))).toEqual(
      {
        variantKey: "vuln",
        status: "in-progress",
        notes: "进入 网络钓鱼误判观察版",
      },
    );
  });

  it("生成误判观察版和识别复盘版验证记录载荷", () => {
    const vulnerableResult = createPhishingResult(
      "vuln",
      "phishing-lookalike-domain-overlooked",
    );
    const fixedResult = createPhishingResult(
      "fixed",
      "phishing-reporting-flow-applied",
    );

    expect(
      createPhishingVerificationRecord(
        getPhishingVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "误判观察版展示了固定网络钓鱼线索卡中的错误放行风险信号。",
      details: {
        signal: "phishing-lookalike-domain-overlooked",
        caseKey: "account-security-alert",
        reviewModeKey: "surface-only",
        defenseChecklistKey: "none",
        indicatorCount: 3,
        riskIndicators: [
          "domain-lookalike",
          "credential-request",
          "urgency-signal",
        ],
        surfaceBias: true,
        checklistApplied: false,
        recommendedAction: "surface-release-observed",
        riskLevel: "high",
      },
    });
    expect(
      createPhishingVerificationRecord(
        getPhishingVariantConfig("fixed"),
        fixedResult,
      ),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "识别复盘版展示了固定网络钓鱼线索卡的阻断或安全放行信号。",
      details: {
        signal: "phishing-reporting-flow-applied",
        caseKey: "account-security-alert",
        reviewModeKey: "reporting-flow",
        defenseChecklistKey: "report-isolate-confirm",
        indicatorCount: 3,
        riskIndicators: [
          "domain-lookalike",
          "credential-request",
          "urgency-signal",
        ],
        surfaceBias: false,
        checklistApplied: true,
        recommendedAction: "report-isolate-and-confirm",
        riskLevel: "high",
      },
    });
  });

  it("静态文案保持固定案例和无真实投递边界", () => {
    const combined = JSON.stringify({
      configs: [
        getPhishingVariantConfig("vuln"),
        getPhishingVariantConfig("fixed"),
      ],
      cases: phishingCaseOptions,
      modes: phishingReviewModeOptions,
      checklists: phishingDefenseChecklistOptions,
      checklist: phishingReviewChecklist,
    });

    expect(formatPhishingSignal("phishing-reporting-flow-applied")).toBe(
      "修复版举报隔离流程已生效",
    );
    expect(combined).toContain("固定");
    expect(combined).toContain("不进行真实投递");
    expect(combined).not.toContain("emailBody");
    expect(combined).not.toContain("recipient");
    expect(combined).not.toContain("password");
    expect(combined).not.toContain("https://");
  });
});

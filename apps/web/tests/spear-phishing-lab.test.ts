import { describe, expect, it } from "vitest";

import type { SpearPhishingResult } from "../src/api/spear-phishing-lab";
import {
  createSpearPhishingLearningProgress,
  createSpearPhishingVerificationRecord,
  defaultSpearPhishingCaseKey,
  defaultSpearPhishingFixedPolicyKey,
  defaultSpearPhishingVulnerablePolicyKey,
  formatSpearPhishingSignal,
  getDefaultSpearPhishingVerificationPolicyKey,
  getSpearPhishingCaseObservationRows,
  getSpearPhishingVariantConfig,
  spearPhishingCaseOptions,
  spearPhishingReviewChecklist,
  spearPhishingVerificationPolicyOptions,
} from "../src/labs/spear-phishing";

function createSpearPhishingResult(
  variantKey: SpearPhishingResult["variantKey"],
  signal: SpearPhishingResult["signal"],
): SpearPhishingResult {
  const blocked =
    signal === "spear-phishing-out-of-band-confirmation-required";

  return {
    status: blocked ? "blocked" : "ok",
    variantKey,
    caseKey: defaultSpearPhishingCaseKey,
    verificationPolicyKey: blocked
      ? defaultSpearPhishingFixedPolicyKey
      : defaultSpearPhishingVulnerablePolicyKey,
    caseSummary: {
      caseKey: defaultSpearPhishingCaseKey,
      title: "高权威付款审批线索卡",
      roleContext: "高权威业务角色与付款审批执行者",
      processContext: "财务审批链与可信通道二次确认",
      riskLevel: "high",
      clueLabels: ["角色权威", "紧急压力", "审批链绕过"],
      learningNotes: "观察权威压力和紧急付款语境如何压缩正式审批链核验。",
    },
    assessment: {
      caseAllowed: true,
      policyAllowed: true,
      riskIndicatorCount: 3,
      riskIndicators: [
        "authority-pressure",
        "urgency-pressure",
        "approval-chain-bypass",
      ],
      matchedControlledCase: true,
      contextTrustBias: !blocked,
      verificationApplied: blocked,
      approvalChainRequired: blocked,
      outOfBandRequired: blocked,
      recommendedAction: blocked
        ? "restore-approval-chain-before-action"
        : "surface-context-release-observed",
      riskLevel: "high",
    },
    signal,
    decision: blocked ? "blocked" : "accepted",
    message: "spear phishing observation",
    nextStep: "compare variants",
    ...(blocked
      ? { blockedReason: "spear-phishing-verification-required" }
      : {}),
  };
}

describe("鱼叉式钓鱼前端实验模型", () => {
  it("为针对性误判观察版和流程核验复盘版提供不同教学信号", () => {
    expect(getSpearPhishingVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      perspective: "攻击方观察",
      badge: "角色权威、业务熟悉感和审批链绕过",
    });
    expect(getSpearPhishingVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      perspective: "防御方复盘",
      badge: "可信通道、审批链复核和最小授权",
    });
  });

  it("暴露固定案例和固定核验策略", () => {
    expect(defaultSpearPhishingCaseKey).toBe("executive-invoice-approval");
    expect(defaultSpearPhishingVulnerablePolicyKey).toBe("context-only");
    expect(defaultSpearPhishingFixedPolicyKey).toBe("approval-chain-review");
    expect(getDefaultSpearPhishingVerificationPolicyKey("vuln")).toBe(
      "context-only",
    );
    expect(getDefaultSpearPhishingVerificationPolicyKey("fixed")).toBe(
      "approval-chain-review",
    );
    expect(spearPhishingCaseOptions.map((item) => item.key)).toEqual([
      "executive-invoice-approval",
      "vendor-payment-change",
      "engineering-access-request",
      "hr-benefit-personalized",
    ]);
    expect(
      spearPhishingVerificationPolicyOptions.map((item) => item.key),
    ).toEqual([
      "context-only",
      "out-of-band-confirmation",
      "approval-chain-review",
      "least-privilege-review",
      "report-and-isolate",
    ]);
  });

  it("为不同变体生成固定案例观察说明", () => {
    const vulnerableRows = getSpearPhishingCaseObservationRows("vuln");
    const fixedRows = getSpearPhishingCaseObservationRows("fixed");

    expect(vulnerableRows).toHaveLength(4);
    expect(fixedRows).toHaveLength(4);
    expect(vulnerableRows[0]).toMatchObject({
      key: "executive-invoice-approval",
      title: "高权威付款审批线索卡",
    });
    expect(vulnerableRows[0]!.focus).toContain("正式审批链");
    expect(fixedRows[0]!.focus).toContain("可信通道");
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(
      createSpearPhishingLearningProgress(
        getSpearPhishingVariantConfig("vuln"),
      ),
    ).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 鱼叉式钓鱼针对性误判观察版",
    });
  });

  it("生成针对性误判观察版和流程核验复盘版验证记录载荷", () => {
    const vulnerableResult = createSpearPhishingResult(
      "vuln",
      "spear-phishing-approval-chain-bypassed",
    );
    const fixedResult = createSpearPhishingResult(
      "fixed",
      "spear-phishing-out-of-band-confirmation-required",
    );

    expect(
      createSpearPhishingVerificationRecord(
        getSpearPhishingVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary:
        "针对性误判观察版展示了固定鱼叉式钓鱼线索卡中的错误放行风险信号。",
      details: {
        signal: "spear-phishing-approval-chain-bypassed",
        caseKey: "executive-invoice-approval",
        verificationPolicyKey: "context-only",
        riskIndicatorCount: 3,
        riskIndicators: [
          "authority-pressure",
          "urgency-pressure",
          "approval-chain-bypass",
        ],
        matchedControlledCase: true,
        contextTrustBias: true,
        verificationApplied: false,
        approvalChainRequired: false,
        outOfBandRequired: false,
        recommendedAction: "surface-context-release-observed",
        riskLevel: "high",
      },
    });
    expect(
      createSpearPhishingVerificationRecord(
        getSpearPhishingVariantConfig("fixed"),
        fixedResult,
      ),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "流程核验复盘版展示了固定鱼叉式钓鱼线索卡的阻断或边界确认信号。",
      details: {
        signal: "spear-phishing-out-of-band-confirmation-required",
        caseKey: "executive-invoice-approval",
        verificationPolicyKey: "approval-chain-review",
        riskIndicatorCount: 3,
        riskIndicators: [
          "authority-pressure",
          "urgency-pressure",
          "approval-chain-bypass",
        ],
        matchedControlledCase: true,
        contextTrustBias: false,
        verificationApplied: true,
        approvalChainRequired: true,
        outOfBandRequired: true,
        recommendedAction: "restore-approval-chain-before-action",
        riskLevel: "high",
      },
    });
  });

  it("静态文案保持固定案例和无真实投递边界", () => {
    const combined = JSON.stringify({
      configs: [
        getSpearPhishingVariantConfig("vuln"),
        getSpearPhishingVariantConfig("fixed"),
      ],
      cases: spearPhishingCaseOptions,
      policies: spearPhishingVerificationPolicyOptions,
      checklist: spearPhishingReviewChecklist,
    });

    expect(
      formatSpearPhishingSignal(
        "spear-phishing-out-of-band-confirmation-required",
      ),
    ).toBe("修复版要求可信通道二次确认");
    expect(combined).toContain("固定");
    expect(combined).toContain("不进行真实投递");
    expect(combined).not.toContain("emailBody");
    expect(combined).not.toContain("recipient");
    expect(combined).not.toContain("password");
    expect(combined).not.toContain("https://");
  });
});

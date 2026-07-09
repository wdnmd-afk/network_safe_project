import { describe, expect, it } from "vitest";

import type { WhalingResult } from "../src/api/whaling-lab";
import {
  createWhalingLearningProgress,
  createWhalingVerificationRecord,
  defaultWhalingCaseKey,
  defaultWhalingFixedPolicyKey,
  defaultWhalingVulnerablePolicyKey,
  formatWhalingSignal,
  getDefaultWhalingVerificationPolicyKey,
  getWhalingCaseObservationRows,
  getWhalingVariantConfig,
  whalingCaseOptions,
  whalingReviewChecklist,
  whalingVerificationPolicyOptions,
} from "../src/labs/whaling";

function createWhalingResult(
  variantKey: WhalingResult["variantKey"],
  signal: WhalingResult["signal"],
): WhalingResult {
  const blocked = signal === "whaling-payment-freeze-required";

  return {
    status: blocked ? "blocked" : "ok",
    variantKey,
    caseKey: defaultWhalingCaseKey,
    verificationPolicyKey: blocked
      ? defaultWhalingFixedPolicyKey
      : defaultWhalingVulnerablePolicyKey,
    caseSummary: {
      caseKey: defaultWhalingCaseKey,
      title: "高层紧急大额付款线索卡",
      roleContext: "高层决策角色与大额付款执行者",
      processContext: "财务付款审批链、可信通道回拨和双人复核",
      riskLevel: "critical",
      clueLabels: ["高权威压力", "紧急时限", "审批链跳过", "保密理由"],
      learningNotes: "观察高层授权标签和紧急付款语境如何压缩正式核验。",
    },
    assessment: {
      caseAllowed: true,
      policyAllowed: true,
      riskIndicatorCount: 5,
      riskIndicators: [
        "executive-authority-pressure",
        "confidentiality-pressure",
        "payment-urgency",
        "approval-chain-bypass",
        "trusted-channel-missing",
      ],
      matchedControlledCase: true,
      authorityContextBias: !blocked,
      verificationApplied: blocked,
      trustedChannelRequired: blocked,
      paymentFreezeRequired: blocked,
      legalBoardReviewRequired: false,
      leastPrivilegeRequired: false,
      recommendedAction: blocked
        ? "freeze-payment-before-dual-approval"
        : "authority-context-release-observed",
      riskLevel: "critical",
    },
    signal,
    decision: blocked ? "blocked" : "accepted",
    message: "whaling observation",
    nextStep: "compare variants",
    ...(blocked ? { blockedReason: "whaling-verification-required" } : {}),
  };
}

describe("捕鲸攻击前端实验模型", () => {
  it("为高权威误判观察版和高风险流程核验复盘版提供不同教学信号", () => {
    expect(getWhalingVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      perspective: "攻击方观察",
      badge: "高权威压力、保密语境和越级审批",
    });
    expect(getWhalingVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      perspective: "防御方复盘",
      badge: "可信通道、付款冻结、法务核验和最小授权",
    });
  });

  it("暴露固定案例和固定核验策略", () => {
    expect(defaultWhalingCaseKey).toBe("executive-wire-approval");
    expect(defaultWhalingVulnerablePolicyKey).toBe("authority-context-only");
    expect(defaultWhalingFixedPolicyKey).toBe("payment-dual-approval");
    expect(getDefaultWhalingVerificationPolicyKey("vuln")).toBe(
      "authority-context-only",
    );
    expect(getDefaultWhalingVerificationPolicyKey("fixed")).toBe(
      "payment-dual-approval",
    );
    expect(whalingCaseOptions.map((item) => item.key)).toEqual([
      "executive-wire-approval",
      "board-confidential-request",
      "legal-settlement-transfer",
      "ma-data-room-access",
    ]);
    expect(whalingVerificationPolicyOptions.map((item) => item.key)).toEqual([
      "authority-context-only",
      "trusted-channel-callback",
      "payment-dual-approval",
      "legal-board-channel-review",
      "least-privilege-data-room",
      "freeze-and-escalate",
    ]);
  });

  it("为不同变体生成固定案例观察说明", () => {
    const vulnerableRows = getWhalingCaseObservationRows("vuln");
    const fixedRows = getWhalingCaseObservationRows("fixed");

    expect(vulnerableRows).toHaveLength(4);
    expect(fixedRows).toHaveLength(4);
    expect(vulnerableRows[0]).toMatchObject({
      key: "executive-wire-approval",
      title: "高层紧急大额付款线索卡",
    });
    expect(vulnerableRows[0]!.focus).toContain("正式核验");
    expect(fixedRows[0]!.focus).toContain("双人复核");
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(createWhalingLearningProgress(getWhalingVariantConfig("vuln"))).toEqual(
      {
        variantKey: "vuln",
        status: "in-progress",
        notes: "进入 捕鲸攻击高权威误判观察版",
      },
    );
  });

  it("生成高权威误判观察版和高风险流程核验复盘版验证记录载荷", () => {
    const vulnerableResult = createWhalingResult(
      "vuln",
      "whaling-executive-authority-overweighted",
    );
    const fixedResult = createWhalingResult(
      "fixed",
      "whaling-payment-freeze-required",
    );

    expect(
      createWhalingVerificationRecord(
        getWhalingVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "高权威误判观察版展示了固定捕鲸攻击案例中的错误放行风险信号。",
      details: {
        signal: "whaling-executive-authority-overweighted",
        caseKey: "executive-wire-approval",
        verificationPolicyKey: "authority-context-only",
        riskIndicatorCount: 5,
        riskIndicators: [
          "executive-authority-pressure",
          "confidentiality-pressure",
          "payment-urgency",
          "approval-chain-bypass",
          "trusted-channel-missing",
        ],
        matchedControlledCase: true,
        authorityContextBias: true,
        verificationApplied: false,
        trustedChannelRequired: false,
        paymentFreezeRequired: false,
        legalBoardReviewRequired: false,
        leastPrivilegeRequired: false,
        recommendedAction: "authority-context-release-observed",
        riskLevel: "critical",
      },
    });
    expect(
      createWhalingVerificationRecord(
        getWhalingVariantConfig("fixed"),
        fixedResult,
      ),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "高风险流程核验复盘版展示了固定捕鲸攻击案例的阻断或边界确认信号。",
      details: {
        signal: "whaling-payment-freeze-required",
        caseKey: "executive-wire-approval",
        verificationPolicyKey: "payment-dual-approval",
        riskIndicatorCount: 5,
        riskIndicators: [
          "executive-authority-pressure",
          "confidentiality-pressure",
          "payment-urgency",
          "approval-chain-bypass",
          "trusted-channel-missing",
        ],
        matchedControlledCase: true,
        authorityContextBias: false,
        verificationApplied: true,
        trustedChannelRequired: true,
        paymentFreezeRequired: true,
        legalBoardReviewRequired: false,
        leastPrivilegeRequired: false,
        recommendedAction: "freeze-payment-before-dual-approval",
        riskLevel: "critical",
      },
    });
  });

  it("静态文案保持固定案例和无真实投递边界", () => {
    const combined = JSON.stringify({
      configs: [getWhalingVariantConfig("vuln"), getWhalingVariantConfig("fixed")],
      cases: whalingCaseOptions,
      policies: whalingVerificationPolicyOptions,
      checklist: whalingReviewChecklist,
    });

    expect(formatWhalingSignal("whaling-payment-freeze-required")).toBe(
      "修复版要求冻结并复核高风险动作",
    );
    expect(combined).toContain("固定");
    expect(combined).toContain("不进行真实投递");
    expect(combined).not.toContain("emailBody");
    expect(combined).not.toContain("executiveName");
    expect(combined).not.toContain("organizationChart");
    expect(combined).not.toContain("paymentAccount");
    expect(combined).not.toContain("meetingInvite");
    expect(combined).not.toContain("password");
    expect(combined).not.toContain("https://");
  });
});

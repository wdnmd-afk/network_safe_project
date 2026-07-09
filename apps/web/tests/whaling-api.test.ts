import { afterEach, describe, expect, it, vi } from "vitest";

import { submitWhalingReview } from "../src/api/whaling-lab";
import {
  defaultWhalingCaseKey,
  defaultWhalingFixedPolicyKey,
  defaultWhalingVulnerablePolicyKey,
} from "../src/labs/whaling";

describe("whaling lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts only fixed case and verification policy keys", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            caseKey: defaultWhalingCaseKey,
            verificationPolicyKey: defaultWhalingVulnerablePolicyKey,
            caseSummary: {
              caseKey: defaultWhalingCaseKey,
              title: "高层紧急大额付款线索卡",
              roleContext: "高层决策角色与大额付款执行者",
              processContext: "财务付款审批链、可信通道回拨和双人复核",
              riskLevel: "critical",
              clueLabels: ["高权威压力", "紧急时限", "审批链跳过"],
              learningNotes: "观察高层授权标签和紧急付款语境。",
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
              authorityContextBias: true,
              verificationApplied: false,
              trustedChannelRequired: false,
              paymentFreezeRequired: false,
              legalBoardReviewRequired: false,
              leastPrivilegeRequired: false,
              recommendedAction: "authority-context-release-observed",
              riskLevel: "critical",
            },
            signal: "whaling-executive-authority-overweighted",
            decision: "accepted",
            message: "misjudgement visible",
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

    const result = await submitWhalingReview("vuln", "local-session-token", {
      caseKey: defaultWhalingCaseKey,
      verificationPolicyKey: defaultWhalingVulnerablePolicyKey,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/social/whaling/vuln/review",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          caseKey: defaultWhalingCaseKey,
          verificationPolicyKey: defaultWhalingVulnerablePolicyKey,
        }),
      },
    );

    const requestBody = String(fetchMock.mock.calls[0]?.[1]?.body);

    expect(JSON.parse(requestBody)).toEqual({
      caseKey: defaultWhalingCaseKey,
      verificationPolicyKey: defaultWhalingVulnerablePolicyKey,
    });
    expect(requestBody).not.toContain("emailBody");
    expect(requestBody).not.toContain("executiveName");
    expect(requestBody).not.toContain("organizationChart");
    expect(requestBody).not.toContain("paymentAccount");
    expect(requestBody).not.toContain("meetingInvite");
    expect(requestBody).not.toContain("password");
    expect(requestBody).not.toContain("token");
    expect(requestBody).not.toContain("url");
    expect(result.result.signal).toBe(
      "whaling-executive-authority-overweighted",
    );
  });

  it("returns blocked response body for fixed verification decisions", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            variantKey: "fixed",
            caseKey: defaultWhalingCaseKey,
            verificationPolicyKey: defaultWhalingFixedPolicyKey,
            caseSummary: {
              caseKey: defaultWhalingCaseKey,
              title: "高层紧急大额付款线索卡",
              roleContext: "高层决策角色与大额付款执行者",
              processContext: "财务付款审批链、可信通道回拨和双人复核",
              riskLevel: "critical",
              clueLabels: ["高权威压力", "紧急时限", "审批链跳过"],
              learningNotes: "观察可信通道和双人复核。",
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
              authorityContextBias: false,
              verificationApplied: true,
              trustedChannelRequired: true,
              paymentFreezeRequired: true,
              legalBoardReviewRequired: false,
              leastPrivilegeRequired: false,
              recommendedAction: "freeze-payment-before-dual-approval",
              riskLevel: "critical",
            },
            signal: "whaling-payment-freeze-required",
            decision: "blocked",
            message: "blocked",
            nextStep: "review logs",
            blockedReason: "whaling-verification-required",
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

    const result = await submitWhalingReview("fixed", "local-session-token", {
      caseKey: defaultWhalingCaseKey,
      verificationPolicyKey: defaultWhalingFixedPolicyKey,
    });

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe("whaling-payment-freeze-required");
  });
});

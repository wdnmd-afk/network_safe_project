import { afterEach, describe, expect, it, vi } from "vitest";

import { submitSpearPhishingReview } from "../src/api/spear-phishing-lab";
import {
  defaultSpearPhishingCaseKey,
  defaultSpearPhishingFixedPolicyKey,
  defaultSpearPhishingVulnerablePolicyKey,
} from "../src/labs/spear-phishing";

describe("spear phishing lab api client", () => {
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
            caseKey: defaultSpearPhishingCaseKey,
            verificationPolicyKey: defaultSpearPhishingVulnerablePolicyKey,
            caseSummary: {
              caseKey: defaultSpearPhishingCaseKey,
              title: "高权威付款审批线索卡",
              roleContext: "高权威业务角色与付款审批执行者",
              processContext: "财务审批链与可信通道二次确认",
              riskLevel: "high",
              clueLabels: ["角色权威", "紧急压力", "审批链绕过"],
              learningNotes: "观察权威压力和紧急付款语境。",
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
              contextTrustBias: true,
              verificationApplied: false,
              approvalChainRequired: false,
              outOfBandRequired: false,
              recommendedAction: "surface-context-release-observed",
              riskLevel: "high",
            },
            signal: "spear-phishing-approval-chain-bypassed",
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

    const result = await submitSpearPhishingReview(
      "vuln",
      "local-session-token",
      {
        caseKey: defaultSpearPhishingCaseKey,
        verificationPolicyKey: defaultSpearPhishingVulnerablePolicyKey,
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/social/spear-phishing/vuln/review",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          caseKey: defaultSpearPhishingCaseKey,
          verificationPolicyKey: defaultSpearPhishingVulnerablePolicyKey,
        }),
      },
    );

    const requestBody = String(fetchMock.mock.calls[0]?.[1]?.body);

    expect(JSON.parse(requestBody)).toEqual({
      caseKey: defaultSpearPhishingCaseKey,
      verificationPolicyKey: defaultSpearPhishingVulnerablePolicyKey,
    });
    expect(requestBody).not.toContain("emailBody");
    expect(requestBody).not.toContain("recipient");
    expect(requestBody).not.toContain("sender");
    expect(requestBody).not.toContain("subject");
    expect(requestBody).not.toContain("password");
    expect(requestBody).not.toContain("token");
    expect(requestBody).not.toContain("url");
    expect(requestBody).not.toContain("profile");
    expect(result.result.signal).toBe(
      "spear-phishing-approval-chain-bypassed",
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
            caseKey: defaultSpearPhishingCaseKey,
            verificationPolicyKey: defaultSpearPhishingFixedPolicyKey,
            caseSummary: {
              caseKey: defaultSpearPhishingCaseKey,
              title: "高权威付款审批线索卡",
              roleContext: "高权威业务角色与付款审批执行者",
              processContext: "财务审批链与可信通道二次确认",
              riskLevel: "high",
              clueLabels: ["角色权威", "紧急压力", "审批链绕过"],
              learningNotes: "观察可信通道复核。",
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
              contextTrustBias: false,
              verificationApplied: true,
              approvalChainRequired: true,
              outOfBandRequired: true,
              recommendedAction: "restore-approval-chain-before-action",
              riskLevel: "high",
            },
            signal: "spear-phishing-out-of-band-confirmation-required",
            decision: "blocked",
            message: "blocked",
            nextStep: "review logs",
            blockedReason: "spear-phishing-verification-required",
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

    const result = await submitSpearPhishingReview(
      "fixed",
      "local-session-token",
      {
        caseKey: defaultSpearPhishingCaseKey,
        verificationPolicyKey: defaultSpearPhishingFixedPolicyKey,
      },
    );

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe(
      "spear-phishing-out-of-band-confirmation-required",
    );
  });
});

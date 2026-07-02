import { afterEach, describe, expect, it, vi } from "vitest";

import { submitPhishingReview } from "../src/api/phishing-lab";
import {
  defaultPhishingCaseKey,
  defaultPhishingReviewModeKey,
  defaultPhishingVulnerableDefenseChecklistKey,
} from "../src/labs/phishing";

describe("phishing lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts only fixed case, review mode and checklist keys", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            caseKey: defaultPhishingCaseKey,
            reviewModeKey: defaultPhishingReviewModeKey,
            defenseChecklistKey: defaultPhishingVulnerableDefenseChecklistKey,
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
              surfaceBias: true,
              checklistApplied: false,
              recommendedAction: "surface-release-observed",
              riskLevel: "high",
            },
            signal: "phishing-lookalike-domain-overlooked",
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

    const result = await submitPhishingReview(
      "vuln",
      "local-session-token",
      {
        caseKey: defaultPhishingCaseKey,
        reviewModeKey: defaultPhishingReviewModeKey,
        defenseChecklistKey: defaultPhishingVulnerableDefenseChecklistKey,
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/social/phishing/vuln/review",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          caseKey: defaultPhishingCaseKey,
          reviewModeKey: defaultPhishingReviewModeKey,
          defenseChecklistKey: defaultPhishingVulnerableDefenseChecklistKey,
        }),
      },
    );

    const requestBody = String(fetchMock.mock.calls[0]?.[1]?.body);

    expect(JSON.parse(requestBody)).toEqual({
      caseKey: defaultPhishingCaseKey,
      reviewModeKey: defaultPhishingReviewModeKey,
      defenseChecklistKey: defaultPhishingVulnerableDefenseChecklistKey,
    });
    expect(requestBody).not.toContain("emailBody");
    expect(requestBody).not.toContain("recipient");
    expect(requestBody).not.toContain("sender");
    expect(requestBody).not.toContain("subject");
    expect(requestBody).not.toContain("password");
    expect(requestBody).not.toContain("token");
    expect(requestBody).not.toContain("url");
    expect(requestBody).not.toContain("attachment");
    expect(result.result.signal).toBe("phishing-lookalike-domain-overlooked");
  });

  it("returns blocked response body for controlled checklist decisions", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            variantKey: "fixed",
            caseKey: defaultPhishingCaseKey,
            reviewModeKey: "reporting-flow",
            defenseChecklistKey: "report-isolate-confirm",
            caseSummary: {
              caseKey: defaultPhishingCaseKey,
              title: "账号安全提醒线索卡",
              surfaceCue: "安全提醒与凭据请求",
              businessContext: "固定账号安全提醒案例",
              riskLevel: "high",
              indicatorLabels: ["相似域名", "凭据请求", "紧急语气"],
              learningNotes: "观察安全通道复核。",
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
              surfaceBias: false,
              checklistApplied: true,
              recommendedAction: "report-isolate-and-confirm",
              riskLevel: "high",
            },
            signal: "phishing-reporting-flow-applied",
            decision: "blocked",
            message: "blocked",
            nextStep: "review logs",
            blockedReason: "phishing-risk-checklist-applied",
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

    const result = await submitPhishingReview(
      "fixed",
      "local-session-token",
      {
        caseKey: defaultPhishingCaseKey,
        reviewModeKey: "reporting-flow",
        defenseChecklistKey: "report-isolate-confirm",
      },
    );

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe("phishing-reporting-flow-applied");
  });
});

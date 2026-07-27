import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchGuidedScenarioWorkbench,
  submitGuidedScenarioEvaluation,
} from "../src/api/guided-scenario-lab";

const workbench = {
  id: "social.smishing",
  slug: "smishing",
  category: "social",
  subcategory: "smishing",
  title: "短信钓鱼",
  mode: "case-study",
  severity: "high",
  difficulty: "beginner",
  summary: "固定短信钓鱼场景",
  phase: "phase-3",
  defaultScenarioKey: "synthetic-delivery-alert",
  defaultControlKey: "message-context-trusted",
  scenarios: [],
  controls: [],
  vulnerableOutcome: {
    decision: "accepted",
    signal: "social-smishing-risk-accepted",
    message: "risk accepted",
  },
  safeBoundaries: [],
  notes: "local only",
} as const;

describe("guided scenario lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the exact category and scene workbench", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", workbench }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await fetchGuidedScenarioWorkbench("social", "smishing");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/social/smishing/workbench",
    );
    expect(result.workbench.id).toBe("social.smishing");
  });

  it("posts only scenarioKey and controlKey", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            labKey: "social.smishing",
            variantKey: "vuln",
            scenarioKey: "synthetic-delivery-alert",
            controlKey: "message-context-trusted",
            scenarioTitle: "虚构物流异常提醒",
            controlTitle: "只相信消息上下文",
            decision: "accepted",
            signal: "social-smishing-risk-accepted",
            message: "risk accepted",
            nextStep: "compare fixed",
            assessment: {
              matchedScenario: true,
              matchedControl: true,
              controlApplied: false,
              riskLevel: "high",
              riskIndicatorCount: 3,
              riskIndicators: [
                "short-link",
                "urgency-pressure",
                "sender-spoofing",
              ],
              rootCause: "message context trusted",
            },
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const result = await submitGuidedScenarioEvaluation(
      "social",
      "smishing",
      "vuln",
      "local-session-token",
      {
        scenarioKey: "synthetic-delivery-alert",
        controlKey: "message-context-trusted",
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/social/smishing/vuln/evaluate",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scenarioKey: "synthetic-delivery-alert",
          controlKey: "message-context-trusted",
        }),
      },
    );

    const requestBody = String(fetchMock.mock.calls[0]?.[1]?.body);

    expect(JSON.parse(requestBody)).toEqual({
      scenarioKey: "synthetic-delivery-alert",
      controlKey: "message-context-trusted",
    });
    expect(requestBody).not.toContain("targetUrl");
    expect(requestBody).not.toContain("password");
    expect(requestBody).not.toContain("token");
    expect(requestBody).not.toContain("command");
    expect(result.result.signal).toBe("social-smishing-risk-accepted");
  });

  it("returns controlled fixed blocked responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            labKey: "social.smishing",
            variantKey: "fixed",
            scenarioKey: "synthetic-delivery-alert",
            controlKey: "message-context-trusted",
            decision: "blocked",
            signal: "social-smishing-defense-blocked",
            assessment: {},
          },
        }),
        {
          status: 403,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const result = await submitGuidedScenarioEvaluation(
      "social",
      "smishing",
      "fixed",
      "local-session-token",
      {
        scenarioKey: "synthetic-delivery-alert",
        controlKey: "message-context-trusted",
      },
    );

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe("social-smishing-defense-blocked");
  });
});

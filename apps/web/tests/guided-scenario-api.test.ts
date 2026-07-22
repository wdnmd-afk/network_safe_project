import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchGuidedScenarioWorkbench,
  submitGuidedScenarioEvaluation,
} from "../src/api/guided-scenario-lab";

const workbench = {
  id: "web.clickjacking",
  slug: "clickjacking",
  category: "web",
  subcategory: "clickjacking",
  title: "点击劫持",
  mode: "interactive",
  severity: "medium",
  difficulty: "beginner",
  summary: "固定点击劫持场景",
  phase: "phase-1",
  defaultScenarioKey: "embedded-approval-overlay",
  defaultControlKey: "frame-policy-missing",
  scenarios: [],
  controls: [],
  vulnerableOutcome: {
    decision: "accepted",
    signal: "web-clickjacking-risk-accepted",
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

    const result = await fetchGuidedScenarioWorkbench("web", "clickjacking");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/web/clickjacking/workbench",
    );
    expect(result.workbench.id).toBe("web.clickjacking");
  });

  it("posts only scenarioKey and controlKey", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            labKey: "web.clickjacking",
            variantKey: "vuln",
            scenarioKey: "embedded-approval-overlay",
            controlKey: "frame-policy-missing",
            scenarioTitle: "透明覆盖审批按钮",
            controlTitle: "缺少框架限制",
            decision: "accepted",
            signal: "web-clickjacking-risk-accepted",
            message: "risk accepted",
            nextStep: "compare fixed",
            assessment: {
              matchedScenario: true,
              matchedControl: true,
              controlApplied: false,
              riskLevel: "medium",
              riskIndicatorCount: 3,
              riskIndicators: [
                "frame-embedding",
                "transparent-overlay",
                "sensitive-action",
              ],
              rootCause: "missing frame policy",
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
      "web",
      "clickjacking",
      "vuln",
      "local-session-token",
      {
        scenarioKey: "embedded-approval-overlay",
        controlKey: "frame-policy-missing",
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/web/clickjacking/vuln/evaluate",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scenarioKey: "embedded-approval-overlay",
          controlKey: "frame-policy-missing",
        }),
      },
    );

    const requestBody = String(fetchMock.mock.calls[0]?.[1]?.body);

    expect(JSON.parse(requestBody)).toEqual({
      scenarioKey: "embedded-approval-overlay",
      controlKey: "frame-policy-missing",
    });
    expect(requestBody).not.toContain("targetUrl");
    expect(requestBody).not.toContain("password");
    expect(requestBody).not.toContain("token");
    expect(requestBody).not.toContain("command");
    expect(result.result.signal).toBe("web-clickjacking-risk-accepted");
  });

  it("returns controlled fixed blocked responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            labKey: "web.clickjacking",
            variantKey: "fixed",
            scenarioKey: "embedded-approval-overlay",
            controlKey: "frame-policy-missing",
            decision: "blocked",
            signal: "web-clickjacking-defense-blocked",
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
      "web",
      "clickjacking",
      "fixed",
      "local-session-token",
      {
        scenarioKey: "embedded-approval-overlay",
        controlKey: "frame-policy-missing",
      },
    );

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe("web-clickjacking-defense-blocked");
  });
});

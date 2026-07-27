import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchGuidedScenarioWorkbench,
  submitGuidedScenarioEvaluation,
} from "../src/api/guided-scenario-lab";

const workbench = {
  id: "web.open-redirect",
  slug: "open-redirect",
  category: "web",
  subcategory: "open-redirect",
  title: "开放重定向",
  mode: "interactive",
  severity: "medium",
  difficulty: "beginner",
  summary: "固定开放重定向场景",
  phase: "phase-1",
  defaultScenarioKey: "untrusted-return-target",
  defaultControlKey: "target-allowlist-missing",
  scenarios: [],
  controls: [],
  vulnerableOutcome: {
    decision: "accepted",
    signal: "web-open-redirect-risk-accepted",
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

    const result = await fetchGuidedScenarioWorkbench("web", "open-redirect");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/web/open-redirect/workbench",
    );
    expect(result.workbench.id).toBe("web.open-redirect");
  });

  it("posts only scenarioKey and controlKey", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            labKey: "web.open-redirect",
            variantKey: "vuln",
            scenarioKey: "untrusted-return-target",
            controlKey: "target-allowlist-missing",
            scenarioTitle: "未受信任返回地址",
            controlTitle: "未校验跳转目标",
            decision: "accepted",
            signal: "web-open-redirect-risk-accepted",
            message: "risk accepted",
            nextStep: "compare fixed",
            assessment: {
              matchedScenario: true,
              matchedControl: true,
              controlApplied: false,
              riskLevel: "medium",
              riskIndicatorCount: 3,
              riskIndicators: [
                "untrusted-target",
                "brand-abuse",
                "redirect-chain",
              ],
              rootCause: "missing target allowlist",
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
      "open-redirect",
      "vuln",
      "local-session-token",
      {
        scenarioKey: "untrusted-return-target",
        controlKey: "target-allowlist-missing",
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/web/open-redirect/vuln/evaluate",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scenarioKey: "untrusted-return-target",
          controlKey: "target-allowlist-missing",
        }),
      },
    );

    const requestBody = String(fetchMock.mock.calls[0]?.[1]?.body);

    expect(JSON.parse(requestBody)).toEqual({
      scenarioKey: "untrusted-return-target",
      controlKey: "target-allowlist-missing",
    });
    expect(requestBody).not.toContain("targetUrl");
    expect(requestBody).not.toContain("password");
    expect(requestBody).not.toContain("token");
    expect(requestBody).not.toContain("command");
    expect(result.result.signal).toBe("web-open-redirect-risk-accepted");
  });

  it("returns controlled fixed blocked responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            labKey: "web.open-redirect",
            variantKey: "fixed",
            scenarioKey: "untrusted-return-target",
            controlKey: "target-allowlist-missing",
            decision: "blocked",
            signal: "web-open-redirect-defense-blocked",
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
      "open-redirect",
      "fixed",
      "local-session-token",
      {
        scenarioKey: "untrusted-return-target",
        controlKey: "target-allowlist-missing",
      },
    );

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe("web-open-redirect-defense-blocked");
  });
});

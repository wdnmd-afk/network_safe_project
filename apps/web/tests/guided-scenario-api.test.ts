import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchGuidedScenarioWorkbench,
  submitGuidedScenarioEvaluation,
} from "../src/api/guided-scenario-lab";

const workbench = {
  id: "auth.oauth",
  slug: "oauth",
  category: "auth",
  subcategory: "oauth",
  title: "OAuth 漏洞",
  mode: "interactive",
  severity: "high",
  difficulty: "advanced",
  summary: "固定 OAuth 授权场景",
  phase: "phase-1",
  defaultScenarioKey: "tampered-authorization-response",
  defaultControlKey: "authorization-binding-missing",
  scenarios: [],
  controls: [],
  vulnerableOutcome: {
    decision: "accepted",
    signal: "auth-oauth-risk-accepted",
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

    const result = await fetchGuidedScenarioWorkbench("auth", "oauth");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/auth/oauth/workbench",
    );
    expect(result.workbench.id).toBe("auth.oauth");
  });

  it("posts only scenarioKey and controlKey", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            labKey: "auth.oauth",
            variantKey: "vuln",
            scenarioKey: "tampered-authorization-response",
            controlKey: "authorization-binding-missing",
            scenarioTitle: "授权响应关联缺失",
            controlTitle: "授权请求未绑定",
            decision: "accepted",
            signal: "auth-oauth-risk-accepted",
            message: "risk accepted",
            nextStep: "compare fixed",
            assessment: {
              matchedScenario: true,
              matchedControl: true,
              controlApplied: false,
              riskLevel: "high",
              riskIndicatorCount: 3,
              riskIndicators: [
                "redirect-uri-mismatch",
                "state-missing",
                "pkce-missing",
              ],
              rootCause: "missing authorization binding",
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
      "auth",
      "oauth",
      "vuln",
      "local-session-token",
      {
        scenarioKey: "tampered-authorization-response",
        controlKey: "authorization-binding-missing",
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/auth/oauth/vuln/evaluate",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scenarioKey: "tampered-authorization-response",
          controlKey: "authorization-binding-missing",
        }),
      },
    );

    const requestBody = String(fetchMock.mock.calls[0]?.[1]?.body);

    expect(JSON.parse(requestBody)).toEqual({
      scenarioKey: "tampered-authorization-response",
      controlKey: "authorization-binding-missing",
    });
    expect(requestBody).not.toContain("targetUrl");
    expect(requestBody).not.toContain("password");
    expect(requestBody).not.toContain("token");
    expect(requestBody).not.toContain("command");
    expect(result.result.signal).toBe("auth-oauth-risk-accepted");
  });

  it("returns controlled fixed blocked responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            labKey: "auth.oauth",
            variantKey: "fixed",
            scenarioKey: "tampered-authorization-response",
            controlKey: "authorization-binding-missing",
            decision: "blocked",
            signal: "auth-oauth-defense-blocked",
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
      "auth",
      "oauth",
      "fixed",
      "local-session-token",
      {
        scenarioKey: "tampered-authorization-response",
        controlKey: "authorization-binding-missing",
      },
    );

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe("auth-oauth-defense-blocked");
  });
});

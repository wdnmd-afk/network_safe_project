import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchOauthWorkbench,
  submitOauthEvaluation,
} from "../src/api/oauth-lab";
import { oauthScenarioKey } from "../src/labs/oauth";

const okResult = {
  status: "ok",
  labKey: "auth.oauth",
  variantKey: "vuln",
  scenarioKey: oauthScenarioKey,
  decision: "accepted",
  signal: "auth-oauth-risk-accepted",
  message: "risk accepted",
  nextStep: "switch to fixed",
  completed: true,
  steps: [],
  recap: {
    outcomeCounts: { risk: 2, fix: 0, normal: 0 },
    scores: { "request-binding": 0, "authorization-defense": 0 },
    terminalOutcome: "risk",
  },
  assessment: {
    riskLevel: "high",
    stepCount: 2,
    matchedScenario: true,
  },
};

describe("oauth lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches the dedicated workbench config", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          workbench: {
            id: "auth.oauth",
            defaultScenarioKey: oauthScenarioKey,
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const response = await fetchOauthWorkbench();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/auth/oauth/workbench",
    );
    expect(response.workbench.id).toBe("auth.oauth");
  });

  it("posts only the fixed scenario key and decision path", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", result: okResult }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await submitOauthEvaluation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: oauthScenarioKey,
        decisions: [
          "accept-unbound-authorization",
          "accept-tampered-response",
        ],
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
          scenarioKey: oauthScenarioKey,
          decisions: [
            "accept-unbound-authorization",
            "accept-tampered-response",
          ],
        }),
      },
    );
    const sentBody = String(fetchMock.mock.calls[0]?.[1]?.body);
    expect(sentBody).not.toContain("redirectUri");
    expect(sentBody).not.toContain("authorizationCode");
    expect(sentBody).not.toContain("client_secret");
    expect(response.result.signal).toBe("auth-oauth-risk-accepted");
  });

  it("returns blocked response body for boundary failures", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            ...okResult,
            status: "blocked",
            decision: "blocked",
            signal: "auth-oauth-boundary-blocked",
            completed: false,
            blockedReason: "scenario-not-allowed",
          },
        }),
        {
          status: 403,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const response = await submitOauthEvaluation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: "unknown-scenario",
        decisions: ["accept-unbound-authorization"],
      },
    );

    expect(response.status).toBe("blocked");
    expect(response.result.signal).toBe("auth-oauth-boundary-blocked");
  });
});

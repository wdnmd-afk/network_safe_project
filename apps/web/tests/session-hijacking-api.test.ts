import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchSessionHijackingWorkbench,
  submitSessionHijackingEvaluation,
} from "../src/api/session-hijacking-lab";
import { sessionHijackingScenarioKey } from "../src/labs/session-hijacking";

const okResult = {
  status: "ok",
  labKey: "auth.session-hijacking",
  variantKey: "vuln",
  scenarioKey: sessionHijackingScenarioKey,
  decision: "accepted",
  signal: "auth-session-hijacking-risk-accepted",
  message: "risk accepted",
  nextStep: "switch to fixed",
  completed: true,
  steps: [],
  recap: {
    outcomeCounts: { risk: 2, fix: 0, normal: 0 },
    scores: { "context-binding": 0, "reauth-defense": 0 },
    terminalOutcome: "risk",
  },
  assessment: {
    riskLevel: "high",
    stepCount: 2,
    matchedScenario: true,
  },
};

describe("session hijacking lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches the dedicated workbench config", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          workbench: {
            id: "auth.session-hijacking",
            defaultScenarioKey: sessionHijackingScenarioKey,
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const response = await fetchSessionHijackingWorkbench();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/auth/session-hijacking/workbench",
    );
    expect(response.workbench.id).toBe("auth.session-hijacking");
  });

  it("posts only the fixed scenario key and decision path", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", result: okResult }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await submitSessionHijackingEvaluation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: sessionHijackingScenarioKey,
        decisions: ["trust-long-lived-session", "accept-replayed-session"],
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/auth/session-hijacking/vuln/evaluate",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scenarioKey: sessionHijackingScenarioKey,
          decisions: ["trust-long-lived-session", "accept-replayed-session"],
        }),
      },
    );
    const sentBody = String(fetchMock.mock.calls[0]?.[1]?.body);
    expect(sentBody).not.toContain("sessionCookie");
    expect(sentBody).not.toContain("Bearer eyJ");
    expect(response.result.signal).toBe("auth-session-hijacking-risk-accepted");
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
            signal: "auth-session-hijacking-boundary-blocked",
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

    const response = await submitSessionHijackingEvaluation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: "unknown-scenario",
        decisions: ["trust-long-lived-session"],
      },
    );

    expect(response.status).toBe("blocked");
    expect(response.result.signal).toBe(
      "auth-session-hijacking-boundary-blocked",
    );
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchBflaWorkbench,
  submitBflaEvaluation,
} from "../src/api/bfla-lab";
import { bflaScenarioKey } from "../src/labs/bfla";

const okResult = {
  status: "ok",
  labKey: "api.functional-authorization",
  variantKey: "vuln",
  scenarioKey: bflaScenarioKey,
  decision: "accepted",
  signal: "api-functional-authorization-risk-accepted",
  message: "risk accepted",
  nextStep: "switch to fixed",
  completed: true,
  steps: [],
  recap: {
    outcomeCounts: { risk: 2, fix: 0, normal: 0 },
    scores: { "authorization-enforcement": 0, "least-privilege": 0 },
    terminalOutcome: "risk",
  },
  assessment: {
    riskLevel: "high",
    stepCount: 2,
    matchedScenario: true,
  },
};

describe("bfla lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches the dedicated workbench config", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          workbench: {
            id: "api.functional-authorization",
            defaultScenarioKey: bflaScenarioKey,
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const response = await fetchBflaWorkbench();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/api/functional-authorization/workbench",
    );
    expect(response.workbench.id).toBe("api.functional-authorization");
  });

  it("posts only the fixed scenario key and decision path", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", result: okResult }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await submitBflaEvaluation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: bflaScenarioKey,
        decisions: ["frontend-only-hidden", "execute-privileged-operation"],
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/api/functional-authorization/vuln/evaluate",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scenarioKey: bflaScenarioKey,
          decisions: [
            "frontend-only-hidden",
            "execute-privileged-operation",
          ],
        }),
      },
    );
    const sentBody = fetchMock.mock.calls[0]?.[1]?.body;
    expect(sentBody).not.toContain("requestedRole");
    expect(sentBody).not.toContain("targetUserId");
    expect(sentBody).not.toContain("http");
    expect(response.result.signal).toBe(
      "api-functional-authorization-risk-accepted",
    );
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
            signal: "api-functional-authorization-boundary-blocked",
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

    const response = await submitBflaEvaluation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: "unknown-scenario",
        decisions: ["frontend-only-hidden"],
      },
    );

    expect(response.status).toBe("blocked");
    expect(response.result.signal).toBe(
      "api-functional-authorization-boundary-blocked",
    );
  });
});

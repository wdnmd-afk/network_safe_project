import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchFormjackingWorkbench,
  submitFormjackingEvaluation,
} from "../src/api/formjacking-lab";
import { formjackingScenarioKey } from "../src/labs/formjacking";

const okResult = {
  status: "ok",
  labKey: "client.formjacking",
  variantKey: "vuln",
  scenarioKey: formjackingScenarioKey,
  decision: "accepted",
  signal: "client-formjacking-risk-accepted",
  message: "risk accepted",
  nextStep: "switch to fixed",
  completed: true,
  steps: [],
  recap: {
    outcomeCounts: { risk: 2, fix: 0, normal: 0 },
    scores: { "script-integrity": 0, "form-target-defense": 0 },
    terminalOutcome: "risk",
  },
  assessment: {
    riskLevel: "critical",
    stepCount: 2,
    matchedScenario: true,
  },
};

describe("formjacking lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches the dedicated workbench config", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          workbench: {
            id: "client.formjacking",
            defaultScenarioKey: formjackingScenarioKey,
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const response = await fetchFormjackingWorkbench();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/client/formjacking/workbench",
    );
    expect(response.workbench.id).toBe("client.formjacking");
  });

  it("posts only the fixed scenario key and decision path", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", result: okResult }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await submitFormjackingEvaluation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: formjackingScenarioKey,
        decisions: [
          "trust-unrestricted-scripts",
          "submit-to-tampered-target",
        ],
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/client/formjacking/vuln/evaluate",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scenarioKey: formjackingScenarioKey,
          decisions: [
            "trust-unrestricted-scripts",
            "submit-to-tampered-target",
          ],
        }),
      },
    );
    const sentBody = fetchMock.mock.calls[0]?.[1]?.body;
    expect(sentBody).not.toContain("cardNumber");
    expect(sentBody).not.toContain("http");
    expect(response.result.signal).toBe("client-formjacking-risk-accepted");
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
            signal: "client-formjacking-boundary-blocked",
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

    const response = await submitFormjackingEvaluation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: "unknown-scenario",
        decisions: ["trust-unrestricted-scripts"],
      },
    );

    expect(response.status).toBe("blocked");
    expect(response.result.signal).toBe("client-formjacking-boundary-blocked");
  });
});

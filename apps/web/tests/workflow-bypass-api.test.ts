import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchWorkflowBypassWorkbench,
  submitWorkflowBypassEvaluation,
} from "../src/api/workflow-bypass-lab";
import { workflowBypassScenarioKey } from "../src/labs/workflow-bypass";

const okResult = {
  status: "ok",
  labKey: "business-logic.workflow-bypass",
  variantKey: "vuln",
  scenarioKey: workflowBypassScenarioKey,
  decision: "accepted",
  signal: "business-logic-workflow-bypass-risk-accepted",
  message: "risk accepted",
  nextStep: "switch to fixed",
  completed: true,
  steps: [],
  recap: {
    outcomeCounts: { risk: 2, fix: 0, normal: 0 },
    scores: { "server-side-sequencing": 0, "valid-state-transition": 0 },
    terminalOutcome: "risk",
  },
  assessment: {
    riskLevel: "high",
    stepCount: 2,
    matchedScenario: true,
  },
};

describe("workflow bypass lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches the dedicated workbench config", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          workbench: {
            id: "business-logic.workflow-bypass",
            defaultScenarioKey: workflowBypassScenarioKey,
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const response = await fetchWorkflowBypassWorkbench();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/business-logic/workflow-bypass/workbench",
    );
    expect(response.workbench.id).toBe("business-logic.workflow-bypass");
  });

  it("posts only the fixed scenario key and decision path", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", result: okResult }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await submitWorkflowBypassEvaluation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: workflowBypassScenarioKey,
        decisions: ["trust-client-stage-request", "ship-pending-order"],
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/business-logic/workflow-bypass/vuln/evaluate",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scenarioKey: workflowBypassScenarioKey,
          decisions: ["trust-client-stage-request", "ship-pending-order"],
        }),
      },
    );
    const sentBody = fetchMock.mock.calls[0]?.[1]?.body;
    expect(sentBody).not.toContain("orderId");
    expect(sentBody).not.toContain("requestedStage");
    expect(sentBody).not.toContain("payment");
    expect(response.result.signal).toBe(
      "business-logic-workflow-bypass-risk-accepted",
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
            signal: "business-logic-workflow-bypass-boundary-blocked",
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

    const response = await submitWorkflowBypassEvaluation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: "unknown-scenario",
        decisions: ["trust-client-stage-request"],
      },
    );

    expect(response.status).toBe("blocked");
    expect(response.result.signal).toBe(
      "business-logic-workflow-bypass-boundary-blocked",
    );
  });
});

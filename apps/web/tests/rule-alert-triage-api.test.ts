import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchRuleAlertTriageWorkbench,
  submitRuleAlertTriageEvaluation,
} from "../src/api/rule-alert-triage-lab";
import { ruleAlertTriageScenarioKey } from "../src/labs/rule-alert-triage";

const okResult = {
  status: "ok",
  labKey: "detection.rule-alert-triage",
  variantKey: "vuln",
  scenarioKey: ruleAlertTriageScenarioKey,
  decision: "accepted",
  signal: "detection-rule-alert-triage-risk-accepted",
  message: "risk accepted",
  nextStep: "switch to fixed",
  completed: true,
  steps: [],
  ruleAnalysis: {
    datasetKey: ruleAlertTriageScenarioKey,
    ruleProfileKey: "broad-auth-failure-rule",
    matchedEventIds: ["auth-failure-burst", "single-user-auth-retry"],
    truePositiveCount: 1,
    falsePositiveCount: 1,
    falseNegativeCount: 3,
    trueNegativeCount: 1,
    precisionPercent: 50,
    recallPercent: 25,
  },
  triage: {
    actionKey: "dismiss-correlated-alert-as-noise",
    disposition: "dismissed-as-noise",
    summary: "fixed summary",
    nextAction: "review evidence",
  },
  recap: {
    outcomeCounts: { risk: 2, fix: 0, normal: 0 },
    scores: { "rule-quality": 0, "triage-decision": 0 },
    terminalOutcome: "risk",
  },
  assessment: {
    riskLevel: "high",
    stepCount: 2,
    matchedScenario: true,
  },
};

describe("rule alert triage lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches the dedicated fixed-event workbench", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          workbench: {
            id: "detection.rule-alert-triage",
            defaultScenarioKey: ruleAlertTriageScenarioKey,
            dataset: { key: ruleAlertTriageScenarioKey, events: [] },
            ruleAnalyses: [],
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const response = await fetchRuleAlertTriageWorkbench();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/detection/rule-alert-triage/workbench",
    );
    expect(response.workbench.id).toBe("detection.rule-alert-triage");
  });

  it("posts only the fixed scenario key and decision path", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", result: okResult }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await submitRuleAlertTriageEvaluation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: ruleAlertTriageScenarioKey,
        decisions: [
          "trust-broad-single-signal-rule",
          "dismiss-correlated-alert-as-noise",
        ],
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/detection/rule-alert-triage/vuln/evaluate",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scenarioKey: ruleAlertTriageScenarioKey,
          decisions: [
            "trust-broad-single-signal-rule",
            "dismiss-correlated-alert-as-noise",
          ],
        }),
      },
    );

    const sentBody = fetchMock.mock.calls[0]?.[1]?.body;
    const parsedBody = JSON.parse(String(sentBody)) as Record<string, unknown>;
    expect(Object.keys(parsedBody).sort()).toEqual(["decisions", "scenarioKey"]);
    expect(parsedBody).not.toHaveProperty("events");
    expect(parsedBody).not.toHaveProperty("rule");
    expect(parsedBody).not.toHaveProperty("query");
    expect(parsedBody).not.toHaveProperty("host");
    expect(parsedBody).not.toHaveProperty("account");
    expect(response.result.ruleAnalysis?.falsePositiveCount).toBe(1);
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
            signal: "detection-rule-alert-triage-boundary-blocked",
            completed: false,
            ruleAnalysis: null,
            triage: null,
            blockedReason: "scenario-not-allowed",
          },
        }),
        {
          status: 403,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const response = await submitRuleAlertTriageEvaluation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: "unknown-scenario",
        decisions: ["trust-broad-single-signal-rule"],
      },
    );

    expect(response.status).toBe("blocked");
    expect(response.result.signal).toBe(
      "detection-rule-alert-triage-boundary-blocked",
    );
  });
});

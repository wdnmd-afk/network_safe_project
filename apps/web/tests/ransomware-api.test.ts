import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchRansomwareWorkbench,
  submitRansomwareEvaluation,
} from "../src/api/ransomware-lab";
import { ransomwareScenarioKey } from "../src/labs/ransomware";

const okResult = {
  status: "ok",
  labKey: "malware.ransomware",
  variantKey: "vuln",
  scenarioKey: ransomwareScenarioKey,
  decision: "accepted",
  signal: "malware-ransomware-risk-accepted",
  message: "risk accepted",
  nextStep: "switch to fixed",
  completed: true,
  steps: [],
  recap: {
    outcomeCounts: { risk: 2, fix: 0, normal: 0 },
    scores: { "behavior-detection": 0, "containment-recovery": 0 },
    terminalOutcome: "risk",
  },
  assessment: {
    riskLevel: "critical",
    stepCount: 2,
    matchedScenario: true,
  },
};

describe("ransomware lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches the dedicated workbench config", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          workbench: {
            id: "malware.ransomware",
            defaultScenarioKey: ransomwareScenarioKey,
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const response = await fetchRansomwareWorkbench();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/malware/ransomware/workbench",
    );
    expect(response.workbench.id).toBe("malware.ransomware");
  });

  it("posts only the fixed scenario key and decision path", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", result: okResult }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await submitRansomwareEvaluation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: ransomwareScenarioKey,
        decisions: [
          "ignore-anomalous-file-behavior",
          "allow-unrestricted-encryption",
        ],
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/malware/ransomware/vuln/evaluate",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scenarioKey: ransomwareScenarioKey,
          decisions: [
            "ignore-anomalous-file-behavior",
            "allow-unrestricted-encryption",
          ],
        }),
      },
    );
    const sentBody = fetchMock.mock.calls[0]?.[1]?.body;
    expect(sentBody).not.toContain("http");
    expect(response.result.signal).toBe("malware-ransomware-risk-accepted");
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
            signal: "malware-ransomware-boundary-blocked",
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

    const response = await submitRansomwareEvaluation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: "unknown-scenario",
        decisions: ["ignore-anomalous-file-behavior"],
      },
    );

    expect(response.status).toBe("blocked");
    expect(response.result.signal).toBe("malware-ransomware-boundary-blocked");
  });
});

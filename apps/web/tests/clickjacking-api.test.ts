import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchClickjackingWorkbench,
  submitClickjackingEvaluation,
} from "../src/api/clickjacking-lab";
import { clickjackingScenarioKey } from "../src/labs/clickjacking";

const okResult = {
  status: "ok",
  labKey: "web.clickjacking",
  variantKey: "vuln",
  scenarioKey: clickjackingScenarioKey,
  decision: "accepted",
  signal: "web-clickjacking-risk-accepted",
  message: "risk accepted",
  nextStep: "switch to fixed",
  completed: true,
  steps: [],
  recap: {
    outcomeCounts: { risk: 2, fix: 0, normal: 0 },
    scores: { "frame-hardening": 0, "intent-confirmation": 0 },
    terminalOutcome: "risk",
  },
  assessment: {
    riskLevel: "medium",
    stepCount: 2,
    matchedScenario: true,
  },
};

describe("clickjacking lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches the dedicated workbench config", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          workbench: {
            id: "web.clickjacking",
            defaultScenarioKey: clickjackingScenarioKey,
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const response = await fetchClickjackingWorkbench();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/web/clickjacking/workbench",
    );
    expect(response.workbench.id).toBe("web.clickjacking");
  });

  it("posts only the fixed scenario key and decision path", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", result: okResult }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await submitClickjackingEvaluation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: clickjackingScenarioKey,
        decisions: ["allow-any-origin-framing", "execute-without-confirmation"],
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
          scenarioKey: clickjackingScenarioKey,
          decisions: [
            "allow-any-origin-framing",
            "execute-without-confirmation",
          ],
        }),
      },
    );
    const sentBody = fetchMock.mock.calls[0]?.[1]?.body;
    expect(sentBody).not.toContain("targetUrl");
    expect(sentBody).not.toContain("http");
    expect(response.result.signal).toBe("web-clickjacking-risk-accepted");
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
            signal: "web-clickjacking-boundary-blocked",
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

    const response = await submitClickjackingEvaluation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: "unknown-scenario",
        decisions: ["allow-any-origin-framing"],
      },
    );

    expect(response.status).toBe("blocked");
    expect(response.result.signal).toBe("web-clickjacking-boundary-blocked");
  });
});

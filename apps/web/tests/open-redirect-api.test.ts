import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchOpenRedirectWorkbench,
  submitOpenRedirectEvaluation,
} from "../src/api/open-redirect-lab";
import { openRedirectScenarioKey } from "../src/labs/open-redirect";

const okResult = {
  status: "ok",
  labKey: "web.open-redirect",
  variantKey: "vuln",
  scenarioKey: openRedirectScenarioKey,
  decision: "accepted",
  signal: "web-open-redirect-risk-accepted",
  message: "risk accepted",
  nextStep: "switch to fixed",
  completed: true,
  steps: [],
  recap: {
    outcomeCounts: { risk: 2, fix: 0, normal: 0 },
    scores: { "target-hardening": 0, "redirect-safety": 0 },
    terminalOutcome: "risk",
  },
  assessment: {
    riskLevel: "medium",
    stepCount: 2,
    matchedScenario: true,
  },
};

describe("open redirect lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches the dedicated workbench config", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          workbench: {
            id: "web.open-redirect",
            defaultScenarioKey: openRedirectScenarioKey,
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const response = await fetchOpenRedirectWorkbench();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/web/open-redirect/workbench",
    );
    expect(response.workbench.id).toBe("web.open-redirect");
  });

  it("posts only the fixed scenario key and decision path", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", result: okResult }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await submitOpenRedirectEvaluation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: openRedirectScenarioKey,
        decisions: [
          "trust-user-supplied-target",
          "redirect-without-validation",
        ],
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
          scenarioKey: openRedirectScenarioKey,
          decisions: [
            "trust-user-supplied-target",
            "redirect-without-validation",
          ],
        }),
      },
    );
    const sentBody = fetchMock.mock.calls[0]?.[1]?.body;
    expect(sentBody).not.toContain("targetUrl");
    expect(sentBody).not.toContain("http");
    expect(response.result.signal).toBe("web-open-redirect-risk-accepted");
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
            signal: "web-open-redirect-boundary-blocked",
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

    const response = await submitOpenRedirectEvaluation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: "unknown-scenario",
        decisions: ["trust-user-supplied-target"],
      },
    );

    expect(response.status).toBe("blocked");
    expect(response.result.signal).toBe("web-open-redirect-boundary-blocked");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchInsecureRandomnessWorkbench,
  submitInsecureRandomnessEvaluation,
} from "../src/api/insecure-randomness-lab";
import { insecureRandomnessScenarioKey } from "../src/labs/insecure-randomness";

const okResult = {
  status: "ok",
  labKey: "crypto.insecure-randomness",
  variantKey: "vuln",
  scenarioKey: insecureRandomnessScenarioKey,
  decision: "accepted",
  signal: "crypto-insecure-randomness-risk-accepted",
  message: "risk accepted",
  nextStep: "switch to fixed",
  completed: true,
  steps: [],
  recap: {
    outcomeCounts: { risk: 2, fix: 0, normal: 0 },
    scores: { "entropy-analysis": 0, "secure-random-source": 0 },
    terminalOutcome: "risk",
  },
  assessment: {
    riskLevel: "high",
    stepCount: 2,
    matchedScenario: true,
  },
};

describe("insecure randomness lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches the dedicated fixed-summary workbench", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          workbench: {
            id: "crypto.insecure-randomness",
            defaultScenarioKey: insecureRandomnessScenarioKey,
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const response = await fetchInsecureRandomnessWorkbench();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/crypto/insecure-randomness/workbench",
    );
    expect(response.workbench.id).toBe("crypto.insecure-randomness");
  });

  it("posts only the fixed scenario key and decision path", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", result: okResult }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await submitInsecureRandomnessEvaluation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: insecureRandomnessScenarioKey,
        decisions: [
          "trust-timestamp-counter-pattern",
          "keep-predictable-token-source",
        ],
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/crypto/insecure-randomness/vuln/evaluate",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scenarioKey: insecureRandomnessScenarioKey,
          decisions: [
            "trust-timestamp-counter-pattern",
            "keep-predictable-token-source",
          ],
        }),
      },
    );
    const sentBody = fetchMock.mock.calls[0]?.[1]?.body;
    const parsedBody = JSON.parse(String(sentBody)) as Record<string, unknown>;
    expect(Object.keys(parsedBody).sort()).toEqual(["decisions", "scenarioKey"]);
    expect(parsedBody).not.toHaveProperty("token");
    expect(parsedBody).not.toHaveProperty("secret");
    expect(parsedBody).not.toHaveProperty("seed");
    expect(parsedBody).not.toHaveProperty("timestamp");
    expect(parsedBody).not.toHaveProperty("counter");
    expect(parsedBody).not.toHaveProperty("userId");
    expect(response.result.signal).toBe(
      "crypto-insecure-randomness-risk-accepted",
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
            signal: "crypto-insecure-randomness-boundary-blocked",
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

    const response = await submitInsecureRandomnessEvaluation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: "unknown-scenario",
        decisions: ["trust-timestamp-counter-pattern"],
      },
    );

    expect(response.status).toBe("blocked");
    expect(response.result.signal).toBe(
      "crypto-insecure-randomness-boundary-blocked",
    );
  });
});

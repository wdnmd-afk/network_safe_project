import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchCredentialStuffingWorkbench,
  submitCredentialStuffingEvaluation,
} from "../src/api/credential-stuffing-lab";
import { credentialStuffingScenarioKey } from "../src/labs/credential-stuffing";

const okResult = {
  status: "ok",
  labKey: "auth.credential-stuffing",
  variantKey: "vuln",
  scenarioKey: credentialStuffingScenarioKey,
  decision: "accepted",
  signal: "auth-credential-stuffing-risk-accepted",
  message: "risk accepted",
  nextStep: "switch to fixed",
  completed: true,
  steps: [],
  recap: {
    outcomeCounts: { risk: 2, fix: 0, normal: 0 },
    scores: { "risk-correlation": 0, "adaptive-defense": 0 },
    terminalOutcome: "risk",
  },
  assessment: {
    riskLevel: "high",
    stepCount: 2,
    matchedScenario: true,
  },
};

describe("credential stuffing lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches the dedicated workbench config", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          workbench: {
            id: "auth.credential-stuffing",
            defaultScenarioKey: credentialStuffingScenarioKey,
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const response = await fetchCredentialStuffingWorkbench();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/auth/credential-stuffing/workbench",
    );
    expect(response.workbench.id).toBe("auth.credential-stuffing");
  });

  it("posts only the fixed scenario key and decision path", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", result: okResult }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await submitCredentialStuffingEvaluation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: credentialStuffingScenarioKey,
        decisions: [
          "trust-single-password-result",
          "accept-without-challenge",
        ],
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/auth/credential-stuffing/vuln/evaluate",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scenarioKey: credentialStuffingScenarioKey,
          decisions: [
            "trust-single-password-result",
            "accept-without-challenge",
          ],
        }),
      },
    );
    const sentBody = String(fetchMock.mock.calls[0]?.[1]?.body);
    // 请求体只含固定 scenarioKey 和决策 optionKey，不含真实凭据字段或值。
    expect(JSON.parse(sentBody)).toEqual({
      scenarioKey: credentialStuffingScenarioKey,
      decisions: [
        "trust-single-password-result",
        "accept-without-challenge",
      ],
    });
    expect(sentBody).not.toContain("\"password\"");
    expect(sentBody).not.toContain("\"username\"");
    expect(sentBody).not.toContain("@");
    expect(response.result.signal).toBe("auth-credential-stuffing-risk-accepted");
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
            signal: "auth-credential-stuffing-boundary-blocked",
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

    const response = await submitCredentialStuffingEvaluation(
      "vuln",
      "local-session-token",
      {
        scenarioKey: "unknown-scenario",
        decisions: ["trust-single-password-result"],
      },
    );

    expect(response.status).toBe("blocked");
    expect(response.result.signal).toBe(
      "auth-credential-stuffing-boundary-blocked",
    );
  });
});

import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import {
  createCredentialStuffingLabService,
  credentialStuffingScenarioKey,
  credentialStuffingRiskSignal,
  credentialStuffingDefenseSignal,
  credentialStuffingNormalSignal,
} from "../src/services/credential-stuffing-lab.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";

const demoUser = {
  id: "1",
  username: "demo_user",
  displayName: "演示用户",
  role: "member",
  status: "active",
};

async function listen(app: ReturnType<typeof createApp>) {
  const server = app.listen(0);
  const address = server.address();

  assert.ok(address && typeof address === "object");

  after(() => {
    server.close();
  });

  return `http://127.0.0.1:${address.port}`;
}

test("credential stuffing service walks the risk path to the canonical accepted signal", () => {
  const service = createCredentialStuffingLabService();
  const result = service.evaluate({
    variantKey: "vuln",
    scenarioKey: credentialStuffingScenarioKey,
    decisions: ["trust-single-password-result", "accept-without-challenge"],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.completed, true);
  assert.equal(result.decision, "accepted");
  assert.equal(result.signal, credentialStuffingRiskSignal);
  assert.equal(result.steps.length, 2);
  assert.equal(result.recap.terminalOutcome, "risk");
  assert.equal(result.recap.outcomeCounts.risk, 2);
});

test("credential stuffing service blocks the risky batch on the defense path", () => {
  const service = createCredentialStuffingLabService();
  const result = service.evaluate({
    variantKey: "fixed",
    scenarioKey: credentialStuffingScenarioKey,
    decisions: [
      "enable-cross-request-correlation",
      "defense-blocks-risky-batch",
    ],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.signal, credentialStuffingDefenseSignal);
  assert.equal(result.recap.terminalOutcome, "fix");
});

test("credential stuffing service verifies the normal verified-login path", () => {
  const service = createCredentialStuffingLabService();
  const result = service.evaluate({
    variantKey: "fixed",
    scenarioKey: credentialStuffingScenarioKey,
    decisions: [
      "enable-cross-request-correlation",
      "allow-verified-legitimate-login",
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.decision, "accepted");
  assert.equal(result.signal, credentialStuffingNormalSignal);
  assert.equal(result.recap.terminalOutcome, "normal");
});

test("credential stuffing service blocks unknown scenario and option keys without echoing input", () => {
  const service = createCredentialStuffingLabService();
  const rawScenario = "external-breach-dump-scenario";
  const rawOption = "load-real-credential-dump";

  const unknownScenario = service.evaluate({
    variantKey: "vuln",
    scenarioKey: rawScenario,
    decisions: ["trust-single-password-result"],
  });
  const unknownOption = service.evaluate({
    variantKey: "vuln",
    scenarioKey: credentialStuffingScenarioKey,
    decisions: [rawOption],
  });

  assert.equal(unknownScenario.decision, "blocked");
  assert.equal(unknownScenario.scenarioKey, "blocked-scenario");
  assert.equal(JSON.stringify(unknownScenario).includes(rawScenario), false);

  assert.equal(unknownOption.decision, "blocked");
  assert.equal(
    unknownOption.signal,
    "auth-credential-stuffing-boundary-blocked",
  );
  assert.equal(JSON.stringify(unknownOption).includes(rawOption), false);
});

test("credential stuffing service blocks an incomplete decision path", () => {
  const service = createCredentialStuffingLabService();
  const result = service.evaluate({
    variantKey: "vuln",
    scenarioKey: credentialStuffingScenarioKey,
    decisions: ["trust-single-password-result"],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.completed, false);
  assert.equal(result.blockedReason, "path-incomplete");
});

test("credential stuffing workbench API exposes the fixed multi-step case", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/auth/credential-stuffing/workbench`,
  );
  const body = (await response.json()) as {
    status: string;
    workbench: {
      id: string;
      defaultScenarioKey: string;
      cases: { steps: { key: string }[] }[];
    };
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.workbench.id, "auth.credential-stuffing");
  assert.equal(body.workbench.defaultScenarioKey, credentialStuffingScenarioKey);
  assert.equal(body.workbench.cases[0]?.steps.length, 2);
});

test("credential stuffing evaluate API requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/auth/credential-stuffing/vuln/evaluate`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioKey: credentialStuffingScenarioKey,
        decisions: [
          "trust-single-password-result",
          "accept-without-challenge",
        ],
      }),
    },
  );

  assert.equal(response.status, 401);
});

test("credential stuffing evaluate API records a safe event and never echoes raw input", async () => {
  const eventCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    labEventLogsService: {
      recordLabEvent: async (input) => {
        eventCalls.push(input);
        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: null,
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/auth/credential-stuffing/vuln/evaluate`,
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
        username: "real-account-should-not-appear",
        password: "raw-password-should-not-appear",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: { labKey: string; decision: string; signal: string };
  };

  assert.equal(response.status, 200);
  assert.equal(body.result.labKey, "auth.credential-stuffing");
  assert.equal(body.result.signal, credentialStuffingRiskSignal);
  assert.equal(eventCalls.length, 1);

  const serialized = JSON.stringify(eventCalls[0]);
  assert.equal(serialized.includes("real-account"), false);
  assert.equal(serialized.includes("raw-password"), false);
});

test("credential stuffing evaluate API returns 403 on the blocked defense path", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    labEventLogsService: {
      recordLabEvent: async (input) => ({
        traceId: input.traceId ?? "generated-trace",
        persisted: true,
        labId: null,
      }),
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/auth/credential-stuffing/fixed/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: credentialStuffingScenarioKey,
        decisions: [
          "enable-cross-request-correlation",
          "defense-blocks-risky-batch",
        ],
      }),
    },
  );

  assert.equal(response.status, 403);
});

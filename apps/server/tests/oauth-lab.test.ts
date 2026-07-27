import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import {
  createOauthLabService,
  oauthScenarioKey,
  oauthRiskSignal,
  oauthDefenseSignal,
  oauthNormalSignal,
} from "../src/services/oauth-lab.js";
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

test("oauth service walks the risk path to the canonical accepted signal", () => {
  const service = createOauthLabService();
  const result = service.evaluate({
    variantKey: "vuln",
    scenarioKey: oauthScenarioKey,
    decisions: ["accept-unbound-authorization", "accept-tampered-response"],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.completed, true);
  assert.equal(result.decision, "accepted");
  assert.equal(result.signal, oauthRiskSignal);
  assert.equal(result.steps.length, 2);
  assert.equal(result.recap.terminalOutcome, "risk");
  assert.equal(result.recap.outcomeCounts.risk, 2);
});

test("oauth service blocks the tampered response on the defense path", () => {
  const service = createOauthLabService();
  const result = service.evaluate({
    variantKey: "fixed",
    scenarioKey: oauthScenarioKey,
    decisions: [
      "bind-authorization-request",
      "defense-blocks-tampered-response",
    ],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.signal, oauthDefenseSignal);
  assert.equal(result.recap.terminalOutcome, "fix");
});

test("oauth service verifies the normal authorization path", () => {
  const service = createOauthLabService();
  const result = service.evaluate({
    variantKey: "fixed",
    scenarioKey: oauthScenarioKey,
    decisions: [
      "bind-authorization-request",
      "allow-verified-authorization",
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.decision, "accepted");
  assert.equal(result.signal, oauthNormalSignal);
  assert.equal(result.recap.terminalOutcome, "normal");
});

test("oauth service blocks unknown scenario and option keys without echoing input", () => {
  const service = createOauthLabService();
  const rawScenario = "external-target-secret-scenario";
  const rawOption = "steal-real-authorization-code";

  const unknownScenario = service.evaluate({
    variantKey: "vuln",
    scenarioKey: rawScenario,
    decisions: ["accept-unbound-authorization"],
  });
  const unknownOption = service.evaluate({
    variantKey: "vuln",
    scenarioKey: oauthScenarioKey,
    decisions: [rawOption],
  });

  assert.equal(unknownScenario.decision, "blocked");
  assert.equal(unknownScenario.scenarioKey, "blocked-scenario");
  assert.equal(JSON.stringify(unknownScenario).includes(rawScenario), false);

  assert.equal(unknownOption.decision, "blocked");
  assert.equal(unknownOption.signal, "auth-oauth-boundary-blocked");
  assert.equal(JSON.stringify(unknownOption).includes(rawOption), false);
});

test("oauth service blocks an incomplete decision path", () => {
  const service = createOauthLabService();
  const result = service.evaluate({
    variantKey: "vuln",
    scenarioKey: oauthScenarioKey,
    decisions: ["accept-unbound-authorization"],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.completed, false);
  assert.equal(result.blockedReason, "path-incomplete");
});

test("oauth workbench API exposes the fixed multi-step case", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/auth/oauth/workbench`);
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
  assert.equal(body.workbench.id, "auth.oauth");
  assert.equal(body.workbench.defaultScenarioKey, oauthScenarioKey);
  assert.equal(body.workbench.cases[0]?.steps.length, 2);
});

test("oauth evaluate API requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/auth/oauth/vuln/evaluate`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioKey: oauthScenarioKey,
        decisions: [
          "accept-unbound-authorization",
          "accept-tampered-response",
        ],
      }),
    },
  );

  assert.equal(response.status, 401);
});

test("oauth evaluate API records a safe event and never echoes raw input", async () => {
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
    `${origin}/api/labs/auth/oauth/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: oauthScenarioKey,
        decisions: [
          "accept-unbound-authorization",
          "accept-tampered-response",
        ],
        redirectUri: "https://external.example/should-not-appear",
        authorizationCode: "raw-code-should-not-appear",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: { labKey: string; decision: string; signal: string };
  };

  assert.equal(response.status, 200);
  assert.equal(body.result.labKey, "auth.oauth");
  assert.equal(body.result.signal, oauthRiskSignal);
  assert.equal(eventCalls.length, 1);

  const serialized = JSON.stringify(eventCalls[0]);
  assert.equal(serialized.includes("external.example"), false);
  assert.equal(serialized.includes("raw-code"), false);
});

test("oauth evaluate API returns 403 on the blocked defense path", async () => {
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
    `${origin}/api/labs/auth/oauth/fixed/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: oauthScenarioKey,
        decisions: [
          "bind-authorization-request",
          "defense-blocks-tampered-response",
        ],
      }),
    },
  );

  assert.equal(response.status, 403);
});

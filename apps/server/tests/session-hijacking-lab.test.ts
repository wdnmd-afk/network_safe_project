import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import {
  createSessionHijackingLabService,
  sessionHijackingScenarioKey,
  sessionHijackingRiskSignal,
  sessionHijackingDefenseSignal,
  sessionHijackingNormalSignal,
} from "../src/services/session-hijacking-lab.js";
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

test("session hijacking service walks the risk path to the canonical accepted signal", () => {
  const service = createSessionHijackingLabService();
  const result = service.evaluate({
    variantKey: "vuln",
    scenarioKey: sessionHijackingScenarioKey,
    decisions: ["trust-long-lived-session", "accept-replayed-session"],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.completed, true);
  assert.equal(result.decision, "accepted");
  assert.equal(result.signal, sessionHijackingRiskSignal);
  assert.equal(result.steps.length, 2);
  assert.equal(result.recap.terminalOutcome, "risk");
  assert.equal(result.recap.outcomeCounts.risk, 2);
});

test("session hijacking service blocks the replayed session on the defense path", () => {
  const service = createSessionHijackingLabService();
  const result = service.evaluate({
    variantKey: "fixed",
    scenarioKey: sessionHijackingScenarioKey,
    decisions: ["bind-session-context", "defense-blocks-replayed-session"],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.signal, sessionHijackingDefenseSignal);
  assert.equal(result.recap.terminalOutcome, "fix");
});

test("session hijacking service verifies the normal reauthenticated path", () => {
  const service = createSessionHijackingLabService();
  const result = service.evaluate({
    variantKey: "fixed",
    scenarioKey: sessionHijackingScenarioKey,
    decisions: ["bind-session-context", "allow-reauthenticated-session"],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.decision, "accepted");
  assert.equal(result.signal, sessionHijackingNormalSignal);
  assert.equal(result.recap.terminalOutcome, "normal");
});

test("session hijacking service blocks unknown scenario and option keys without echoing input", () => {
  const service = createSessionHijackingLabService();
  const rawScenario = "external-session-secret-scenario";
  const rawOption = "steal-real-session-cookie";

  const unknownScenario = service.evaluate({
    variantKey: "vuln",
    scenarioKey: rawScenario,
    decisions: ["trust-long-lived-session"],
  });
  const unknownOption = service.evaluate({
    variantKey: "vuln",
    scenarioKey: sessionHijackingScenarioKey,
    decisions: [rawOption],
  });

  assert.equal(unknownScenario.decision, "blocked");
  assert.equal(unknownScenario.scenarioKey, "blocked-scenario");
  assert.equal(JSON.stringify(unknownScenario).includes(rawScenario), false);

  assert.equal(unknownOption.decision, "blocked");
  assert.equal(unknownOption.signal, "auth-session-hijacking-boundary-blocked");
  assert.equal(JSON.stringify(unknownOption).includes(rawOption), false);
});

test("session hijacking service blocks an incomplete decision path", () => {
  const service = createSessionHijackingLabService();
  const result = service.evaluate({
    variantKey: "vuln",
    scenarioKey: sessionHijackingScenarioKey,
    decisions: ["trust-long-lived-session"],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.completed, false);
  assert.equal(result.blockedReason, "path-incomplete");
});

test("session hijacking workbench API exposes the fixed multi-step case", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/auth/session-hijacking/workbench`,
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
  assert.equal(body.workbench.id, "auth.session-hijacking");
  assert.equal(body.workbench.defaultScenarioKey, sessionHijackingScenarioKey);
  assert.equal(body.workbench.cases[0]?.steps.length, 2);
});

test("session hijacking evaluate API requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/auth/session-hijacking/vuln/evaluate`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioKey: sessionHijackingScenarioKey,
        decisions: ["trust-long-lived-session", "accept-replayed-session"],
      }),
    },
  );

  assert.equal(response.status, 401);
});

test("session hijacking evaluate API records a safe event and never echoes raw input", async () => {
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
    `${origin}/api/labs/auth/session-hijacking/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: sessionHijackingScenarioKey,
        decisions: ["trust-long-lived-session", "accept-replayed-session"],
        sessionCookie: "real-session-cookie-should-not-appear",
        token: "raw-token-should-not-appear",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: { labKey: string; decision: string; signal: string };
  };

  assert.equal(response.status, 200);
  assert.equal(body.result.labKey, "auth.session-hijacking");
  assert.equal(body.result.signal, sessionHijackingRiskSignal);
  assert.equal(eventCalls.length, 1);

  const serialized = JSON.stringify(eventCalls[0]);
  assert.equal(serialized.includes("real-session-cookie"), false);
  assert.equal(serialized.includes("raw-token"), false);
});

test("session hijacking evaluate API returns 403 on the blocked defense path", async () => {
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
    `${origin}/api/labs/auth/session-hijacking/fixed/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: sessionHijackingScenarioKey,
        decisions: ["bind-session-context", "defense-blocks-replayed-session"],
      }),
    },
  );

  assert.equal(response.status, 403);
});

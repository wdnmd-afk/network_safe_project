import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import {
  bflaDefenseSignal,
  bflaNormalSignal,
  bflaRiskSignal,
  bflaScenarioKey,
  createBflaLabService,
} from "../src/services/bfla-lab.js";
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

test("bfla service walks the risk path to the canonical accepted signal", () => {
  const service = createBflaLabService();
  const result = service.evaluate({
    variantKey: "vuln",
    scenarioKey: bflaScenarioKey,
    decisions: ["frontend-only-hidden", "execute-privileged-operation"],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.completed, true);
  assert.equal(result.decision, "accepted");
  assert.equal(result.signal, bflaRiskSignal);
  assert.equal(result.steps.length, 2);
  assert.equal(result.recap.terminalOutcome, "risk");
  assert.equal(result.recap.outcomeCounts.risk, 2);
});

test("bfla service blocks the privileged operation on the defense path", () => {
  const service = createBflaLabService();
  const result = service.evaluate({
    variantKey: "fixed",
    scenarioKey: bflaScenarioKey,
    decisions: [
      "enforce-server-side-authorization",
      "defense-blocks-privileged-operation",
    ],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.signal, bflaDefenseSignal);
  assert.equal(result.recap.terminalOutcome, "fix");
});

test("bfla service verifies the normal administrator path", () => {
  const service = createBflaLabService();
  const result = service.evaluate({
    variantKey: "fixed",
    scenarioKey: bflaScenarioKey,
    decisions: [
      "enforce-server-side-authorization",
      "allow-verified-admin-operation",
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.decision, "accepted");
  assert.equal(result.signal, bflaNormalSignal);
  assert.equal(result.recap.terminalOutcome, "normal");
});

test("bfla service blocks unknown keys without echoing raw input", () => {
  const service = createBflaLabService();
  const rawScenario = "real-admin-endpoint";
  const rawOption = "grant-real-admin-role";

  const unknownScenario = service.evaluate({
    variantKey: "vuln",
    scenarioKey: rawScenario,
    decisions: ["frontend-only-hidden"],
  });
  const unknownOption = service.evaluate({
    variantKey: "vuln",
    scenarioKey: bflaScenarioKey,
    decisions: [rawOption],
  });

  assert.equal(unknownScenario.decision, "blocked");
  assert.equal(unknownScenario.scenarioKey, "blocked-scenario");
  assert.equal(JSON.stringify(unknownScenario).includes(rawScenario), false);

  assert.equal(unknownOption.decision, "blocked");
  assert.equal(
    unknownOption.signal,
    "api-functional-authorization-boundary-blocked",
  );
  assert.equal(JSON.stringify(unknownOption).includes(rawOption), false);
});

test("bfla service blocks an incomplete decision path", () => {
  const service = createBflaLabService();
  const result = service.evaluate({
    variantKey: "vuln",
    scenarioKey: bflaScenarioKey,
    decisions: ["frontend-only-hidden"],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.completed, false);
  assert.equal(result.blockedReason, "path-incomplete");
});

test("bfla workbench API exposes the fixed multi-step case", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/api/functional-authorization/workbench`,
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
  assert.equal(body.workbench.id, "api.functional-authorization");
  assert.equal(body.workbench.defaultScenarioKey, bflaScenarioKey);
  assert.equal(body.workbench.cases[0]?.steps.length, 2);
});

test("bfla evaluate API requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/api/functional-authorization/vuln/evaluate`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioKey: bflaScenarioKey,
        decisions: ["frontend-only-hidden", "execute-privileged-operation"],
      }),
    },
  );

  assert.equal(response.status, 401);
});

test("bfla evaluate API records only a safe event summary", async () => {
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
    `${origin}/api/labs/api/functional-authorization/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: bflaScenarioKey,
        decisions: ["frontend-only-hidden", "execute-privileged-operation"],
        targetUserId: "real-target-user-42",
        requestedRole: "secret-super-admin",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: { labKey: string; signal: string };
  };

  assert.equal(response.status, 200);
  assert.equal(body.result.labKey, "api.functional-authorization");
  assert.equal(body.result.signal, bflaRiskSignal);
  assert.equal(eventCalls.length, 1);

  const serialized = JSON.stringify(eventCalls[0]);
  assert.equal(serialized.includes("real-target-user-42"), false);
  assert.equal(serialized.includes("secret-super-admin"), false);
});

test("bfla evaluate API returns 403 on the blocked defense path", async () => {
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
    `${origin}/api/labs/api/functional-authorization/fixed/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: bflaScenarioKey,
        decisions: [
          "enforce-server-side-authorization",
          "defense-blocks-privileged-operation",
        ],
      }),
    },
  );

  assert.equal(response.status, 403);
});

import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import {
  createClickjackingLabService,
  clickjackingScenarioKey,
  clickjackingRiskSignal,
  clickjackingDefenseSignal,
  clickjackingNormalSignal,
} from "../src/services/clickjacking-lab.js";
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

test("clickjacking service walks the risk path to the canonical accepted signal", () => {
  const service = createClickjackingLabService();
  const result = service.evaluate({
    variantKey: "vuln",
    scenarioKey: clickjackingScenarioKey,
    decisions: ["allow-any-origin-framing", "execute-without-confirmation"],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.completed, true);
  assert.equal(result.decision, "accepted");
  assert.equal(result.signal, clickjackingRiskSignal);
  assert.equal(result.steps.length, 2);
  assert.equal(result.recap.terminalOutcome, "risk");
  assert.equal(result.recap.outcomeCounts.risk, 2);
});

test("clickjacking service blocks the clickjacked action on the defense path", () => {
  const service = createClickjackingLabService();
  const result = service.evaluate({
    variantKey: "fixed",
    scenarioKey: clickjackingScenarioKey,
    decisions: [
      "enforce-frame-ancestors",
      "defense-intercepts-clickjacked-action",
    ],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.signal, clickjackingDefenseSignal);
  assert.equal(result.recap.terminalOutcome, "fix");
});

test("clickjacking service verifies the normal confirmation path", () => {
  const service = createClickjackingLabService();
  const result = service.evaluate({
    variantKey: "fixed",
    scenarioKey: clickjackingScenarioKey,
    decisions: [
      "enforce-frame-ancestors",
      "require-explicit-confirmation",
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.decision, "accepted");
  assert.equal(result.signal, clickjackingNormalSignal);
  assert.equal(result.recap.terminalOutcome, "normal");
});

test("clickjacking service blocks unknown scenario and option keys without echoing input", () => {
  const service = createClickjackingLabService();
  const rawScenario = "external-target-secret-scenario";
  const rawOption = "steal-real-credentials";

  const unknownScenario = service.evaluate({
    variantKey: "vuln",
    scenarioKey: rawScenario,
    decisions: ["allow-any-origin-framing"],
  });
  const unknownOption = service.evaluate({
    variantKey: "vuln",
    scenarioKey: clickjackingScenarioKey,
    decisions: [rawOption],
  });

  assert.equal(unknownScenario.decision, "blocked");
  assert.equal(unknownScenario.scenarioKey, "blocked-scenario");
  assert.equal(JSON.stringify(unknownScenario).includes(rawScenario), false);

  assert.equal(unknownOption.decision, "blocked");
  assert.equal(unknownOption.signal, "web-clickjacking-boundary-blocked");
  assert.equal(JSON.stringify(unknownOption).includes(rawOption), false);
});

test("clickjacking service blocks an incomplete decision path", () => {
  const service = createClickjackingLabService();
  const result = service.evaluate({
    variantKey: "vuln",
    scenarioKey: clickjackingScenarioKey,
    decisions: ["allow-any-origin-framing"],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.completed, false);
  assert.equal(result.blockedReason, "path-incomplete");
});

test("clickjacking workbench API exposes the fixed multi-step case", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/web/clickjacking/workbench`);
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
  assert.equal(body.workbench.id, "web.clickjacking");
  assert.equal(body.workbench.defaultScenarioKey, clickjackingScenarioKey);
  assert.equal(body.workbench.cases[0]?.steps.length, 2);
});

test("clickjacking evaluate API requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/clickjacking/vuln/evaluate`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioKey: clickjackingScenarioKey,
        decisions: ["allow-any-origin-framing", "execute-without-confirmation"],
      }),
    },
  );

  assert.equal(response.status, 401);
});

test("clickjacking evaluate API records a safe event and never echoes raw input", async () => {
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
    `${origin}/api/labs/web/clickjacking/vuln/evaluate`,
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
        targetUrl: "https://external.example/should-not-appear",
        password: "raw-password-should-not-appear",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: { labKey: string; decision: string; signal: string };
  };

  assert.equal(response.status, 200);
  assert.equal(body.result.labKey, "web.clickjacking");
  assert.equal(body.result.signal, clickjackingRiskSignal);
  assert.equal(eventCalls.length, 1);

  const serialized = JSON.stringify(eventCalls[0]);
  assert.equal(serialized.includes("external.example"), false);
  assert.equal(serialized.includes("raw-password"), false);
});

test("clickjacking evaluate API returns 403 on the blocked defense path", async () => {
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
    `${origin}/api/labs/web/clickjacking/fixed/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: clickjackingScenarioKey,
        decisions: [
          "enforce-frame-ancestors",
          "defense-intercepts-clickjacked-action",
        ],
      }),
    },
  );

  assert.equal(response.status, 403);
});

test("generic guided scenario workbench still works for other labs", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/open-redirect/workbench`,
  );
  const body = (await response.json()) as {
    status: string;
    workbench: { id: string };
  };

  assert.equal(response.status, 200);
  assert.equal(body.workbench.id, "web.open-redirect");
});

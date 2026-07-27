import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import {
  createFormjackingLabService,
  formjackingScenarioKey,
  formjackingRiskSignal,
  formjackingDefenseSignal,
  formjackingNormalSignal,
} from "../src/services/formjacking-lab.js";
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

test("formjacking service walks the risk path to the canonical accepted signal", () => {
  const service = createFormjackingLabService();
  const result = service.evaluate({
    variantKey: "vuln",
    scenarioKey: formjackingScenarioKey,
    decisions: ["trust-unrestricted-scripts", "submit-to-tampered-target"],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.completed, true);
  assert.equal(result.decision, "accepted");
  assert.equal(result.signal, formjackingRiskSignal);
  assert.equal(result.steps.length, 2);
  assert.equal(result.recap.terminalOutcome, "risk");
  assert.equal(result.recap.outcomeCounts.risk, 2);
});

test("formjacking service blocks the tampered submit target on the defense path", () => {
  const service = createFormjackingLabService();
  const result = service.evaluate({
    variantKey: "fixed",
    scenarioKey: formjackingScenarioKey,
    decisions: [
      "enforce-csp-sri-allowlist",
      "defense-blocks-tampered-target",
    ],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.signal, formjackingDefenseSignal);
  assert.equal(result.recap.terminalOutcome, "fix");
});

test("formjacking service verifies the normal first-party submit path", () => {
  const service = createFormjackingLabService();
  const result = service.evaluate({
    variantKey: "fixed",
    scenarioKey: formjackingScenarioKey,
    decisions: [
      "enforce-csp-sri-allowlist",
      "submit-to-verified-first-party-target",
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.decision, "accepted");
  assert.equal(result.signal, formjackingNormalSignal);
  assert.equal(result.recap.terminalOutcome, "normal");
});

test("formjacking service blocks unknown scenario and option keys without echoing input", () => {
  const service = createFormjackingLabService();
  const rawScenario = "external-target-secret-scenario";
  const rawOption = "exfiltrate-real-card-data";

  const unknownScenario = service.evaluate({
    variantKey: "vuln",
    scenarioKey: rawScenario,
    decisions: ["trust-unrestricted-scripts"],
  });
  const unknownOption = service.evaluate({
    variantKey: "vuln",
    scenarioKey: formjackingScenarioKey,
    decisions: [rawOption],
  });

  assert.equal(unknownScenario.decision, "blocked");
  assert.equal(unknownScenario.scenarioKey, "blocked-scenario");
  assert.equal(JSON.stringify(unknownScenario).includes(rawScenario), false);

  assert.equal(unknownOption.decision, "blocked");
  assert.equal(unknownOption.signal, "client-formjacking-boundary-blocked");
  assert.equal(JSON.stringify(unknownOption).includes(rawOption), false);
});

test("formjacking service blocks an incomplete decision path", () => {
  const service = createFormjackingLabService();
  const result = service.evaluate({
    variantKey: "vuln",
    scenarioKey: formjackingScenarioKey,
    decisions: ["trust-unrestricted-scripts"],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.completed, false);
  assert.equal(result.blockedReason, "path-incomplete");
});

test("formjacking workbench API exposes the fixed multi-step case", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/client/formjacking/workbench`);
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
  assert.equal(body.workbench.id, "client.formjacking");
  assert.equal(body.workbench.defaultScenarioKey, formjackingScenarioKey);
  assert.equal(body.workbench.cases[0]?.steps.length, 2);
});

test("formjacking evaluate API requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/client/formjacking/vuln/evaluate`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioKey: formjackingScenarioKey,
        decisions: [
          "trust-unrestricted-scripts",
          "submit-to-tampered-target",
        ],
      }),
    },
  );

  assert.equal(response.status, 401);
});

test("formjacking evaluate API records a safe event and never echoes raw input", async () => {
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
    `${origin}/api/labs/client/formjacking/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: formjackingScenarioKey,
        decisions: [
          "trust-unrestricted-scripts",
          "submit-to-tampered-target",
        ],
        targetUrl: "https://external.example/should-not-appear",
        cardNumber: "raw-card-should-not-appear",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: { labKey: string; decision: string; signal: string };
  };

  assert.equal(response.status, 200);
  assert.equal(body.result.labKey, "client.formjacking");
  assert.equal(body.result.signal, formjackingRiskSignal);
  assert.equal(eventCalls.length, 1);

  const serialized = JSON.stringify(eventCalls[0]);
  assert.equal(serialized.includes("external.example"), false);
  assert.equal(serialized.includes("raw-card"), false);
});

test("formjacking evaluate API returns 403 on the blocked defense path", async () => {
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
    `${origin}/api/labs/client/formjacking/fixed/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: formjackingScenarioKey,
        decisions: [
          "enforce-csp-sri-allowlist",
          "defense-blocks-tampered-target",
        ],
      }),
    },
  );

  assert.equal(response.status, 403);
});

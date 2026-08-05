import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";
import {
  createWorkflowBypassLabService,
  workflowBypassDefenseSignal,
  workflowBypassNormalSignal,
  workflowBypassRiskSignal,
  workflowBypassScenarioKey,
} from "../src/services/workflow-bypass-lab.js";

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

test("workflow bypass service accepts the fixed out-of-order risk path", () => {
  const service = createWorkflowBypassLabService();
  const result = service.evaluate({
    variantKey: "vuln",
    scenarioKey: workflowBypassScenarioKey,
    decisions: ["trust-client-stage-request", "ship-pending-order"],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.completed, true);
  assert.equal(result.decision, "accepted");
  assert.equal(result.signal, workflowBypassRiskSignal);
  assert.equal(result.steps.length, 2);
  assert.equal(result.recap.terminalOutcome, "risk");
  assert.equal(result.recap.outcomeCounts.risk, 2);
});

test("workflow bypass service blocks the out-of-order defense path", () => {
  const service = createWorkflowBypassLabService();
  const result = service.evaluate({
    variantKey: "fixed",
    scenarioKey: workflowBypassScenarioKey,
    decisions: [
      "enforce-server-side-sequence",
      "block-out-of-order-transition",
    ],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.signal, workflowBypassDefenseSignal);
  assert.equal(result.recap.terminalOutcome, "fix");
  assert.equal(result.blockedReason, "workflow-sequence-enforced");
});

test("workflow bypass service keeps the paid-order normal path available", () => {
  const service = createWorkflowBypassLabService();
  const result = service.evaluate({
    variantKey: "fixed",
    scenarioKey: workflowBypassScenarioKey,
    decisions: ["enforce-server-side-sequence", "ship-paid-order"],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.decision, "accepted");
  assert.equal(result.signal, workflowBypassNormalSignal);
  assert.equal(result.recap.terminalOutcome, "normal");
});

test("workflow bypass service blocks unknown keys without echoing raw input", () => {
  const service = createWorkflowBypassLabService();
  const rawScenario = "real-order-fulfillment";
  const rawOption = "ship-real-order-now";

  const unknownScenario = service.evaluate({
    variantKey: "vuln",
    scenarioKey: rawScenario,
    decisions: ["trust-client-stage-request"],
  });
  const unknownOption = service.evaluate({
    variantKey: "vuln",
    scenarioKey: workflowBypassScenarioKey,
    decisions: [rawOption],
  });
  const trailingOption = service.evaluate({
    variantKey: "vuln",
    scenarioKey: workflowBypassScenarioKey,
    decisions: [
      "trust-client-stage-request",
      "ship-pending-order",
      rawOption,
    ],
  });

  assert.equal(unknownScenario.decision, "blocked");
  assert.equal(unknownScenario.scenarioKey, "blocked-scenario");
  assert.equal(JSON.stringify(unknownScenario).includes(rawScenario), false);

  assert.equal(unknownOption.decision, "blocked");
  assert.equal(
    unknownOption.signal,
    "business-logic-workflow-bypass-boundary-blocked",
  );
  assert.equal(JSON.stringify(unknownOption).includes(rawOption), false);

  assert.equal(trailingOption.decision, "blocked");
  assert.equal(trailingOption.blockedReason, "decisions-after-terminal");
  assert.equal(JSON.stringify(trailingOption).includes(rawOption), false);
});

test("workflow bypass service blocks an incomplete decision path", () => {
  const service = createWorkflowBypassLabService();
  const result = service.evaluate({
    variantKey: "vuln",
    scenarioKey: workflowBypassScenarioKey,
    decisions: ["trust-client-stage-request"],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.completed, false);
  assert.equal(result.blockedReason, "path-incomplete");
});

test("workflow bypass workbench API exposes the fixed multi-step case", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/business-logic/workflow-bypass/workbench`,
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
  assert.equal(body.workbench.id, "business-logic.workflow-bypass");
  assert.equal(body.workbench.defaultScenarioKey, workflowBypassScenarioKey);
  assert.equal(body.workbench.cases[0]?.steps.length, 2);
});

test("workflow bypass evaluate API requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/business-logic/workflow-bypass/vuln/evaluate`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioKey: workflowBypassScenarioKey,
        decisions: ["trust-client-stage-request", "ship-pending-order"],
      }),
    },
  );

  assert.equal(response.status, 401);
});

test("workflow bypass evaluate API records only a safe event summary", async () => {
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
    `${origin}/api/labs/business-logic/workflow-bypass/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: workflowBypassScenarioKey,
        decisions: ["trust-client-stage-request", "ship-pending-order"],
        orderId: "real-order-42",
        paymentToken: "real-payment-token",
        requestedStage: "real-shipping-provider",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: { labKey: string; signal: string };
  };

  assert.equal(response.status, 200);
  assert.equal(body.result.labKey, "business-logic.workflow-bypass");
  assert.equal(body.result.signal, workflowBypassRiskSignal);
  assert.equal(eventCalls.length, 1);

  const serialized = JSON.stringify(eventCalls[0]);
  assert.equal(serialized.includes("real-order-42"), false);
  assert.equal(serialized.includes("real-payment-token"), false);
  assert.equal(serialized.includes("real-shipping-provider"), false);
});

test("workflow bypass evaluate API returns 403 on the defense path", async () => {
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
    `${origin}/api/labs/business-logic/workflow-bypass/fixed/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: workflowBypassScenarioKey,
        decisions: [
          "enforce-server-side-sequence",
          "block-out-of-order-transition",
        ],
      }),
    },
  );

  assert.equal(response.status, 403);
});

import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import {
  createOpenRedirectLabService,
  openRedirectScenarioKey,
  openRedirectRiskSignal,
  openRedirectDefenseSignal,
  openRedirectNormalSignal,
} from "../src/services/open-redirect-lab.js";
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

test("open redirect service walks the risk path to the canonical accepted signal", () => {
  const service = createOpenRedirectLabService();
  const result = service.evaluate({
    variantKey: "vuln",
    scenarioKey: openRedirectScenarioKey,
    decisions: ["trust-user-supplied-target", "redirect-without-validation"],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.completed, true);
  assert.equal(result.decision, "accepted");
  assert.equal(result.signal, openRedirectRiskSignal);
  assert.equal(result.steps.length, 2);
  assert.equal(result.recap.terminalOutcome, "risk");
  assert.equal(result.recap.outcomeCounts.risk, 2);
});

test("open redirect service blocks the untrusted redirect on the defense path", () => {
  const service = createOpenRedirectLabService();
  const result = service.evaluate({
    variantKey: "fixed",
    scenarioKey: openRedirectScenarioKey,
    decisions: [
      "enforce-target-allowlist",
      "defense-blocks-untrusted-redirect",
    ],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.signal, openRedirectDefenseSignal);
  assert.equal(result.recap.terminalOutcome, "fix");
});

test("open redirect service verifies the normal in-site redirect path", () => {
  const service = createOpenRedirectLabService();
  const result = service.evaluate({
    variantKey: "fixed",
    scenarioKey: openRedirectScenarioKey,
    decisions: [
      "enforce-target-allowlist",
      "redirect-to-verified-relative-path",
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.decision, "accepted");
  assert.equal(result.signal, openRedirectNormalSignal);
  assert.equal(result.recap.terminalOutcome, "normal");
});

test("open redirect service blocks unknown scenario and option keys without echoing input", () => {
  const service = createOpenRedirectLabService();
  const rawScenario = "external-target-secret-scenario";
  const rawOption = "redirect-to-real-external-domain";

  const unknownScenario = service.evaluate({
    variantKey: "vuln",
    scenarioKey: rawScenario,
    decisions: ["trust-user-supplied-target"],
  });
  const unknownOption = service.evaluate({
    variantKey: "vuln",
    scenarioKey: openRedirectScenarioKey,
    decisions: [rawOption],
  });

  assert.equal(unknownScenario.decision, "blocked");
  assert.equal(unknownScenario.scenarioKey, "blocked-scenario");
  assert.equal(JSON.stringify(unknownScenario).includes(rawScenario), false);

  assert.equal(unknownOption.decision, "blocked");
  assert.equal(unknownOption.signal, "web-open-redirect-boundary-blocked");
  assert.equal(JSON.stringify(unknownOption).includes(rawOption), false);
});

test("open redirect service blocks an incomplete decision path", () => {
  const service = createOpenRedirectLabService();
  const result = service.evaluate({
    variantKey: "vuln",
    scenarioKey: openRedirectScenarioKey,
    decisions: ["trust-user-supplied-target"],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.completed, false);
  assert.equal(result.blockedReason, "path-incomplete");
});

test("open redirect workbench API exposes the fixed multi-step case", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/web/open-redirect/workbench`);
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
  assert.equal(body.workbench.id, "web.open-redirect");
  assert.equal(body.workbench.defaultScenarioKey, openRedirectScenarioKey);
  assert.equal(body.workbench.cases[0]?.steps.length, 2);
});

test("open redirect evaluate API requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/open-redirect/vuln/evaluate`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioKey: openRedirectScenarioKey,
        decisions: [
          "trust-user-supplied-target",
          "redirect-without-validation",
        ],
      }),
    },
  );

  assert.equal(response.status, 401);
});

test("open redirect evaluate API records a safe event and never echoes raw input", async () => {
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
    `${origin}/api/labs/web/open-redirect/vuln/evaluate`,
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
  assert.equal(body.result.labKey, "web.open-redirect");
  assert.equal(body.result.signal, openRedirectRiskSignal);
  assert.equal(eventCalls.length, 1);

  const serialized = JSON.stringify(eventCalls[0]);
  assert.equal(serialized.includes("external.example"), false);
  assert.equal(serialized.includes("raw-password"), false);
});

test("open redirect evaluate API returns 403 on the blocked defense path", async () => {
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
    `${origin}/api/labs/web/open-redirect/fixed/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: openRedirectScenarioKey,
        decisions: [
          "enforce-target-allowlist",
          "defense-blocks-untrusted-redirect",
        ],
      }),
    },
  );

  assert.equal(response.status, 403);
});

import assert from "node:assert/strict";
import { after, test } from "node:test";

import { guidedScenarioCatalog } from "@network-safe/shared/guided-scenarios";

import { createApp } from "../src/app.js";
import {
  createGuidedScenarioLabService,
  summarizeGuidedScenarioResult,
} from "../src/services/guided-scenario-lab.js";
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

test("guided scenario service covers vulnerable, blocked, and normal fixed outcomes for all 38 labs", () => {
  const service = createGuidedScenarioLabService();

  for (const scenario of guidedScenarioCatalog) {
    const vulnerable = service.evaluate({
      category: scenario.category,
      scene: scenario.subcategory,
      variantKey: "vuln",
      scenarioKey: scenario.defaultScenarioKey,
      controlKey: scenario.controls[0].key,
    });
    const blocked = service.evaluate({
      category: scenario.category,
      scene: scenario.subcategory,
      variantKey: "fixed",
      scenarioKey: scenario.defaultScenarioKey,
      controlKey: scenario.controls[0].key,
    });
    const normal = service.evaluate({
      category: scenario.category,
      scene: scenario.subcategory,
      variantKey: "fixed",
      scenarioKey: scenario.defaultScenarioKey,
      controlKey: scenario.controls[1].key,
    });

    assert.equal(vulnerable?.decision, "accepted", scenario.id);
    assert.equal(vulnerable?.signal, scenario.vulnerableOutcome.signal);
    assert.equal(blocked?.decision, "blocked", scenario.id);
    assert.equal(blocked?.signal, scenario.controls[0].fixedSignal);
    assert.equal(normal?.decision, "accepted", scenario.id);
    assert.equal(normal?.signal, scenario.controls[1].fixedSignal);
  }
});

test("guided scenario service blocks unknown keys without echoing raw values", () => {
  const service = createGuidedScenarioLabService();
  const rawScenarioKey = "external-target-secret-scenario";
  const rawControlKey = "real-credential-control";
  const result = service.evaluate({
    category: "web",
    scene: "clickjacking",
    variantKey: "vuln",
    scenarioKey: rawScenarioKey,
    controlKey: rawControlKey,
  });
  const serialized = JSON.stringify(result);

  assert.equal(result?.decision, "blocked");
  assert.equal(result?.signal, "guided-scenario-boundary-blocked");
  assert.equal(result?.scenarioKey, "blocked-scenario");
  assert.equal(result?.controlKey, "blocked-control");
  assert.equal(serialized.includes(rawScenarioKey), false);
  assert.equal(serialized.includes(rawControlKey), false);
});

test("guided scenario workbench API exposes all fixed catalog entries", async () => {
  const app = createApp();
  const origin = await listen(app);

  for (const scenario of guidedScenarioCatalog) {
    const response = await fetch(
      `${origin}/api/labs/${scenario.category}/${scenario.subcategory}/workbench`,
    );
    const body = (await response.json()) as {
      status: string;
      workbench: { id: string; defaultScenarioKey: string };
    };

    assert.equal(response.status, 200, scenario.id);
    assert.equal(body.status, "ok");
    assert.equal(body.workbench.id, scenario.id);
    assert.equal(body.workbench.defaultScenarioKey, scenario.defaultScenarioKey);
  }
});

test("guided scenario evaluate API requires login", async () => {
  const app = createApp();
  const origin = await listen(app);
  const scenario = guidedScenarioCatalog[0];

  assert.ok(scenario);

  const response = await fetch(
    `${origin}/api/labs/${scenario.category}/${scenario.subcategory}/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: scenario.defaultScenarioKey,
        controlKey: scenario.defaultControlKey,
      }),
    },
  );

  assert.equal(response.status, 401);
});

test("guided scenario evaluate API records a safe event for every new lab", async () => {
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

  for (const scenario of guidedScenarioCatalog) {
    const response = await fetch(
      `${origin}/api/labs/${scenario.category}/${scenario.subcategory}/vuln/evaluate`,
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scenarioKey: scenario.defaultScenarioKey,
          controlKey: scenario.defaultControlKey,
          targetUrl: "https://external.example/should-not-appear",
          password: "raw-password-should-not-appear",
          token: "raw-token-should-not-appear",
        }),
      },
    );
    const body = (await response.json()) as {
      status: string;
      result: { labKey: string; decision: string; signal: string };
    };

    assert.equal(response.status, 200, scenario.id);
    assert.equal(body.result.labKey, scenario.id);
    assert.equal(body.result.decision, "accepted");
    assert.equal(body.result.signal, scenario.vulnerableOutcome.signal);
  }

  assert.equal(eventCalls.length, guidedScenarioCatalog.length);

  for (const [index, event] of eventCalls.entries()) {
    const scenario = guidedScenarioCatalog[index];
    const serialized = JSON.stringify(event.inputSummary);

    assert.equal(event.labKey, scenario?.id);
    assert.equal(event.decision, "accepted");
    assert.deepEqual(
      event.inputSummary,
      summarizeGuidedScenarioResult(
        createGuidedScenarioLabService().evaluate({
          category: scenario?.category ?? "",
          scene: scenario?.subcategory ?? "",
          variantKey: "vuln",
          scenarioKey: scenario?.defaultScenarioKey ?? "",
          controlKey: scenario?.defaultControlKey ?? "",
        })!,
      ),
    );
    assert.equal(serialized.includes("external.example"), false);
    assert.equal(serialized.includes("raw-password"), false);
    assert.equal(serialized.includes("raw-token"), false);
  }
});

test("guided fixed API blocks risky control and allows verified normal flow", async () => {
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
  const scenario = guidedScenarioCatalog.find(
    (item) => item.id === "infrastructure.zero-day",
  );

  assert.ok(scenario);

  const blockedResponse = await fetch(
    `${origin}/api/labs/${scenario.category}/${scenario.subcategory}/fixed/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: scenario.defaultScenarioKey,
        controlKey: scenario.controls[0].key,
      }),
    },
  );
  const normalResponse = await fetch(
    `${origin}/api/labs/${scenario.category}/${scenario.subcategory}/fixed/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: scenario.defaultScenarioKey,
        controlKey: scenario.controls[1].key,
      }),
    },
  );

  assert.equal(blockedResponse.status, 403);
  assert.equal(normalResponse.status, 200);
});

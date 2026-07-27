import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import {
  createRansomwareLabService,
  ransomwareScenarioKey,
  ransomwareRiskSignal,
  ransomwareDefenseSignal,
  ransomwareNormalSignal,
} from "../src/services/ransomware-lab.js";
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

test("ransomware service walks the risk path to the canonical accepted signal", () => {
  const service = createRansomwareLabService();
  const result = service.evaluate({
    variantKey: "vuln",
    scenarioKey: ransomwareScenarioKey,
    decisions: [
      "ignore-anomalous-file-behavior",
      "allow-unrestricted-encryption",
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.completed, true);
  assert.equal(result.decision, "accepted");
  assert.equal(result.signal, ransomwareRiskSignal);
  assert.equal(result.steps.length, 2);
  assert.equal(result.recap.terminalOutcome, "risk");
  assert.equal(result.recap.outcomeCounts.risk, 2);
});

test("ransomware service blocks the encryption behavior on the defense path", () => {
  const service = createRansomwareLabService();
  const result = service.evaluate({
    variantKey: "fixed",
    scenarioKey: ransomwareScenarioKey,
    decisions: ["correlate-and-detect-behavior", "isolate-and-block-host"],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.signal, ransomwareDefenseSignal);
  assert.equal(result.recap.terminalOutcome, "fix");
});

test("ransomware service verifies the normal backup-restore path", () => {
  const service = createRansomwareLabService();
  const result = service.evaluate({
    variantKey: "fixed",
    scenarioKey: ransomwareScenarioKey,
    decisions: [
      "correlate-and-detect-behavior",
      "restore-from-offline-backup",
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.decision, "accepted");
  assert.equal(result.signal, ransomwareNormalSignal);
  assert.equal(result.recap.terminalOutcome, "normal");
});

test("ransomware service blocks unknown scenario and option keys without echoing input", () => {
  const service = createRansomwareLabService();
  const rawScenario = "real-ransomware-sample-path";
  const rawOption = "encrypt-real-files";

  const unknownScenario = service.evaluate({
    variantKey: "vuln",
    scenarioKey: rawScenario,
    decisions: ["ignore-anomalous-file-behavior"],
  });
  const unknownOption = service.evaluate({
    variantKey: "vuln",
    scenarioKey: ransomwareScenarioKey,
    decisions: [rawOption],
  });

  assert.equal(unknownScenario.decision, "blocked");
  assert.equal(unknownScenario.scenarioKey, "blocked-scenario");
  assert.equal(JSON.stringify(unknownScenario).includes(rawScenario), false);

  assert.equal(unknownOption.decision, "blocked");
  assert.equal(unknownOption.signal, "malware-ransomware-boundary-blocked");
  assert.equal(JSON.stringify(unknownOption).includes(rawOption), false);
});

test("ransomware service blocks an incomplete decision path", () => {
  const service = createRansomwareLabService();
  const result = service.evaluate({
    variantKey: "vuln",
    scenarioKey: ransomwareScenarioKey,
    decisions: ["ignore-anomalous-file-behavior"],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.completed, false);
  assert.equal(result.blockedReason, "path-incomplete");
});

test("ransomware workbench API exposes the fixed multi-step case", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/malware/ransomware/workbench`);
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
  assert.equal(body.workbench.id, "malware.ransomware");
  assert.equal(body.workbench.defaultScenarioKey, ransomwareScenarioKey);
  assert.equal(body.workbench.cases[0]?.steps.length, 2);
});

test("ransomware evaluate API requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/malware/ransomware/vuln/evaluate`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioKey: ransomwareScenarioKey,
        decisions: [
          "ignore-anomalous-file-behavior",
          "allow-unrestricted-encryption",
        ],
      }),
    },
  );

  assert.equal(response.status, 401);
});

test("ransomware evaluate API records a safe event and never echoes raw input", async () => {
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
    `${origin}/api/labs/malware/ransomware/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: ransomwareScenarioKey,
        decisions: [
          "ignore-anomalous-file-behavior",
          "allow-unrestricted-encryption",
        ],
        ransomNote: "pay-to-external-wallet-should-not-appear",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: { labKey: string; decision: string; signal: string };
  };

  assert.equal(response.status, 200);
  assert.equal(body.result.labKey, "malware.ransomware");
  assert.equal(body.result.signal, ransomwareRiskSignal);
  assert.equal(eventCalls.length, 1);

  const serialized = JSON.stringify(eventCalls[0]);
  assert.equal(serialized.includes("external-wallet"), false);
});

test("ransomware evaluate API returns 403 on the blocked defense path", async () => {
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
    `${origin}/api/labs/malware/ransomware/fixed/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: ransomwareScenarioKey,
        decisions: ["correlate-and-detect-behavior", "isolate-and-block-host"],
      }),
    },
  );

  assert.equal(response.status, 403);
});

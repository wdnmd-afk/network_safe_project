import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import {
  assessFixedPersistenceEntry,
  createPersistenceTriageLabService,
  fixedPersistenceEntrySnapshots,
  persistenceTriageDefenseSignal,
  persistenceTriageNormalSignal,
  persistenceTriageRiskSignal,
  persistenceTriageScenarioKey,
} from "../src/services/persistence-triage-lab.js";
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

test("fixed persistence entry snapshots are frozen and expose locked audit counts", () => {
  assert.equal(Object.isFrozen(fixedPersistenceEntrySnapshots), true);
  assert.equal(Object.isFrozen(fixedPersistenceEntrySnapshots[0]), true);
  assert.deepEqual(
    fixedPersistenceEntrySnapshots.map(assessFixedPersistenceEntry),
    [
      {
        entryKey: "virtual-unsigned-autorun-entry",
        expectedPosture: "vulnerable",
        findingCount: 4,
        criticalFindingCount: 2,
        hardeningControlCount: 0,
      },
      {
        entryKey: "virtual-signed-managed-task",
        expectedPosture: "hardened",
        findingCount: 0,
        criticalFindingCount: 0,
        hardeningControlCount: 5,
      },
    ],
  );
});

test("persistence triage accepts the fixed retention risk path", () => {
  const result = createPersistenceTriageLabService().evaluate({
    variantKey: "vuln",
    scenarioKey: persistenceTriageScenarioKey,
    decisions: [
      "accept-unsigned-autorun-entry",
      "approve-persistence-retention",
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, persistenceTriageRiskSignal);
  assert.equal(result.recap.terminalOutcome, "risk");
  assert.equal(result.entryAssessment?.criticalFindingCount, 2);
  assert.equal(
    result.persistenceDecision?.disposition,
    "persistence-retention-approved",
  );
});

test("persistence triage blocks and removes persistence on the defense path", () => {
  const result = createPersistenceTriageLabService().evaluate({
    variantKey: "fixed",
    scenarioKey: persistenceTriageScenarioKey,
    decisions: [
      "harden-signature-and-path-acl",
      "block-and-remove-persistence",
    ],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, persistenceTriageDefenseSignal);
  assert.equal(result.recap.terminalOutcome, "fix");
  assert.equal(result.entryAssessment?.hardeningControlCount, 5);
  assert.equal(result.blockedReason, "persistence-retention-blocked");
});

test("persistence triage verifies the managed autorun normal baseline", () => {
  const result = createPersistenceTriageLabService().evaluate({
    variantKey: "fixed",
    scenarioKey: persistenceTriageScenarioKey,
    decisions: [
      "harden-signature-and-path-acl",
      "verify-managed-autorun-baseline",
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, persistenceTriageNormalSignal);
  assert.equal(result.recap.terminalOutcome, "normal");
  assert.equal(
    result.persistenceDecision?.disposition,
    "managed-autorun-baseline-verified",
  );
});

test("persistence triage blocks unknown and incomplete paths without echo", () => {
  const service = createPersistenceTriageLabService();
  const rawScenario = "enumerate-real-scheduled-tasks";
  const rawOption = "install-real-autorun-entry";
  const unknownScenario = service.evaluate({
    variantKey: "vuln",
    scenarioKey: rawScenario,
    decisions: ["accept-unsigned-autorun-entry"],
  });
  const unknownOption = service.evaluate({
    variantKey: "vuln",
    scenarioKey: persistenceTriageScenarioKey,
    decisions: [rawOption],
  });
  const incomplete = service.evaluate({
    variantKey: "vuln",
    scenarioKey: persistenceTriageScenarioKey,
    decisions: ["accept-unsigned-autorun-entry"],
  });
  const trailing = service.evaluate({
    variantKey: "vuln",
    scenarioKey: persistenceTriageScenarioKey,
    decisions: [
      "accept-unsigned-autorun-entry",
      "approve-persistence-retention",
      rawOption,
    ],
  });

  assert.equal(unknownScenario.scenarioKey, "blocked-scenario");
  assert.equal(JSON.stringify(unknownScenario).includes(rawScenario), false);
  assert.equal(JSON.stringify(unknownOption).includes(rawOption), false);
  assert.equal(incomplete.blockedReason, "path-incomplete");
  assert.equal(trailing.blockedReason, "decisions-after-terminal");
  assert.equal(JSON.stringify(trailing).includes(rawOption), false);
});

test("persistence triage workbench API exposes only fixed entries", async () => {
  const origin = await listen(createApp());
  const response = await fetch(
    `${origin}/api/labs/host/persistence-triage/workbench`,
  );
  const body = (await response.json()) as {
    status: string;
    workbench: {
      id: string;
      defaultScenarioKey: string;
      entrySnapshots: Array<{ entryKey: string; signatureScope: string }>;
      entryAssessments: unknown[];
    };
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.workbench.id, "host.persistence-triage");
  assert.equal(body.workbench.defaultScenarioKey, persistenceTriageScenarioKey);
  assert.equal(body.workbench.entrySnapshots.length, 2);
  assert.equal(body.workbench.entryAssessments.length, 2);
  assert.ok(
    body.workbench.entrySnapshots.every((entry) =>
      entry.entryKey.startsWith("virtual-"),
    ),
  );
  // 签名范围只允许两个登记枚举，不得出现真实发布者名称
  assert.ok(
    body.workbench.entrySnapshots.every(
      (entry) =>
        entry.signatureScope === "unsigned" ||
        entry.signatureScope === "publisher-verified",
    ),
  );
});

test("persistence triage evaluate API requires login", async () => {
  const origin = await listen(createApp());
  const response = await fetch(
    `${origin}/api/labs/host/persistence-triage/vuln/evaluate`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioKey: persistenceTriageScenarioKey,
        decisions: [
          "accept-unsigned-autorun-entry",
          "approve-persistence-retention",
        ],
      }),
    },
  );

  assert.equal(response.status, 401);
});

test("persistence triage API records only fixed keys and audit counts", async () => {
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
    `${origin}/api/labs/host/persistence-triage/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: persistenceTriageScenarioKey,
        decisions: [
          "accept-unsigned-autorun-entry",
          "approve-persistence-retention",
        ],
        registryKey:
          "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
        taskName: "\\Microsoft\\Windows\\RealUpdateTask",
        imagePath: "C:\\Users\\windows\\AppData\\Local\\real-agent.exe",
        hostname: "REAL-DESKTOP-01",
        sid: "S-1-5-21-1111111111-2222222222-3333333333-1001",
      }),
    },
  );
  const blockedResponse = await fetch(
    `${origin}/api/labs/host/persistence-triage/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: "enumerate-real-scheduled-tasks",
        decisions: ["install-real-autorun-entry"],
      }),
    },
  );

  assert.equal(response.status, 200);
  assert.equal(blockedResponse.status, 403);
  assert.equal(eventCalls.length, 2);

  const serialized = JSON.stringify(eventCalls);
  assert.equal(
    serialized.includes("fixed-windows-autorun-persistence-timeline"),
    true,
  );
  assert.equal(serialized.includes("virtual-unsigned-autorun-entry"), true);
  assert.equal(serialized.includes("HKLM"), false);
  assert.equal(serialized.includes("RealUpdateTask"), false);
  assert.equal(serialized.includes("real-agent.exe"), false);
  assert.equal(serialized.includes("REAL-DESKTOP-01"), false);
  assert.equal(serialized.includes("S-1-5-21"), false);
  assert.equal(serialized.includes("enumerate-real-scheduled-tasks"), false);
  assert.equal(serialized.includes("install-real-autorun-entry"), false);
});

test("persistence triage API returns 403 for the defense path", async () => {
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
    `${origin}/api/labs/host/persistence-triage/fixed/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: persistenceTriageScenarioKey,
        decisions: [
          "harden-signature-and-path-acl",
          "block-and-remove-persistence",
        ],
      }),
    },
  );

  assert.equal(response.status, 403);
});

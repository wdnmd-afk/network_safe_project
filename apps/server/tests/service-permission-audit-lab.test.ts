import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import {
  assessFixedServicePermissionProfile,
  createServicePermissionAuditLabService,
  fixedServicePermissionProfiles,
  servicePermissionAuditDefenseSignal,
  servicePermissionAuditNormalSignal,
  servicePermissionAuditRiskSignal,
  servicePermissionAuditScenarioKey,
} from "../src/services/service-permission-audit-lab.js";
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

test("fixed service permission profiles are frozen and expose locked audit counts", () => {
  assert.equal(Object.isFrozen(fixedServicePermissionProfiles), true);
  assert.equal(Object.isFrozen(fixedServicePermissionProfiles[0]), true);
  assert.deepEqual(
    fixedServicePermissionProfiles.map(assessFixedServicePermissionProfile),
    [
      {
        serviceKey: "virtual-update-service-risky",
        expectedPosture: "vulnerable",
        findingCount: 4,
        criticalFindingCount: 2,
        hardenedControlCount: 0,
      },
      {
        serviceKey: "virtual-update-service-hardened",
        expectedPosture: "hardened",
        findingCount: 0,
        criticalFindingCount: 0,
        hardenedControlCount: 4,
      },
    ],
  );
});

test("service permission audit accepts the fixed replacement risk path", () => {
  const result = createServicePermissionAuditLabService().evaluate({
    variantKey: "vuln",
    scenarioKey: servicePermissionAuditScenarioKey,
    decisions: [
      "accept-user-writable-unquoted-path",
      "allow-unprivileged-service-replacement",
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, servicePermissionAuditRiskSignal);
  assert.equal(result.recap.terminalOutcome, "risk");
  assert.equal(result.profileAssessment?.serviceKey, "virtual-update-service-risky");
  assert.equal(result.profileAssessment?.criticalFindingCount, 2);
  assert.equal(
    result.permissionDecision?.disposition,
    "replacement-risk-accepted",
  );
});

test("service permission audit blocks unprivileged service modification", () => {
  const result = createServicePermissionAuditLabService().evaluate({
    variantKey: "fixed",
    scenarioKey: servicePermissionAuditScenarioKey,
    decisions: [
      "harden-path-and-service-acl",
      "block-unprivileged-service-modification",
    ],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, servicePermissionAuditDefenseSignal);
  assert.equal(result.recap.terminalOutcome, "fix");
  assert.equal(result.profileAssessment?.hardenedControlCount, 4);
  assert.equal(result.blockedReason, "unprivileged-service-modification-blocked");
});

test("service permission audit verifies the hardened normal baseline", () => {
  const result = createServicePermissionAuditLabService().evaluate({
    variantKey: "fixed",
    scenarioKey: servicePermissionAuditScenarioKey,
    decisions: [
      "harden-path-and-service-acl",
      "verify-hardened-service-baseline",
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, servicePermissionAuditNormalSignal);
  assert.equal(result.recap.terminalOutcome, "normal");
  assert.equal(
    result.permissionDecision?.disposition,
    "hardened-baseline-verified",
  );
});

test("service permission audit blocks unknown and incomplete paths without echo", () => {
  const service = createServicePermissionAuditLabService();
  const rawScenario = "enumerate-real-windows-services";
  const rawOption = "replace-real-service-binary";
  const unknownScenario = service.evaluate({
    variantKey: "vuln",
    scenarioKey: rawScenario,
    decisions: ["accept-user-writable-unquoted-path"],
  });
  const unknownOption = service.evaluate({
    variantKey: "vuln",
    scenarioKey: servicePermissionAuditScenarioKey,
    decisions: [rawOption],
  });
  const incomplete = service.evaluate({
    variantKey: "vuln",
    scenarioKey: servicePermissionAuditScenarioKey,
    decisions: ["accept-user-writable-unquoted-path"],
  });
  const trailing = service.evaluate({
    variantKey: "vuln",
    scenarioKey: servicePermissionAuditScenarioKey,
    decisions: [
      "accept-user-writable-unquoted-path",
      "allow-unprivileged-service-replacement",
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

test("service permission audit workbench API exposes only fixed profiles", async () => {
  const origin = await listen(createApp());
  const response = await fetch(
    `${origin}/api/labs/host/service-permission-audit/workbench`,
  );
  const body = (await response.json()) as {
    status: string;
    workbench: {
      id: string;
      defaultScenarioKey: string;
      serviceProfiles: Array<{ serviceKey: string; executablePath: string }>;
      profileAssessments: unknown[];
    };
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.workbench.id, "host.service-permission-audit");
  assert.equal(body.workbench.defaultScenarioKey, servicePermissionAuditScenarioKey);
  assert.equal(body.workbench.serviceProfiles.length, 2);
  assert.equal(body.workbench.profileAssessments.length, 2);
  assert.ok(
    body.workbench.serviceProfiles.every((profile) =>
      profile.executablePath.includes("LabVirtual"),
    ),
  );
});

test("service permission audit evaluate API requires login", async () => {
  const origin = await listen(createApp());
  const response = await fetch(
    `${origin}/api/labs/host/service-permission-audit/vuln/evaluate`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioKey: servicePermissionAuditScenarioKey,
        decisions: [
          "accept-user-writable-unquoted-path",
          "allow-unprivileged-service-replacement",
        ],
      }),
    },
  );

  assert.equal(response.status, 401);
});

test("service permission audit API records only fixed keys and audit counts", async () => {
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
    `${origin}/api/labs/host/service-permission-audit/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: servicePermissionAuditScenarioKey,
        decisions: [
          "accept-user-writable-unquoted-path",
          "allow-unprivileged-service-replacement",
        ],
        serviceName: "real-service-name",
        path: "C:\\RealSystem\\service.exe",
        sid: "S-1-5-real",
        account: "real-machine-account",
        command: "sc.exe config real-service",
        credential: "real-secret-value",
      }),
    },
  );
  const blockedResponse = await fetch(
    `${origin}/api/labs/host/service-permission-audit/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: "enumerate-real-windows-services",
        decisions: ["replace-real-service-binary"],
      }),
    },
  );

  assert.equal(response.status, 200);
  assert.equal(blockedResponse.status, 403);
  assert.equal(eventCalls.length, 2);

  const serialized = JSON.stringify(eventCalls);
  assert.equal(serialized.includes("fixed-windows-service-permission-audit"), true);
  assert.equal(serialized.includes("virtual-update-service-risky"), true);
  assert.equal(serialized.includes("real-service-name"), false);
  assert.equal(serialized.includes("C:\\\\RealSystem"), false);
  assert.equal(serialized.includes("S-1-5-real"), false);
  assert.equal(serialized.includes("real-machine-account"), false);
  assert.equal(serialized.includes("sc.exe config"), false);
  assert.equal(serialized.includes("real-secret-value"), false);
  assert.equal(serialized.includes("enumerate-real-windows-services"), false);
  assert.equal(serialized.includes("replace-real-service-binary"), false);
});

test("service permission audit API returns 403 for the defense path", async () => {
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
    `${origin}/api/labs/host/service-permission-audit/fixed/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: servicePermissionAuditScenarioKey,
        decisions: [
          "harden-path-and-service-acl",
          "block-unprivileged-service-modification",
        ],
      }),
    },
  );

  assert.equal(response.status, 403);
});

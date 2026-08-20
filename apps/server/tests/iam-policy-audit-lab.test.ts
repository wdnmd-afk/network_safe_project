import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import {
  assessFixedIamPolicy,
  createIamPolicyAuditLabService,
  fixedIamPolicySnapshots,
  iamPolicyAuditDefenseSignal,
  iamPolicyAuditNormalSignal,
  iamPolicyAuditRiskSignal,
  iamPolicyAuditScenarioKey,
} from "../src/services/iam-policy-audit-lab.js";
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

test("fixed iam policy snapshots are frozen and expose locked audit counts", () => {
  assert.equal(Object.isFrozen(fixedIamPolicySnapshots), true);
  assert.equal(Object.isFrozen(fixedIamPolicySnapshots[0]), true);
  assert.deepEqual(fixedIamPolicySnapshots.map(assessFixedIamPolicy), [
    {
      policyKey: "virtual-admin-wildcard-policy",
      expectedPosture: "vulnerable",
      findingCount: 4,
      criticalFindingCount: 2,
      leastPrivilegeControlCount: 0,
    },
    {
      policyKey: "virtual-scoped-least-privilege-policy",
      expectedPosture: "hardened",
      findingCount: 0,
      criticalFindingCount: 0,
      leastPrivilegeControlCount: 4,
    },
  ]);
});

test("iam policy audit accepts the fixed overbroad grant risk path", () => {
  const result = createIamPolicyAuditLabService().evaluate({
    variantKey: "vuln",
    scenarioKey: iamPolicyAuditScenarioKey,
    decisions: [
      "accept-wildcard-admin-policy",
      "approve-overbroad-policy-grant",
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, iamPolicyAuditRiskSignal);
  assert.equal(result.recap.terminalOutcome, "risk");
  assert.equal(result.policyAssessment?.criticalFindingCount, 2);
  assert.equal(
    result.policyDecision?.disposition,
    "overbroad-grant-approved",
  );
});

test("iam policy audit blocks the overbroad grant on the defense path", () => {
  const result = createIamPolicyAuditLabService().evaluate({
    variantKey: "fixed",
    scenarioKey: iamPolicyAuditScenarioKey,
    decisions: [
      "scope-policy-to-least-privilege",
      "block-overbroad-policy-grant",
    ],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, iamPolicyAuditDefenseSignal);
  assert.equal(result.recap.terminalOutcome, "fix");
  assert.equal(result.policyAssessment?.leastPrivilegeControlCount, 4);
  assert.equal(result.blockedReason, "overbroad-policy-grant-blocked");
});

test("iam policy audit verifies the least privilege normal baseline", () => {
  const result = createIamPolicyAuditLabService().evaluate({
    variantKey: "fixed",
    scenarioKey: iamPolicyAuditScenarioKey,
    decisions: [
      "scope-policy-to-least-privilege",
      "verify-least-privilege-baseline",
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, iamPolicyAuditNormalSignal);
  assert.equal(result.recap.terminalOutcome, "normal");
  assert.equal(
    result.policyDecision?.disposition,
    "least-privilege-baseline-verified",
  );
});

test("iam policy audit blocks unknown and incomplete paths without echo", () => {
  const service = createIamPolicyAuditLabService();
  const rawScenario = "enumerate-real-cloud-roles";
  const rawOption = "attach-real-admin-policy";
  const unknownScenario = service.evaluate({
    variantKey: "vuln",
    scenarioKey: rawScenario,
    decisions: ["accept-wildcard-admin-policy"],
  });
  const unknownOption = service.evaluate({
    variantKey: "vuln",
    scenarioKey: iamPolicyAuditScenarioKey,
    decisions: [rawOption],
  });
  const incomplete = service.evaluate({
    variantKey: "vuln",
    scenarioKey: iamPolicyAuditScenarioKey,
    decisions: ["accept-wildcard-admin-policy"],
  });
  const trailing = service.evaluate({
    variantKey: "vuln",
    scenarioKey: iamPolicyAuditScenarioKey,
    decisions: [
      "accept-wildcard-admin-policy",
      "approve-overbroad-policy-grant",
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

test("iam policy audit workbench API exposes only fixed policies", async () => {
  const origin = await listen(createApp());
  const response = await fetch(
    `${origin}/api/labs/infrastructure/iam-policy-audit/workbench`,
  );
  const body = (await response.json()) as {
    status: string;
    workbench: {
      id: string;
      defaultScenarioKey: string;
      policySnapshots: Array<{ policyKey: string }>;
      policyAssessments: unknown[];
    };
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.workbench.id, "infrastructure.iam-policy-audit");
  assert.equal(body.workbench.defaultScenarioKey, iamPolicyAuditScenarioKey);
  assert.equal(body.workbench.policySnapshots.length, 2);
  assert.equal(body.workbench.policyAssessments.length, 2);
  assert.ok(
    body.workbench.policySnapshots.every((policy) =>
      policy.policyKey.startsWith("virtual-"),
    ),
  );
});

test("iam policy audit evaluate API requires login", async () => {
  const origin = await listen(createApp());
  const response = await fetch(
    `${origin}/api/labs/infrastructure/iam-policy-audit/vuln/evaluate`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioKey: iamPolicyAuditScenarioKey,
        decisions: [
          "accept-wildcard-admin-policy",
          "approve-overbroad-policy-grant",
        ],
      }),
    },
  );

  assert.equal(response.status, 401);
});

test("iam policy audit API records only fixed keys and audit counts", async () => {
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
    `${origin}/api/labs/infrastructure/iam-policy-audit/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: iamPolicyAuditScenarioKey,
        decisions: [
          "accept-wildcard-admin-policy",
          "approve-overbroad-policy-grant",
        ],
        accountId: "123456789012",
        roleArn: "arn:aws:iam::123456789012:role/RealAdmin",
        accessKeyId: "AKIAREALKEYVALUE",
        region: "us-east-1",
        policyDocument: '{"Effect":"Allow","Action":"*"}',
      }),
    },
  );
  const blockedResponse = await fetch(
    `${origin}/api/labs/infrastructure/iam-policy-audit/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: "enumerate-real-cloud-roles",
        decisions: ["attach-real-admin-policy"],
      }),
    },
  );

  assert.equal(response.status, 200);
  assert.equal(blockedResponse.status, 403);
  assert.equal(eventCalls.length, 2);

  const serialized = JSON.stringify(eventCalls);
  assert.equal(serialized.includes("fixed-cloud-iam-policy-audit"), true);
  assert.equal(serialized.includes("virtual-admin-wildcard-policy"), true);
  assert.equal(serialized.includes("123456789012"), false);
  assert.equal(serialized.includes("arn:aws:iam"), false);
  assert.equal(serialized.includes("AKIAREALKEYVALUE"), false);
  assert.equal(serialized.includes("us-east-1"), false);
  assert.equal(serialized.includes('"Action":"*"'), false);
  assert.equal(serialized.includes("enumerate-real-cloud-roles"), false);
  assert.equal(serialized.includes("attach-real-admin-policy"), false);
});

test("iam policy audit API returns 403 for the defense path", async () => {
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
    `${origin}/api/labs/infrastructure/iam-policy-audit/fixed/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: iamPolicyAuditScenarioKey,
        decisions: [
          "scope-policy-to-least-privilege",
          "block-overbroad-policy-grant",
        ],
      }),
    },
  );

  assert.equal(response.status, 403);
});

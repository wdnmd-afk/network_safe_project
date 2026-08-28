import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import {
  assessFixedRbacBinding,
  createKubernetesRbacAuditLabService,
  fixedRbacBindingSnapshots,
  kubernetesRbacAuditDefenseSignal,
  kubernetesRbacAuditNormalSignal,
  kubernetesRbacAuditRiskSignal,
  kubernetesRbacAuditScenarioKey,
} from "../src/services/kubernetes-rbac-audit-lab.js";
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

test("fixed rbac binding snapshots are frozen and expose locked audit counts", () => {
  assert.equal(Object.isFrozen(fixedRbacBindingSnapshots), true);
  assert.equal(Object.isFrozen(fixedRbacBindingSnapshots[0]), true);
  assert.deepEqual(fixedRbacBindingSnapshots.map(assessFixedRbacBinding), [
    {
      bindingKey: "virtual-cluster-admin-broad-binding",
      expectedPosture: "vulnerable",
      findingCount: 4,
      criticalFindingCount: 3,
      leastPrivilegeControlCount: 0,
    },
    {
      bindingKey: "virtual-namespaced-readonly-binding",
      expectedPosture: "hardened",
      findingCount: 0,
      criticalFindingCount: 0,
      leastPrivilegeControlCount: 5,
    },
  ]);
});

test("kubernetes rbac audit accepts the fixed overbroad binding risk path", () => {
  const result = createKubernetesRbacAuditLabService().evaluate({
    variantKey: "vuln",
    scenarioKey: kubernetesRbacAuditScenarioKey,
    decisions: ["accept-cluster-admin-binding", "approve-overbroad-binding"],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, kubernetesRbacAuditRiskSignal);
  assert.equal(result.recap.terminalOutcome, "risk");
  assert.equal(result.bindingAssessment?.criticalFindingCount, 3);
  assert.equal(result.bindingDecision?.disposition, "overbroad-binding-approved");
});

test("kubernetes rbac audit blocks the overbroad binding on the defense path", () => {
  const result = createKubernetesRbacAuditLabService().evaluate({
    variantKey: "fixed",
    scenarioKey: kubernetesRbacAuditScenarioKey,
    decisions: ["scope-binding-to-namespace", "block-overbroad-binding"],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, kubernetesRbacAuditDefenseSignal);
  assert.equal(result.recap.terminalOutcome, "fix");
  assert.equal(result.bindingAssessment?.leastPrivilegeControlCount, 5);
  assert.equal(result.blockedReason, "overbroad-binding-blocked");
});

test("kubernetes rbac audit verifies the namespaced normal baseline", () => {
  const result = createKubernetesRbacAuditLabService().evaluate({
    variantKey: "fixed",
    scenarioKey: kubernetesRbacAuditScenarioKey,
    decisions: ["scope-binding-to-namespace", "verify-namespaced-baseline"],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, kubernetesRbacAuditNormalSignal);
  assert.equal(result.recap.terminalOutcome, "normal");
  assert.equal(
    result.bindingDecision?.disposition,
    "namespaced-baseline-verified",
  );
});

test("kubernetes rbac audit blocks unknown and incomplete paths without echo", () => {
  const service = createKubernetesRbacAuditLabService();
  const rawScenario = "enumerate-real-cluster-roles";
  const rawOption = "bind-real-cluster-admin";
  const unknownScenario = service.evaluate({
    variantKey: "vuln",
    scenarioKey: rawScenario,
    decisions: ["accept-cluster-admin-binding"],
  });
  const unknownOption = service.evaluate({
    variantKey: "vuln",
    scenarioKey: kubernetesRbacAuditScenarioKey,
    decisions: [rawOption],
  });
  const incomplete = service.evaluate({
    variantKey: "vuln",
    scenarioKey: kubernetesRbacAuditScenarioKey,
    decisions: ["accept-cluster-admin-binding"],
  });
  const trailing = service.evaluate({
    variantKey: "vuln",
    scenarioKey: kubernetesRbacAuditScenarioKey,
    decisions: [
      "accept-cluster-admin-binding",
      "approve-overbroad-binding",
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

test("kubernetes rbac audit workbench API exposes only fixed bindings", async () => {
  const origin = await listen(createApp());
  const response = await fetch(
    `${origin}/api/labs/infrastructure/kubernetes-rbac-audit/workbench`,
  );
  const body = (await response.json()) as {
    status: string;
    workbench: {
      id: string;
      defaultScenarioKey: string;
      bindingSnapshots: Array<{ bindingKey: string; roleScope: string }>;
      bindingAssessments: unknown[];
    };
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.workbench.id, "infrastructure.kubernetes-rbac-audit");
  assert.equal(
    body.workbench.defaultScenarioKey,
    kubernetesRbacAuditScenarioKey,
  );
  assert.equal(body.workbench.bindingSnapshots.length, 2);
  assert.equal(body.workbench.bindingAssessments.length, 2);
  assert.ok(
    body.workbench.bindingSnapshots.every((binding) =>
      binding.bindingKey.startsWith("virtual-"),
    ),
  );
  // 作用域只允许固定语义枚举，不得出现真实集群命名空间名
  assert.ok(
    body.workbench.bindingSnapshots.every(
      (binding) =>
        binding.roleScope === "cluster-wide" ||
        binding.roleScope === "namespace-scoped",
    ),
  );
});

test("kubernetes rbac audit evaluate API requires login", async () => {
  const origin = await listen(createApp());
  const response = await fetch(
    `${origin}/api/labs/infrastructure/kubernetes-rbac-audit/vuln/evaluate`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioKey: kubernetesRbacAuditScenarioKey,
        decisions: [
          "accept-cluster-admin-binding",
          "approve-overbroad-binding",
        ],
      }),
    },
  );

  assert.equal(response.status, 401);
});

test("kubernetes rbac audit API records only fixed keys and audit counts", async () => {
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
    `${origin}/api/labs/infrastructure/kubernetes-rbac-audit/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: kubernetesRbacAuditScenarioKey,
        decisions: [
          "accept-cluster-admin-binding",
          "approve-overbroad-binding",
        ],
        kubeconfig: "/home/real-user/.kube/config",
        clusterEndpoint: "https://real-cluster.example.internal:6443",
        serviceAccountToken: "eyJhbGciOiJSUzI1NiJ9.realtokenvalue",
        namespace: "production-payments",
        roleYaml: "kind: ClusterRole\nrules:\n  - verbs: ['*']",
      }),
    },
  );
  const blockedResponse = await fetch(
    `${origin}/api/labs/infrastructure/kubernetes-rbac-audit/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: "enumerate-real-cluster-roles",
        decisions: ["bind-real-cluster-admin"],
      }),
    },
  );

  assert.equal(response.status, 200);
  assert.equal(blockedResponse.status, 403);
  assert.equal(eventCalls.length, 2);

  const serialized = JSON.stringify(eventCalls);
  assert.equal(serialized.includes("fixed-kubernetes-rbac-audit"), true);
  assert.equal(serialized.includes("virtual-cluster-admin-broad-binding"), true);
  assert.equal(serialized.includes(".kube/config"), false);
  assert.equal(serialized.includes("real-cluster.example.internal"), false);
  assert.equal(serialized.includes("realtokenvalue"), false);
  assert.equal(serialized.includes("production-payments"), false);
  assert.equal(serialized.includes("ClusterRole"), false);
  assert.equal(serialized.includes("enumerate-real-cluster-roles"), false);
  assert.equal(serialized.includes("bind-real-cluster-admin"), false);
});

test("kubernetes rbac audit API returns 403 for the defense path", async () => {
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
    `${origin}/api/labs/infrastructure/kubernetes-rbac-audit/fixed/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: kubernetesRbacAuditScenarioKey,
        decisions: ["scope-binding-to-namespace", "block-overbroad-binding"],
      }),
    },
  );

  assert.equal(response.status, 403);
});

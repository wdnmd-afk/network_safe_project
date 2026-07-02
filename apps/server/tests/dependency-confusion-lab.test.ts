import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";
import {
  createDependencyConfusionLabService,
  dependencyConfusionDefaultManifestKey,
  dependencyConfusionDefaultRegistryScenarioKey,
  dependencyConfusionDefaultResolutionPolicyKey,
  type DependencyConfusionResult,
} from "../src/services/dependency-confusion-lab.js";

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

test("dependency confusion service exposes vulnerable public source selection", async () => {
  const service = createDependencyConfusionLabService();

  const result = await service.resolveDependency({
    userId: "1",
    variantKey: "vuln",
    manifestKey: dependencyConfusionDefaultManifestKey,
    registryScenarioKey: dependencyConfusionDefaultRegistryScenarioKey,
    resolutionPolicyKey: dependencyConfusionDefaultResolutionPolicyKey,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "dependency-confusion-public-source-selected");
  assert.equal(result.decision, "accepted");
  assert.equal(result.resolution.resolvedSource, "public-registry");
  assert.equal(result.resolution.sourceTrust, "untrusted");
  assert.equal(result.resolution.packageScopeStatus, "missing");
  assert.deepEqual(result.resolution.auditActions, ["audit-missing"]);
  assert.equal(JSON.stringify(result).includes("registry.npmjs"), false);
  assert.equal(JSON.stringify(result).includes(".npmrc"), false);
  assert.equal(JSON.stringify(result).includes("package.json"), false);
});

test("dependency confusion service pins private scope in fixed variant", async () => {
  const service = createDependencyConfusionLabService();

  const result = await service.resolveDependency({
    userId: "1",
    variantKey: "fixed",
    manifestKey: "scoped-private-package",
    registryScenarioKey: "private-scope-pinned",
    resolutionPolicyKey: "scope-pinned-private",
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "dependency-confusion-private-scope-pinned");
  assert.equal(result.decision, "accepted");
  assert.equal(result.resolution.resolvedSource, "private-registry");
  assert.equal(result.resolution.sourceTrust, "trusted");
  assert.deepEqual(result.resolution.auditActions, [
    "scope-registry-bound",
    "source-audited",
  ]);
});

test("dependency confusion service blocks lockfile integrity mismatch", async () => {
  const service = createDependencyConfusionLabService();

  const result = await service.resolveDependency({
    userId: "1",
    variantKey: "fixed",
    manifestKey: "mixed-source-review",
    registryScenarioKey: "lockfile-integrity-mismatch",
    resolutionPolicyKey: "lockfile-integrity-audit",
  });

  assert.equal(result.status, "blocked");
  assert.equal(
    result.signal,
    "dependency-confusion-lockfile-integrity-blocked",
  );
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "lockfile-integrity-mismatch");
  assert.equal(result.resolution.resolvedSource, "blocked-audit");
  assert.equal(result.resolution.lockfileStatus, "mismatch");
  assert.ok(result.resolution.auditActions.includes("resolution-blocked"));
});

test("dependency confusion service keeps audited public dependency available", async () => {
  const service = createDependencyConfusionLabService();

  const result = await service.resolveDependency({
    userId: "1",
    variantKey: "fixed",
    manifestKey: "mixed-source-review",
    registryScenarioKey: "private-scope-pinned",
    resolutionPolicyKey: "scope-pinned-private",
  });

  assert.equal(result.status, "ok");
  assert.equal(
    result.signal,
    "dependency-confusion-safe-public-package-accepted",
  );
  assert.equal(result.decision, "accepted");
  assert.equal(result.resolution.resolvedSource, "mixed-audited");
  assert.equal(result.resolution.sourceTrust, "audited");
});

test("dependency confusion service rejects unknown key without echoing raw input", async () => {
  const service = createDependencyConfusionLabService();
  const rawManifestKey = "real-internal-package-name-should-not-appear";

  const result = await service.resolveDependency({
    userId: "1",
    variantKey: "vuln",
    manifestKey: rawManifestKey,
    registryScenarioKey: dependencyConfusionDefaultRegistryScenarioKey,
    resolutionPolicyKey: dependencyConfusionDefaultResolutionPolicyKey,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "dependency-confusion-boundary-verified");
  assert.equal(result.decision, "blocked");
  assert.equal(result.manifestKey, "blocked-manifest");
  assert.equal(result.blockedReason, "manifest-not-allowed");
  assert.equal(JSON.stringify(result).includes(rawManifestKey), false);
});

test("POST /api/labs/supply-chain/dependency-confusion/:variant/resolve requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/supply-chain/dependency-confusion/vuln/resolve`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        manifestKey: dependencyConfusionDefaultManifestKey,
        registryScenarioKey: dependencyConfusionDefaultRegistryScenarioKey,
        resolutionPolicyKey: dependencyConfusionDefaultResolutionPolicyKey,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    message: string;
  };

  assert.equal(response.status, 401);
  assert.deepEqual(body, {
    status: "error",
    message: "missing session token",
  });
});

test("POST /api/labs/supply-chain/dependency-confusion/vuln/resolve records safe summary", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => {
        labEventLogCalls.push(input);

        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: "24",
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/supply-chain/dependency-confusion/vuln/resolve`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
        "x-lab-trace-id": "trace-dependency-confusion-vuln",
      },
      body: JSON.stringify({
        manifestKey: dependencyConfusionDefaultManifestKey,
        registryScenarioKey: dependencyConfusionDefaultRegistryScenarioKey,
        resolutionPolicyKey: dependencyConfusionDefaultResolutionPolicyKey,
        packageName: "real-internal-package-should-not-appear",
        registryUrl: "https://registry.npmjs.example/should-not-appear",
        npmrc: "//registry/:_authToken=secret-should-not-appear",
        token: "secret-token-should-not-appear",
        lockfile: "real-lockfile-content-should-not-appear",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: DependencyConfusionResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(
    body.result.signal,
    "dependency-confusion-public-source-selected",
  );
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-dependency-confusion-vuln",
      userId: "1",
      labKey: "supply-chain.dependency-confusion",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/supply-chain/dependency-confusion/vuln/resolve",
      inputSummary: {
        manifestKey: "unscoped-internal-name",
        registryScenarioKey: "public-name-collision",
        resolutionPolicyKey: "prefer-public-latest",
        resolvedSource: "public-registry",
        sourceTrust: "untrusted",
        packageScopeStatus: "missing",
        lockfileStatus: "missing",
        matchedControlledSample: true,
        riskIndicatorCount: 4,
        riskIndicators: [
          "private-scope-missing",
          "lockfile-missing",
          "public-name-collision",
          "source-not-audited",
        ],
        auditActions: ["audit-missing"],
        recommendedAction:
          "切换到修复版，补齐 scope 绑定、来源审计和 lockfile 校验。",
        signal: "dependency-confusion-public-source-selected",
      },
      decision: "accepted",
      signal: "dependency-confusion-public-source-selected",
      statusCode: 200,
      message: body.result.message,
      riskLevel: "high",
    },
  ]);
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes(
      "real-internal-package-should-not-appear",
    ),
    false,
  );
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes(
      "secret-token-should-not-appear",
    ),
    false,
  );
});

test("POST /api/labs/supply-chain/dependency-confusion/fixed/resolve blocks integrity mismatch", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => {
        labEventLogCalls.push(input);

        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: "24",
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/supply-chain/dependency-confusion/fixed/resolve`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        manifestKey: "mixed-source-review",
        registryScenarioKey: "lockfile-integrity-mismatch",
        resolutionPolicyKey: "lockfile-integrity-audit",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: DependencyConfusionResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(
    body.result.signal,
    "dependency-confusion-lockfile-integrity-blocked",
  );
  assert.deepEqual(labEventLogCalls[0], {
    traceId: undefined,
    userId: "1",
    labKey: "supply-chain.dependency-confusion",
    variantKey: "fixed",
    phase: "defense",
    eventType: "blocked",
    actorPerspective: "attacker",
    method: "POST",
    path: "/api/labs/supply-chain/dependency-confusion/fixed/resolve",
    inputSummary: {
      manifestKey: "mixed-source-review",
      registryScenarioKey: "lockfile-integrity-mismatch",
      resolutionPolicyKey: "lockfile-integrity-audit",
      resolvedSource: "blocked-audit",
      sourceTrust: "blocked",
      packageScopeStatus: "mixed-audited",
      lockfileStatus: "mismatch",
      matchedControlledSample: true,
      riskIndicatorCount: 1,
      riskIndicators: ["integrity-mismatch"],
      auditActions: [
        "scope-registry-bound",
        "source-audited",
        "lockfile-integrity-checked",
        "resolution-blocked",
      ],
      recommendedAction: "停止当前解析并复核固定来源、scope 和完整性摘要。",
      signal: "dependency-confusion-lockfile-integrity-blocked",
    },
    decision: "blocked",
    signal: "dependency-confusion-lockfile-integrity-blocked",
    statusCode: 403,
    message: body.result.message,
    riskLevel: "high",
  });
});

test("POST /api/labs/supply-chain/dependency-confusion/fixed/resolve returns safe public dependency", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => ({
        traceId: input.traceId ?? "generated-trace",
        persisted: true,
        labId: "24",
      }),
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/supply-chain/dependency-confusion/fixed/resolve`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        manifestKey: "mixed-source-review",
        registryScenarioKey: "private-scope-pinned",
        resolutionPolicyKey: "scope-pinned-private",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: DependencyConfusionResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(
    body.result.signal,
    "dependency-confusion-safe-public-package-accepted",
  );
  assert.equal(body.result.resolution.resolvedSource, "mixed-audited");
});

import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";
import {
  createMisconfigurationLabService,
  misconfigurationDefaultAuditPolicyKey,
  misconfigurationDefaultConfigCaseKey,
  type MisconfigurationResult,
} from "../src/services/misconfiguration-lab.js";

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

test("misconfiguration service exposes debug surface in vulnerable variant", async () => {
  const service = createMisconfigurationLabService();

  const result = await service.auditConfig({
    userId: "1",
    variantKey: "vuln",
    configCaseKey: misconfigurationDefaultConfigCaseKey,
    auditPolicyKey: misconfigurationDefaultAuditPolicyKey,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "misconfiguration-debug-surface-visible");
  assert.equal(result.decision, "accepted");
  assert.equal(result.audit.exposureCategory, "debug-surface");
  assert.equal(result.audit.exposureState, "visible");
  assert.equal(result.audit.riskIndicatorCount, 1);
  assert.deepEqual(result.audit.riskIndicators, ["debug-surface-visible"]);
  assert.deepEqual(result.audit.auditActions, ["audit-missing"]);
  assert.equal(JSON.stringify(result).includes(".env"), false);
  assert.equal(JSON.stringify(result).includes("nginx.conf"), false);
  assert.equal(JSON.stringify(result).includes("127.0.0.1"), false);
});

test("misconfiguration service restricts broad CORS in fixed variant", async () => {
  const service = createMisconfigurationLabService();

  const result = await service.auditConfig({
    userId: "1",
    variantKey: "fixed",
    configCaseKey: "wildcard-cors-with-credentials",
    auditPolicyKey: "strict-cors-audit",
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "misconfiguration-cors-policy-restricted");
  assert.equal(result.decision, "accepted");
  assert.equal(result.audit.exposureCategory, "cross-origin-trust");
  assert.equal(result.audit.corsPolicyStatus, "restricted");
  assert.equal(result.audit.riskIndicatorCount, 0);
  assert.deepEqual(result.audit.auditActions, [
    "cors-policy-restricted",
    "exposure-reduced",
  ]);
});

test("misconfiguration service blocks public admin status in fixed variant", async () => {
  const service = createMisconfigurationLabService();

  const result = await service.auditConfig({
    userId: "1",
    variantKey: "fixed",
    configCaseKey: "public-admin-status",
    auditPolicyKey: "authenticated-admin-only",
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "misconfiguration-auth-required");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "authentication-required");
  assert.equal(result.audit.authRequired, true);
  assert.deepEqual(result.audit.auditActions, [
    "admin-auth-required",
    "exposure-reduced",
  ]);
});

test("misconfiguration service rejects unknown key without echoing raw input", async () => {
  const service = createMisconfigurationLabService();
  const rawConfigCase = "real-host-10.0.0.5-nginx-conf-should-not-appear";

  const result = await service.auditConfig({
    userId: "1",
    variantKey: "vuln",
    configCaseKey: rawConfigCase,
    auditPolicyKey: misconfigurationDefaultAuditPolicyKey,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "misconfiguration-boundary-verified");
  assert.equal(result.decision, "blocked");
  assert.equal(result.configCaseKey, "blocked-config-case");
  assert.equal(result.blockedReason, "config-case-not-allowed");
  assert.equal(JSON.stringify(result).includes(rawConfigCase), false);
});

test("POST /api/labs/infrastructure/misconfiguration/:variant/audit requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/infrastructure/misconfiguration/vuln/audit`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        configCaseKey: misconfigurationDefaultConfigCaseKey,
        auditPolicyKey: misconfigurationDefaultAuditPolicyKey,
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

test("POST /api/labs/infrastructure/misconfiguration/vuln/audit records safe summary", async () => {
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
          labId: "25",
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/infrastructure/misconfiguration/vuln/audit`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
        "x-lab-trace-id": "trace-misconfiguration-vuln",
      },
      body: JSON.stringify({
        configCaseKey: misconfigurationDefaultConfigCaseKey,
        auditPolicyKey: misconfigurationDefaultAuditPolicyKey,
        host: "real-host-should-not-appear",
        port: 8080,
        path: "C:/secret/config/should-not-appear",
        nginxConfig: "server_name should-not-appear.example",
        token: "secret-token-should-not-appear",
        cookie: "session=secret-cookie-should-not-appear",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: MisconfigurationResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "misconfiguration-debug-surface-visible");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-misconfiguration-vuln",
      userId: "1",
      labKey: "infrastructure.misconfiguration",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/infrastructure/misconfiguration/vuln/audit",
      inputSummary: {
        configCaseKey: "debug-console-exposed",
        auditPolicyKey: "exposure-review",
        exposureCategory: "debug-surface",
        exposureState: "visible",
        authRequired: false,
        corsPolicyStatus: "not-applicable",
        errorReportingStatus: "not-applicable",
        matchedControlledSample: true,
        riskIndicatorCount: 1,
        riskIndicators: ["debug-surface-visible"],
        auditActions: ["audit-missing"],
        signal: "misconfiguration-debug-surface-visible",
      },
      decision: "accepted",
      signal: "misconfiguration-debug-surface-visible",
      statusCode: 200,
      message: body.result.message,
      riskLevel: "high",
    },
  ]);
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes(
      "real-host-should-not-appear",
    ),
    false,
  );
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes(
      "secret-token-should-not-appear",
    ),
    false,
  );
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes(
      "should-not-appear.example",
    ),
    false,
  );
});

test("POST /api/labs/infrastructure/misconfiguration/fixed/audit blocks public admin status", async () => {
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
          labId: "25",
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/infrastructure/misconfiguration/fixed/audit`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        configCaseKey: "public-admin-status",
        auditPolicyKey: "authenticated-admin-only",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: MisconfigurationResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(body.result.signal, "misconfiguration-auth-required");
  assert.deepEqual(labEventLogCalls[0], {
    traceId: undefined,
    userId: "1",
    labKey: "infrastructure.misconfiguration",
    variantKey: "fixed",
    phase: "defense",
    eventType: "blocked",
    actorPerspective: "attacker",
    method: "POST",
    path: "/api/labs/infrastructure/misconfiguration/fixed/audit",
    inputSummary: {
      configCaseKey: "public-admin-status",
      auditPolicyKey: "authenticated-admin-only",
      exposureCategory: "admin-status",
      exposureState: "blocked",
      authRequired: true,
      corsPolicyStatus: "not-applicable",
      errorReportingStatus: "not-applicable",
      matchedControlledSample: true,
      riskIndicatorCount: 0,
      riskIndicators: [],
      auditActions: ["admin-auth-required", "exposure-reduced"],
      signal: "misconfiguration-auth-required",
    },
    decision: "blocked",
    signal: "misconfiguration-auth-required",
    statusCode: 403,
    message: body.result.message,
    riskLevel: "medium",
  });
});

test("POST /api/labs/infrastructure/misconfiguration/fixed/audit returns safe error reporting", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => ({
        traceId: input.traceId ?? "generated-trace",
        persisted: true,
        labId: "25",
      }),
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/infrastructure/misconfiguration/fixed/audit`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        configCaseKey: "verbose-error-detail",
        auditPolicyKey: "safe-error-reporting",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: MisconfigurationResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "misconfiguration-safe-error-reporting");
  assert.equal(body.result.audit.errorReportingStatus, "safe");
  assert.deepEqual(body.result.audit.auditActions, [
    "safe-error-reporting",
    "exposure-reduced",
  ]);
});

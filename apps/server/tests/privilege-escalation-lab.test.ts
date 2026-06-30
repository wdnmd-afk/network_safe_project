import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";
import {
  createPrivilegeEscalationLabService,
  type PrivilegeEscalationResult,
} from "../src/services/privilege-escalation-lab.js";

const demoUser = {
  id: "1",
  username: "demo_user",
  displayName: "演示用户",
  role: "member",
  status: "active",
};

const privilegeEscalationLabService = createPrivilegeEscalationLabService();
const privilegeSamples = privilegeEscalationLabService.getSamples();

async function listen(app: ReturnType<typeof createApp>) {
  const server = app.listen(0);
  const address = server.address();

  assert.ok(address && typeof address === "object");

  after(() => {
    server.close();
  });

  return `http://127.0.0.1:${address.port}`;
}

test("privilege escalation service accepts normal member operation in both variants", async () => {
  const vulnerableResult = await privilegeEscalationLabService.executeOperation({
    userId: "1",
    currentUserRole: "member",
    variantKey: "vuln",
    operationKey: privilegeSamples.normalOperationKey,
    requestedRole: privilegeSamples.normalRequestedRole,
  });
  const fixedResult = await privilegeEscalationLabService.executeOperation({
    userId: "1",
    currentUserRole: "member",
    variantKey: "fixed",
    operationKey: privilegeSamples.normalOperationKey,
    requestedRole: privilegeSamples.normalRequestedRole,
  });

  assert.equal(vulnerableResult.status, "ok");
  assert.equal(
    vulnerableResult.signal,
    "privilege-normal-operation-accepted",
  );
  assert.equal(vulnerableResult.inspection.roleAllowed, true);
  assert.equal(fixedResult.status, "ok");
  assert.equal(fixedResult.signal, "privilege-normal-operation-accepted");
});

test("privilege escalation service accepts client admin role in the vulnerable variant", async () => {
  const result = await privilegeEscalationLabService.executeOperation({
    userId: "1",
    currentUserRole: "member",
    variantKey: "vuln",
    operationKey: privilegeSamples.adminOperationKey,
    requestedRole: privilegeSamples.attackRequestedRole,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "privilege-client-role-admin-accepted");
  assert.equal(result.decision, "accepted");
  assert.equal(result.inspection.currentUserRole, "member");
  assert.equal(result.inspection.effectiveRole, "admin");
  assert.equal(result.inspection.trustedClientRole, true);
  assert.equal(result.operation?.requiredRole, "admin");
});

test("privilege escalation service blocks client admin role in the fixed variant", async () => {
  const result = await privilegeEscalationLabService.executeOperation({
    userId: "1",
    currentUserRole: "member",
    variantKey: "fixed",
    operationKey: privilegeSamples.adminOperationKey,
    requestedRole: privilegeSamples.attackRequestedRole,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "privilege-client-role-admin-blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "server-role-not-allowed");
  assert.equal(result.operation, null);
});

test("POST /api/labs/auth/privilege-escalation/:variant/execute requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/auth/privilege-escalation/vuln/execute`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        operationKey: privilegeSamples.normalOperationKey,
        requestedRole: privilegeSamples.normalRequestedRole,
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

test("POST /api/labs/auth/privilege-escalation/vuln/execute records client role event logs", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    privilegeEscalationLabService: {
      getSamples: () => privilegeSamples,
      executeOperation: async (): Promise<PrivilegeEscalationResult> => ({
        status: "ok",
        variantKey: "vuln",
        operationKey: privilegeSamples.adminOperationKey,
        requestedRole: privilegeSamples.attackRequestedRole,
        operation: {
          key: privilegeSamples.adminOperationKey,
          title: "审批高风险退款",
          requiredRole: "admin",
          resultSummary: "virtual refund approved",
        },
        inspection: {
          operationKeyLength: privilegeSamples.adminOperationKey.length,
          requestedRole: "admin",
          currentUserRole: "member",
          effectiveRole: "admin",
          trustedClientRole: true,
          privilegedOperation: true,
          roleAllowed: true,
        },
        signal: "privilege-client-role-admin-accepted",
        decision: "accepted",
        message: "client admin role accepted",
        nextStep: "compare fixed variant",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => {
        labEventLogCalls.push(input);

        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: "10",
        };
      },
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/auth/privilege-escalation/vuln/execute`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
        "x-lab-trace-id": "trace-privilege-vuln",
      },
      body: JSON.stringify({
        operationKey: privilegeSamples.adminOperationKey,
        requestedRole: privilegeSamples.attackRequestedRole,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: PrivilegeEscalationResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "privilege-client-role-admin-accepted");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-privilege-vuln",
      userId: "1",
      labKey: "auth.privilege-escalation",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/auth/privilege-escalation/vuln/execute",
      inputSummary: {
        operationKeyLength: privilegeSamples.adminOperationKey.length,
        operationKeyPreview: "controlled-admin-operation",
        requestedRole: "admin",
        currentUserRole: "member",
        effectiveRole: "admin",
        trustedClientRole: true,
        privilegedOperation: true,
        roleAllowed: true,
        signal: "privilege-client-role-admin-accepted",
      },
      decision: "accepted",
      signal: "privilege-client-role-admin-accepted",
      statusCode: 200,
      message: "client admin role accepted",
      riskLevel: "critical",
    },
  ]);
});

test("POST /api/labs/auth/privilege-escalation/fixed/execute returns blocked response", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    privilegeEscalationLabService: {
      getSamples: () => privilegeSamples,
      executeOperation: async (): Promise<PrivilegeEscalationResult> => ({
        status: "blocked",
        variantKey: "fixed",
        operationKey: privilegeSamples.adminOperationKey,
        requestedRole: privilegeSamples.attackRequestedRole,
        operation: null,
        inspection: {
          operationKeyLength: privilegeSamples.adminOperationKey.length,
          requestedRole: "admin",
          currentUserRole: "member",
          effectiveRole: "member",
          trustedClientRole: false,
          privilegedOperation: true,
          roleAllowed: false,
        },
        signal: "privilege-client-role-admin-blocked",
        decision: "blocked",
        message: "fixed variant blocked client admin role",
        nextStep: "review server-side role source",
        blockedReason: "server-role-not-allowed",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => ({
        traceId: input.traceId ?? "generated-trace",
        persisted: true,
        labId: "10",
      }),
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/auth/privilege-escalation/fixed/execute`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        operationKey: privilegeSamples.adminOperationKey,
        requestedRole: privilegeSamples.attackRequestedRole,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: PrivilegeEscalationResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(body.result.signal, "privilege-client-role-admin-blocked");
});

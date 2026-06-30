import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";
import {
  createPortScanLabService,
  portScanDefaultProfile,
  portScanDefaultTargetKey,
  type PortScanResult,
} from "../src/services/port-scan-lab.js";

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

test("port scan service exposes management surface in vulnerable variant", async () => {
  const service = createPortScanLabService();

  const result = await service.observeExposure({
    userId: "1",
    variantKey: "vuln",
    targetKey: portScanDefaultTargetKey,
    scanProfile: portScanDefaultProfile,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "port-scan-management-surface-visible");
  assert.equal(result.decision, "accepted");
  assert.equal(result.summary.highRiskPortCount > 0, true);
  assert.equal(
    result.ports.some((port) => port.serviceLabel === "数据库服务"),
    true,
  );
  assert.equal(JSON.stringify(result).includes("127.0.0.1"), false);
  assert.equal(JSON.stringify(result).includes("banner"), false);
});

test("port scan service reduces surface in fixed variant", async () => {
  const service = createPortScanLabService();

  const result = await service.observeExposure({
    userId: "1",
    variantKey: "fixed",
    targetKey: portScanDefaultTargetKey,
    scanProfile: portScanDefaultProfile,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "port-scan-surface-reduced");
  assert.equal(result.decision, "accepted");
  assert.equal(result.summary.openPortCount, 0);
  assert.equal(
    result.ports.every((port) => port.exposure !== "public"),
    true,
  );
});

test("port scan service blocks unknown targets without echoing raw input", async () => {
  const service = createPortScanLabService();
  const rawTarget = "203.0.113.10";

  const result = await service.observeExposure({
    userId: "1",
    variantKey: "vuln",
    targetKey: rawTarget,
    scanProfile: portScanDefaultProfile,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "port-scan-target-blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "target-not-allowed");
  assert.equal(result.targetKey, "blocked-target");
  assert.equal(JSON.stringify(result).includes(rawTarget), false);
});

test("POST /api/labs/network/port-scan/:variant/scan requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/network/port-scan/vuln/scan`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        targetKey: portScanDefaultTargetKey,
        scanProfile: portScanDefaultProfile,
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

test("POST /api/labs/network/port-scan/vuln/scan records safe virtual summary", async () => {
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
          labId: "20",
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/network/port-scan/vuln/scan`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
        "x-lab-trace-id": "trace-port-scan-vuln",
      },
      body: JSON.stringify({
        targetKey: portScanDefaultTargetKey,
        scanProfile: portScanDefaultProfile,
        host: "203.0.113.10",
        portRange: "1-65535",
        concurrency: 200,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: PortScanResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "port-scan-management-surface-visible");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-port-scan-vuln",
      userId: "1",
      labKey: "network.port-scan",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/network/port-scan/vuln/scan",
      inputSummary: {
        targetKey: "admin-node",
        scanProfile: "surface-review",
        virtualPortCount: 4,
        openPortCount: 4,
        restrictedPortCount: 0,
        highRiskPortCount: 3,
        exposureScore: 155,
        matchedControlledSample: true,
        signal: "port-scan-management-surface-visible",
      },
      decision: "accepted",
      signal: "port-scan-management-surface-visible",
      statusCode: 200,
      message: body.result.message,
      riskLevel: "high",
    },
  ]);
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes("203.0.113.10"),
    false,
  );
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes("1-65535"),
    false,
  );
});

test("POST /api/labs/network/port-scan/fixed/scan returns reduced surface", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => ({
        traceId: input.traceId ?? "generated-trace",
        persisted: true,
        labId: "20",
      }),
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/network/port-scan/fixed/scan`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        targetKey: portScanDefaultTargetKey,
        scanProfile: portScanDefaultProfile,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: PortScanResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "port-scan-surface-reduced");
  assert.equal(body.result.summary.openPortCount, 0);
});

test("POST /api/labs/network/port-scan/vuln/scan blocks unknown target safely", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const rawTarget = "203.0.113.10";
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
          labId: "20",
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/network/port-scan/vuln/scan`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        targetKey: rawTarget,
        scanProfile: portScanDefaultProfile,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: PortScanResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(body.result.targetKey, "blocked-target");
  assert.equal(body.result.signal, "port-scan-target-blocked");
  assert.equal(JSON.stringify(body).includes(rawTarget), false);
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes(rawTarget),
    false,
  );
  assert.deepEqual(labEventLogCalls[0], {
    traceId: undefined,
    userId: "1",
    labKey: "network.port-scan",
    variantKey: "vuln",
    phase: "defense",
    eventType: "blocked",
    actorPerspective: "attacker",
    method: "POST",
    path: "/api/labs/network/port-scan/vuln/scan",
    inputSummary: {
      targetKey: "blocked-target",
      scanProfile: "surface-review",
      virtualPortCount: 0,
      openPortCount: 0,
      restrictedPortCount: 0,
      highRiskPortCount: 0,
      exposureScore: 0,
      matchedControlledSample: false,
      signal: "port-scan-target-blocked",
    },
    decision: "blocked",
    signal: "port-scan-target-blocked",
    statusCode: 403,
    message: body.result.message,
    riskLevel: "medium",
  });
});

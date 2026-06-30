import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import {
  createIdorLabService,
  type IdorResult,
} from "../src/services/idor-lab.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";

const demoUser = {
  id: "1",
  username: "demo_user",
  displayName: "演示用户",
  role: "member",
  status: "active",
};

const idorLabService = createIdorLabService();
const idorSamples = idorLabService.getSamples();

async function listen(app: ReturnType<typeof createApp>) {
  const server = app.listen(0);
  const address = server.address();

  assert.ok(address && typeof address === "object");

  after(() => {
    server.close();
  });

  return `http://127.0.0.1:${address.port}`;
}

test("idor service accepts the current user's own order in both variants", async () => {
  const vulnerableResult = await idorLabService.readOrder({
    userId: "1",
    variantKey: "vuln",
    orderId: idorSamples.ownOrderId,
  });
  const fixedResult = await idorLabService.readOrder({
    userId: "1",
    variantKey: "fixed",
    orderId: idorSamples.ownOrderId,
  });

  assert.equal(vulnerableResult.status, "ok");
  assert.equal(vulnerableResult.signal, "idor-own-order-accepted");
  assert.equal(vulnerableResult.inspection.ownerMatches, true);
  assert.equal(vulnerableResult.order?.ownerUserId, "1");
  assert.equal(fixedResult.status, "ok");
  assert.equal(fixedResult.signal, "idor-own-order-accepted");
});

test("idor service exposes another user's order in the vulnerable variant", async () => {
  const result = await idorLabService.readOrder({
    userId: "1",
    variantKey: "vuln",
    orderId: idorSamples.otherUserOrderId,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "idor-cross-user-order-exposed");
  assert.equal(result.decision, "accepted");
  assert.equal(result.inspection.crossUserRequested, true);
  assert.equal(result.order?.ownerUserId, "2");
});

test("idor service blocks another user's order in the fixed variant", async () => {
  const result = await idorLabService.readOrder({
    userId: "1",
    variantKey: "fixed",
    orderId: idorSamples.otherUserOrderId,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "idor-cross-user-order-blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "owner-mismatch");
  assert.equal(result.order, null);
});

test("POST /api/labs/auth/idor/:variant/read requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/auth/idor/vuln/read`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      orderId: idorSamples.ownOrderId,
    }),
  });
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

test("POST /api/labs/auth/idor/vuln/read records cross-user order event logs", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    idorLabService: {
      getSamples: () => idorSamples,
      readOrder: async (): Promise<IdorResult> => ({
        status: "ok",
        variantKey: "vuln",
        orderId: idorSamples.otherUserOrderId,
        order: {
          id: idorSamples.otherUserOrderId,
          ownerUserId: "2",
          ownerLabel: "测试账户",
          productName: "Cloud Backup Locker",
          amount: 159,
          status: "shipping",
          contactMasked: "test***02",
          internalNote: "other user controlled teaching order",
        },
        inspection: {
          orderIdLength: idorSamples.otherUserOrderId.length,
          objectType: "order",
          objectFound: true,
          currentUserId: "1",
          ownerUserId: "2",
          ownerMatches: false,
          crossUserRequested: true,
        },
        signal: "idor-cross-user-order-exposed",
        decision: "accepted",
        message: "cross user order exposed",
        nextStep: "compare fixed variant",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => {
        labEventLogCalls.push(input);

        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: "9",
        };
      },
    },
  });
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/auth/idor/vuln/read`, {
    method: "POST",
    headers: {
      authorization: "Bearer local-session-token",
      "content-type": "application/json",
      "x-lab-trace-id": "trace-idor-vuln",
    },
    body: JSON.stringify({
      orderId: idorSamples.otherUserOrderId,
    }),
  });
  const body = (await response.json()) as {
    status: string;
    result: IdorResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "idor-cross-user-order-exposed");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-idor-vuln",
      userId: "1",
      labKey: "auth.idor",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/auth/idor/vuln/read",
      inputSummary: {
        orderIdLength: idorSamples.otherUserOrderId.length,
        orderIdPreview: "controlled-idor-cross-user-order",
        objectType: "order",
        objectFound: true,
        currentUserId: "1",
        ownerUserId: "2",
        ownerMatches: false,
        crossUserRequested: true,
        signal: "idor-cross-user-order-exposed",
      },
      decision: "accepted",
      signal: "idor-cross-user-order-exposed",
      statusCode: 200,
      message: "cross user order exposed",
      riskLevel: "high",
    },
  ]);
});

test("POST /api/labs/auth/idor/fixed/read returns blocked response", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    idorLabService: {
      getSamples: () => idorSamples,
      readOrder: async (): Promise<IdorResult> => ({
        status: "blocked",
        variantKey: "fixed",
        orderId: idorSamples.otherUserOrderId,
        order: null,
        inspection: {
          orderIdLength: idorSamples.otherUserOrderId.length,
          objectType: "order",
          objectFound: true,
          currentUserId: "1",
          ownerUserId: "2",
          ownerMatches: false,
          crossUserRequested: true,
        },
        signal: "idor-cross-user-order-blocked",
        decision: "blocked",
        message: "fixed variant blocked cross user order",
        nextStep: "review owner check",
        blockedReason: "owner-mismatch",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => ({
        traceId: input.traceId ?? "generated-trace",
        persisted: true,
        labId: "9",
      }),
    },
  });
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/auth/idor/fixed/read`, {
    method: "POST",
    headers: {
      authorization: "Bearer local-session-token",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      orderId: idorSamples.otherUserOrderId,
    }),
  });
  const body = (await response.json()) as {
    status: string;
    result: IdorResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(body.result.signal, "idor-cross-user-order-blocked");
});

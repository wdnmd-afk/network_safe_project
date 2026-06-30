import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
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

function createTestApp(labEventLogCalls: LabEventInput[] = []) {
  return createApp({
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
          labId: "2",
        };
      },
    },
  });
}

test("POST /api/labs/web/csrf/vuln/transfer requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/web/csrf/vuln/transfer`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      amount: 200,
      targetAccount: "safe-mart-training",
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

test("POST /api/labs/web/csrf/vuln/transfer accepts the simulated cross-site request without token", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createTestApp(labEventLogCalls);
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/web/csrf/vuln/transfer`, {
    method: "POST",
    headers: {
      authorization: "Bearer local-session-token",
      "content-type": "application/json",
      "x-lab-trace-id": "trace-csrf-vuln",
    },
    body: JSON.stringify({
      amount: 200,
      targetAccount: "safe-mart-training",
    }),
  });
  const body = (await response.json()) as {
    status: string;
    state: {
      balance: number;
      status: string;
      lastSignal: string;
      lastTransfer: {
        variantKey: string;
        amount: number;
        targetAccount: string;
      };
    };
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.state.balance, 4800);
  assert.equal(body.state.status, "transferred");
  assert.equal(body.state.lastSignal, "csrf-transfer-accepted");
  assert.deepEqual(body.state.lastTransfer, {
    variantKey: "vuln",
    amount: 200,
    targetAccount: "safe-mart-training",
  });
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-csrf-vuln",
      userId: "1",
      labKey: "web.csrf",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/web/csrf/vuln/transfer",
      inputSummary: {
        amount: 200,
        targetAccountMasked: "saf***ng",
        hasCsrfToken: false,
      },
      decision: "accepted",
      signal: "csrf-transfer-accepted",
      statusCode: 200,
      message: "漏洞版缺少 CSRF token 仍接受转账请求，攻击模拟成功",
      riskLevel: "high",
    },
  ]);
});

test("POST /api/labs/web/csrf/fixed/transfer blocks a request without csrf token", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createTestApp(labEventLogCalls);
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/web/csrf/fixed/transfer`, {
    method: "POST",
    headers: {
      authorization: "Bearer local-session-token",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      amount: 200,
      targetAccount: "safe-mart-training",
    }),
  });
  const body = (await response.json()) as {
    status: string;
    state: {
      balance: number;
      status: string;
      lastSignal: string;
      lastTransfer: unknown;
    };
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(body.state.balance, 5000);
  assert.equal(body.state.status, "blocked");
  assert.equal(body.state.lastSignal, "csrf-token-required");
  assert.equal(body.state.lastTransfer, null);
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: undefined,
      userId: "1",
      labKey: "web.csrf",
      variantKey: "fixed",
      phase: "defense",
      eventType: "blocked",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/web/csrf/fixed/transfer",
      inputSummary: {
        amount: 200,
        targetAccountMasked: "saf***ng",
        hasCsrfToken: false,
      },
      decision: "blocked",
      signal: "csrf-token-required",
      statusCode: 403,
      message: "修复版要求有效 CSRF token，已阻断跨站转账模拟请求",
      riskLevel: "medium",
    },
  ]);
});

test("POST /api/labs/web/csrf/fixed/token and fixed transfer accept a matching csrf token", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createTestApp(labEventLogCalls);
  const origin = await listen(app);
  const headers = {
    authorization: "Bearer local-session-token",
    "content-type": "application/json",
  };

  const tokenResponse = await fetch(`${origin}/api/labs/web/csrf/fixed/token`, {
    method: "POST",
    headers,
  });
  const tokenBody = (await tokenResponse.json()) as {
    status: string;
    csrfToken: string;
  };

  assert.equal(tokenResponse.status, 200);
  assert.equal(tokenBody.status, "ok");
  assert.equal(typeof tokenBody.csrfToken, "string");
  assert.ok(tokenBody.csrfToken.length > 12);

  const transferResponse = await fetch(`${origin}/api/labs/web/csrf/fixed/transfer`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      amount: 200,
      targetAccount: "safe-mart-training",
      csrfToken: tokenBody.csrfToken,
    }),
  });
  const transferBody = (await transferResponse.json()) as {
    status: string;
    state: {
      balance: number;
      status: string;
      lastSignal: string;
    };
  };

  assert.equal(transferResponse.status, 200);
  assert.equal(transferBody.status, "ok");
  assert.equal(transferBody.state.balance, 4800);
  assert.equal(transferBody.state.status, "transferred");
  assert.equal(transferBody.state.lastSignal, "csrf-token-accepted");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: undefined,
      userId: "1",
      labKey: "web.csrf",
      variantKey: "fixed",
      phase: "normal",
      eventType: "success",
      actorPerspective: "user",
      method: "POST",
      path: "/api/labs/web/csrf/fixed/transfer",
      inputSummary: {
        amount: 200,
        targetAccountMasked: "saf***ng",
        hasCsrfToken: true,
      },
      decision: "accepted",
      signal: "csrf-token-accepted",
      statusCode: 200,
      message: "修复版收到匹配 CSRF token，正常业务请求被接受",
      riskLevel: "low",
    },
  ]);
});

test("GET /api/labs/web/csrf/state returns current user csrf lab state", async () => {
  const app = createTestApp();
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/web/csrf/state`, {
    headers: {
      authorization: "Bearer local-session-token",
    },
  });
  const body = (await response.json()) as {
    status: string;
    state: {
      userId: string;
      balance: number;
      status: string;
      lastSignal: string;
    };
  };

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    status: "ok",
    state: {
      userId: "1",
      balance: 5000,
      status: "idle",
      lastSignal: "none",
      lastTransfer: null,
    },
  });
});

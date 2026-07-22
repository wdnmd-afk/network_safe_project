import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";

const demoUser = {
  id: "1",
  username: "demo_user",
  displayName: "演示用户",
  role: "member",
  status: "active",
};

const xssLab = {
  id: "web.xss",
  slug: "xss",
  title: "XSS",
  category: "web",
  subcategory: "xss",
  severity: "high",
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

test("POST /api/labs/:category/:scene/learning-progress requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/web/xss/learning-progress`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      variantKey: "vuln",
      status: "in-progress",
    }),
  });
  const body = (await response.json()) as {
    status: string;
    message: string;
  };

  assert.equal(response.status, 401);
  assert.equal(body.status, "error");
  assert.equal(body.message, "missing session token");
});

test("POST /api/labs/:category/:scene/learning-progress records current user progress", async () => {
  const calls: unknown[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    labRegistry: {
      listLabs: async () => [xssLab],
      getLab: async () => xssLab,
    },
    labRecordsService: {
      recordLearningProgress: async (input: unknown) => {
        calls.push(input);
        return {
          labKey: "web.xss",
          variantKey: "vuln",
          status: "in-progress",
        };
      },
      recordVerification: async () => {
        throw new Error("recordVerification should not be called");
      },
    },
  } as Parameters<typeof createApp>[0] & {
    labRecordsService: unknown;
  });
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/web/xss/learning-progress`, {
    method: "POST",
    headers: {
      authorization: "Bearer local-session-token",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 XSS 漏洞版",
    }),
  });
  const body = (await response.json()) as {
    status: string;
    progress: {
      labKey: string;
      variantKey: string;
      status: string;
    };
  };

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    status: "ok",
    progress: {
      labKey: "web.xss",
      variantKey: "vuln",
      status: "in-progress",
    },
  });
  assert.deepEqual(calls, [
    {
      userId: "1",
      labKey: "web.xss",
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 XSS 漏洞版",
    },
  ]);
});

test("POST /api/labs/:category/:scene/verification-records records manual verification", async () => {
  const calls: unknown[] = [];
  const eventCalls: unknown[] = [];
  const verificationSummary =
    "修复版原样显示 HTML 字符串，raw-summary-value 不应进入事件日志";
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    labRegistry: {
      listLabs: async () => [xssLab],
      getLab: async () => xssLab,
    },
    labRecordsService: {
      recordLearningProgress: async () => {
        throw new Error("recordLearningProgress should not be called");
      },
      recordVerification: async (input: unknown) => {
        calls.push(input);
        return {
          labKey: "web.xss",
          variantKey: "fixed",
          result: "passed",
        };
      },
    },
    labEventLogsService: {
      recordLabEvent: async (input: unknown) => {
        eventCalls.push(input);

        return {
          traceId: "verification-trace",
          persisted: true,
          labId: "1",
        };
      },
      listUserLabEventLogs: async () => {
        throw new Error("listUserLabEventLogs should not be called");
      },
    },
  } as Parameters<typeof createApp>[0] & {
    labRecordsService: unknown;
    labEventLogsService: unknown;
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/xss/verification-records`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
        "x-lab-trace-id": "verification-trace",
      },
      body: JSON.stringify({
        variantKey: "fixed",
        result: "passed",
        summary: verificationSummary,
        details: {
          signal: "text-rendered",
          password: "raw-password",
          rawDetail: "raw-detail-value",
        },
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    record: {
      labKey: string;
      variantKey: string;
      result: string;
    };
  };

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    status: "ok",
    record: {
      labKey: "web.xss",
      variantKey: "fixed",
      result: "passed",
    },
  });
  assert.deepEqual(calls, [
    {
      userId: "1",
      labKey: "web.xss",
      variantKey: "fixed",
      result: "passed",
      summary: verificationSummary,
      details: {
        signal: "text-rendered",
        password: "raw-password",
        rawDetail: "raw-detail-value",
      },
    },
  ]);
  assert.deepEqual(eventCalls, [
    {
      traceId: "verification-trace",
      userId: "1",
      labKey: "web.xss",
      variantKey: "fixed",
      phase: "defense",
      eventType: "success",
      actorPerspective: "user",
      method: "POST",
      path: "/api/labs/web/xss/verification-records",
      inputSummary: {
        variantKey: "fixed",
        result: "passed",
        signal: "text-rendered",
        summaryLength: verificationSummary.length,
      },
      decision: "accepted",
      signal: "text-rendered",
      statusCode: 200,
      message: "手动验证记录已保存",
      riskLevel: "high",
    },
  ]);

  const serializedEvent = JSON.stringify(eventCalls);

  assert.equal(serializedEvent.includes("raw-summary-value"), false);
  assert.equal(serializedEvent.includes("raw-password"), false);
  assert.equal(serializedEvent.includes("raw-detail-value"), false);
});

test("POST /api/labs/:category/:scene/verification-records returns 404 for unknown lab", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    labRegistry: {
      listLabs: async () => [],
      getLab: async () => undefined,
    },
    labRecordsService: {
      recordLearningProgress: async () => {
        throw new Error("recordLearningProgress should not be called");
      },
      recordVerification: async () => {
        throw new Error("recordVerification should not be called");
      },
    },
  } as Parameters<typeof createApp>[0] & {
    labRecordsService: unknown;
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/not-found/verification-records`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        variantKey: "vuln",
        result: "passed",
        summary: "不存在的实验",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    message: string;
  };

  assert.equal(response.status, 404);
  assert.deepEqual(body, {
    status: "error",
    message: "lab not found",
  });
});

test("GET /api/lab-records/me requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/lab-records/me`);
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

test("GET /api/lab-event-logs/me requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/lab-event-logs/me`);
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

test("GET /api/lab-recap-question-completions/me requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/lab-recap-question-completions/me`,
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

test("PUT /api/lab-recap-question-completions/me requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/lab-recap-question-completions/me`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        traceId: "trace-csrf-vuln",
        labKey: "web.csrf",
        questionIndex: 0,
        completed: true,
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

test("GET /api/lab-records/me returns current user record summary", async () => {
  const calls: unknown[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    labRecordsService: {
      recordLearningProgress: async () => {
        throw new Error("recordLearningProgress should not be called");
      },
      recordVerification: async () => {
        throw new Error("recordVerification should not be called");
      },
      listUserLabRecords: async (input: unknown) => {
        calls.push(input);
        return {
          progress: [
            {
              labKey: "web.xss",
              title: "XSS",
              variantKey: "fixed",
              status: "completed",
              updatedAt: "2026-06-22T09:00:00.000Z",
            },
          ],
          verifications: [
            {
              labKey: "web.xss",
              title: "XSS",
              variantKey: "fixed",
              result: "passed",
              summary: "修复版原样显示 HTML 字符串",
              createdAt: "2026-06-22T09:01:00.000Z",
            },
          ],
        };
      },
    },
  } as Parameters<typeof createApp>[0] & {
    labRecordsService: unknown;
  });
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/lab-records/me`, {
    headers: {
      authorization: "Bearer local-session-token",
    },
  });
  const body = (await response.json()) as unknown;

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    status: "ok",
    records: {
      progress: [
        {
          labKey: "web.xss",
          title: "XSS",
          variantKey: "fixed",
          status: "completed",
          updatedAt: "2026-06-22T09:00:00.000Z",
        },
      ],
      verifications: [
        {
          labKey: "web.xss",
          title: "XSS",
          variantKey: "fixed",
          result: "passed",
          summary: "修复版原样显示 HTML 字符串",
          createdAt: "2026-06-22T09:01:00.000Z",
        },
      ],
    },
  });
  assert.deepEqual(calls, [
    {
      userId: "1",
    },
  ]);
});

test("GET /api/lab-recap-question-completions/me returns current user completions", async () => {
  const calls: unknown[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    labRecapQuestionCompletionsService: {
      listUserQuestionCompletions: async (input: unknown) => {
        calls.push(input);

        return [
          {
            traceId: "trace-csrf-vuln",
            labKey: "web.csrf",
            questionIndex: 0,
            questionKey: "question-0",
            completed: true,
            completedAt: "2026-06-29T08:00:00.000Z",
            updatedAt: "2026-06-29T08:01:00.000Z",
          },
        ];
      },
      setQuestionCompletion: async () => {
        throw new Error("setQuestionCompletion should not be called");
      },
    },
  } as Parameters<typeof createApp>[0] & {
    labRecapQuestionCompletionsService: unknown;
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/lab-recap-question-completions/me?labKey=web.csrf&traceIds=trace-csrf-vuln,trace-extra`,
    {
      headers: {
        authorization: "Bearer local-session-token",
      },
    },
  );
  const body = (await response.json()) as unknown;

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    status: "ok",
    items: [
      {
        traceId: "trace-csrf-vuln",
        labKey: "web.csrf",
        questionIndex: 0,
        questionKey: "question-0",
        completed: true,
        completedAt: "2026-06-29T08:00:00.000Z",
        updatedAt: "2026-06-29T08:01:00.000Z",
      },
    ],
  });
  assert.deepEqual(calls, [
    {
      userId: "1",
      labKey: "web.csrf",
      traceIds: ["trace-csrf-vuln", "trace-extra"],
    },
  ]);
});

test("PUT /api/lab-recap-question-completions/me stores current user completion", async () => {
  const calls: unknown[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    labRecapQuestionCompletionsService: {
      listUserQuestionCompletions: async () => {
        throw new Error("listUserQuestionCompletions should not be called");
      },
      setQuestionCompletion: async (input: unknown) => {
        calls.push(input);

        return {
          traceId: "trace-csrf-vuln",
          labKey: "web.csrf",
          questionIndex: 1,
          questionKey: "question-1",
          completed: false,
          completedAt: null,
          updatedAt: "2026-06-29T08:02:00.000Z",
        };
      },
    },
  } as Parameters<typeof createApp>[0] & {
    labRecapQuestionCompletionsService: unknown;
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/lab-recap-question-completions/me`,
    {
      method: "PUT",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        traceId: "trace-csrf-vuln",
        labKey: "web.csrf",
        questionIndex: 1,
        completed: false,
      }),
    },
  );
  const body = (await response.json()) as unknown;

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    status: "ok",
    item: {
      traceId: "trace-csrf-vuln",
      labKey: "web.csrf",
      questionIndex: 1,
      questionKey: "question-1",
      completed: false,
      completedAt: null,
      updatedAt: "2026-06-29T08:02:00.000Z",
    },
  });
  assert.deepEqual(calls, [
    {
      userId: "1",
      traceId: "trace-csrf-vuln",
      labKey: "web.csrf",
      questionIndex: 1,
      completed: false,
    },
  ]);
});

test("PUT /api/lab-recap-question-completions/me validates required fields", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    labRecapQuestionCompletionsService: {
      listUserQuestionCompletions: async () => [],
      setQuestionCompletion: async () => {
        throw new Error("setQuestionCompletion should not be called");
      },
    },
  } as Parameters<typeof createApp>[0] & {
    labRecapQuestionCompletionsService: unknown;
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/lab-recap-question-completions/me`,
    {
      method: "PUT",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        traceId: "trace-csrf-vuln",
        labKey: "web.csrf",
        questionIndex: 21,
        completed: true,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    message: string;
  };

  assert.equal(response.status, 400);
  assert.deepEqual(body, {
    status: "error",
    message: "traceId, labKey, questionIndex and completed are required",
  });
});

test("GET /api/lab-event-logs/me returns current user recent event logs", async () => {
  const calls: unknown[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    labEventLogsService: {
      recordLabEvent: async () => {
        throw new Error("recordLabEvent should not be called");
      },
      listUserLabEventLogs: async (input: unknown) => {
        calls.push(input);

        return [
          {
            traceId: "trace-xss-fixed",
            labKey: "web.xss",
            title: "XSS",
            variantKey: "fixed",
            phase: "defense",
            eventType: "success",
            actorPerspective: "user",
            decision: "accepted",
            signal: "xss-payload-rendered-as-text",
            statusCode: 200,
            message: "修复版按文本显示输入",
            riskLevel: "low",
            createdAt: "2026-06-25T08:00:00.000Z",
          },
        ];
      },
    },
  } as Parameters<typeof createApp>[0] & {
    labEventLogsService: unknown;
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/lab-event-logs/me?labKey=web.xss&phase=defense&riskLevel=low`,
    {
      headers: {
        authorization: "Bearer local-session-token",
      },
    },
  );
  const body = (await response.json()) as unknown;

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    status: "ok",
    events: [
      {
        traceId: "trace-xss-fixed",
        labKey: "web.xss",
        title: "XSS",
        variantKey: "fixed",
        phase: "defense",
        eventType: "success",
        actorPerspective: "user",
        decision: "accepted",
        signal: "xss-payload-rendered-as-text",
        statusCode: 200,
        message: "修复版按文本显示输入",
        riskLevel: "low",
        createdAt: "2026-06-25T08:00:00.000Z",
      },
    ],
  });
  assert.deepEqual(calls, [
    {
      userId: "1",
      labKey: "web.xss",
      phase: "defense",
      riskLevel: "low",
    },
  ]);
});

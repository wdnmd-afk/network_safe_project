import assert from "node:assert/strict";
import { after, test } from "node:test";

import type { AdminUser } from "@nsm/shared";

import { createAdminApp } from "../src/app.js";
import { hashPassword } from "../src/services/password.js";
import { createAdminToken } from "../src/services/session-token.js";
import type {
  EventRecord,
  LabRecord,
  LearnerRecord,
  StoredAdminUser,
} from "../src/services/admin-repository.js";
import { createInMemoryRepository, type SeedData } from "./support/in-memory-repository.js";

const tokenSecret = "test-admin-secret";
const adminPassword = "123456";

function createSeed(adminHash: string): SeedData {
  const adminUser: StoredAdminUser = {
    id: "1",
    username: "admin",
    passwordHash: adminHash,
    displayName: "平台管理员",
    role: "admin",
    status: "active",
  };
  const memberUser: StoredAdminUser = {
    id: "2",
    username: "demo_user",
    passwordHash: adminHash,
    displayName: "演示用户",
    role: "member",
    status: "active",
  };
  const inactiveAdmin: StoredAdminUser = {
    id: "3",
    username: "retired_admin",
    passwordHash: adminHash,
    displayName: "已停用管理员",
    role: "admin",
    status: "disabled",
  };
  const labs: LabRecord[] = [
    {
      labKey: "web.xss",
      title: "XSS",
      categoryCode: "web",
      categoryName: "Web 漏洞",
      severity: "high",
      mode: "interactive",
      status: "ready",
      isEnabled: true,
      variants: [
        { variantKey: "vuln", title: "漏洞版", isEnabled: true },
        { variantKey: "fixed", title: "修复版", isEnabled: true },
      ],
    },
    {
      labKey: "auth.idor",
      title: "IDOR",
      categoryCode: "auth",
      categoryName: "认证授权",
      severity: "high",
      mode: "interactive",
      status: "ready",
      isEnabled: false,
      variants: [{ variantKey: "vuln", title: "漏洞版", isEnabled: true }],
    },
  ];
  const events: EventRecord[] = [
    {
      id: "100",
      traceId: "trace-1",
      userId: "2",
      username: "demo_user",
      labKey: "web.xss",
      labTitle: "XSS",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      decision: "accepted",
      signal: "xss-executed",
      statusCode: 200,
      message: "payload executed",
      riskLevel: "high",
      createdAt: new Date("2026-09-16T02:00:00.000Z"),
    },
    {
      id: "101",
      traceId: "trace-1",
      userId: "2",
      username: "demo_user",
      labKey: "web.xss",
      labTitle: "XSS",
      variantKey: "fixed",
      phase: "defense",
      eventType: "blocked",
      actorPerspective: "system",
      decision: "blocked",
      signal: "xss-escaped",
      statusCode: 200,
      message: "escaped",
      riskLevel: "low",
      createdAt: new Date("2026-09-16T02:00:03.000Z"),
    },
  ];
  const learners: LearnerRecord[] = [
    {
      id: "2",
      username: "demo_user",
      displayName: "演示用户",
      role: "member",
      status: "active",
      progressCount: 1,
      completedCount: 1,
      verificationCount: 1,
      eventCount: 2,
      lastActivityAt: new Date("2026-09-16T02:00:03.000Z"),
    },
  ];

  return {
    users: [adminUser, memberUser, inactiveAdmin],
    labs,
    events,
    progress: [
      {
        userId: "2",
        labKey: "web.xss",
        labTitle: "XSS",
        variantKey: "vuln",
        status: "completed",
        updatedAt: new Date("2026-09-16T02:00:00.000Z"),
      },
    ],
    verifications: [
      {
        userId: "2",
        labKey: "web.xss",
        labTitle: "XSS",
        variantKey: "vuln",
        result: "passed",
        summary: "看到转义后的输出",
        createdAt: new Date("2026-09-16T02:00:05.000Z"),
      },
    ],
    recap: [
      { userId: "2", labKey: "web.xss", traceId: "trace-1", isCompleted: true },
      { userId: "2", labKey: "web.xss", traceId: "trace-1", isCompleted: false },
      { userId: "2", labKey: "web.xss", traceId: "trace-2", isCompleted: true },
    ],
    learners,
  };
}

type TestContext = {
  origin: string;
  adminToken: string;
  adminUser: AdminUser;
  auditLogs: { action: string; targetKey: string; beforeJson: unknown; afterJson: unknown }[];
  state: SeedData;
};

async function createContext() {
  const adminHash = await hashPassword(adminPassword);
  const { repository, auditLogs, state } = createInMemoryRepository(
    createSeed(adminHash),
  );
  const app = createAdminApp({
    repository,
    tokenSecret,
    // 主站探测用固定替身，避免测试依赖真实主站进程
    mainSiteProbe: async () => {
      throw new Error("main site not available in tests");
    },
  });
  const server = app.listen(0);
  const address = server.address();

  assert.ok(address && typeof address === "object");

  after(() => {
    server.close();
  });

  const origin = `http://127.0.0.1:${address.port}`;
  const loginResponse = await fetch(`${origin}/api/admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "admin", password: adminPassword }),
  });
  const loginBody = (await loginResponse.json()) as {
    token: string;
    user: AdminUser;
  };

  assert.equal(loginResponse.status, 200);

  return {
    origin,
    adminToken: loginBody.token,
    adminUser: loginBody.user,
    auditLogs: auditLogs as TestContext["auditLogs"],
    state,
  } satisfies TestContext;
}

function authHeaders(token: string) {
  return { authorization: `Bearer ${token}` };
}

// 受保护路由清单：新增路由必须同步登记，否则权限门禁会漏测
const protectedRoutes: { method: string; path: string }[] = [
  { method: "GET", path: "/api/admin/auth/me" },
  { method: "GET", path: "/api/admin/overview" },
  { method: "GET", path: "/api/admin/events" },
  { method: "GET", path: "/api/admin/events/traces/trace-1" },
  { method: "GET", path: "/api/admin/labs" },
  { method: "PATCH", path: "/api/admin/labs/web.xss" },
  { method: "PATCH", path: "/api/admin/labs/web.xss/variants/vuln" },
  { method: "GET", path: "/api/admin/learners" },
  { method: "GET", path: "/api/admin/learners/2" },
  { method: "GET", path: "/api/admin/audit-logs" },
];

test("所有受保护路由未登录返回 401", async () => {
  const { origin } = await createContext();

  for (const route of protectedRoutes) {
    const response = await fetch(`${origin}${route.path}`, {
      method: route.method,
      headers: { "content-type": "application/json" },
      body: route.method === "PATCH" ? JSON.stringify({ isEnabled: false }) : undefined,
    });

    assert.equal(response.status, 401, `${route.method} ${route.path} 应要求登录`);
  }
});

test("所有受保护路由对非管理员返回 403", async () => {
  const { origin } = await createContext();
  // demo_user 用自己的密钥是签不出来的，这里直接用它自己的身份签发，
  // 模拟「角色被降级但旧 token 仍有效」这一真实风险场景
  const memberToken = createAdminToken("2", tokenSecret);

  for (const route of protectedRoutes) {
    const response = await fetch(`${origin}${route.path}`, {
      method: route.method,
      headers: {
        ...authHeaders(memberToken),
        "content-type": "application/json",
      },
      body: route.method === "PATCH" ? JSON.stringify({ isEnabled: false }) : undefined,
    });

    assert.equal(response.status, 403, `${route.method} ${route.path} 应拒绝非管理员`);
  }
});

test("管理员登录后可访问全部受保护路由", async () => {
  const { origin, adminToken } = await createContext();

  for (const route of protectedRoutes) {
    const response = await fetch(`${origin}${route.path}`, {
      method: route.method,
      headers: {
        ...authHeaders(adminToken),
        "content-type": "application/json",
      },
      body: route.method === "PATCH" ? JSON.stringify({ isEnabled: false }) : undefined,
    });

    assert.notEqual(
      response.status,
      401,
      `${route.method} ${route.path} 不应再要求登录`,
    );
    assert.notEqual(
      response.status,
      403,
      `${route.method} ${route.path} 不应拒绝管理员`,
    );
  }
});

test("登录成功后签发令牌并写审计", async () => {
  const context = await createContext();

  const successLog = context.auditLogs.find(
    (log) => log.action === "auth.login.success",
  );

  assert.ok(successLog, "登录成功必须留下审计记录");
  assert.equal(successLog.targetKey, "admin");
});

test("密码错误返回 401 并写失败审计，且不泄露账号是否存在", async () => {
  const { origin, auditLogs } = await createContext();

  const wrongPassword = await fetch(`${origin}/api/admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "wrong-password" }),
  });
  const unknownUser = await fetch(`${origin}/api/admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "no-such-user", password: "whatever" }),
  });

  assert.equal(wrongPassword.status, 401);
  assert.equal(unknownUser.status, 401);

  const wrongBody = (await wrongPassword.json()) as { message: string };
  const unknownBody = (await unknownUser.json()) as { message: string };

  // 两种失败必须返回同一句话，否则可用来枚举账号
  assert.equal(wrongBody.message, unknownBody.message);
  assert.equal(
    auditLogs.filter((log) => log.action === "auth.login.failure").length,
    2,
  );
});

test("凭据正确但非管理员登录返回 403", async () => {
  const { origin } = await createContext();

  const response = await fetch(`${origin}/api/admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "demo_user", password: adminPassword }),
  });

  assert.equal(response.status, 403);
});

test("已停用账号即使角色是管理员也登录失败", async () => {
  const { origin } = await createContext();

  const response = await fetch(`${origin}/api/admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "retired_admin", password: adminPassword }),
  });

  assert.equal(response.status, 401);
});

test("登出后原令牌立即失效", async () => {
  const { origin, adminToken } = await createContext();

  const logout = await fetch(`${origin}/api/admin/auth/logout`, {
    method: "POST",
    headers: authHeaders(adminToken),
  });

  assert.equal(logout.status, 200);

  const after = await fetch(`${origin}/api/admin/auth/me`, {
    headers: authHeaders(adminToken),
  });

  assert.equal(after.status, 401);
});

test("事件响应不含禁止外传的字段", async () => {
  const { origin, adminToken } = await createContext();

  const response = await fetch(`${origin}/api/admin/events`, {
    headers: authHeaders(adminToken),
  });
  const text = await response.text();
  const body = JSON.parse(text) as { items: Record<string, unknown>[]; total: number };

  assert.equal(response.status, 200);
  assert.equal(body.total, 2);
  assert.equal(body.items.length, 2);

  // 按 key 断言而非按值：新增字段时也能兜住
  for (const forbidden of [
    "inputSummaryJson",
    "passwordHash",
    "method",
    "path",
  ]) {
    assert.equal(
      text.includes(`"${forbidden}"`),
      false,
      `事件响应不应包含 ${forbidden}`,
    );
  }

  const first = body.items[0] as Record<string, unknown>;

  assert.equal(typeof first.id, "string");
  assert.equal(typeof first.username, "string");
});

test("事件分页与筛选生效", async () => {
  const { origin, adminToken } = await createContext();

  const filtered = await fetch(
    `${origin}/api/admin/events?decision=blocked&pageSize=1`,
    { headers: authHeaders(adminToken) },
  );
  const body = (await filtered.json()) as {
    items: { decision: string }[];
    total: number;
    page: number;
    pageSize: number;
  };

  assert.equal(body.total, 1);
  assert.equal(body.pageSize, 1);
  assert.equal(body.page, 1);
  assert.equal(body.items[0]?.decision, "blocked");
});

test("非法查询参数返回 400 而不是静默纠正", async () => {
  const { origin, adminToken } = await createContext();

  const cases = [
    "/api/admin/events?pageSize=101",
    "/api/admin/events?pageSize=0",
    "/api/admin/events?page=abc",
    "/api/admin/events?phase=nope",
    "/api/admin/events?decision=nope",
    "/api/admin/events?riskLevel=nope",
    "/api/admin/events?from=2026-09-16&to=2026-09-01",
    "/api/admin/events?from=not-a-date",
    "/api/admin/events?labKey=web.xss;DROP",
    "/api/admin/events?userId=abc",
    "/api/admin/audit-logs?action=nope",
    "/api/admin/labs?isEnabled=maybe",
  ];

  for (const path of cases) {
    const response = await fetch(`${origin}${path}`, {
      headers: authHeaders(adminToken),
    });

    assert.equal(response.status, 400, `${path} 应返回 400`);
  }
});

test("trace 详情按时间归并并计算耗时，未知 trace 返回 404", async () => {
  const { origin, adminToken } = await createContext();

  const found = await fetch(`${origin}/api/admin/events/traces/trace-1`, {
    headers: authHeaders(adminToken),
  });
  const body = (await found.json()) as {
    trace: { events: { id: string }[]; durationMs: number; startedAt: string };
  };

  assert.equal(found.status, 200);
  assert.deepEqual(
    body.trace.events.map((event) => event.id),
    ["100", "101"],
  );
  assert.equal(body.trace.durationMs, 3000);
  assert.equal(body.trace.startedAt, "2026-09-16T02:00:00.000Z");

  const missing = await fetch(`${origin}/api/admin/events/traces/no-such-trace`, {
    headers: authHeaders(adminToken),
  });

  assert.equal(missing.status, 404);
});

test("停用变体写入审计并返回前后值", async () => {
  const { origin, adminToken, auditLogs } = await createContext();

  const response = await fetch(
    `${origin}/api/admin/labs/web.xss/variants/vuln`,
    {
      method: "PATCH",
      headers: { ...authHeaders(adminToken), "content-type": "application/json" },
      body: JSON.stringify({ isEnabled: false }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    before: { isEnabled: boolean };
    after: { isEnabled: boolean };
  };

  assert.equal(response.status, 200);
  assert.deepEqual(body.before, { isEnabled: true });
  assert.deepEqual(body.after, { isEnabled: false });

  const log = auditLogs.find((item) => item.action === "variant.disable");

  assert.ok(log, "停用变体必须写审计");
  assert.equal(log.targetKey, "web.xss:vuln");
  assert.deepEqual(log.beforeJson, { isEnabled: true });
  assert.deepEqual(log.afterJson, { isEnabled: false });
});

test("停用实验写入审计；不存在的实验或变体返回 404", async () => {
  const { origin, adminToken, auditLogs } = await createContext();

  const labToggle = await fetch(`${origin}/api/admin/labs/web.xss`, {
    method: "PATCH",
    headers: { ...authHeaders(adminToken), "content-type": "application/json" },
    body: JSON.stringify({ isEnabled: false }),
  });

  assert.equal(labToggle.status, 200);
  assert.ok(auditLogs.some((log) => log.action === "lab.disable"));

  const missingLab = await fetch(`${origin}/api/admin/labs/no.such-lab`, {
    method: "PATCH",
    headers: { ...authHeaders(adminToken), "content-type": "application/json" },
    body: JSON.stringify({ isEnabled: false }),
  });

  assert.equal(missingLab.status, 404);

  const missingVariant = await fetch(
    `${origin}/api/admin/labs/web.xss/variants/nope`,
    {
      method: "PATCH",
      headers: { ...authHeaders(adminToken), "content-type": "application/json" },
      body: JSON.stringify({ isEnabled: false }),
    },
  );

  assert.equal(missingVariant.status, 400);
});

test("PATCH 请求体只接受 isEnabled 布尔值", async () => {
  const { origin, adminToken } = await createContext();

  const cases: unknown[] = [
    {},
    { isEnabled: "false" },
    { isEnabled: false, extra: 1 },
    [],
  ];

  for (const body of cases) {
    const response = await fetch(`${origin}/api/admin/labs/web.xss`, {
      method: "PATCH",
      headers: { ...authHeaders(adminToken), "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    assert.equal(response.status, 400, `请求体 ${JSON.stringify(body)} 应被拒绝`);
  }
});

test("审计日志分页可查且只回传 isEnabled 快照", async () => {
  const { origin, adminToken } = await createContext();

  await fetch(`${origin}/api/admin/labs/web.xss/variants/fixed`, {
    method: "PATCH",
    headers: { ...authHeaders(adminToken), "content-type": "application/json" },
    body: JSON.stringify({ isEnabled: false }),
  });

  const response = await fetch(
    `${origin}/api/admin/audit-logs?pageSize=5&action=variant.disable`,
    { headers: authHeaders(adminToken) },
  );
  const body = (await response.json()) as {
    items: { action: string; targetKey: string; after: unknown; extra?: unknown }[];
    total: number;
  };

  assert.equal(response.status, 200);
  assert.equal(body.total, 1);
  assert.equal(body.items[0]?.action, "variant.disable");
  assert.equal(body.items[0]?.targetKey, "web.xss:fixed");
  assert.deepEqual(body.items[0]?.after, { isEnabled: false });
});

test("学习过程只读接口返回进度、验证与复盘汇总", async () => {
  const { origin, adminToken } = await createContext();

  const response = await fetch(`${origin}/api/admin/learners/2`, {
    headers: authHeaders(adminToken),
  });
  const body = (await response.json()) as {
    learner: { username: string; completedCount: number };
    progress: { labKey: string; title: string }[];
    verifications: { result: string; title: string }[];
    recap: { labKey: string; traceCount: number; completedQuestions: number }[];
  };

  assert.equal(response.status, 200);
  assert.equal(body.learner.username, "demo_user");
  assert.equal(body.learner.completedCount, 1);
  assert.equal(body.progress.length, 1);
  assert.equal(body.verifications.length, 1);
  // 对外字段名固定为 title，与主项目 /api/lab-records/me 对齐
  assert.equal(body.progress[0]?.title, "XSS");
  assert.equal(body.verifications[0]?.title, "XSS");
  // trace-1 与 trace-2 两条 trace，其中两道题已完成
  assert.deepEqual(body.recap, [
    { labKey: "web.xss", traceCount: 2, completedQuestions: 2 },
  ]);
});

test("概览返回统计、风险分布与近 7 日补零序列", async () => {
  const { origin, adminToken } = await createContext();

  const response = await fetch(`${origin}/api/admin/overview`, {
    headers: authHeaders(adminToken),
  });
  const body = (await response.json()) as {
    labs: { total: number; enabled: number };
    variants: { total: number; enabled: number };
    events: {
      total: number;
      blocked: number;
      blockRate: number;
      byRisk: Record<string, number>;
      daily: { date: string; count: number }[];
    };
    learners: number;
    mainSite: { reachable: boolean; availabilitySource: string | null };
  };

  assert.equal(response.status, 200);
  assert.deepEqual(body.labs, { total: 2, enabled: 1, categories: 2 });
  assert.deepEqual(body.variants, { total: 3, enabled: 3 });
  assert.equal(body.events.total, 2);
  assert.equal(body.events.blocked, 1);
  assert.equal(body.events.blockRate, 50);
  assert.equal(body.events.byRisk.high, 1);
  assert.equal(body.events.byRisk.medium, 0);
  assert.equal(body.events.daily.length, 7);
  assert.equal(body.learners, 1);
  // 测试替身固定让主站不可达，管理端仍应正常返回
  assert.deepEqual(body.mainSite, { reachable: false, availabilitySource: null });
});

test("健康检查探活数据库", async () => {
  const { origin } = await createContext();

  const response = await fetch(`${origin}/api/admin/health`);
  const body = (await response.json()) as { status: string; database: string };

  assert.equal(response.status, 200);
  assert.deepEqual(body, { status: "ok", database: "ok" });
});

test("响应带禁止缓存与嗅探的安全头", async () => {
  const { origin } = await createContext();

  const response = await fetch(`${origin}/api/admin/health`);

  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("cache-control"), "no-store");
});

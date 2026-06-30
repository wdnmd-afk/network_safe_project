import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";
import {
  createSqlInjectionLabService,
  type SqlInjectionLabRepository,
  type SqlInjectionSearchResult,
} from "../src/services/sql-injection-lab.js";

const demoUser = {
  id: "1",
  username: "demo_user",
  displayName: "演示用户",
  role: "member",
  status: "active",
};

const publicProduct = {
  id: "1",
  sku: "LAB-SQL-ROUTER-01",
  name: "Training Router",
  category: "network",
  priceCents: 129900,
  internalNote: "公开商品，正常搜索可见。",
  isHidden: false,
};

const hiddenProduct = {
  id: "3",
  sku: "LAB-SQL-HIDDEN-99",
  name: "Executive Contract Bundle",
  category: "internal",
  priceCents: 999900,
  internalNote: "隐藏采购条款：仅内部审批可见。",
  isHidden: true,
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

function createRepository(): SqlInjectionLabRepository {
  return {
    async searchWithUnsafeConcat(keyword) {
      return {
        queryPreview: `unsafe keyword=${keyword}`,
        rows: keyword.includes("OR 1=1")
          ? [publicProduct, hiddenProduct]
          : [publicProduct],
      };
    },
    async searchWithParameterizedQuery() {
      return {
        queryPreview: "parameterized keyword=?",
        rows: [],
      };
    },
  };
}

test("sql injection service returns public rows for a normal vulnerable search", async () => {
  const service = createSqlInjectionLabService(createRepository());

  const result = await service.searchProducts({
    variantKey: "vuln",
    keyword: "router",
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "sql-injection-normal-search");
  assert.equal(result.detectedInjection, false);
  assert.deepEqual(result.rows, [publicProduct]);
});

test("sql injection service exposes hidden rows in the vulnerable variant", async () => {
  const service = createSqlInjectionLabService(createRepository());

  const result = await service.searchProducts({
    variantKey: "vuln",
    keyword: "%' OR 1=1 #",
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "sql-injection-data-exposed");
  assert.equal(result.detectedInjection, true);
  assert.equal(result.decision, "accepted");
  assert.deepEqual(result.rows, [publicProduct, hiddenProduct]);
});

test("sql injection service blocks the same payload in the fixed variant", async () => {
  const service = createSqlInjectionLabService(createRepository());

  const result = await service.searchProducts({
    variantKey: "fixed",
    keyword: "%' OR 1=1 #",
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "sql-injection-parameterized-blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.queryMode, "parameterized");
  assert.deepEqual(result.rows, []);
});

test("sql injection service blocks destructive input at the lab boundary", async () => {
  const service = createSqlInjectionLabService(createRepository());

  const result = await service.searchProducts({
    variantKey: "vuln",
    keyword: "'; DROP TABLE users; --",
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "sql-injection-safety-boundary-blocked");
  assert.equal(result.blockedReason, "unsafe-sql-keyword");
});

test("POST /api/labs/web/sql-injection/:variant/search requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/sql-injection/vuln/search`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        keyword: "router",
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

test("POST /api/labs/web/sql-injection/vuln/search records attack event logs", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    sqlInjectionLabService: {
      searchProducts: async (): Promise<SqlInjectionSearchResult> => ({
        status: "ok",
        variantKey: "vuln",
        keyword: "%' OR 1=1 #",
        detectedInjection: true,
        queryMode: "unsafe-concat",
        queryPreview: "unsafe query",
        rows: [publicProduct, hiddenProduct],
        signal: "sql-injection-data-exposed",
        decision: "accepted",
        message: "漏洞版拼接 SQL 后接受了攻击语义，隐藏数据被返回。",
        nextStep: "切到修复版提交同样输入。",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => {
        labEventLogCalls.push(input);

        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: "3",
        };
      },
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/sql-injection/vuln/search`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
        "x-lab-trace-id": "trace-sqli-vuln",
      },
      body: JSON.stringify({
        keyword: "%' OR 1=1 #",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: SqlInjectionSearchResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "sql-injection-data-exposed");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-sqli-vuln",
      userId: "1",
      labKey: "web.sql-injection",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/web/sql-injection/vuln/search",
      inputSummary: {
        keywordLength: 11,
        keywordPreview: "controlled-sql-injection-sample",
        detectedInjection: true,
        signal: "sql-injection-data-exposed",
        queryMode: "unsafe-concat",
        resultCount: 2,
        containsHiddenResult: true,
      },
      decision: "accepted",
      signal: "sql-injection-data-exposed",
      statusCode: 200,
      message: "漏洞版拼接 SQL 后接受了攻击语义，隐藏数据被返回。",
      riskLevel: "critical",
    },
  ]);
});

test("POST /api/labs/web/sql-injection/fixed/search returns blocked response", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    sqlInjectionLabService: {
      searchProducts: async (): Promise<SqlInjectionSearchResult> => ({
        status: "blocked",
        variantKey: "fixed",
        keyword: "%' OR 1=1 #",
        detectedInjection: true,
        queryMode: "parameterized",
        queryPreview: "parameterized query",
        rows: [],
        signal: "sql-injection-parameterized-blocked",
        decision: "blocked",
        message: "修复版把输入作为参数值处理，攻击语义没有进入 SQL 结构。",
        nextStep: "切回漏洞版观察差异。",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => ({
        traceId: input.traceId ?? "generated-trace",
        persisted: true,
        labId: "3",
      }),
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/sql-injection/fixed/search`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        keyword: "%' OR 1=1 #",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: SqlInjectionSearchResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(body.result.signal, "sql-injection-parameterized-blocked");
});

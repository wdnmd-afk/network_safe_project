import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";
import {
  createXpathInjectionLabService,
  xpathInjectionControlledKeyword,
  xpathInjectionNormalKeyword,
  xpathInjectionNormalQueryTemplate,
  xpathInjectionNormalScope,
  type XpathInjectionResult,
} from "../src/services/xpath-injection-lab.js";

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

test("xpath injection service completes normal public catalog searches", async () => {
  const service = createXpathInjectionLabService();
  const result = await service.searchCatalog({
    userId: "1",
    variantKey: "fixed",
    queryTemplate: xpathInjectionNormalQueryTemplate,
    keyword: xpathInjectionNormalKeyword,
    scope: xpathInjectionNormalScope,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "xpath-injection-safe-query-completed");
  assert.equal(result.decision, "accepted");
  assert.equal(result.inspection.resultScope, "public");
  assert.equal(
    result.documents.every((document) => document.visibility === "public"),
    true,
  );
});

test("xpath injection service expands virtual result scope in vulnerable variant", async () => {
  const service = createXpathInjectionLabService();
  const result = await service.searchCatalog({
    userId: "1",
    variantKey: "vuln",
    queryTemplate: xpathInjectionNormalQueryTemplate,
    keyword: xpathInjectionControlledKeyword,
    scope: xpathInjectionNormalScope,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "xpath-injection-result-scope-expanded");
  assert.equal(result.decision, "accepted");
  assert.equal(result.inspection.matchedControlledSample, true);
  assert.equal(result.inspection.resultScope, "expanded");
  assert.equal(
    result.documents.some((document) => document.visibility === "internal"),
    true,
  );
  assert.equal(JSON.stringify(result).includes(xpathInjectionControlledKeyword), false);
});

test("xpath injection service blocks the same controlled sample in fixed variant", async () => {
  const service = createXpathInjectionLabService();
  const result = await service.searchCatalog({
    userId: "1",
    variantKey: "fixed",
    queryTemplate: xpathInjectionNormalQueryTemplate,
    keyword: xpathInjectionControlledKeyword,
    scope: xpathInjectionNormalScope,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "xpath-injection-controlled-sample-blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "controlled-sample-blocked");
});

test("xpath injection service rejects unknown query templates", async () => {
  const service = createXpathInjectionLabService();
  const result = await service.searchCatalog({
    userId: "1",
    variantKey: "vuln",
    queryTemplate: "raw-xpath-expression",
    keyword: xpathInjectionNormalKeyword,
    scope: xpathInjectionNormalScope,
  });

  assert.equal(result.status, "failed");
  assert.equal(result.signal, "xpath-injection-template-not-found");
  assert.equal(result.decision, "failed");
  assert.equal(result.blockedReason, "query-template-not-allowed");
});

test("POST /api/labs/web/xpath-injection/:variant/search requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/xpath-injection/vuln/search`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        queryTemplate: xpathInjectionNormalQueryTemplate,
        keyword: xpathInjectionNormalKeyword,
        scope: xpathInjectionNormalScope,
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

test("POST /api/labs/web/xpath-injection/vuln/search records safe summary without keyword", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    xpathInjectionLabService: {
      searchCatalog: async (): Promise<XpathInjectionResult> => ({
        status: "ok",
        variantKey: "vuln",
        queryTemplate: xpathInjectionNormalQueryTemplate,
        scope: xpathInjectionNormalScope,
        keywordLength: xpathInjectionControlledKeyword.length,
        keywordPreview: "controlled-xpath-keyword",
        documents: [
          {
            id: "product-internal-review",
            name: "虚拟内部审核产品",
            category: "internal-review",
            visibility: "internal",
            matchedBy: "controlled-expanded-scope",
            teachingOnly: true,
          },
        ],
        inspection: {
          queryTemplateAllowed: true,
          scopeAllowed: true,
          keywordLength: xpathInjectionControlledKeyword.length,
          keywordPreview: "controlled-xpath-keyword",
          detectedRiskTypes: [
            "controlled-scope-expansion",
            "xpath-like-token",
          ],
          matchedControlledSample: true,
          resultScope: "expanded",
        },
        signal: "xpath-injection-result-scope-expanded",
        decision: "accepted",
        message: "virtual result scope expanded",
        nextStep: "compare fixed variant",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => {
        labEventLogCalls.push(input);

        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: "13",
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/xpath-injection/vuln/search`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
        "x-lab-trace-id": "trace-xpath-vuln",
      },
      body: JSON.stringify({
        queryTemplate: xpathInjectionNormalQueryTemplate,
        keyword: xpathInjectionControlledKeyword,
        scope: xpathInjectionNormalScope,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: XpathInjectionResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "xpath-injection-result-scope-expanded");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-xpath-vuln",
      userId: "1",
      labKey: "web.xpath-injection",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/web/xpath-injection/vuln/search",
      inputSummary: {
        queryTemplate: "product-catalog-by-name",
        scope: "public-catalog",
        keywordLength: xpathInjectionControlledKeyword.length,
        keywordPreview: "controlled-xpath-keyword",
        detectedRiskTypes: [
          "controlled-scope-expansion",
          "xpath-like-token",
        ],
        matchedControlledSample: true,
        resultScope: "expanded",
        documentCount: 1,
        signal: "xpath-injection-result-scope-expanded",
      },
      decision: "accepted",
      signal: "xpath-injection-result-scope-expanded",
      statusCode: 200,
      message: "virtual result scope expanded",
      riskLevel: "high",
    },
  ]);
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes(
      xpathInjectionControlledKeyword,
    ),
    false,
  );
});

test("POST /api/labs/web/xpath-injection/fixed/search returns blocked response", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => ({
        traceId: input.traceId ?? "generated-trace",
        persisted: true,
        labId: "13",
      }),
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/xpath-injection/fixed/search`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        queryTemplate: xpathInjectionNormalQueryTemplate,
        keyword: xpathInjectionControlledKeyword,
        scope: xpathInjectionNormalScope,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: XpathInjectionResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(body.result.signal, "xpath-injection-controlled-sample-blocked");
});

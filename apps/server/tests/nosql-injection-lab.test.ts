import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";
import {
  createNosqlInjectionLabService,
  nosqlInjectionAttackFilterText,
  nosqlInjectionNormalFilterText,
  nosqlInjectionNormalKeyword,
  type NosqlInjectionResult,
} from "../src/services/nosql-injection-lab.js";

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

test("nosql injection service completes normal public coupon searches", async () => {
  const service = createNosqlInjectionLabService();
  const result = await service.searchCoupons({
    userId: "1",
    variantKey: "fixed",
    queryMode: "coupon-search",
    keyword: nosqlInjectionNormalKeyword,
    filterText: nosqlInjectionNormalFilterText,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "nosql-injection-safe-query-completed");
  assert.equal(result.decision, "accepted");
  assert.equal(result.inspection.resultScope, "public");
  assert.equal(
    result.documents.every((document) => document.visibility === "public"),
    true,
  );
});

test("nosql injection service expands virtual query scope in vulnerable variant", async () => {
  const service = createNosqlInjectionLabService();
  const result = await service.searchCoupons({
    userId: "1",
    variantKey: "vuln",
    queryMode: "coupon-search",
    keyword: nosqlInjectionNormalKeyword,
    filterText: nosqlInjectionAttackFilterText,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "nosql-injection-query-expanded");
  assert.equal(result.decision, "accepted");
  assert.equal(result.inspection.matchedControlledSample, true);
  assert.equal(result.inspection.resultScope, "expanded");
  assert.equal(
    result.documents.some((document) => document.visibility === "hidden"),
    true,
  );
});

test("nosql injection service blocks the same controlled sample in fixed variant", async () => {
  const service = createNosqlInjectionLabService();
  const result = await service.searchCoupons({
    userId: "1",
    variantKey: "fixed",
    queryMode: "coupon-search",
    keyword: nosqlInjectionNormalKeyword,
    filterText: nosqlInjectionAttackFilterText,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "nosql-injection-operator-blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "controlled-operator-blocked");
});

test("nosql injection service rejects unknown query modes", async () => {
  const service = createNosqlInjectionLabService();
  const result = await service.searchCoupons({
    userId: "1",
    variantKey: "vuln",
    queryMode: "unknown-query",
    keyword: nosqlInjectionNormalKeyword,
    filterText: nosqlInjectionNormalFilterText,
  });

  assert.equal(result.status, "failed");
  assert.equal(result.signal, "nosql-injection-query-mode-not-found");
  assert.equal(result.decision, "failed");
});

test("POST /api/labs/web/nosql-injection/:variant/search requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/nosql-injection/vuln/search`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        queryMode: "coupon-search",
        keyword: nosqlInjectionNormalKeyword,
        filterText: nosqlInjectionNormalFilterText,
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

test("POST /api/labs/web/nosql-injection/vuln/search records safe summary without filter text", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    nosqlInjectionLabService: {
      searchCoupons: async (): Promise<NosqlInjectionResult> => ({
        status: "ok",
        variantKey: "vuln",
        queryMode: "coupon-search",
        keyword: nosqlInjectionNormalKeyword,
        filterTextLength: nosqlInjectionAttackFilterText.length,
        documents: [
          {
            id: "coupon-hidden-review",
            title: "虚拟隐藏复盘优惠券",
            channel: "internal-review",
            visibility: "hidden",
            teachingOnly: true,
          },
        ],
        inspection: {
          queryModeAllowed: true,
          keywordLength: nosqlInjectionNormalKeyword.length,
          filterTextLength: nosqlInjectionAttackFilterText.length,
          detectedRiskTypes: ["controlled-operator", "operator-like-token"],
          matchedControlledSample: true,
          resultScope: "expanded",
        },
        signal: "nosql-injection-query-expanded",
        decision: "accepted",
        message: "virtual query expanded",
        nextStep: "compare fixed variant",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => {
        labEventLogCalls.push(input);

        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: "11",
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/nosql-injection/vuln/search`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
        "x-lab-trace-id": "trace-nosql-vuln",
      },
      body: JSON.stringify({
        queryMode: "coupon-search",
        keyword: nosqlInjectionNormalKeyword,
        filterText: nosqlInjectionAttackFilterText,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: NosqlInjectionResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "nosql-injection-query-expanded");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-nosql-vuln",
      userId: "1",
      labKey: "web.nosql-injection",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/web/nosql-injection/vuln/search",
      inputSummary: {
        queryMode: "coupon-search",
        keywordLength: nosqlInjectionNormalKeyword.length,
        keywordPreview: "shi***ng",
        filterTextLength: nosqlInjectionAttackFilterText.length,
        detectedRiskTypes: ["controlled-operator", "operator-like-token"],
        matchedControlledSample: true,
        resultScope: "expanded",
        documentCount: 1,
        signal: "nosql-injection-query-expanded",
      },
      decision: "accepted",
      signal: "nosql-injection-query-expanded",
      statusCode: 200,
      message: "virtual query expanded",
      riskLevel: "high",
    },
  ]);
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes(
      nosqlInjectionAttackFilterText,
    ),
    false,
  );
});

test("POST /api/labs/web/nosql-injection/fixed/search returns blocked response", async () => {
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
        labId: "11",
      }),
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/web/nosql-injection/fixed/search`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        queryMode: "coupon-search",
        keyword: nosqlInjectionNormalKeyword,
        filterText: nosqlInjectionAttackFilterText,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: NosqlInjectionResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(body.result.signal, "nosql-injection-operator-blocked");
});

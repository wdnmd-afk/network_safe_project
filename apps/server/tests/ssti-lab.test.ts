import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";
import {
  createSstiLabService,
  sstiDebugTemplateText,
  sstiMathTemplateText,
  sstiNormalTemplateText,
  sstiNormalVariables,
  type SstiPreviewResult,
} from "../src/services/ssti-lab.js";

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

test("ssti service renders normal templates with allowed variables", async () => {
  const service = createSstiLabService();
  const result = await service.previewTemplate({
    userId: "1",
    variantKey: "fixed",
    templateKey: "shipping-notice",
    templateText: sstiNormalTemplateText,
    variables: sstiNormalVariables,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "ssti-safe-template-rendered");
  assert.equal(result.decision, "accepted");
  assert.equal(result.inspection.expressionTypes.includes("allowed-variable"), true);
  assert.equal(result.renderedText.includes(sstiNormalVariables.customerName), true);
});

test("ssti service evaluates only the controlled math sample in vulnerable variant", async () => {
  const service = createSstiLabService();
  const result = await service.previewTemplate({
    userId: "1",
    variantKey: "vuln",
    templateKey: "shipping-notice",
    templateText: sstiMathTemplateText,
    variables: sstiNormalVariables,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "ssti-expression-evaluated");
  assert.equal(result.decision, "accepted");
  assert.equal(
    result.inspection.expressionTypes.includes("controlled-math-expression"),
    true,
  );
  assert.equal(result.inspection.matchedControlledSample, true);
  assert.equal(result.renderedText.includes("49"), true);
});

test("ssti service exposes only virtual context in vulnerable variant", async () => {
  const service = createSstiLabService();
  const result = await service.previewTemplate({
    userId: "1",
    variantKey: "vuln",
    templateKey: "shipping-notice",
    templateText: sstiDebugTemplateText,
    variables: sstiNormalVariables,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "ssti-template-context-exposed");
  assert.equal(
    result.inspection.expressionTypes.includes("controlled-debug-context"),
    true,
  );
  assert.match(result.renderedText, /虚拟上下文/);
});

test("ssti service blocks the same controlled sample in fixed variant", async () => {
  const service = createSstiLabService();
  const result = await service.previewTemplate({
    userId: "1",
    variantKey: "fixed",
    templateKey: "shipping-notice",
    templateText: sstiMathTemplateText,
    variables: sstiNormalVariables,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "ssti-expression-blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "expression-not-allowed");
});

test("ssti service rejects unknown templates", async () => {
  const service = createSstiLabService();
  const result = await service.previewTemplate({
    userId: "1",
    variantKey: "vuln",
    templateKey: "unknown-template",
    templateText: sstiNormalTemplateText,
    variables: sstiNormalVariables,
  });

  assert.equal(result.status, "failed");
  assert.equal(result.signal, "ssti-template-not-found");
  assert.equal(result.decision, "failed");
});

test("POST /api/labs/web/ssti/:variant/preview requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/web/ssti/vuln/preview`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      templateKey: "shipping-notice",
      templateText: sstiNormalTemplateText,
      variables: sstiNormalVariables,
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

test("POST /api/labs/web/ssti/vuln/preview records safe summary without template text", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    sstiLabService: {
      previewTemplate: async (): Promise<SstiPreviewResult> => ({
        status: "ok",
        variantKey: "vuln",
        templateKey: "shipping-notice",
        renderedText: "尊敬的 演示用户，调试结果：49",
        inspection: {
          templateLength: sstiMathTemplateText.length,
          expressionCount: 2,
          expressionTypes: [
            "allowed-variable",
            "controlled-math-expression",
          ],
          matchedControlledSample: true,
          unknownExpressionCount: 0,
          variableKeys: ["customerName", "orderNo", "noticeTitle"],
          acceptedVariableKeys: ["customerName"],
        },
        signal: "ssti-expression-evaluated",
        decision: "accepted",
        message: "controlled expression evaluated",
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
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/web/ssti/vuln/preview`, {
    method: "POST",
    headers: {
      authorization: "Bearer local-session-token",
      "content-type": "application/json",
      "x-lab-trace-id": "trace-ssti-vuln",
    },
    body: JSON.stringify({
      templateKey: "shipping-notice",
      templateText: sstiMathTemplateText,
      variables: sstiNormalVariables,
    }),
  });
  const body = (await response.json()) as {
    status: string;
    result: SstiPreviewResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "ssti-expression-evaluated");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-ssti-vuln",
      userId: "1",
      labKey: "web.ssti",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/web/ssti/vuln/preview",
      inputSummary: {
        templateKey: "shipping-notice",
        templateLength: sstiMathTemplateText.length,
        variableKeys: ["customerName", "orderNo", "noticeTitle"],
        acceptedVariableKeys: ["customerName"],
        expressionCount: 2,
        expressionTypes: [
          "allowed-variable",
          "controlled-math-expression",
        ],
        matchedControlledSample: true,
        unknownExpressionCount: 0,
        signal: "ssti-expression-evaluated",
      },
      decision: "accepted",
      signal: "ssti-expression-evaluated",
      statusCode: 200,
      message: "controlled expression evaluated",
      riskLevel: "high",
    },
  ]);
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes(
      sstiMathTemplateText,
    ),
    false,
  );
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes("7 * 7"),
    false,
  );
});

test("POST /api/labs/web/ssti/fixed/preview returns blocked response", async () => {
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
        labId: "10",
      }),
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/web/ssti/fixed/preview`, {
    method: "POST",
    headers: {
      authorization: "Bearer local-session-token",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      templateKey: "shipping-notice",
      templateText: sstiMathTemplateText,
      variables: sstiNormalVariables,
    }),
  });
  const body = (await response.json()) as {
    status: string;
    result: SstiPreviewResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(body.result.signal, "ssti-expression-blocked");
});

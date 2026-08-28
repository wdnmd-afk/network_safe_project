import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import {
  assessFixedWebhookBatch,
  createRateLimitIdempotencyLabService,
  fixedWebhookBatchSnapshots,
  rateLimitIdempotencyDefenseSignal,
  rateLimitIdempotencyNormalSignal,
  rateLimitIdempotencyRiskSignal,
  rateLimitIdempotencyScenarioKey,
} from "../src/services/rate-limit-idempotency-lab.js";
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

test("fixed webhook batch snapshots are frozen and expose locked audit counts", () => {
  assert.equal(Object.isFrozen(fixedWebhookBatchSnapshots), true);
  assert.equal(Object.isFrozen(fixedWebhookBatchSnapshots[0]), true);
  assert.deepEqual(fixedWebhookBatchSnapshots.map(assessFixedWebhookBatch), [
    {
      batchKey: "virtual-unthrottled-replayable-batch",
      expectedPosture: "vulnerable",
      findingCount: 4,
      criticalFindingCount: 2,
      resourceControlCount: 0,
    },
    {
      batchKey: "virtual-quota-idempotent-batch",
      expectedPosture: "hardened",
      findingCount: 0,
      criticalFindingCount: 0,
      resourceControlCount: 4,
    },
  ]);
});

test("rate limit idempotency accepts the fixed overload replay risk path", () => {
  const result = createRateLimitIdempotencyLabService().evaluate({
    variantKey: "vuln",
    scenarioKey: rateLimitIdempotencyScenarioKey,
    decisions: [
      "accept-unthrottled-replayable-batch",
      "approve-overload-and-replay",
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, rateLimitIdempotencyRiskSignal);
  assert.equal(result.recap.terminalOutcome, "risk");
  assert.equal(result.batchAssessment?.criticalFindingCount, 2);
  assert.equal(result.batchDecision?.disposition, "overload-and-replay-approved");
});

test("rate limit idempotency blocks the overload replay on the defense path", () => {
  const result = createRateLimitIdempotencyLabService().evaluate({
    variantKey: "fixed",
    scenarioKey: rateLimitIdempotencyScenarioKey,
    decisions: ["enforce-quota-and-idempotency", "block-overload-and-replay"],
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, rateLimitIdempotencyDefenseSignal);
  assert.equal(result.recap.terminalOutcome, "fix");
  assert.equal(result.batchAssessment?.resourceControlCount, 4);
  assert.equal(result.blockedReason, "overload-and-replay-blocked");
});

test("rate limit idempotency verifies the throttled normal baseline", () => {
  const result = createRateLimitIdempotencyLabService().evaluate({
    variantKey: "fixed",
    scenarioKey: rateLimitIdempotencyScenarioKey,
    decisions: ["enforce-quota-and-idempotency", "verify-throttled-baseline"],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, rateLimitIdempotencyNormalSignal);
  assert.equal(result.recap.terminalOutcome, "normal");
  assert.equal(
    result.batchDecision?.disposition,
    "throttled-baseline-verified",
  );
});

test("rate limit idempotency blocks unknown and incomplete paths without echo", () => {
  const service = createRateLimitIdempotencyLabService();
  const rawScenario = "flood-real-webhook-endpoint";
  const rawOption = "replay-real-payment-event";
  const unknownScenario = service.evaluate({
    variantKey: "vuln",
    scenarioKey: rawScenario,
    decisions: ["accept-unthrottled-replayable-batch"],
  });
  const unknownOption = service.evaluate({
    variantKey: "vuln",
    scenarioKey: rateLimitIdempotencyScenarioKey,
    decisions: [rawOption],
  });
  const incomplete = service.evaluate({
    variantKey: "vuln",
    scenarioKey: rateLimitIdempotencyScenarioKey,
    decisions: ["accept-unthrottled-replayable-batch"],
  });
  const trailing = service.evaluate({
    variantKey: "vuln",
    scenarioKey: rateLimitIdempotencyScenarioKey,
    decisions: [
      "accept-unthrottled-replayable-batch",
      "approve-overload-and-replay",
      rawOption,
    ],
  });

  assert.equal(unknownScenario.scenarioKey, "blocked-scenario");
  assert.equal(JSON.stringify(unknownScenario).includes(rawScenario), false);
  assert.equal(JSON.stringify(unknownOption).includes(rawOption), false);
  assert.equal(incomplete.blockedReason, "path-incomplete");
  assert.equal(trailing.blockedReason, "decisions-after-terminal");
  assert.equal(JSON.stringify(trailing).includes(rawOption), false);
});

test("rate limit idempotency workbench API exposes only fixed batches", async () => {
  const origin = await listen(createApp());
  const response = await fetch(
    `${origin}/api/labs/api/rate-limit-idempotency/workbench`,
  );
  const body = (await response.json()) as {
    status: string;
    workbench: {
      id: string;
      defaultScenarioKey: string;
      batchSnapshots: Array<{ batchKey: string; quotaScope: string }>;
      batchAssessments: unknown[];
    };
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.workbench.id, "api.rate-limit-idempotency");
  assert.equal(
    body.workbench.defaultScenarioKey,
    rateLimitIdempotencyScenarioKey,
  );
  assert.equal(body.workbench.batchSnapshots.length, 2);
  assert.equal(body.workbench.batchAssessments.length, 2);
  assert.ok(
    body.workbench.batchSnapshots.every((batch) =>
      batch.batchKey.startsWith("virtual-"),
    ),
  );
  // 配额范围必须是登记过的语义枚举，不得出现真实速率配置
  assert.ok(
    body.workbench.batchSnapshots.every(
      (batch) =>
        batch.quotaScope === "unlimited" ||
        batch.quotaScope === "windowed-quota",
    ),
  );
});

test("rate limit idempotency evaluate API requires login", async () => {
  const origin = await listen(createApp());
  const response = await fetch(
    `${origin}/api/labs/api/rate-limit-idempotency/vuln/evaluate`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioKey: rateLimitIdempotencyScenarioKey,
        decisions: [
          "accept-unthrottled-replayable-batch",
          "approve-overload-and-replay",
        ],
      }),
    },
  );

  assert.equal(response.status, 401);
});

test("rate limit idempotency API records only fixed keys and audit counts", async () => {
  const eventCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    labEventLogsService: {
      recordLabEvent: async (input) => {
        eventCalls.push(input);
        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: null,
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);
  const response = await fetch(
    `${origin}/api/labs/api/rate-limit-idempotency/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: rateLimitIdempotencyScenarioKey,
        decisions: [
          "accept-unthrottled-replayable-batch",
          "approve-overload-and-replay",
        ],
        webhookUrl: "https://payments.real-vendor.example/hooks/live",
        signingSecret: "whsec_REALSIGNINGSECRET",
        eventId: "evt_1RealPaymentEvent",
        requestsPerSecond: 5000,
      }),
    },
  );
  const blockedResponse = await fetch(
    `${origin}/api/labs/api/rate-limit-idempotency/vuln/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: "flood-real-webhook-endpoint",
        decisions: ["replay-real-payment-event"],
      }),
    },
  );

  assert.equal(response.status, 200);
  assert.equal(blockedResponse.status, 403);
  assert.equal(eventCalls.length, 2);

  const serialized = JSON.stringify(eventCalls);
  assert.equal(serialized.includes("fixed-webhook-batch-quota-audit"), true);
  assert.equal(
    serialized.includes("virtual-unthrottled-replayable-batch"),
    true,
  );
  assert.equal(serialized.includes("payments.real-vendor.example"), false);
  assert.equal(serialized.includes("whsec_REALSIGNINGSECRET"), false);
  assert.equal(serialized.includes("evt_1RealPaymentEvent"), false);
  assert.equal(serialized.includes("5000"), false);
  assert.equal(serialized.includes("flood-real-webhook-endpoint"), false);
  assert.equal(serialized.includes("replay-real-payment-event"), false);
});

test("rate limit idempotency API returns 403 for the defense path", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    labEventLogsService: {
      recordLabEvent: async (input) => ({
        traceId: input.traceId ?? "generated-trace",
        persisted: true,
        labId: null,
      }),
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);
  const response = await fetch(
    `${origin}/api/labs/api/rate-limit-idempotency/fixed/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: rateLimitIdempotencyScenarioKey,
        decisions: [
          "enforce-quota-and-idempotency",
          "block-overload-and-replay",
        ],
      }),
    },
  );

  assert.equal(response.status, 403);
});

import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";
import {
  createSpearPhishingLabService,
  spearPhishingDefaultCaseKey,
  spearPhishingDefaultVerificationPolicyKey,
  type SpearPhishingResult,
} from "../src/services/spear-phishing-lab.js";

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

test("spear phishing service exposes vulnerable context-trust misjudgement", async () => {
  const service = createSpearPhishingLabService();

  const result = await service.reviewCase({
    userId: "1",
    variantKey: "vuln",
    caseKey: spearPhishingDefaultCaseKey,
    verificationPolicyKey: spearPhishingDefaultVerificationPolicyKey,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "spear-phishing-approval-chain-bypassed");
  assert.equal(result.decision, "accepted");
  assert.equal(result.assessment.riskIndicatorCount, 3);
  assert.equal(result.assessment.contextTrustBias, true);
  assert.equal(result.assessment.verificationApplied, false);
  assert.equal(result.caseSummary?.caseKey, "executive-invoice-approval");
  assert.equal(JSON.stringify(result).includes("emailBody"), false);
  assert.equal(JSON.stringify(result).includes("real-recipient"), false);
});

test("spear phishing service applies out-of-band confirmation in fixed variant", async () => {
  const service = createSpearPhishingLabService();

  const result = await service.reviewCase({
    userId: "1",
    variantKey: "fixed",
    caseKey: spearPhishingDefaultCaseKey,
    verificationPolicyKey: "approval-chain-review",
  });

  assert.equal(result.status, "blocked");
  assert.equal(
    result.signal,
    "spear-phishing-out-of-band-confirmation-required",
  );
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "spear-phishing-verification-required");
  assert.equal(result.assessment.verificationApplied, true);
  assert.equal(result.assessment.approvalChainRequired, true);
  assert.equal(result.assessment.outOfBandRequired, true);
  assert.equal(
    result.assessment.recommendedAction,
    "restore-approval-chain-before-action",
  );
});

test("spear phishing service rejects unknown case without echoing raw input", async () => {
  const service = createSpearPhishingLabService();
  const rawCaseKey = "real-executive-mailbox-request";

  const result = await service.reviewCase({
    userId: "1",
    variantKey: "vuln",
    caseKey: rawCaseKey,
    verificationPolicyKey: spearPhishingDefaultVerificationPolicyKey,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "spear-phishing-boundary-verified");
  assert.equal(result.decision, "blocked");
  assert.equal(result.caseKey, "blocked-case");
  assert.equal(result.blockedReason, "case-not-allowed");
  assert.equal(JSON.stringify(result).includes(rawCaseKey), false);
});

test("POST /api/labs/social/spear-phishing/:variant/review requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/social/spear-phishing/vuln/review`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        caseKey: spearPhishingDefaultCaseKey,
        verificationPolicyKey: spearPhishingDefaultVerificationPolicyKey,
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

test("POST /api/labs/social/spear-phishing/vuln/review records safe summary", async () => {
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
          labId: "26",
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/social/spear-phishing/vuln/review`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
        "x-lab-trace-id": "trace-spear-phishing-vuln",
      },
      body: JSON.stringify({
        caseKey: spearPhishingDefaultCaseKey,
        verificationPolicyKey: spearPhishingDefaultVerificationPolicyKey,
        emailBody: "raw-spear-phishing-content-should-not-appear",
        recipient: "real-recipient-should-not-appear",
        password: "secret-password-should-not-appear",
        token: "secret-token-should-not-appear",
        url: "https://example.invalid/should-not-appear",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: SpearPhishingResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "spear-phishing-approval-chain-bypassed");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-spear-phishing-vuln",
      userId: "1",
      labKey: "social.spear-phishing",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/social/spear-phishing/vuln/review",
      inputSummary: {
        caseKey: "executive-invoice-approval",
        verificationPolicyKey: "context-only",
        riskIndicatorCount: 3,
        riskIndicators: [
          "authority-pressure",
          "urgency-pressure",
          "approval-chain-bypass",
        ],
        matchedControlledCase: true,
        contextTrustBias: true,
        verificationApplied: false,
        approvalChainRequired: false,
        outOfBandRequired: false,
        recommendedAction: "surface-context-release-observed",
        riskLevel: "high",
        signal: "spear-phishing-approval-chain-bypassed",
      },
      decision: "accepted",
      signal: "spear-phishing-approval-chain-bypassed",
      statusCode: 200,
      message: body.result.message,
      riskLevel: "high",
    },
  ]);
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes(
      "raw-spear-phishing-content-should-not-appear",
    ),
    false,
  );
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes(
      "secret-password-should-not-appear",
    ),
    false,
  );
});

test("POST /api/labs/social/spear-phishing/fixed/review blocks risky case", async () => {
  const labEventLogCalls: LabEventInput[] = [];
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
          labId: "26",
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/social/spear-phishing/fixed/review`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        caseKey: "vendor-payment-change",
        verificationPolicyKey: "out-of-band-confirmation",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: SpearPhishingResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(
    body.result.signal,
    "spear-phishing-out-of-band-confirmation-required",
  );
  assert.deepEqual(labEventLogCalls[0], {
    traceId: undefined,
    userId: "1",
    labKey: "social.spear-phishing",
    variantKey: "fixed",
    phase: "defense",
    eventType: "blocked",
    actorPerspective: "attacker",
    method: "POST",
    path: "/api/labs/social/spear-phishing/fixed/review",
    inputSummary: {
      caseKey: "vendor-payment-change",
      verificationPolicyKey: "out-of-band-confirmation",
      riskIndicatorCount: 3,
      riskIndicators: [
        "business-context-trust",
        "payment-change-risk",
        "approval-chain-bypass",
      ],
      matchedControlledCase: true,
      contextTrustBias: false,
      verificationApplied: true,
      approvalChainRequired: false,
      outOfBandRequired: true,
      recommendedAction: "confirm-through-trusted-channel",
      riskLevel: "high",
      signal: "spear-phishing-out-of-band-confirmation-required",
    },
    decision: "blocked",
    signal: "spear-phishing-out-of-band-confirmation-required",
    statusCode: 403,
    message: body.result.message,
    riskLevel: "high",
  });
});

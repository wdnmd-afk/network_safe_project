import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";
import {
  createWhalingLabService,
  whalingDefaultCaseKey,
  whalingDefaultVerificationPolicyKey,
  type WhalingResult,
} from "../src/services/whaling-lab.js";

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

test("whaling service exposes vulnerable authority-context misjudgement", async () => {
  const service = createWhalingLabService();

  const result = await service.reviewCase({
    userId: "1",
    variantKey: "vuln",
    caseKey: whalingDefaultCaseKey,
    verificationPolicyKey: whalingDefaultVerificationPolicyKey,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "whaling-executive-authority-overweighted");
  assert.equal(result.decision, "accepted");
  assert.equal(result.assessment.riskIndicatorCount, 5);
  assert.equal(result.assessment.authorityContextBias, true);
  assert.equal(result.assessment.verificationApplied, false);
  assert.equal(result.caseSummary?.caseKey, "executive-wire-approval");
  assert.equal(JSON.stringify(result).includes("emailBody"), false);
  assert.equal(JSON.stringify(result).includes("paymentAccount"), false);
});

test("whaling service applies freeze and escalation in fixed variant", async () => {
  const service = createWhalingLabService();

  const result = await service.reviewCase({
    userId: "1",
    variantKey: "fixed",
    caseKey: whalingDefaultCaseKey,
    verificationPolicyKey: "payment-dual-approval",
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "whaling-payment-freeze-required");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "whaling-verification-required");
  assert.equal(result.assessment.verificationApplied, true);
  assert.equal(result.assessment.trustedChannelRequired, true);
  assert.equal(result.assessment.paymentFreezeRequired, true);
  assert.equal(
    result.assessment.recommendedAction,
    "freeze-payment-before-dual-approval",
  );
});

test("whaling service rejects unknown case without echoing raw input", async () => {
  const service = createWhalingLabService();
  const rawCaseKey = "real-board-member-payment-request";

  const result = await service.reviewCase({
    userId: "1",
    variantKey: "vuln",
    caseKey: rawCaseKey,
    verificationPolicyKey: whalingDefaultVerificationPolicyKey,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "whaling-boundary-verified");
  assert.equal(result.decision, "blocked");
  assert.equal(result.caseKey, "blocked-case");
  assert.equal(result.blockedReason, "case-not-allowed");
  assert.equal(JSON.stringify(result).includes(rawCaseKey), false);
});

test("POST /api/labs/social/whaling/:variant/review requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/social/whaling/vuln/review`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        caseKey: whalingDefaultCaseKey,
        verificationPolicyKey: whalingDefaultVerificationPolicyKey,
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

test("POST /api/labs/social/whaling/vuln/review records safe summary", async () => {
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
          labId: "27",
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/social/whaling/vuln/review`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
        "x-lab-trace-id": "trace-whaling-vuln",
      },
      body: JSON.stringify({
        caseKey: whalingDefaultCaseKey,
        verificationPolicyKey: whalingDefaultVerificationPolicyKey,
        emailBody: "raw-whaling-content-should-not-appear",
        executiveName: "real-executive-should-not-appear",
        organizationChart: "real-org-chart-should-not-appear",
        paymentAccount: "real-payment-account-should-not-appear",
        password: "secret-password-should-not-appear",
        token: "secret-token-should-not-appear",
        meetingInvite: "real-meeting-invite-should-not-appear",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: WhalingResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "whaling-executive-authority-overweighted");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-whaling-vuln",
      userId: "1",
      labKey: "social.whaling",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/social/whaling/vuln/review",
      inputSummary: {
        caseKey: "executive-wire-approval",
        verificationPolicyKey: "authority-context-only",
        riskIndicatorCount: 5,
        riskIndicators: [
          "executive-authority-pressure",
          "confidentiality-pressure",
          "payment-urgency",
          "approval-chain-bypass",
          "trusted-channel-missing",
        ],
        matchedControlledCase: true,
        authorityContextBias: true,
        verificationApplied: false,
        trustedChannelRequired: false,
        paymentFreezeRequired: false,
        legalBoardReviewRequired: false,
        leastPrivilegeRequired: false,
        recommendedAction: "authority-context-release-observed",
        riskLevel: "critical",
        signal: "whaling-executive-authority-overweighted",
      },
      decision: "accepted",
      signal: "whaling-executive-authority-overweighted",
      statusCode: 200,
      message: body.result.message,
      riskLevel: "critical",
    },
  ]);

  const safeSummary = JSON.stringify(labEventLogCalls[0]?.inputSummary);

  assert.equal(safeSummary.includes("raw-whaling-content-should-not-appear"), false);
  assert.equal(safeSummary.includes("real-executive-should-not-appear"), false);
  assert.equal(safeSummary.includes("real-org-chart-should-not-appear"), false);
  assert.equal(safeSummary.includes("real-payment-account-should-not-appear"), false);
  assert.equal(safeSummary.includes("secret-password-should-not-appear"), false);
  assert.equal(safeSummary.includes("real-meeting-invite-should-not-appear"), false);
});

test("POST /api/labs/social/whaling/fixed/review blocks risky case", async () => {
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
          labId: "27",
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/social/whaling/fixed/review`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        caseKey: "legal-settlement-transfer",
        verificationPolicyKey: "freeze-and-escalate",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: WhalingResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(body.result.signal, "whaling-payment-freeze-required");
  assert.deepEqual(labEventLogCalls[0], {
    traceId: undefined,
    userId: "1",
    labKey: "social.whaling",
    variantKey: "fixed",
    phase: "defense",
    eventType: "blocked",
    actorPerspective: "attacker",
    method: "POST",
    path: "/api/labs/social/whaling/fixed/review",
    inputSummary: {
      caseKey: "legal-settlement-transfer",
      verificationPolicyKey: "freeze-and-escalate",
      riskIndicatorCount: 5,
      riskIndicators: [
        "legal-settlement-pressure",
        "confidentiality-pressure",
        "payment-urgency",
        "approval-chain-bypass",
        "trusted-channel-missing",
      ],
      matchedControlledCase: true,
      authorityContextBias: false,
      verificationApplied: true,
      trustedChannelRequired: true,
      paymentFreezeRequired: true,
      legalBoardReviewRequired: true,
      leastPrivilegeRequired: true,
      recommendedAction: "freeze-escalate-and-recap",
      riskLevel: "critical",
      signal: "whaling-payment-freeze-required",
    },
    decision: "blocked",
    signal: "whaling-payment-freeze-required",
    statusCode: 403,
    message: body.result.message,
    riskLevel: "critical",
  });
});

import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";
import {
  createPhishingLabService,
  phishingDefaultCaseKey,
  phishingDefaultDefenseChecklistKey,
  phishingDefaultReviewModeKey,
  type PhishingResult,
} from "../src/services/phishing-lab.js";

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

test("phishing service exposes vulnerable surface-only misjudgement", async () => {
  const service = createPhishingLabService();

  const result = await service.reviewCase({
    userId: "1",
    variantKey: "vuln",
    caseKey: phishingDefaultCaseKey,
    reviewModeKey: phishingDefaultReviewModeKey,
    defenseChecklistKey: phishingDefaultDefenseChecklistKey,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "phishing-lookalike-domain-overlooked");
  assert.equal(result.decision, "accepted");
  assert.equal(result.inspection.indicatorCount, 3);
  assert.equal(result.inspection.surfaceBias, true);
  assert.equal(result.inspection.checklistApplied, false);
  assert.equal(result.caseSummary?.caseKey, "account-security-alert");
  assert.equal(JSON.stringify(result).includes("emailBody"), false);
  assert.equal(JSON.stringify(result).includes("real-recipient"), false);
});

test("phishing service applies reporting flow in fixed variant", async () => {
  const service = createPhishingLabService();

  const result = await service.reviewCase({
    userId: "1",
    variantKey: "fixed",
    caseKey: phishingDefaultCaseKey,
    reviewModeKey: "reporting-flow",
    defenseChecklistKey: "report-isolate-confirm",
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "phishing-reporting-flow-applied");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "phishing-risk-checklist-applied");
  assert.equal(result.inspection.checklistApplied, true);
  assert.equal(result.inspection.recommendedAction, "report-isolate-and-confirm");
});

test("phishing service keeps fixed safe message available", async () => {
  const service = createPhishingLabService();

  const result = await service.reviewCase({
    userId: "1",
    variantKey: "fixed",
    caseKey: "internal-security-newsletter",
    reviewModeKey: "indicator-review",
    defenseChecklistKey: "safe-release-check",
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "phishing-safe-message-accepted");
  assert.equal(result.decision, "accepted");
  assert.equal(result.inspection.indicatorCount, 0);
  assert.deepEqual(result.inspection.riskIndicators, []);
});

test("phishing service rejects unknown case without echoing raw input", async () => {
  const service = createPhishingLabService();
  const rawCaseKey = "real-inbox-message-raw";

  const result = await service.reviewCase({
    userId: "1",
    variantKey: "vuln",
    caseKey: rawCaseKey,
    reviewModeKey: phishingDefaultReviewModeKey,
    defenseChecklistKey: phishingDefaultDefenseChecklistKey,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "phishing-case-boundary-verified");
  assert.equal(result.decision, "blocked");
  assert.equal(result.caseKey, "blocked-case");
  assert.equal(result.blockedReason, "case-not-allowed");
  assert.equal(JSON.stringify(result).includes(rawCaseKey), false);
});

test("POST /api/labs/social/phishing/:variant/review requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/social/phishing/vuln/review`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        caseKey: phishingDefaultCaseKey,
        reviewModeKey: phishingDefaultReviewModeKey,
        defenseChecklistKey: phishingDefaultDefenseChecklistKey,
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

test("POST /api/labs/social/phishing/vuln/review records safe summary", async () => {
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
          labId: "23",
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/social/phishing/vuln/review`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
        "x-lab-trace-id": "trace-phishing-vuln",
      },
      body: JSON.stringify({
        caseKey: phishingDefaultCaseKey,
        reviewModeKey: phishingDefaultReviewModeKey,
        defenseChecklistKey: phishingDefaultDefenseChecklistKey,
        emailBody: "raw-mail-content-should-not-appear",
        recipient: "real-recipient-should-not-appear",
        password: "secret-password-should-not-appear",
        token: "secret-token-should-not-appear",
        url: "https://example.invalid/should-not-appear",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: PhishingResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "phishing-lookalike-domain-overlooked");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-phishing-vuln",
      userId: "1",
      labKey: "social.phishing",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/social/phishing/vuln/review",
      inputSummary: {
        caseKey: "account-security-alert",
        reviewModeKey: "surface-only",
        defenseChecklistKey: "none",
        indicatorCount: 3,
        riskIndicators: [
          "domain-lookalike",
          "credential-request",
          "urgency-signal",
        ],
        matchedControlledCase: true,
        surfaceBias: true,
        checklistApplied: false,
        recommendedAction: "surface-release-observed",
        riskLevel: "high",
        signal: "phishing-lookalike-domain-overlooked",
      },
      decision: "accepted",
      signal: "phishing-lookalike-domain-overlooked",
      statusCode: 200,
      message: body.result.message,
      riskLevel: "high",
    },
  ]);
  assert.equal(
    JSON.stringify(labEventLogCalls[0]?.inputSummary).includes(
      "raw-mail-content-should-not-appear",
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

test("POST /api/labs/social/phishing/fixed/review blocks risky case", async () => {
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
          labId: "23",
        };
      },
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/social/phishing/fixed/review`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        caseKey: phishingDefaultCaseKey,
        reviewModeKey: "reporting-flow",
        defenseChecklistKey: "report-isolate-confirm",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: PhishingResult;
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, "blocked");
  assert.equal(body.result.signal, "phishing-reporting-flow-applied");
  assert.deepEqual(labEventLogCalls[0], {
    traceId: undefined,
    userId: "1",
    labKey: "social.phishing",
    variantKey: "fixed",
    phase: "defense",
    eventType: "blocked",
    actorPerspective: "attacker",
    method: "POST",
    path: "/api/labs/social/phishing/fixed/review",
    inputSummary: {
      caseKey: "account-security-alert",
      reviewModeKey: "reporting-flow",
      defenseChecklistKey: "report-isolate-confirm",
      indicatorCount: 3,
      riskIndicators: [
        "domain-lookalike",
        "credential-request",
        "urgency-signal",
      ],
      matchedControlledCase: true,
      surfaceBias: false,
      checklistApplied: true,
      recommendedAction: "report-isolate-and-confirm",
      riskLevel: "high",
      signal: "phishing-reporting-flow-applied",
    },
    decision: "blocked",
    signal: "phishing-reporting-flow-applied",
    statusCode: 403,
    message: body.result.message,
    riskLevel: "high",
  });
});

test("POST /api/labs/social/phishing/fixed/review returns safe message", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => ({
        traceId: input.traceId ?? "generated-trace",
        persisted: true,
        labId: "23",
      }),
      listUserLabEventLogs: async () => [],
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/social/phishing/fixed/review`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        caseKey: "internal-security-newsletter",
        reviewModeKey: "indicator-review",
        defenseChecklistKey: "safe-release-check",
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: PhishingResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "phishing-safe-message-accepted");
  assert.equal(body.result.inspection.indicatorCount, 0);
});

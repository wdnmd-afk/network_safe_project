import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import type { LabEventInput } from "../src/services/lab-event-logs.js";
import {
  createBruteForceLabService,
  type BruteForceResult,
} from "../src/services/brute-force-lab.js";

const demoUser = {
  id: "1",
  username: "demo_user",
  displayName: "演示用户",
  role: "member",
  status: "active",
};

const bruteForceLabService = createBruteForceLabService();
const bruteForceSamples = bruteForceLabService.getSamples();

async function listen(app: ReturnType<typeof createApp>) {
  const server = app.listen(0);
  const address = server.address();

  assert.ok(address && typeof address === "object");

  after(() => {
    server.close();
  });

  return `http://127.0.0.1:${address.port}`;
}

test("brute force service accepts a normal single candidate in both variants", async () => {
  const vulnerableResult = await bruteForceLabService.submitAttempt({
    userId: "1",
    variantKey: "vuln",
    targetUsername: bruteForceSamples.normalTargetUsername,
    passwordCandidates: bruteForceSamples.normalPasswordCandidates,
  });
  const fixedResult = await bruteForceLabService.submitAttempt({
    userId: "1",
    variantKey: "fixed",
    targetUsername: bruteForceSamples.normalTargetUsername,
    passwordCandidates: bruteForceSamples.normalPasswordCandidates,
  });

  assert.equal(vulnerableResult.status, "ok");
  assert.equal(vulnerableResult.signal, "brute-force-normal-login-accepted");
  assert.equal(vulnerableResult.inspection.attackPattern, false);
  assert.equal(fixedResult.status, "ok");
  assert.equal(fixedResult.signal, "brute-force-normal-login-accepted");
});

test("brute force service guesses the teaching password in vulnerable variant", async () => {
  const result = await bruteForceLabService.submitAttempt({
    userId: "1",
    variantKey: "vuln",
    targetUsername: bruteForceSamples.attackTargetUsername,
    passwordCandidates: bruteForceSamples.attackPasswordCandidates,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.signal, "brute-force-password-guessed");
  assert.equal(result.decision, "accepted");
  assert.equal(result.inspection.attackPattern, true);
  assert.equal(result.inspection.matchedAttemptNumber, 4);
  assert.equal(result.inspection.failedAttemptsBeforeMatch, 3);
  assert.equal(result.teachingAccount?.username, "training-user");
});

test("brute force service applies rate limit in fixed variant", async () => {
  const result = await bruteForceLabService.submitAttempt({
    userId: "1",
    variantKey: "fixed",
    targetUsername: bruteForceSamples.attackTargetUsername,
    passwordCandidates: bruteForceSamples.attackPasswordCandidates,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.signal, "brute-force-rate-limit-blocked");
  assert.equal(result.decision, "blocked");
  assert.equal(result.blockedReason, "failed-attempt-threshold-exceeded");
  assert.equal(result.inspection.rateLimitApplied, true);
  assert.equal(result.inspection.acceptedCredential, false);
  assert.equal(result.teachingAccount, null);
});

test("POST /api/labs/auth/brute-force/:variant/attempt requires login", async () => {
  const app = createApp();
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/auth/brute-force/vuln/attempt`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        targetUsername: bruteForceSamples.normalTargetUsername,
        passwordCandidates: bruteForceSamples.normalPasswordCandidates,
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

test("POST /api/labs/auth/brute-force/vuln/attempt records attack event logs", async () => {
  const labEventLogCalls: LabEventInput[] = [];
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async (token: string) =>
        token === "local-session-token" ? demoUser : null,
    },
    bruteForceLabService: {
      getSamples: () => bruteForceSamples,
      submitAttempt: async (): Promise<BruteForceResult> => ({
        status: "ok",
        variantKey: "vuln",
        targetUsername: bruteForceSamples.attackTargetUsername,
        teachingAccount: {
          username: "training-user",
          displayName: "口令安全教学账号",
          accessSummary: "virtual account only",
        },
        inspection: {
          targetUsernameLength: bruteForceSamples.attackTargetUsername.length,
          targetExists: true,
          candidateCount: bruteForceSamples.attackPasswordCandidates.length,
          maxAllowedCandidates: 5,
          lockoutThreshold: 3,
          matchedAttemptNumber: 4,
          failedAttemptsBeforeMatch: 3,
          thresholdExceeded: true,
          rateLimitApplied: false,
          acceptedCredential: true,
          attackPattern: true,
          currentUserId: "1",
        },
        signal: "brute-force-password-guessed",
        decision: "accepted",
        message: "password guessed",
        nextStep: "compare fixed variant",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => {
        labEventLogCalls.push(input);

        return {
          traceId: input.traceId ?? "generated-trace",
          persisted: true,
          labId: "12",
        };
      },
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/auth/brute-force/vuln/attempt`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
        "x-lab-trace-id": "trace-brute-force-vuln",
      },
      body: JSON.stringify({
        targetUsername: bruteForceSamples.attackTargetUsername,
        passwordCandidates: bruteForceSamples.attackPasswordCandidates,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: BruteForceResult;
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.signal, "brute-force-password-guessed");
  assert.deepEqual(labEventLogCalls, [
    {
      traceId: "trace-brute-force-vuln",
      userId: "1",
      labKey: "auth.brute-force",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      method: "POST",
      path: "/api/labs/auth/brute-force/vuln/attempt",
      inputSummary: {
        targetUsernameLength: bruteForceSamples.attackTargetUsername.length,
        targetUsernamePreview: "controlled-brute-force-target",
        targetExists: true,
        candidateCount: bruteForceSamples.attackPasswordCandidates.length,
        maxAllowedCandidates: 5,
        lockoutThreshold: 3,
        matchedAttemptNumber: 4,
        failedAttemptsBeforeMatch: 3,
        thresholdExceeded: true,
        rateLimitApplied: false,
        acceptedCredential: true,
        attackPattern: true,
        currentUserId: "1",
        signal: "brute-force-password-guessed",
      },
      decision: "accepted",
      signal: "brute-force-password-guessed",
      statusCode: 200,
      message: "password guessed",
      riskLevel: "high",
    },
  ]);
});

test("POST /api/labs/auth/brute-force/fixed/attempt returns rate limit response", async () => {
  const app = createApp({
    authService: {
      login: async () => null,
      getCurrentUser: async () => demoUser,
    },
    bruteForceLabService: {
      getSamples: () => bruteForceSamples,
      submitAttempt: async (): Promise<BruteForceResult> => ({
        status: "blocked",
        variantKey: "fixed",
        targetUsername: bruteForceSamples.attackTargetUsername,
        teachingAccount: null,
        inspection: {
          targetUsernameLength: bruteForceSamples.attackTargetUsername.length,
          targetExists: true,
          candidateCount: bruteForceSamples.attackPasswordCandidates.length,
          maxAllowedCandidates: 5,
          lockoutThreshold: 3,
          matchedAttemptNumber: 4,
          failedAttemptsBeforeMatch: 3,
          thresholdExceeded: true,
          rateLimitApplied: true,
          acceptedCredential: false,
          attackPattern: true,
          currentUserId: "1",
        },
        signal: "brute-force-rate-limit-blocked",
        decision: "blocked",
        message: "rate limit applied",
        nextStep: "review logs",
        blockedReason: "failed-attempt-threshold-exceeded",
      }),
    },
    labEventLogsService: {
      recordLabEvent: async (input: LabEventInput) => ({
        traceId: input.traceId ?? "generated-trace",
        persisted: true,
        labId: "12",
      }),
    },
  });
  const origin = await listen(app);

  const response = await fetch(
    `${origin}/api/labs/auth/brute-force/fixed/attempt`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        targetUsername: bruteForceSamples.attackTargetUsername,
        passwordCandidates: bruteForceSamples.attackPasswordCandidates,
      }),
    },
  );
  const body = (await response.json()) as {
    status: string;
    result: BruteForceResult;
  };

  assert.equal(response.status, 429);
  assert.equal(body.status, "blocked");
  assert.equal(body.result.signal, "brute-force-rate-limit-blocked");
});

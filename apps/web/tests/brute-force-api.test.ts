import { afterEach, describe, expect, it, vi } from "vitest";

import { submitBruteForceAttempt } from "../src/api/brute-force-lab";
import {
  attackPasswordCandidatesSample,
  attackTargetUsernameSample,
  normalPasswordCandidatesSample,
  normalTargetUsernameSample,
} from "../src/labs/brute-force";

describe("brute force lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts candidate payload to the selected variant", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            targetUsername: normalTargetUsernameSample,
            teachingAccount: {
              username: "training-user",
              displayName: "口令安全教学账号",
              accessSummary: "virtual account only",
            },
            inspection: {
              targetUsernameLength: normalTargetUsernameSample.length,
              targetExists: true,
              candidateCount: 1,
              maxAllowedCandidates: 5,
              lockoutThreshold: 3,
              matchedAttemptNumber: 1,
              failedAttemptsBeforeMatch: 0,
              thresholdExceeded: false,
              rateLimitApplied: false,
              acceptedCredential: true,
              attackPattern: false,
              currentUserId: "1",
            },
            signal: "brute-force-normal-login-accepted",
            decision: "accepted",
            message: "normal login accepted",
            nextStep: "try attack sample",
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const result = await submitBruteForceAttempt(
      "vuln",
      "local-session-token",
      {
        targetUsername: normalTargetUsernameSample,
        passwordCandidates: normalPasswordCandidatesSample,
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/auth/brute-force/vuln/attempt",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          targetUsername: normalTargetUsernameSample,
          passwordCandidates: normalPasswordCandidatesSample,
        }),
      },
    );
    expect(result.result.signal).toBe("brute-force-normal-login-accepted");
  });

  it("returns blocked response body for fixed variant attack sample", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            variantKey: "fixed",
            targetUsername: attackTargetUsernameSample,
            teachingAccount: null,
            inspection: {
              targetUsernameLength: attackTargetUsernameSample.length,
              targetExists: true,
              candidateCount: attackPasswordCandidatesSample.length,
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
          },
        }),
        {
          status: 429,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const result = await submitBruteForceAttempt(
      "fixed",
      "local-session-token",
      {
        targetUsername: attackTargetUsernameSample,
        passwordCandidates: attackPasswordCandidatesSample,
      },
    );

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe("brute-force-rate-limit-blocked");
    expect(result.result.inspection.rateLimitApplied).toBe(true);
  });
});

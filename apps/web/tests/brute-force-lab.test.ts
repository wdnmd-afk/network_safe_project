import { describe, expect, it } from "vitest";

import type { BruteForceResult } from "../src/api/brute-force-lab";
import {
  attackPasswordCandidatesSample,
  attackTargetUsernameSample,
  createBruteForceLearningProgress,
  createBruteForceVerificationRecord,
  formatBruteForceSignal,
  getBruteForceVariantConfig,
  normalPasswordCandidatesSample,
  normalTargetUsernameSample,
} from "../src/labs/brute-force";

describe("暴力破解纵向实验模型", () => {
  it("为漏洞版和修复版提供不同教学信号", () => {
    expect(getBruteForceVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      badge: "没有失败阈值，持续检查候选口令",
    });
    expect(getBruteForceVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      badge: "连续失败达到阈值后触发节流",
    });
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(
      createBruteForceLearningProgress(getBruteForceVariantConfig("vuln")),
    ).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 暴力破解漏洞版",
    });
  });

  it("生成漏洞版和修复版验证记录载荷", () => {
    const vulnerableResult: BruteForceResult = {
      status: "ok",
      variantKey: "vuln",
      targetUsername: attackTargetUsernameSample,
      teachingAccount: {
        username: "training-user",
        displayName: "口令安全教学账号",
        accessSummary: "virtual account only",
      },
      inspection: {
        targetUsernameLength: attackTargetUsernameSample.length,
        targetExists: true,
        candidateCount: attackPasswordCandidatesSample.length,
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
      nextStep: "compare fixed",
    };
    const fixedResult: BruteForceResult = {
      ...vulnerableResult,
      status: "blocked",
      variantKey: "fixed",
      teachingAccount: null,
      inspection: {
        ...vulnerableResult.inspection,
        rateLimitApplied: true,
        acceptedCredential: false,
      },
      signal: "brute-force-rate-limit-blocked",
      decision: "blocked",
      blockedReason: "failed-attempt-threshold-exceeded",
    };

    expect(
      createBruteForceVerificationRecord(
        getBruteForceVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary:
        "漏洞版没有失败次数阈值，连续候选口令最终猜中了虚拟教学账号。",
      details: {
        signal: "brute-force-password-guessed",
        targetUsername: attackTargetUsernameSample,
        candidateCount: 4,
        matchedAttemptNumber: 4,
        failedAttemptsBeforeMatch: 3,
        rateLimitApplied: false,
      },
    });
    expect(
      createBruteForceVerificationRecord(
        getBruteForceVariantConfig("fixed"),
        fixedResult,
      ),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary:
        "修复版在连续失败达到阈值后触发节流，后续候选口令没有继续被检查。",
      details: {
        signal: "brute-force-rate-limit-blocked",
        targetUsername: attackTargetUsernameSample,
        candidateCount: 4,
        matchedAttemptNumber: 4,
        failedAttemptsBeforeMatch: 3,
        rateLimitApplied: true,
      },
    });
  });

  it("暴露本机受控口令样例与信号文案", () => {
    expect(normalTargetUsernameSample).toBe("training-user");
    expect(normalPasswordCandidatesSample).toEqual(["training-login-weak"]);
    expect(attackPasswordCandidatesSample).toEqual([
      "summer2024",
      "password123",
      "letmein",
      "training-login-weak",
    ]);
    expect(formatBruteForceSignal("brute-force-password-guessed")).toBe(
      "漏洞版连续猜测命中了虚拟账号",
    );
  });
});

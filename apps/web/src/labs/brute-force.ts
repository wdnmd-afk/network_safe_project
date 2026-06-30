import type {
  BruteForceResult,
  BruteForceSignal,
  BruteForceVariantKey,
} from "../api/brute-force-lab";

export type { BruteForceVariantKey };

export type BruteForceVariantConfig = {
  key: BruteForceVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
};

export type BruteForceLearningProgressInput = {
  variantKey: BruteForceVariantKey;
  status: "in-progress";
  notes: string;
};

export type BruteForceVerificationRecordInput = {
  variantKey: BruteForceVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: BruteForceSignal;
    targetUsername: string;
    candidateCount: number;
    matchedAttemptNumber: number | null;
    failedAttemptsBeforeMatch: number;
    rateLimitApplied: boolean;
  };
};

export const normalTargetUsernameSample = "training-user";
export const normalPasswordCandidatesSample = ["training-login-weak"];
export const attackTargetUsernameSample = "training-user";
export const attackPasswordCandidatesSample = [
  "summer2024",
  "password123",
  "letmein",
  "training-login-weak",
];

const bruteForceVariantConfigs: Record<
  BruteForceVariantKey,
  BruteForceVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "暴力破解漏洞版",
    badge: "没有失败阈值，持续检查候选口令",
    explanation:
      "漏洞版模拟登录口令检查器没有失败次数限制。攻击者连续提交候选口令后，系统会一直检查到猜中虚拟教学账号。",
    expectedSignal:
      "提交连续猜测样例后应出现 brute-force-password-guessed 信号。",
  },
  fixed: {
    key: "fixed",
    title: "暴力破解修复版",
    badge: "连续失败达到阈值后触发节流",
    explanation:
      "修复版统计连续失败次数。达到 3 次失败后，系统触发节流并停止继续检查后续候选口令，正常单次正确登录仍然可用。",
    expectedSignal:
      "提交连续猜测样例后应出现 brute-force-rate-limit-blocked 信号。",
  },
};

export function getBruteForceVariantConfig(variant: BruteForceVariantKey) {
  return bruteForceVariantConfigs[variant];
}

export function createBruteForceLearningProgress(
  config: BruteForceVariantConfig,
): BruteForceLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createBruteForceVerificationRecord(
  config: BruteForceVariantConfig,
  result: BruteForceResult,
): BruteForceVerificationRecordInput {
  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary:
        "漏洞版没有失败次数阈值，连续候选口令最终猜中了虚拟教学账号。",
      details: {
        signal: result.signal,
        targetUsername: result.targetUsername,
        candidateCount: result.inspection.candidateCount,
        matchedAttemptNumber: result.inspection.matchedAttemptNumber,
        failedAttemptsBeforeMatch: result.inspection.failedAttemptsBeforeMatch,
        rateLimitApplied: result.inspection.rateLimitApplied,
      },
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary:
      "修复版在连续失败达到阈值后触发节流，后续候选口令没有继续被检查。",
    details: {
      signal: result.signal,
      targetUsername: result.targetUsername,
      candidateCount: result.inspection.candidateCount,
      matchedAttemptNumber: result.inspection.matchedAttemptNumber,
      failedAttemptsBeforeMatch: result.inspection.failedAttemptsBeforeMatch,
      rateLimitApplied: result.inspection.rateLimitApplied,
    },
  };
}

export function formatBruteForceSignal(signal: BruteForceSignal) {
  const labels: Record<BruteForceSignal, string> = {
    "brute-force-normal-login-accepted": "正常单次教学登录被接受",
    "brute-force-password-guessed": "漏洞版连续猜测命中了虚拟账号",
    "brute-force-rate-limit-blocked": "修复版触发失败阈值并节流",
    "brute-force-credentials-rejected": "候选口令没有匹配虚拟账号",
  };

  return labels[signal];
}

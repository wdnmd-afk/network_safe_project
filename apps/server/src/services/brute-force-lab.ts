export type BruteForceVariantKey = "vuln" | "fixed";

export type BruteForceSignal =
  | "brute-force-normal-login-accepted"
  | "brute-force-password-guessed"
  | "brute-force-rate-limit-blocked"
  | "brute-force-credentials-rejected";

export type BruteForceStatus = "ok" | "blocked" | "failed";

export type BruteForceInput = {
  userId: string;
  variantKey: BruteForceVariantKey;
  targetUsername: string;
  passwordCandidates: string[];
};

export type BruteForceTeachingAccount = {
  username: string;
  displayName: string;
  accessSummary: string;
};

export type BruteForceInspection = {
  targetUsernameLength: number;
  targetExists: boolean;
  candidateCount: number;
  maxAllowedCandidates: number;
  lockoutThreshold: number;
  matchedAttemptNumber: number | null;
  failedAttemptsBeforeMatch: number;
  thresholdExceeded: boolean;
  rateLimitApplied: boolean;
  acceptedCredential: boolean;
  attackPattern: boolean;
  currentUserId: string;
};

export type BruteForceResult = {
  status: BruteForceStatus;
  variantKey: BruteForceVariantKey;
  targetUsername: string;
  teachingAccount: BruteForceTeachingAccount | null;
  inspection: BruteForceInspection;
  signal: BruteForceSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type BruteForceLabSamples = {
  normalTargetUsername: string;
  normalPasswordCandidates: string[];
  attackTargetUsername: string;
  attackPasswordCandidates: string[];
};

export type BruteForceLabService = {
  submitAttempt(input: BruteForceInput): Promise<BruteForceResult>;
  getSamples(): BruteForceLabSamples;
};

const maxAllowedCandidates = 5;
const lockoutThreshold = 3;

const teachingAccount = {
  username: "training-user",
  displayName: "口令安全教学账号",
  password: "training-login-weak",
  accessSummary: "仅用于暴力破解实验观察的虚拟账号，不是真实平台账号。",
};

const bruteForceSamples: BruteForceLabSamples = {
  normalTargetUsername: teachingAccount.username,
  normalPasswordCandidates: [teachingAccount.password],
  attackTargetUsername: teachingAccount.username,
  attackPasswordCandidates: [
    "summer2024",
    "password123",
    "letmein",
    teachingAccount.password,
  ],
};

function normalizeCandidates(candidates: string[]) {
  return candidates.map((candidate) => candidate.trim()).filter(Boolean);
}

function findMatchedAttemptNumber(input: {
  targetUsername: string;
  passwordCandidates: string[];
}) {
  if (input.targetUsername !== teachingAccount.username) {
    return null;
  }

  const matchedIndex = input.passwordCandidates.findIndex(
    (candidate) => candidate === teachingAccount.password,
  );

  return matchedIndex >= 0 ? matchedIndex + 1 : null;
}

function createInspection(input: {
  userId: string;
  targetUsername: string;
  passwordCandidates: string[];
  matchedAttemptNumber: number | null;
  rateLimitApplied: boolean;
  acceptedCredential: boolean;
}): BruteForceInspection {
  const failedAttemptsBeforeMatch =
    input.matchedAttemptNumber === null
      ? input.passwordCandidates.length
      : input.matchedAttemptNumber - 1;

  return {
    targetUsernameLength: input.targetUsername.length,
    targetExists: input.targetUsername === teachingAccount.username,
    candidateCount: input.passwordCandidates.length,
    maxAllowedCandidates,
    lockoutThreshold,
    matchedAttemptNumber: input.matchedAttemptNumber,
    failedAttemptsBeforeMatch,
    thresholdExceeded: failedAttemptsBeforeMatch >= lockoutThreshold,
    rateLimitApplied: input.rateLimitApplied,
    acceptedCredential: input.acceptedCredential,
    attackPattern: input.passwordCandidates.length > 1,
    currentUserId: input.userId,
  };
}

function getMessage(signal: BruteForceSignal) {
  const messages: Record<BruteForceSignal, string> = {
    "brute-force-normal-login-accepted":
      "单次正确教学登录被接受，正常业务流程可用。",
    "brute-force-password-guessed":
      "漏洞版没有失败次数阈值，连续候选口令最终猜中了虚拟教学账号。",
    "brute-force-rate-limit-blocked":
      "修复版在连续失败达到阈值后触发节流，后续候选口令没有继续被检查。",
    "brute-force-credentials-rejected":
      "候选口令没有匹配虚拟教学账号，登录尝试失败。",
  };

  return messages[signal];
}

function getNextStep(signal: BruteForceSignal) {
  const nextSteps: Record<BruteForceSignal, string> = {
    "brute-force-normal-login-accepted":
      "填入连续猜测样例，观察漏洞版为什么会在多次失败后仍继续检查候选口令。",
    "brute-force-password-guessed":
      "切换到修复版提交同样样例，观察失败阈值如何阻断后续猜测。",
    "brute-force-rate-limit-blocked":
      "回到日志摘要，重点观察 failedAttemptsBeforeMatch、thresholdExceeded 和 rateLimitApplied。",
    "brute-force-credentials-rejected":
      "使用正常样例或连续猜测样例继续观察不同变体的判定差异。",
  };

  return nextSteps[signal];
}

function toTeachingAccount(): BruteForceTeachingAccount {
  return {
    username: teachingAccount.username,
    displayName: teachingAccount.displayName,
    accessSummary: teachingAccount.accessSummary,
  };
}

export function createBruteForceLabService(): BruteForceLabService {
  return {
    getSamples() {
      return bruteForceSamples;
    },

    async submitAttempt(input) {
      const targetUsername = input.targetUsername.trim();
      const passwordCandidates = normalizeCandidates(input.passwordCandidates).slice(
        0,
        maxAllowedCandidates,
      );
      const matchedAttemptNumber = findMatchedAttemptNumber({
        targetUsername,
        passwordCandidates,
      });
      const failedAttemptsBeforeMatch =
        matchedAttemptNumber === null
          ? passwordCandidates.length
          : matchedAttemptNumber - 1;
      const thresholdExceeded = failedAttemptsBeforeMatch >= lockoutThreshold;
      const rateLimitApplied =
        input.variantKey === "fixed" && thresholdExceeded;
      const acceptedCredential = Boolean(
        matchedAttemptNumber && !rateLimitApplied,
      );
      const inspection = createInspection({
        userId: input.userId,
        targetUsername,
        passwordCandidates,
        matchedAttemptNumber,
        rateLimitApplied,
        acceptedCredential,
      });

      if (rateLimitApplied) {
        return {
          status: "blocked",
          variantKey: input.variantKey,
          targetUsername,
          teachingAccount: null,
          inspection,
          signal: "brute-force-rate-limit-blocked",
          decision: "blocked",
          message: getMessage("brute-force-rate-limit-blocked"),
          nextStep: getNextStep("brute-force-rate-limit-blocked"),
          blockedReason: "failed-attempt-threshold-exceeded",
        };
      }

      if (acceptedCredential) {
        const signal =
          inspection.attackPattern && input.variantKey === "vuln"
            ? "brute-force-password-guessed"
            : "brute-force-normal-login-accepted";

        return {
          status: "ok",
          variantKey: input.variantKey,
          targetUsername,
          teachingAccount: toTeachingAccount(),
          inspection,
          signal,
          decision: "accepted",
          message: getMessage(signal),
          nextStep: getNextStep(signal),
        };
      }

      return {
        status: "failed",
        variantKey: input.variantKey,
        targetUsername,
        teachingAccount: null,
        inspection,
        signal: "brute-force-credentials-rejected",
        decision: "failed",
        message: getMessage("brute-force-credentials-rejected"),
        nextStep: getNextStep("brute-force-credentials-rejected"),
      };
    },
  };
}

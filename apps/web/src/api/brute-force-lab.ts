export type BruteForceVariantKey = "vuln" | "fixed";

export type BruteForceSignal =
  | "brute-force-normal-login-accepted"
  | "brute-force-password-guessed"
  | "brute-force-rate-limit-blocked"
  | "brute-force-credentials-rejected";

export type BruteForceInput = {
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
  status: "ok" | "blocked" | "failed";
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

export type BruteForceResponse = {
  status: "ok" | "blocked" | "failed";
  result: BruteForceResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

function isBruteForceResponse(value: unknown): value is BruteForceResponse {
  return Boolean(
    value &&
      typeof value === "object" &&
      "result" in value &&
      value.result &&
      typeof value.result === "object",
  );
}

export async function submitBruteForceAttempt(
  variantKey: BruteForceVariantKey,
  token: string,
  input: BruteForceInput,
) {
  const response = await fetch(
    `/api/labs/auth/brute-force/${variantKey}/attempt`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  if (
    response.status === 400 ||
    response.status === 401 ||
    response.status === 404 ||
    response.status === 429
  ) {
    const body = (await response.json()) as unknown;

    if (isBruteForceResponse(body)) {
      return body;
    }

    throw new Error(`request failed with status ${response.status}`);
  }

  return readJson<BruteForceResponse>(response);
}

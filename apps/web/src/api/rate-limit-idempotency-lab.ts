export type RateLimitIdempotencyVariantKey = "vuln" | "fixed";
export type RateLimitIdempotencyOutcome = "risk" | "fix" | "normal";

export type RateLimitIdempotencyCard = {
  key: string;
  kind: "asset" | "timeline" | "evidence" | "policy";
  title: string;
  detail: string;
};

export type RateLimitIdempotencyOption = {
  key: string;
  label: string;
  outcome: RateLimitIdempotencyOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
  nextStepKey: string | null;
  scoreDeltas?: Record<string, number>;
};

export type RateLimitIdempotencyStep = {
  key: string;
  order: number;
  title: string;
  prompt: string;
  riskSignal: string;
  options: RateLimitIdempotencyOption[];
};

export type RateLimitIdempotencyCase = {
  key: string;
  title: string;
  description: string;
  assets?: RateLimitIdempotencyCard[];
  evidence?: RateLimitIdempotencyCard[];
  initialStepKey: string;
  steps: RateLimitIdempotencyStep[];
};

// 字段与服务端 FixedWebhookBatchSnapshot 保持一致
export type FixedWebhookBatchSnapshot = {
  batchKey: string;
  displayName: string;
  quotaScope: "unlimited" | "windowed-quota";
  idempotencyScope: "none" | "idempotency-key-required";
  timestampScope: "none" | "signed-window";
  degradeScope: "none" | "throttle-then-degrade";
  replayProcessedTwice: boolean;
  expectedPosture: "vulnerable" | "hardened";
  findings: string[];
};

export type WebhookBatchAssessment = {
  batchKey: string;
  expectedPosture: "vulnerable" | "hardened";
  findingCount: number;
  criticalFindingCount: number;
  resourceControlCount: number;
};

export type RateLimitIdempotencyWorkbench = {
  id: string;
  slug: string;
  category: string;
  subcategory: string;
  title: string;
  mode: "interactive" | "simulation" | "case-study";
  severity: "low" | "medium" | "high" | "critical";
  difficulty: "beginner" | "intermediate" | "advanced";
  summary: string;
  defaultScenarioKey: string;
  scoringDimensions: Array<{
    key: string;
    title: string;
    description: string;
    max: number;
  }>;
  cases: RateLimitIdempotencyCase[];
  safeBoundaries: string[];
  notes: string;
  batchSnapshots: FixedWebhookBatchSnapshot[];
  batchAssessments: WebhookBatchAssessment[];
};

export type RateLimitIdempotencyStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: RateLimitIdempotencyOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type WebhookBatchDecision = {
  actionKey:
    | "approve-unthrottled-replay"
    | "block-quota-and-replay"
    | "verify-idempotent-baseline";
  disposition:
    | "unthrottled-replay-approved"
    | "quota-and-replay-blocked"
    | "idempotent-baseline-verified";
  summary: string;
  nextAction: string;
};

export type RateLimitIdempotencyResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: RateLimitIdempotencyVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: RateLimitIdempotencyStepResult[];
  batchAssessment: WebhookBatchAssessment | null;
  batchDecision: WebhookBatchDecision | null;
  recap: {
    outcomeCounts: Record<RateLimitIdempotencyOutcome, number>;
    scores: Record<string, number>;
    terminalOutcome: RateLimitIdempotencyOutcome | null;
  };
  assessment: {
    riskLevel: "low" | "medium" | "high" | "critical";
    stepCount: number;
    matchedScenario: boolean;
  };
  blockedReason?: string;
};

export type RateLimitIdempotencyWorkbenchResponse = {
  status: "ok";
  workbench: RateLimitIdempotencyWorkbench;
};

export type RateLimitIdempotencyEvaluationResponse = {
  status: "ok" | "blocked";
  result: RateLimitIdempotencyResult;
};

export type RateLimitIdempotencyEvaluationInput = {
  scenarioKey: string;
  decisions: string[];
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function fetchRateLimitIdempotencyWorkbench() {
  const response = await fetch(
    "/api/labs/api/rate-limit-idempotency/workbench",
  );

  return readJson<RateLimitIdempotencyWorkbenchResponse>(response);
}

export async function submitRateLimitIdempotencyEvaluation(
  variantKey: RateLimitIdempotencyVariantKey,
  token: string,
  input: RateLimitIdempotencyEvaluationInput,
) {
  const response = await fetch(
    `/api/labs/api/rate-limit-idempotency/${variantKey}/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: input.scenarioKey,
        decisions: input.decisions,
      }),
    },
  );

  // 400/403/404 是受控的边界阻断与未登记变体响应，需要按结果体返回而不是抛错
  if (
    response.status === 400 ||
    response.status === 403 ||
    response.status === 404
  ) {
    return (await response.json()) as RateLimitIdempotencyEvaluationResponse;
  }

  return readJson<RateLimitIdempotencyEvaluationResponse>(response);
}

export type OauthVariantKey = "vuln" | "fixed";

export type OauthOutcome = "risk" | "fix" | "normal";

export type OauthCard = {
  key: string;
  kind: "asset" | "timeline" | "evidence" | "policy";
  title: string;
  detail: string;
};

export type OauthOption = {
  key: string;
  label: string;
  outcome: OauthOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
  nextStepKey: string | null;
  scoreDeltas?: Record<string, number>;
};

export type OauthStep = {
  key: string;
  order: number;
  title: string;
  prompt: string;
  riskSignal: string;
  options: OauthOption[];
};

export type OauthCase = {
  key: string;
  title: string;
  description: string;
  assets?: OauthCard[];
  timeline?: OauthCard[];
  evidence?: OauthCard[];
  initialStepKey: string;
  steps: OauthStep[];
};

export type OauthScoringDimension = {
  key: string;
  title: string;
  description: string;
  max: number;
};

export type OauthWorkbench = {
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
  scoringDimensions: OauthScoringDimension[];
  cases: OauthCase[];
  safeBoundaries: string[];
  notes: string;
};

export type OauthStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: OauthOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type OauthResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: OauthVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: OauthStepResult[];
  recap: {
    outcomeCounts: Record<OauthOutcome, number>;
    scores: Record<string, number>;
    terminalOutcome: OauthOutcome | null;
  };
  assessment: {
    riskLevel: "low" | "medium" | "high" | "critical";
    stepCount: number;
    matchedScenario: boolean;
  };
  blockedReason?: string;
};

export type OauthWorkbenchResponse = {
  status: "ok";
  workbench: OauthWorkbench;
};

export type OauthEvaluationResponse = {
  status: "ok" | "blocked";
  result: OauthResult;
};

export type OauthEvaluationInput = {
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

export async function fetchOauthWorkbench() {
  const response = await fetch("/api/labs/auth/oauth/workbench");

  return readJson<OauthWorkbenchResponse>(response);
}

export async function submitOauthEvaluation(
  variantKey: OauthVariantKey,
  token: string,
  input: OauthEvaluationInput,
) {
  const response = await fetch(
    `/api/labs/auth/oauth/${variantKey}/evaluate`,
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

  if (
    response.status === 400 ||
    response.status === 403 ||
    response.status === 404
  ) {
    return (await response.json()) as OauthEvaluationResponse;
  }

  return readJson<OauthEvaluationResponse>(response);
}

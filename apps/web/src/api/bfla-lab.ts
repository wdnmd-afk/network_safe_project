export type BflaVariantKey = "vuln" | "fixed";

export type BflaOutcome = "risk" | "fix" | "normal";

export type BflaCard = {
  key: string;
  kind: "asset" | "timeline" | "evidence" | "policy";
  title: string;
  detail: string;
};

export type BflaOption = {
  key: string;
  label: string;
  outcome: BflaOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
  nextStepKey: string | null;
  scoreDeltas?: Record<string, number>;
};

export type BflaStep = {
  key: string;
  order: number;
  title: string;
  prompt: string;
  riskSignal: string;
  options: BflaOption[];
};

export type BflaCase = {
  key: string;
  title: string;
  description: string;
  assets?: BflaCard[];
  timeline?: BflaCard[];
  evidence?: BflaCard[];
  initialStepKey: string;
  steps: BflaStep[];
};

export type BflaScoringDimension = {
  key: string;
  title: string;
  description: string;
  max: number;
};

export type BflaWorkbench = {
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
  scoringDimensions: BflaScoringDimension[];
  cases: BflaCase[];
  safeBoundaries: string[];
  notes: string;
};

export type BflaStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: BflaOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type BflaResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: BflaVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: BflaStepResult[];
  recap: {
    outcomeCounts: Record<BflaOutcome, number>;
    scores: Record<string, number>;
    terminalOutcome: BflaOutcome | null;
  };
  assessment: {
    riskLevel: "low" | "medium" | "high" | "critical";
    stepCount: number;
    matchedScenario: boolean;
  };
  blockedReason?: string;
};

export type BflaWorkbenchResponse = {
  status: "ok";
  workbench: BflaWorkbench;
};

export type BflaEvaluationResponse = {
  status: "ok" | "blocked";
  result: BflaResult;
};

export type BflaEvaluationInput = {
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

export async function fetchBflaWorkbench() {
  const response = await fetch(
    "/api/labs/api/functional-authorization/workbench",
  );

  return readJson<BflaWorkbenchResponse>(response);
}

export async function submitBflaEvaluation(
  variantKey: BflaVariantKey,
  token: string,
  input: BflaEvaluationInput,
) {
  const response = await fetch(
    `/api/labs/api/functional-authorization/${variantKey}/evaluate`,
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
    return (await response.json()) as BflaEvaluationResponse;
  }

  return readJson<BflaEvaluationResponse>(response);
}

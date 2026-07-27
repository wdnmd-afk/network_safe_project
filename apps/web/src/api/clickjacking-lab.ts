export type ClickjackingVariantKey = "vuln" | "fixed";

export type ClickjackingOutcome = "risk" | "fix" | "normal";

export type ClickjackingCard = {
  key: string;
  kind: "asset" | "timeline" | "evidence" | "policy";
  title: string;
  detail: string;
};

export type ClickjackingOption = {
  key: string;
  label: string;
  outcome: ClickjackingOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
  nextStepKey: string | null;
  scoreDeltas?: Record<string, number>;
};

export type ClickjackingStep = {
  key: string;
  order: number;
  title: string;
  prompt: string;
  riskSignal: string;
  options: ClickjackingOption[];
};

export type ClickjackingCase = {
  key: string;
  title: string;
  description: string;
  assets?: ClickjackingCard[];
  timeline?: ClickjackingCard[];
  evidence?: ClickjackingCard[];
  initialStepKey: string;
  steps: ClickjackingStep[];
};

export type ClickjackingScoringDimension = {
  key: string;
  title: string;
  description: string;
  max: number;
};

export type ClickjackingWorkbench = {
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
  scoringDimensions: ClickjackingScoringDimension[];
  cases: ClickjackingCase[];
  safeBoundaries: string[];
  notes: string;
};

export type ClickjackingStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: ClickjackingOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type ClickjackingResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: ClickjackingVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: ClickjackingStepResult[];
  recap: {
    outcomeCounts: Record<ClickjackingOutcome, number>;
    scores: Record<string, number>;
    terminalOutcome: ClickjackingOutcome | null;
  };
  assessment: {
    riskLevel: "low" | "medium" | "high" | "critical";
    stepCount: number;
    matchedScenario: boolean;
  };
  blockedReason?: string;
};

export type ClickjackingWorkbenchResponse = {
  status: "ok";
  workbench: ClickjackingWorkbench;
};

export type ClickjackingEvaluationResponse = {
  status: "ok" | "blocked";
  result: ClickjackingResult;
};

export type ClickjackingEvaluationInput = {
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

export async function fetchClickjackingWorkbench() {
  const response = await fetch("/api/labs/web/clickjacking/workbench");

  return readJson<ClickjackingWorkbenchResponse>(response);
}

export async function submitClickjackingEvaluation(
  variantKey: ClickjackingVariantKey,
  token: string,
  input: ClickjackingEvaluationInput,
) {
  const response = await fetch(
    `/api/labs/web/clickjacking/${variantKey}/evaluate`,
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
    return (await response.json()) as ClickjackingEvaluationResponse;
  }

  return readJson<ClickjackingEvaluationResponse>(response);
}

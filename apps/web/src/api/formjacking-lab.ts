export type FormjackingVariantKey = "vuln" | "fixed";

export type FormjackingOutcome = "risk" | "fix" | "normal";

export type FormjackingCard = {
  key: string;
  kind: "asset" | "timeline" | "evidence" | "policy";
  title: string;
  detail: string;
};

export type FormjackingOption = {
  key: string;
  label: string;
  outcome: FormjackingOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
  nextStepKey: string | null;
  scoreDeltas?: Record<string, number>;
};

export type FormjackingStep = {
  key: string;
  order: number;
  title: string;
  prompt: string;
  riskSignal: string;
  options: FormjackingOption[];
};

export type FormjackingCase = {
  key: string;
  title: string;
  description: string;
  assets?: FormjackingCard[];
  timeline?: FormjackingCard[];
  evidence?: FormjackingCard[];
  initialStepKey: string;
  steps: FormjackingStep[];
};

export type FormjackingScoringDimension = {
  key: string;
  title: string;
  description: string;
  max: number;
};

export type FormjackingWorkbench = {
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
  scoringDimensions: FormjackingScoringDimension[];
  cases: FormjackingCase[];
  safeBoundaries: string[];
  notes: string;
};

export type FormjackingStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: FormjackingOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type FormjackingResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: FormjackingVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: FormjackingStepResult[];
  recap: {
    outcomeCounts: Record<FormjackingOutcome, number>;
    scores: Record<string, number>;
    terminalOutcome: FormjackingOutcome | null;
  };
  assessment: {
    riskLevel: "low" | "medium" | "high" | "critical";
    stepCount: number;
    matchedScenario: boolean;
  };
  blockedReason?: string;
};

export type FormjackingWorkbenchResponse = {
  status: "ok";
  workbench: FormjackingWorkbench;
};

export type FormjackingEvaluationResponse = {
  status: "ok" | "blocked";
  result: FormjackingResult;
};

export type FormjackingEvaluationInput = {
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

export async function fetchFormjackingWorkbench() {
  const response = await fetch("/api/labs/client/formjacking/workbench");

  return readJson<FormjackingWorkbenchResponse>(response);
}

export async function submitFormjackingEvaluation(
  variantKey: FormjackingVariantKey,
  token: string,
  input: FormjackingEvaluationInput,
) {
  const response = await fetch(
    `/api/labs/client/formjacking/${variantKey}/evaluate`,
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
    return (await response.json()) as FormjackingEvaluationResponse;
  }

  return readJson<FormjackingEvaluationResponse>(response);
}

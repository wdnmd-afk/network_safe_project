export type OpenRedirectVariantKey = "vuln" | "fixed";

export type OpenRedirectOutcome = "risk" | "fix" | "normal";

export type OpenRedirectCard = {
  key: string;
  kind: "asset" | "timeline" | "evidence" | "policy";
  title: string;
  detail: string;
};

export type OpenRedirectOption = {
  key: string;
  label: string;
  outcome: OpenRedirectOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
  nextStepKey: string | null;
  scoreDeltas?: Record<string, number>;
};

export type OpenRedirectStep = {
  key: string;
  order: number;
  title: string;
  prompt: string;
  riskSignal: string;
  options: OpenRedirectOption[];
};

export type OpenRedirectCase = {
  key: string;
  title: string;
  description: string;
  assets?: OpenRedirectCard[];
  timeline?: OpenRedirectCard[];
  evidence?: OpenRedirectCard[];
  initialStepKey: string;
  steps: OpenRedirectStep[];
};

export type OpenRedirectScoringDimension = {
  key: string;
  title: string;
  description: string;
  max: number;
};

export type OpenRedirectWorkbench = {
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
  scoringDimensions: OpenRedirectScoringDimension[];
  cases: OpenRedirectCase[];
  safeBoundaries: string[];
  notes: string;
};

export type OpenRedirectStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: OpenRedirectOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type OpenRedirectResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: OpenRedirectVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: OpenRedirectStepResult[];
  recap: {
    outcomeCounts: Record<OpenRedirectOutcome, number>;
    scores: Record<string, number>;
    terminalOutcome: OpenRedirectOutcome | null;
  };
  assessment: {
    riskLevel: "low" | "medium" | "high" | "critical";
    stepCount: number;
    matchedScenario: boolean;
  };
  blockedReason?: string;
};

export type OpenRedirectWorkbenchResponse = {
  status: "ok";
  workbench: OpenRedirectWorkbench;
};

export type OpenRedirectEvaluationResponse = {
  status: "ok" | "blocked";
  result: OpenRedirectResult;
};

export type OpenRedirectEvaluationInput = {
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

export async function fetchOpenRedirectWorkbench() {
  const response = await fetch("/api/labs/web/open-redirect/workbench");

  return readJson<OpenRedirectWorkbenchResponse>(response);
}

export async function submitOpenRedirectEvaluation(
  variantKey: OpenRedirectVariantKey,
  token: string,
  input: OpenRedirectEvaluationInput,
) {
  const response = await fetch(
    `/api/labs/web/open-redirect/${variantKey}/evaluate`,
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
    return (await response.json()) as OpenRedirectEvaluationResponse;
  }

  return readJson<OpenRedirectEvaluationResponse>(response);
}

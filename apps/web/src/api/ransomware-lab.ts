export type RansomwareVariantKey = "vuln" | "fixed";

export type RansomwareOutcome = "risk" | "fix" | "normal";

export type RansomwareCard = {
  key: string;
  kind: "asset" | "timeline" | "evidence" | "policy";
  title: string;
  detail: string;
};

export type RansomwareOption = {
  key: string;
  label: string;
  outcome: RansomwareOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
  nextStepKey: string | null;
  scoreDeltas?: Record<string, number>;
};

export type RansomwareStep = {
  key: string;
  order: number;
  title: string;
  prompt: string;
  riskSignal: string;
  options: RansomwareOption[];
};

export type RansomwareCase = {
  key: string;
  title: string;
  description: string;
  assets?: RansomwareCard[];
  timeline?: RansomwareCard[];
  evidence?: RansomwareCard[];
  initialStepKey: string;
  steps: RansomwareStep[];
};

export type RansomwareScoringDimension = {
  key: string;
  title: string;
  description: string;
  max: number;
};

export type RansomwareWorkbench = {
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
  scoringDimensions: RansomwareScoringDimension[];
  cases: RansomwareCase[];
  safeBoundaries: string[];
  notes: string;
};

export type RansomwareStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: RansomwareOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type RansomwareResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: RansomwareVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: RansomwareStepResult[];
  recap: {
    outcomeCounts: Record<RansomwareOutcome, number>;
    scores: Record<string, number>;
    terminalOutcome: RansomwareOutcome | null;
  };
  assessment: {
    riskLevel: "low" | "medium" | "high" | "critical";
    stepCount: number;
    matchedScenario: boolean;
  };
  blockedReason?: string;
};

export type RansomwareWorkbenchResponse = {
  status: "ok";
  workbench: RansomwareWorkbench;
};

export type RansomwareEvaluationResponse = {
  status: "ok" | "blocked";
  result: RansomwareResult;
};

export type RansomwareEvaluationInput = {
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

export async function fetchRansomwareWorkbench() {
  const response = await fetch("/api/labs/malware/ransomware/workbench");

  return readJson<RansomwareWorkbenchResponse>(response);
}

export async function submitRansomwareEvaluation(
  variantKey: RansomwareVariantKey,
  token: string,
  input: RansomwareEvaluationInput,
) {
  const response = await fetch(
    `/api/labs/malware/ransomware/${variantKey}/evaluate`,
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
    return (await response.json()) as RansomwareEvaluationResponse;
  }

  return readJson<RansomwareEvaluationResponse>(response);
}

export type CredentialStuffingVariantKey = "vuln" | "fixed";

export type CredentialStuffingOutcome = "risk" | "fix" | "normal";

export type CredentialStuffingCard = {
  key: string;
  kind: "asset" | "timeline" | "evidence" | "policy";
  title: string;
  detail: string;
};

export type CredentialStuffingOption = {
  key: string;
  label: string;
  outcome: CredentialStuffingOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
  nextStepKey: string | null;
  scoreDeltas?: Record<string, number>;
};

export type CredentialStuffingStep = {
  key: string;
  order: number;
  title: string;
  prompt: string;
  riskSignal: string;
  options: CredentialStuffingOption[];
};

export type CredentialStuffingCase = {
  key: string;
  title: string;
  description: string;
  assets?: CredentialStuffingCard[];
  timeline?: CredentialStuffingCard[];
  evidence?: CredentialStuffingCard[];
  initialStepKey: string;
  steps: CredentialStuffingStep[];
};

export type CredentialStuffingScoringDimension = {
  key: string;
  title: string;
  description: string;
  max: number;
};

export type CredentialStuffingWorkbench = {
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
  scoringDimensions: CredentialStuffingScoringDimension[];
  cases: CredentialStuffingCase[];
  safeBoundaries: string[];
  notes: string;
};

export type CredentialStuffingStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: CredentialStuffingOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type CredentialStuffingResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: CredentialStuffingVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: CredentialStuffingStepResult[];
  recap: {
    outcomeCounts: Record<CredentialStuffingOutcome, number>;
    scores: Record<string, number>;
    terminalOutcome: CredentialStuffingOutcome | null;
  };
  assessment: {
    riskLevel: "low" | "medium" | "high" | "critical";
    stepCount: number;
    matchedScenario: boolean;
  };
  blockedReason?: string;
};

export type CredentialStuffingWorkbenchResponse = {
  status: "ok";
  workbench: CredentialStuffingWorkbench;
};

export type CredentialStuffingEvaluationResponse = {
  status: "ok" | "blocked";
  result: CredentialStuffingResult;
};

export type CredentialStuffingEvaluationInput = {
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

export async function fetchCredentialStuffingWorkbench() {
  const response = await fetch(
    "/api/labs/auth/credential-stuffing/workbench",
  );

  return readJson<CredentialStuffingWorkbenchResponse>(response);
}

export async function submitCredentialStuffingEvaluation(
  variantKey: CredentialStuffingVariantKey,
  token: string,
  input: CredentialStuffingEvaluationInput,
) {
  const response = await fetch(
    `/api/labs/auth/credential-stuffing/${variantKey}/evaluate`,
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
    return (await response.json()) as CredentialStuffingEvaluationResponse;
  }

  return readJson<CredentialStuffingEvaluationResponse>(response);
}

export type InsecureRandomnessVariantKey = "vuln" | "fixed";

export type InsecureRandomnessOutcome = "risk" | "fix" | "normal";

export type InsecureRandomnessCard = {
  key: string;
  kind: "asset" | "timeline" | "evidence" | "policy";
  title: string;
  detail: string;
};

export type InsecureRandomnessOption = {
  key: string;
  label: string;
  outcome: InsecureRandomnessOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
  nextStepKey: string | null;
  scoreDeltas?: Record<string, number>;
};

export type InsecureRandomnessStep = {
  key: string;
  order: number;
  title: string;
  prompt: string;
  riskSignal: string;
  options: InsecureRandomnessOption[];
};

export type InsecureRandomnessCase = {
  key: string;
  title: string;
  description: string;
  assets?: InsecureRandomnessCard[];
  timeline?: InsecureRandomnessCard[];
  evidence?: InsecureRandomnessCard[];
  initialStepKey: string;
  steps: InsecureRandomnessStep[];
};

export type InsecureRandomnessScoringDimension = {
  key: string;
  title: string;
  description: string;
  max: number;
};

export type InsecureRandomnessWorkbench = {
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
  scoringDimensions: InsecureRandomnessScoringDimension[];
  cases: InsecureRandomnessCase[];
  safeBoundaries: string[];
  notes: string;
};

export type InsecureRandomnessStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: InsecureRandomnessOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type InsecureRandomnessResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: InsecureRandomnessVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: InsecureRandomnessStepResult[];
  recap: {
    outcomeCounts: Record<InsecureRandomnessOutcome, number>;
    scores: Record<string, number>;
    terminalOutcome: InsecureRandomnessOutcome | null;
  };
  assessment: {
    riskLevel: "low" | "medium" | "high" | "critical";
    stepCount: number;
    matchedScenario: boolean;
  };
  blockedReason?: string;
};

export type InsecureRandomnessWorkbenchResponse = {
  status: "ok";
  workbench: InsecureRandomnessWorkbench;
};

export type InsecureRandomnessEvaluationResponse = {
  status: "ok" | "blocked";
  result: InsecureRandomnessResult;
};

export type InsecureRandomnessEvaluationInput = {
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

export async function fetchInsecureRandomnessWorkbench() {
  const response = await fetch(
    "/api/labs/crypto/insecure-randomness/workbench",
  );

  return readJson<InsecureRandomnessWorkbenchResponse>(response);
}

export async function submitInsecureRandomnessEvaluation(
  variantKey: InsecureRandomnessVariantKey,
  token: string,
  input: InsecureRandomnessEvaluationInput,
) {
  const response = await fetch(
    `/api/labs/crypto/insecure-randomness/${variantKey}/evaluate`,
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
    return (await response.json()) as InsecureRandomnessEvaluationResponse;
  }

  return readJson<InsecureRandomnessEvaluationResponse>(response);
}

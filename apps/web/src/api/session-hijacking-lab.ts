export type SessionHijackingVariantKey = "vuln" | "fixed";

export type SessionHijackingOutcome = "risk" | "fix" | "normal";

export type SessionHijackingCard = {
  key: string;
  kind: "asset" | "timeline" | "evidence" | "policy";
  title: string;
  detail: string;
};

export type SessionHijackingOption = {
  key: string;
  label: string;
  outcome: SessionHijackingOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
  nextStepKey: string | null;
  scoreDeltas?: Record<string, number>;
};

export type SessionHijackingStep = {
  key: string;
  order: number;
  title: string;
  prompt: string;
  riskSignal: string;
  options: SessionHijackingOption[];
};

export type SessionHijackingCase = {
  key: string;
  title: string;
  description: string;
  assets?: SessionHijackingCard[];
  timeline?: SessionHijackingCard[];
  evidence?: SessionHijackingCard[];
  initialStepKey: string;
  steps: SessionHijackingStep[];
};

export type SessionHijackingScoringDimension = {
  key: string;
  title: string;
  description: string;
  max: number;
};

export type SessionHijackingWorkbench = {
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
  scoringDimensions: SessionHijackingScoringDimension[];
  cases: SessionHijackingCase[];
  safeBoundaries: string[];
  notes: string;
};

export type SessionHijackingStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: SessionHijackingOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type SessionHijackingResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: SessionHijackingVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: SessionHijackingStepResult[];
  recap: {
    outcomeCounts: Record<SessionHijackingOutcome, number>;
    scores: Record<string, number>;
    terminalOutcome: SessionHijackingOutcome | null;
  };
  assessment: {
    riskLevel: "low" | "medium" | "high" | "critical";
    stepCount: number;
    matchedScenario: boolean;
  };
  blockedReason?: string;
};

export type SessionHijackingWorkbenchResponse = {
  status: "ok";
  workbench: SessionHijackingWorkbench;
};

export type SessionHijackingEvaluationResponse = {
  status: "ok" | "blocked";
  result: SessionHijackingResult;
};

export type SessionHijackingEvaluationInput = {
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

export async function fetchSessionHijackingWorkbench() {
  const response = await fetch("/api/labs/auth/session-hijacking/workbench");

  return readJson<SessionHijackingWorkbenchResponse>(response);
}

export async function submitSessionHijackingEvaluation(
  variantKey: SessionHijackingVariantKey,
  token: string,
  input: SessionHijackingEvaluationInput,
) {
  const response = await fetch(
    `/api/labs/auth/session-hijacking/${variantKey}/evaluate`,
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
    return (await response.json()) as SessionHijackingEvaluationResponse;
  }

  return readJson<SessionHijackingEvaluationResponse>(response);
}

export type WorkflowBypassVariantKey = "vuln" | "fixed";

export type WorkflowBypassOutcome = "risk" | "fix" | "normal";

export type WorkflowBypassCard = {
  key: string;
  kind: "asset" | "timeline" | "evidence" | "policy";
  title: string;
  detail: string;
};

export type WorkflowBypassOption = {
  key: string;
  label: string;
  outcome: WorkflowBypassOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
  nextStepKey: string | null;
  scoreDeltas?: Record<string, number>;
};

export type WorkflowBypassStep = {
  key: string;
  order: number;
  title: string;
  prompt: string;
  riskSignal: string;
  options: WorkflowBypassOption[];
};

export type WorkflowBypassCase = {
  key: string;
  title: string;
  description: string;
  assets?: WorkflowBypassCard[];
  timeline?: WorkflowBypassCard[];
  evidence?: WorkflowBypassCard[];
  initialStepKey: string;
  steps: WorkflowBypassStep[];
};

export type WorkflowBypassScoringDimension = {
  key: string;
  title: string;
  description: string;
  max: number;
};

export type WorkflowBypassWorkbench = {
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
  scoringDimensions: WorkflowBypassScoringDimension[];
  cases: WorkflowBypassCase[];
  safeBoundaries: string[];
  notes: string;
};

export type WorkflowBypassStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: WorkflowBypassOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type WorkflowBypassResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: WorkflowBypassVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: WorkflowBypassStepResult[];
  recap: {
    outcomeCounts: Record<WorkflowBypassOutcome, number>;
    scores: Record<string, number>;
    terminalOutcome: WorkflowBypassOutcome | null;
  };
  assessment: {
    riskLevel: "low" | "medium" | "high" | "critical";
    stepCount: number;
    matchedScenario: boolean;
  };
  blockedReason?: string;
};

export type WorkflowBypassWorkbenchResponse = {
  status: "ok";
  workbench: WorkflowBypassWorkbench;
};

export type WorkflowBypassEvaluationResponse = {
  status: "ok" | "blocked";
  result: WorkflowBypassResult;
};

export type WorkflowBypassEvaluationInput = {
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

export async function fetchWorkflowBypassWorkbench() {
  const response = await fetch(
    "/api/labs/business-logic/workflow-bypass/workbench",
  );

  return readJson<WorkflowBypassWorkbenchResponse>(response);
}

export async function submitWorkflowBypassEvaluation(
  variantKey: WorkflowBypassVariantKey,
  token: string,
  input: WorkflowBypassEvaluationInput,
) {
  const response = await fetch(
    `/api/labs/business-logic/workflow-bypass/${variantKey}/evaluate`,
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
    return (await response.json()) as WorkflowBypassEvaluationResponse;
  }

  return readJson<WorkflowBypassEvaluationResponse>(response);
}

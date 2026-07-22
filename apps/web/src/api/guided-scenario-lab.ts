export type GuidedScenarioVariantKey = "vuln" | "fixed";

export type GuidedScenarioCase = {
  key: string;
  title: string;
  description: string;
  riskIndicators: string[];
  rootCause: string;
};

export type GuidedScenarioControl = {
  key: string;
  title: string;
  description: string;
  fixedDecision: "accepted" | "blocked";
  fixedSignal: string;
  fixedMessage: string;
};

export type GuidedScenarioWorkbench = {
  id: string;
  slug: string;
  category: string;
  subcategory: string;
  title: string;
  mode: "interactive" | "simulation" | "case-study";
  severity: "low" | "medium" | "high" | "critical";
  difficulty: "beginner" | "intermediate" | "advanced";
  summary: string;
  phase: string;
  defaultScenarioKey: string;
  defaultControlKey: string;
  scenarios: GuidedScenarioCase[];
  controls: GuidedScenarioControl[];
  vulnerableOutcome: {
    decision: "accepted";
    signal: string;
    message: string;
  };
  safeBoundaries: string[];
  notes: string;
};

export type GuidedScenarioResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: GuidedScenarioVariantKey;
  scenarioKey: string;
  controlKey: string;
  scenarioTitle: string;
  controlTitle: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  assessment: {
    matchedScenario: boolean;
    matchedControl: boolean;
    controlApplied: boolean;
    riskLevel: "low" | "medium" | "high" | "critical";
    riskIndicatorCount: number;
    riskIndicators: string[];
    rootCause: string;
  };
  blockedReason?: string;
};

export type GuidedScenarioEvaluationInput = {
  scenarioKey: string;
  controlKey: string;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function fetchGuidedScenarioWorkbench(
  category: string,
  scene: string,
) {
  const response = await fetch(`/api/labs/${category}/${scene}/workbench`);

  return readJson<{
    status: "ok";
    workbench: GuidedScenarioWorkbench;
  }>(response);
}

export async function submitGuidedScenarioEvaluation(
  category: string,
  scene: string,
  variantKey: GuidedScenarioVariantKey,
  token: string,
  input: GuidedScenarioEvaluationInput,
) {
  const response = await fetch(
    `/api/labs/${category}/${scene}/${variantKey}/evaluate`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scenarioKey: input.scenarioKey,
        controlKey: input.controlKey,
      }),
    },
  );
  const body = (await response.json()) as {
    status: "ok" | "blocked";
    result: GuidedScenarioResult;
  };

  if (response.status === 403 && body.result) {
    return body;
  }

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

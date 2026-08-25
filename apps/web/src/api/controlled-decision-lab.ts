export type ControlledVariantKey = "vuln" | "fixed";
export type ControlledOutcome = "risk" | "fix" | "normal";

export type ControlledOption = {
  key: string;
  label: string;
  outcome: ControlledOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type ControlledStep = {
  key: string;
  order: number;
  title: string;
  prompt: string;
  options: ControlledOption[];
};

export type ControlledWorkbench = {
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
  cases: Array<{
    key: string;
    title: string;
    description: string;
    evidence: Array<{ key: string; title: string; detail: string }>;
    steps: ControlledStep[];
  }>;
  safeBoundaries: string[];
  notes: string;
};

export type ControlledResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: ControlledVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: Array<{
    stepKey: string;
    optionKey: string;
    outcome: ControlledOutcome;
    decision: "accepted" | "blocked";
    signal: string;
    explanation: string;
  }>;
  recap: {
    outcomeCounts: Record<ControlledOutcome, number>;
    terminalOutcome: ControlledOutcome | null;
  };
  assessment: {
    riskLevel: "low" | "medium" | "high" | "critical";
    stepCount: number;
    matchedScenario: boolean;
  };
  blockedReason?: string;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok && response.status !== 403) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function fetchControlledWorkbench(category: string, scene: string) {
  const response = await fetch(`/api/labs/${category}/${scene}/workbench`);
  return readJson<{ status: "ok"; workbench: ControlledWorkbench }>(response);
}

export async function submitControlledEvaluation(
  category: string,
  scene: string,
  variant: ControlledVariantKey,
  token: string,
  input: { scenarioKey: string; decisions: string[] },
) {
  const response = await fetch(`/api/labs/${category}/${scene}/${variant}/evaluate`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return readJson<{ status: "ok" | "blocked"; result: ControlledResult }>(response);
}


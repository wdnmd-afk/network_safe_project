export type MitbTransactionVariantKey = "vuln" | "fixed";
export type MitbTransactionOutcome = "risk" | "fix" | "normal";

export type MitbTransactionCard = {
  key: string;
  kind: "asset" | "timeline" | "evidence" | "policy";
  title: string;
  detail: string;
};

export type MitbTransactionOption = {
  key: string;
  label: string;
  outcome: MitbTransactionOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
  nextStepKey: string | null;
  scoreDeltas?: Record<string, number>;
};

export type MitbTransactionStep = {
  key: string;
  order: number;
  title: string;
  prompt: string;
  riskSignal: string;
  options: MitbTransactionOption[];
};

export type MitbTransactionCase = {
  key: string;
  title: string;
  description: string;
  assets?: MitbTransactionCard[];
  evidence?: MitbTransactionCard[];
  initialStepKey: string;
  steps: MitbTransactionStep[];
};

export type FixedTransactionView = {
  viewKey: string;
  displayName: string;
  browserPayee: string;
  browserAmount: string;
  serverPayee: string;
  serverAmount: string;
  outOfBandPayee: string;
  outOfBandAmount: string;
  transactionSigned: boolean;
  expectedPosture: "tampered" | "consistent";
  findings: string[];
};

export type TransactionViewAssessment = {
  viewKey: string;
  expectedPosture: "tampered" | "consistent";
  findingCount: number;
  mismatchCount: number;
  trustedPathControlCount: number;
};

export type MitbTransactionWorkbench = {
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
  scoringDimensions: Array<{
    key: string;
    title: string;
    description: string;
    max: number;
  }>;
  cases: MitbTransactionCase[];
  safeBoundaries: string[];
  notes: string;
  transactionViews: FixedTransactionView[];
  viewAssessments: TransactionViewAssessment[];
};

export type MitbTransactionStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: MitbTransactionOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type MitbTransactionDecision = {
  actionKey:
    | "submit-transaction-from-browser-view"
    | "block-mismatched-transaction"
    | "confirm-consistent-transaction";
  disposition:
    | "tampered-transaction-submitted"
    | "mismatched-transaction-blocked"
    | "consistent-transaction-confirmed";
  summary: string;
  nextAction: string;
};

export type MitbTransactionResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: MitbTransactionVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: MitbTransactionStepResult[];
  viewAssessment: TransactionViewAssessment | null;
  transactionDecision: MitbTransactionDecision | null;
  recap: {
    outcomeCounts: Record<MitbTransactionOutcome, number>;
    scores: Record<string, number>;
    terminalOutcome: MitbTransactionOutcome | null;
  };
  assessment: {
    riskLevel: "low" | "medium" | "high" | "critical";
    stepCount: number;
    matchedScenario: boolean;
  };
  blockedReason?: string;
};

export type MitbTransactionWorkbenchResponse = {
  status: "ok";
  workbench: MitbTransactionWorkbench;
};

export type MitbTransactionEvaluationResponse = {
  status: "ok" | "blocked";
  result: MitbTransactionResult;
};

export type MitbTransactionEvaluationInput = {
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

export async function fetchMitbTransactionWorkbench() {
  const response = await fetch("/api/labs/client/mitb/workbench");

  return readJson<MitbTransactionWorkbenchResponse>(response);
}

export async function submitMitbTransactionEvaluation(
  variantKey: MitbTransactionVariantKey,
  token: string,
  input: MitbTransactionEvaluationInput,
) {
  const response = await fetch(
    `/api/labs/client/mitb/${variantKey}/evaluate`,
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

  // 400/403/404 是受控的边界阻断与未登记变体响应，需要按结果体返回而不是抛错
  if (
    response.status === 400 ||
    response.status === 403 ||
    response.status === 404
  ) {
    return (await response.json()) as MitbTransactionEvaluationResponse;
  }

  return readJson<MitbTransactionEvaluationResponse>(response);
}

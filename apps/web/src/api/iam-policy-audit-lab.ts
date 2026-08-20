export type IamPolicyAuditVariantKey = "vuln" | "fixed";
export type IamPolicyAuditOutcome = "risk" | "fix" | "normal";

export type IamPolicyAuditCard = {
  key: string;
  kind: "asset" | "timeline" | "evidence" | "policy";
  title: string;
  detail: string;
};

export type IamPolicyAuditOption = {
  key: string;
  label: string;
  outcome: IamPolicyAuditOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
  nextStepKey: string | null;
  scoreDeltas?: Record<string, number>;
};

export type IamPolicyAuditStep = {
  key: string;
  order: number;
  title: string;
  prompt: string;
  riskSignal: string;
  options: IamPolicyAuditOption[];
};

export type IamPolicyAuditCase = {
  key: string;
  title: string;
  description: string;
  assets?: IamPolicyAuditCard[];
  evidence?: IamPolicyAuditCard[];
  initialStepKey: string;
  steps: IamPolicyAuditStep[];
};

export type FixedIamPolicySnapshot = {
  policyKey: string;
  displayName: string;
  principalScope: "wildcard-all" | "named-role";
  actionScope: "wildcard-all" | "wildcard-service" | "explicit-actions";
  resourceScope: "wildcard-all" | "explicit-resources";
  conditionScope: "none" | "source-restricted";
  privilegeEscalationReachable: boolean;
  expectedPosture: "vulnerable" | "hardened";
  findings: string[];
};

export type IamPolicyAssessment = {
  policyKey: string;
  expectedPosture: "vulnerable" | "hardened";
  findingCount: number;
  criticalFindingCount: number;
  leastPrivilegeControlCount: number;
};

export type IamPolicyAuditWorkbench = {
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
  cases: IamPolicyAuditCase[];
  safeBoundaries: string[];
  notes: string;
  policySnapshots: FixedIamPolicySnapshot[];
  policyAssessments: IamPolicyAssessment[];
};

export type IamPolicyAuditStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: IamPolicyAuditOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type IamPolicyDecision = {
  actionKey:
    | "approve-overbroad-policy-grant"
    | "block-overbroad-policy-grant"
    | "verify-least-privilege-baseline";
  disposition:
    | "overbroad-grant-approved"
    | "overbroad-grant-blocked"
    | "least-privilege-baseline-verified";
  summary: string;
  nextAction: string;
};

export type IamPolicyAuditResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: IamPolicyAuditVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: IamPolicyAuditStepResult[];
  policyAssessment: IamPolicyAssessment | null;
  policyDecision: IamPolicyDecision | null;
  recap: {
    outcomeCounts: Record<IamPolicyAuditOutcome, number>;
    scores: Record<string, number>;
    terminalOutcome: IamPolicyAuditOutcome | null;
  };
  assessment: {
    riskLevel: "low" | "medium" | "high" | "critical";
    stepCount: number;
    matchedScenario: boolean;
  };
  blockedReason?: string;
};

export type IamPolicyAuditWorkbenchResponse = {
  status: "ok";
  workbench: IamPolicyAuditWorkbench;
};

export type IamPolicyAuditEvaluationResponse = {
  status: "ok" | "blocked";
  result: IamPolicyAuditResult;
};

export type IamPolicyAuditEvaluationInput = {
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

export async function fetchIamPolicyAuditWorkbench() {
  const response = await fetch(
    "/api/labs/infrastructure/iam-policy-audit/workbench",
  );

  return readJson<IamPolicyAuditWorkbenchResponse>(response);
}

export async function submitIamPolicyAuditEvaluation(
  variantKey: IamPolicyAuditVariantKey,
  token: string,
  input: IamPolicyAuditEvaluationInput,
) {
  const response = await fetch(
    `/api/labs/infrastructure/iam-policy-audit/${variantKey}/evaluate`,
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
    return (await response.json()) as IamPolicyAuditEvaluationResponse;
  }

  return readJson<IamPolicyAuditEvaluationResponse>(response);
}

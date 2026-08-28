export type KubernetesRbacAuditVariantKey = "vuln" | "fixed";
export type KubernetesRbacAuditOutcome = "risk" | "fix" | "normal";

export type KubernetesRbacAuditCard = {
  key: string;
  kind: "asset" | "timeline" | "evidence" | "policy";
  title: string;
  detail: string;
};

export type KubernetesRbacAuditOption = {
  key: string;
  label: string;
  outcome: KubernetesRbacAuditOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
  nextStepKey: string | null;
  scoreDeltas?: Record<string, number>;
};

export type KubernetesRbacAuditStep = {
  key: string;
  order: number;
  title: string;
  prompt: string;
  riskSignal: string;
  options: KubernetesRbacAuditOption[];
};

export type KubernetesRbacAuditCase = {
  key: string;
  title: string;
  description: string;
  assets?: KubernetesRbacAuditCard[];
  evidence?: KubernetesRbacAuditCard[];
  initialStepKey: string;
  steps: KubernetesRbacAuditStep[];
};

export type FixedRbacBindingSnapshot = {
  bindingKey: string;
  displayName: string;
  roleScope: "cluster-wide" | "namespace-scoped";
  verbScope: "wildcard-all" | "write-verbs" | "read-only-verbs";
  resourceScope: "wildcard-all" | "explicit-resources";
  subjectScope: "broad-group" | "named-service-account";
  secretsReadable: boolean;
  privilegeEscalationReachable: boolean;
  expectedPosture: "vulnerable" | "hardened";
  findings: string[];
};

export type RbacBindingAssessment = {
  bindingKey: string;
  expectedPosture: "vulnerable" | "hardened";
  findingCount: number;
  criticalFindingCount: number;
  leastPrivilegeControlCount: number;
};

export type KubernetesRbacAuditWorkbench = {
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
  cases: KubernetesRbacAuditCase[];
  safeBoundaries: string[];
  notes: string;
  bindingSnapshots: FixedRbacBindingSnapshot[];
  bindingAssessments: RbacBindingAssessment[];
};

export type KubernetesRbacAuditStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: KubernetesRbacAuditOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type RbacBindingDecision = {
  actionKey:
    | "approve-cluster-admin-binding"
    | "block-cluster-admin-binding"
    | "verify-namespaced-baseline";
  disposition:
    | "cluster-admin-binding-approved"
    | "cluster-admin-binding-blocked"
    | "namespaced-baseline-verified";
  summary: string;
  nextAction: string;
};

export type KubernetesRbacAuditResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: KubernetesRbacAuditVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: KubernetesRbacAuditStepResult[];
  bindingAssessment: RbacBindingAssessment | null;
  bindingDecision: RbacBindingDecision | null;
  recap: {
    outcomeCounts: Record<KubernetesRbacAuditOutcome, number>;
    scores: Record<string, number>;
    terminalOutcome: KubernetesRbacAuditOutcome | null;
  };
  assessment: {
    riskLevel: "low" | "medium" | "high" | "critical";
    stepCount: number;
    matchedScenario: boolean;
  };
  blockedReason?: string;
};

export type KubernetesRbacAuditWorkbenchResponse = {
  status: "ok";
  workbench: KubernetesRbacAuditWorkbench;
};

export type KubernetesRbacAuditEvaluationResponse = {
  status: "ok" | "blocked";
  result: KubernetesRbacAuditResult;
};

export type KubernetesRbacAuditEvaluationInput = {
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

export async function fetchKubernetesRbacAuditWorkbench() {
  const response = await fetch(
    "/api/labs/infrastructure/kubernetes-rbac-audit/workbench",
  );

  return readJson<KubernetesRbacAuditWorkbenchResponse>(response);
}

export async function submitKubernetesRbacAuditEvaluation(
  variantKey: KubernetesRbacAuditVariantKey,
  token: string,
  input: KubernetesRbacAuditEvaluationInput,
) {
  const response = await fetch(
    `/api/labs/infrastructure/kubernetes-rbac-audit/${variantKey}/evaluate`,
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
    return (await response.json()) as KubernetesRbacAuditEvaluationResponse;
  }

  return readJson<KubernetesRbacAuditEvaluationResponse>(response);
}

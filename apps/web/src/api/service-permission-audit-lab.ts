export type ServicePermissionAuditVariantKey = "vuln" | "fixed";
export type ServicePermissionAuditOutcome = "risk" | "fix" | "normal";

export type ServicePermissionAuditCard = {
  key: string;
  kind: "asset" | "timeline" | "evidence" | "policy";
  title: string;
  detail: string;
};

export type ServicePermissionAuditOption = {
  key: string;
  label: string;
  outcome: ServicePermissionAuditOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
  nextStepKey: string | null;
  scoreDeltas?: Record<string, number>;
};

export type ServicePermissionAuditStep = {
  key: string;
  order: number;
  title: string;
  prompt: string;
  riskSignal: string;
  options: ServicePermissionAuditOption[];
};

export type ServicePermissionAuditCase = {
  key: string;
  title: string;
  description: string;
  assets?: ServicePermissionAuditCard[];
  evidence?: ServicePermissionAuditCard[];
  initialStepKey: string;
  steps: ServicePermissionAuditStep[];
};

export type FixedServicePermissionProfile = {
  serviceKey: string;
  displayName: string;
  runAs: "virtual-local-system" | "virtual-service-account";
  executablePath: string;
  pathQuoted: boolean;
  binaryDirectoryAcl:
    | "users-write"
    | "administrators-write"
    | "system-only";
  serviceConfigAcl:
    | "users-change"
    | "administrators-change"
    | "system-only";
  expectedPosture: "vulnerable" | "hardened";
  findings: string[];
};

export type ServicePermissionProfileAssessment = {
  serviceKey: string;
  expectedPosture: "vulnerable" | "hardened";
  findingCount: number;
  criticalFindingCount: number;
  hardenedControlCount: number;
};

export type ServicePermissionAuditWorkbench = {
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
  cases: ServicePermissionAuditCase[];
  safeBoundaries: string[];
  notes: string;
  serviceProfiles: FixedServicePermissionProfile[];
  profileAssessments: ServicePermissionProfileAssessment[];
};

export type ServicePermissionAuditStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: ServicePermissionAuditOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type ServicePermissionDecision = {
  actionKey:
    | "allow-unprivileged-service-replacement"
    | "block-unprivileged-service-modification"
    | "verify-hardened-service-baseline";
  disposition:
    | "replacement-risk-accepted"
    | "unauthorized-change-blocked"
    | "hardened-baseline-verified";
  summary: string;
  nextAction: string;
};

export type ServicePermissionAuditResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: ServicePermissionAuditVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: ServicePermissionAuditStepResult[];
  profileAssessment: ServicePermissionProfileAssessment | null;
  permissionDecision: ServicePermissionDecision | null;
  recap: {
    outcomeCounts: Record<ServicePermissionAuditOutcome, number>;
    scores: Record<string, number>;
    terminalOutcome: ServicePermissionAuditOutcome | null;
  };
  assessment: {
    riskLevel: "low" | "medium" | "high" | "critical";
    stepCount: number;
    matchedScenario: boolean;
  };
  blockedReason?: string;
};

export type ServicePermissionAuditWorkbenchResponse = {
  status: "ok";
  workbench: ServicePermissionAuditWorkbench;
};

export type ServicePermissionAuditEvaluationResponse = {
  status: "ok" | "blocked";
  result: ServicePermissionAuditResult;
};

export type ServicePermissionAuditEvaluationInput = {
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

export async function fetchServicePermissionAuditWorkbench() {
  const response = await fetch(
    "/api/labs/host/service-permission-audit/workbench",
  );

  return readJson<ServicePermissionAuditWorkbenchResponse>(response);
}

export async function submitServicePermissionAuditEvaluation(
  variantKey: ServicePermissionAuditVariantKey,
  token: string,
  input: ServicePermissionAuditEvaluationInput,
) {
  const response = await fetch(
    `/api/labs/host/service-permission-audit/${variantKey}/evaluate`,
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
    return (await response.json()) as ServicePermissionAuditEvaluationResponse;
  }

  return readJson<ServicePermissionAuditEvaluationResponse>(response);
}

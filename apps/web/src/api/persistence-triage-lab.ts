export type PersistenceTriageVariantKey = "vuln" | "fixed";
export type PersistenceTriageOutcome = "risk" | "fix" | "normal";

export type PersistenceTriageCard = {
  key: string;
  kind: "asset" | "timeline" | "evidence" | "policy";
  title: string;
  detail: string;
};

export type PersistenceTriageOption = {
  key: string;
  label: string;
  outcome: PersistenceTriageOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
  nextStepKey: string | null;
  scoreDeltas?: Record<string, number>;
};

export type PersistenceTriageStep = {
  key: string;
  order: number;
  title: string;
  prompt: string;
  riskSignal: string;
  options: PersistenceTriageOption[];
};

export type PersistenceTriageCase = {
  key: string;
  title: string;
  description: string;
  assets?: PersistenceTriageCard[];
  evidence?: PersistenceTriageCard[];
  initialStepKey: string;
  steps: PersistenceTriageStep[];
};

// 字段与 apps/server/src/services/persistence-triage-lab.ts 的固定快照严格一致
export type FixedPersistenceEntrySnapshot = {
  entryKey: string;
  displayName: string;
  signatureScope: "unsigned" | "publisher-verified";
  imagePathAclScope: "user-writable" | "admin-only-writable";
  triggerScope: "logon-high-frequency" | "scheduled-window";
  runAccountScope: "high-privilege-account" | "least-privilege-account";
  auditScope: "none" | "change-audited-and-alerted";
  tamperableByStandardUser: boolean;
  expectedPosture: "vulnerable" | "hardened";
  findings: string[];
};

export type PersistenceEntryAssessment = {
  entryKey: string;
  expectedPosture: "vulnerable" | "hardened";
  findingCount: number;
  criticalFindingCount: number;
  hardeningControlCount: number;
};

export type PersistenceTriageWorkbench = {
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
  cases: PersistenceTriageCase[];
  safeBoundaries: string[];
  notes: string;
  entrySnapshots: FixedPersistenceEntrySnapshot[];
  entryAssessments: PersistenceEntryAssessment[];
};

export type PersistenceTriageStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: PersistenceTriageOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type PersistenceTriageDecision = {
  actionKey:
    | "approve-persistence-retention"
    | "block-and-remove-persistence"
    | "verify-managed-autorun-baseline";
  disposition:
    | "persistence-retention-approved"
    | "persistence-retention-blocked"
    | "managed-autorun-baseline-verified";
  summary: string;
  nextAction: string;
};

export type PersistenceTriageResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: PersistenceTriageVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: PersistenceTriageStepResult[];
  entryAssessment: PersistenceEntryAssessment | null;
  entryDecision: PersistenceTriageDecision | null;
  recap: {
    outcomeCounts: Record<PersistenceTriageOutcome, number>;
    scores: Record<string, number>;
    terminalOutcome: PersistenceTriageOutcome | null;
  };
  assessment: {
    riskLevel: "low" | "medium" | "high" | "critical";
    stepCount: number;
    matchedScenario: boolean;
  };
  blockedReason?: string;
};

export type PersistenceTriageWorkbenchResponse = {
  status: "ok";
  workbench: PersistenceTriageWorkbench;
};

export type PersistenceTriageEvaluationResponse = {
  status: "ok" | "blocked";
  result: PersistenceTriageResult;
};

export type PersistenceTriageEvaluationInput = {
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

export async function fetchPersistenceTriageWorkbench() {
  const response = await fetch(
    "/api/labs/host/persistence-triage/workbench",
  );

  return readJson<PersistenceTriageWorkbenchResponse>(response);
}

export async function submitPersistenceTriageEvaluation(
  variantKey: PersistenceTriageVariantKey,
  token: string,
  input: PersistenceTriageEvaluationInput,
) {
  const response = await fetch(
    `/api/labs/host/persistence-triage/${variantKey}/evaluate`,
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
    return (await response.json()) as PersistenceTriageEvaluationResponse;
  }

  return readJson<PersistenceTriageEvaluationResponse>(response);
}

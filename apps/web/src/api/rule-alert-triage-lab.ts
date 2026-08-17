export type RuleAlertTriageVariantKey = "vuln" | "fixed";
export type RuleAlertTriageOutcome = "risk" | "fix" | "normal";

export type RuleAlertTriageCard = {
  key: string;
  kind: "asset" | "timeline" | "evidence" | "policy";
  title: string;
  detail: string;
};

export type RuleAlertTriageOption = {
  key: string;
  label: string;
  outcome: RuleAlertTriageOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
  nextStepKey: string | null;
  scoreDeltas?: Record<string, number>;
};

export type RuleAlertTriageStep = {
  key: string;
  order: number;
  title: string;
  prompt: string;
  riskSignal: string;
  options: RuleAlertTriageOption[];
};

export type RuleAlertTriageCase = {
  key: string;
  title: string;
  description: string;
  assets?: RuleAlertTriageCard[];
  timeline?: RuleAlertTriageCard[];
  evidence?: RuleAlertTriageCard[];
  initialStepKey: string;
  steps: RuleAlertTriageStep[];
};

export type FixedSecurityEvent = {
  eventId: string;
  timestamp: string;
  source:
    | "virtual-auth-service"
    | "virtual-endpoint"
    | "virtual-network-sensor";
  category: "auth" | "process" | "network" | "file";
  severity: "low" | "medium" | "high" | "critical";
  signalTags: string[];
  summary: string;
  expectedDisposition: "benign" | "suspicious";
};

export type FixedDetectionRuleProfile = {
  key: string;
  title: string;
  description: string;
  matchedEventIds: string[];
};

export type FixedSecurityEventDataset = {
  key: string;
  title: string;
  description: string;
  events: FixedSecurityEvent[];
  ruleProfiles: FixedDetectionRuleProfile[];
};

export type FixedDetectionRuleAnalysis = {
  datasetKey: string;
  ruleProfileKey: string;
  matchedEventIds: string[];
  truePositiveCount: number;
  falsePositiveCount: number;
  falseNegativeCount: number;
  trueNegativeCount: number;
  precisionPercent: number;
  recallPercent: number;
};

export type RuleAlertTriageWorkbench = {
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
  cases: RuleAlertTriageCase[];
  safeBoundaries: string[];
  notes: string;
  dataset: FixedSecurityEventDataset;
  ruleAnalyses: FixedDetectionRuleAnalysis[];
};

export type RuleAlertTriageStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: RuleAlertTriageOutcome;
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type RuleAlertTriageSummary = {
  actionKey:
    | "dismiss-correlated-alert-as-noise"
    | "escalate-correlated-alert-for-containment"
    | "close-known-maintenance-with-evidence";
  disposition:
    | "dismissed-as-noise"
    | "escalated-for-containment"
    | "closed-known-maintenance";
  summary: string;
  nextAction: string;
};

export type RuleAlertTriageResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: RuleAlertTriageVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: RuleAlertTriageStepResult[];
  ruleAnalysis: FixedDetectionRuleAnalysis | null;
  triage: RuleAlertTriageSummary | null;
  recap: {
    outcomeCounts: Record<RuleAlertTriageOutcome, number>;
    scores: Record<string, number>;
    terminalOutcome: RuleAlertTriageOutcome | null;
  };
  assessment: {
    riskLevel: "low" | "medium" | "high" | "critical";
    stepCount: number;
    matchedScenario: boolean;
  };
  blockedReason?: string;
};

export type RuleAlertTriageWorkbenchResponse = {
  status: "ok";
  workbench: RuleAlertTriageWorkbench;
};

export type RuleAlertTriageEvaluationResponse = {
  status: "ok" | "blocked";
  result: RuleAlertTriageResult;
};

export type RuleAlertTriageEvaluationInput = {
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

export async function fetchRuleAlertTriageWorkbench() {
  const response = await fetch(
    "/api/labs/detection/rule-alert-triage/workbench",
  );

  return readJson<RuleAlertTriageWorkbenchResponse>(response);
}

export async function submitRuleAlertTriageEvaluation(
  variantKey: RuleAlertTriageVariantKey,
  token: string,
  input: RuleAlertTriageEvaluationInput,
) {
  const response = await fetch(
    `/api/labs/detection/rule-alert-triage/${variantKey}/evaluate`,
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
    return (await response.json()) as RuleAlertTriageEvaluationResponse;
  }

  return readJson<RuleAlertTriageEvaluationResponse>(response);
}

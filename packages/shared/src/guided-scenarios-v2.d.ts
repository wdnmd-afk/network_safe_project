export type GuidedScenarioV2Mode = "interactive" | "simulation" | "case-study";
export type GuidedScenarioV2Severity = "low" | "medium" | "high" | "critical";
export type GuidedScenarioV2Difficulty =
  | "beginner"
  | "intermediate"
  | "advanced";

// 每一步选项的固定结果：
// - risk：漏洞视角，接受了高风险动作。
// - fix：修复视角，识别并阻断了高风险动作。
// - normal：正常业务视角，控制落实后流程继续。
export type GuidedScenarioV2Outcome = "risk" | "fix" | "normal";
export type GuidedScenarioV2Decision = "accepted" | "blocked";
export type GuidedScenarioV2CardKind =
  | "asset"
  | "timeline"
  | "evidence"
  | "policy";

export type GuidedScenarioV2ScoringDimension = {
  key: string;
  title: string;
  description: string;
  max: number;
};

export type GuidedScenarioV2Card = {
  key: string;
  kind: GuidedScenarioV2CardKind;
  title: string;
  detail: string;
};

export type GuidedScenarioV2Option = {
  key: string;
  label: string;
  outcome: GuidedScenarioV2Outcome;
  decision: GuidedScenarioV2Decision;
  signal: string;
  explanation: string;
  // 下一步 step key；null 表示该选项终止案例。
  nextStepKey: string | null;
  scoreDeltas?: Record<string, number>;
};

export type GuidedScenarioV2Step = {
  key: string;
  order: number;
  title: string;
  prompt: string;
  riskSignal: string;
  options: GuidedScenarioV2Option[];
};

export type GuidedScenarioV2Case = {
  key: string;
  title: string;
  description: string;
  assets?: GuidedScenarioV2Card[];
  timeline?: GuidedScenarioV2Card[];
  evidence?: GuidedScenarioV2Card[];
  initialStepKey: string;
  steps: GuidedScenarioV2Step[];
};

export type GuidedScenarioV2Definition = {
  version: 2;
  id: string;
  slug: string;
  category: string;
  subcategory: string;
  title: string;
  mode: GuidedScenarioV2Mode;
  severity: GuidedScenarioV2Severity;
  difficulty: GuidedScenarioV2Difficulty;
  summary: string;
  phase: string;
  tags: string[];
  knowledgePoints: string[];
  scoringDimensions: GuidedScenarioV2ScoringDimension[];
  defaultCaseKey: string;
  cases: GuidedScenarioV2Case[];
  safeBoundaries: string[];
  notes: string;
};

export type GuidedScenarioV2Validation =
  | { ok: true; value: GuidedScenarioV2Definition }
  | { ok: false; errors: string[] };

export type GuidedScenarioV2StepChoiceResult =
  | {
      status: "ok";
      stepKey: string;
      outcome: GuidedScenarioV2Outcome;
      decision: GuidedScenarioV2Decision;
      signal: string;
      explanation: string;
      nextStepKey: string | null;
      completed: boolean;
    }
  | {
      status: "blocked";
      reason: "option-not-allowed" | "machine-completed";
      signal: string;
      stepKey: string;
    };

export type GuidedScenarioV2Recap = {
  caseKey: string;
  completed: boolean;
  currentStepKey: string | null;
  path: Array<{
    stepKey: string;
    optionKey: string;
    outcome: GuidedScenarioV2Outcome;
    decision: GuidedScenarioV2Decision;
    signal: string;
  }>;
  outcomeCounts: Record<GuidedScenarioV2Outcome, number>;
  scores: Record<string, number>;
  terminalOutcome: GuidedScenarioV2Outcome | null;
};

export type GuidedScenarioV2Machine = {
  readonly definitionId: string;
  readonly caseKey: string;
  readonly currentStepKey: string | null;
  readonly isCompleted: boolean;
  availableOptions(): Array<{
    key: string;
    label: string;
    outcome: GuidedScenarioV2Outcome;
  }>;
  choose(optionKey: string): GuidedScenarioV2StepChoiceResult;
  back(): { status: "ok" | "noop"; stepKey?: string };
  reset(): void;
  recap(): GuidedScenarioV2Recap;
};

export function validateGuidedScenarioV2(
  definition: unknown,
): GuidedScenarioV2Validation;

export function createGuidedScenarioMachine(
  definition: GuidedScenarioV2Definition,
  caseKey?: string,
): GuidedScenarioV2Machine;

export function liftV1Scenario(
  v1Definition: unknown,
): GuidedScenarioV2Definition;

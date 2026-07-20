export type GuidedScenarioMode = "interactive" | "simulation" | "case-study";
export type GuidedScenarioSeverity = "low" | "medium" | "high" | "critical";
export type GuidedScenarioDifficulty = "beginner" | "intermediate" | "advanced";

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

export type GuidedScenarioDefinition = {
  id: string;
  slug: string;
  category: string;
  subcategory: string;
  title: string;
  mode: GuidedScenarioMode;
  severity: GuidedScenarioSeverity;
  difficulty: GuidedScenarioDifficulty;
  summary: string;
  phase: string;
  tags: string[];
  knowledgePoints: string[];
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

export const guidedScenarioCatalog: readonly GuidedScenarioDefinition[];

export function getGuidedScenarioById(
  id: string,
): GuidedScenarioDefinition | undefined;

export function getGuidedScenarioByRoute(
  category: string,
  scene: string,
): GuidedScenarioDefinition | undefined;

export function listGuidedScenarioIds(): string[];

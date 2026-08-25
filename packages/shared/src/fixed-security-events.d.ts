export type FixedSecurityEventSource =
  | "virtual-auth-service"
  | "virtual-endpoint"
  | "virtual-network-sensor"
  | "virtual-windows-security-log"
  | "virtual-service-manager";

export type FixedSecurityEventCategory =
  | "auth"
  | "process"
  | "network"
  | "file";

export type FixedSecurityEventSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type FixedSecurityEventDisposition = "benign" | "suspicious";

export type FixedSecurityEvent = {
  readonly eventId: string;
  readonly timestamp: string;
  readonly source: FixedSecurityEventSource;
  readonly category: FixedSecurityEventCategory;
  readonly severity: FixedSecurityEventSeverity;
  readonly signalTags: readonly string[];
  readonly summary: string;
  readonly expectedDisposition: FixedSecurityEventDisposition;
};

export type FixedDetectionRuleProfile = {
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly matchedEventIds: readonly string[];
};

export type FixedSecurityEventDataset = {
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly events: readonly FixedSecurityEvent[];
  readonly ruleProfiles: readonly FixedDetectionRuleProfile[];
};

export type FixedSecurityEventDatasetValidation =
  | { ok: true; value: FixedSecurityEventDataset }
  | { ok: false; errors: string[] };

export type FixedDetectionRuleAnalysis = {
  datasetKey: string;
  ruleProfileKey: string;
  matchedEventIds: readonly string[];
  truePositiveCount: number;
  falsePositiveCount: number;
  falseNegativeCount: number;
  trueNegativeCount: number;
  precisionPercent: number;
  recallPercent: number;
};

export const fixedSecurityEventDataset: FixedSecurityEventDataset;
export const fixedWindowsSecurityEventDataset: FixedSecurityEventDataset;

export function validateFixedSecurityEventDataset(
  value: unknown,
): FixedSecurityEventDatasetValidation;

export function analyzeFixedDetectionRule(
  dataset: FixedSecurityEventDataset,
  ruleProfileKey: string,
): FixedDetectionRuleAnalysis | null;

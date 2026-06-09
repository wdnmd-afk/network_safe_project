export type LabMetadataStatus =
  | "planned"
  | "in-progress"
  | "ready"
  | "deprecated";

export type LabMetadataMode = "interactive" | "simulation" | "case-study";
export type LabMetadataSeverity = "low" | "medium" | "high" | "critical";
export type LabMetadataDifficulty = "beginner" | "intermediate" | "advanced";

export type LabVariantMetadata = {
  key: string;
  title: string;
  enabled: boolean;
  description: string;
  entryKey: string;
  expectedOutcome: string;
  supportsAutomation: boolean;
};

export type LabEntrypoint = {
  key: string;
  path: string;
  description: string;
  variant?: string;
};

export type LabMetadata = {
  id: string;
  slug: string;
  title: string;
  category: string;
  subcategory: string;
  mode: LabMetadataMode;
  severity: LabMetadataSeverity;
  difficulty: LabMetadataDifficulty;
  summary: string;
  status: LabMetadataStatus;
  phase?: string;
  tags: string[];
  knowledgePoints: string[];
  variants: LabVariantMetadata[];
  entrypoints: {
    web: LabEntrypoint[];
    api: LabEntrypoint[];
    scripts: LabEntrypoint[];
    docs: LabEntrypoint[];
  };
  verification: {
    manual: {
      supported: boolean;
      stepsDocPath: string;
      expectedSignals: string[];
    };
    automation: {
      supported: boolean;
      playwright?: {
        enabled: boolean;
        specPath: string;
      };
      apiTest?: {
        enabled: boolean;
        specPath: string;
      };
      scriptVerification?: {
        enabled: boolean;
        scriptKeys: string[];
      };
    };
  };
  prerequisites: unknown[];
  paths: {
    root: string;
    readme: string;
    vuln: string;
    fixed: string;
    mock: string;
    docs: string;
    scripts: string;
  };
  sortOrder?: number;
  estimatedMinutes?: number;
  safeBoundaries?: string[];
  references?: unknown[];
  notes?: string;
};

export type LabMetadataValidationResult =
  | {
      ok: true;
      value: LabMetadata;
    }
  | {
      ok: false;
      errors: string[];
    };

export const labMetadataStatuses: LabMetadataStatus[];
export const labMetadataModes: LabMetadataMode[];
export const labMetadataSeverities: LabMetadataSeverity[];
export const labMetadataDifficulties: LabMetadataDifficulty[];

export function parseLabMetadataJson(value: string):
  | {
      ok: true;
      value: unknown;
    }
  | {
      ok: false;
      errors: string[];
    };

export function validateLabMetadata(value: unknown): LabMetadataValidationResult;

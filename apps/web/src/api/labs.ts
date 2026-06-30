export type LabVariant = {
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
  method?: string;
  language?: string;
};

export type LabVerification = {
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

export type LabMetadata = {
  id: string;
  slug: string;
  title: string;
  category: string;
  subcategory: string;
  mode: string;
  severity: string;
  difficulty: string;
  summary: string;
  status: string;
  phase?: string;
  tags: string[];
  knowledgePoints: string[];
  variants: LabVariant[];
  entrypoints: {
    web: LabEntrypoint[];
    api: LabEntrypoint[];
    scripts: LabEntrypoint[];
    docs: LabEntrypoint[];
  };
  verification: LabVerification;
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
};

export type LabListResponse = {
  items: LabMetadata[];
  total: number;
};

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchLabs() {
  const response = await fetch("/api/labs");
  return readJson<LabListResponse>(response);
}

export async function fetchLab(category: string, scene: string) {
  const response = await fetch(`/api/labs/${category}/${scene}`);
  return readJson<LabMetadata>(response);
}

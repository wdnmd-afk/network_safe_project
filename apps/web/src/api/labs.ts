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
  estimatedMinutes?: number;
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
  safeBoundaries?: string[];
  notes?: string;
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

/**
 * 管理端在数据库中配置的运行期启停状态，由服务端目录接口附带返回。
 *
 * 与 `LabVariant.enabled` 语义不同：后者是 meta.json 的登记事实，
 * 入口一致性门禁与平台状态页依赖它，不得被运行期开关覆写。
 */
export type LabAvailability = {
  source: "database" | "metadata-fallback";
  labEnabled: boolean;
  variants: {
    key: string;
    /** 元数据启用 && 实验级启用 && 变体级启用 */
    enabled: boolean;
  }[];
};

/** 目录接口返回的实验：元数据 + 运行期可用性。单独成型，避免把运行期状态混进元数据类型 */
export type LabCatalogItem = LabMetadata & {
  availability: LabAvailability;
};

export type LabListResponse = {
  items: LabCatalogItem[];
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
  return readJson<LabCatalogItem>(response);
}

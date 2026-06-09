export type LabVariant = {
  key: string;
  title: string;
  enabled: boolean;
  description: string;
  entryKey: string;
  expectedOutcome: string;
  supportsAutomation: boolean;
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
  variants: LabVariant[];
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

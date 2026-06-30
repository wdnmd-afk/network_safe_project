export type XxeVariantKey = "vuln" | "fixed";

export type XxeInput = {
  importKind: string;
  xmlDocument: string;
};

export type XxeEntitySourceType =
  | "none"
  | "virtual-file"
  | "virtual-resource"
  | "unknown";

export type XxeSignal =
  | "xxe-safe-xml-imported"
  | "xxe-virtual-entity-resolved"
  | "xxe-internal-resource-exposed"
  | "xxe-doctype-blocked"
  | "xxe-entity-not-found"
  | "xxe-import-kind-not-found"
  | "xxe-xml-too-large";

export type XxePreviewField = {
  key: string;
  label: string;
  value: string;
  fromVirtualEntity: boolean;
};

export type XxeInspection = {
  xmlLength: number;
  containsDoctype: boolean;
  declaredEntityNames: string[];
  referencedEntityNames: string[];
  entitySourceTypes: XxeEntitySourceType[];
  matchedControlledSample: boolean;
  unknownEntityCount: number;
};

export type XxeImportResult = {
  status: "ok" | "blocked" | "failed";
  variantKey: XxeVariantKey;
  importKind: string;
  preview: {
    title: string;
    fields: XxePreviewField[];
  };
  inspection: XxeInspection;
  signal: XxeSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type XxeResponse = {
  status: "ok" | "blocked" | "failed";
  result: XxeImportResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitXxeImport(
  variantKey: XxeVariantKey,
  token: string,
  input: XxeInput,
) {
  const response = await fetch(`/api/labs/web/xxe/${variantKey}/import`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (
    response.status === 400 ||
    response.status === 403 ||
    response.status === 404
  ) {
    return (await response.json()) as XxeResponse;
  }

  return readJson<XxeResponse>(response);
}

export type CrlfInjectionVariantKey = "vuln" | "fixed";

export type CrlfInjectionInput = {
  headerTemplate: string;
  fileName: string;
  dispositionType: string;
};

export type CrlfInjectionControlCharType = "cr" | "lf" | "other-control";

export type CrlfInjectionHeaderSource =
  | "template"
  | "user-input"
  | "virtual-injected";

export type CrlfInjectionSignal =
  | "crlf-injection-safe-header-previewed"
  | "crlf-injection-control-chars-detected"
  | "crlf-injection-virtual-header-injected"
  | "crlf-injection-control-chars-blocked"
  | "crlf-injection-template-not-found";

export type CrlfInjectionVirtualHeader = {
  name: string;
  valuePreview: string;
  source: CrlfInjectionHeaderSource;
  polluted: boolean;
};

export type CrlfInjectionInspection = {
  headerTemplateAllowed: boolean;
  dispositionTypeAllowed: boolean;
  fileNameLength: number;
  fileNamePreview: string;
  detectedControlChars: CrlfInjectionControlCharType[];
  matchedControlledSample: boolean;
  virtualHeaderCount: number;
  pollutedHeaderCount: number;
};

export type CrlfInjectionResult = {
  status: "ok" | "blocked" | "failed";
  variantKey: CrlfInjectionVariantKey;
  headerTemplate: string;
  dispositionType: string;
  fileNameLength: number;
  fileNamePreview: string;
  headers: CrlfInjectionVirtualHeader[];
  inspection: CrlfInjectionInspection;
  signal: CrlfInjectionSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type CrlfInjectionResponse = {
  status: "ok" | "blocked" | "failed";
  result: CrlfInjectionResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitCrlfInjectionPreview(
  variantKey: CrlfInjectionVariantKey,
  token: string,
  input: CrlfInjectionInput,
) {
  const response = await fetch(
    `/api/labs/web/crlf-injection/${variantKey}/preview`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  if (
    response.status === 400 ||
    response.status === 403 ||
    response.status === 404
  ) {
    return (await response.json()) as CrlfInjectionResponse;
  }

  return readJson<CrlfInjectionResponse>(response);
}

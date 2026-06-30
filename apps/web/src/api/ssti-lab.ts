export type SstiVariantKey = "vuln" | "fixed";

export type SstiTemplateVariables = {
  customerName: string;
  orderNo: string;
  noticeTitle: string;
};

export type SstiInput = {
  templateKey: string;
  templateText?: string;
  variables: SstiTemplateVariables;
};

export type SstiExpressionType =
  | "allowed-variable"
  | "controlled-math-expression"
  | "controlled-debug-context"
  | "unknown-expression";

export type SstiSignal =
  | "ssti-safe-template-rendered"
  | "ssti-expression-evaluated"
  | "ssti-template-context-exposed"
  | "ssti-expression-blocked"
  | "ssti-template-not-found";

export type SstiInspection = {
  templateLength: number;
  expressionCount: number;
  expressionTypes: SstiExpressionType[];
  matchedControlledSample: boolean;
  unknownExpressionCount: number;
  variableKeys: string[];
  acceptedVariableKeys: string[];
};

export type SstiPreviewResult = {
  status: "ok" | "blocked" | "failed";
  variantKey: SstiVariantKey;
  templateKey: string;
  renderedText: string;
  inspection: SstiInspection;
  signal: SstiSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type SstiResponse = {
  status: "ok" | "blocked" | "failed";
  result: SstiPreviewResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitSstiPreview(
  variantKey: SstiVariantKey,
  token: string,
  input: SstiInput,
) {
  const response = await fetch(`/api/labs/web/ssti/${variantKey}/preview`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (response.status === 403 || response.status === 404) {
    return (await response.json()) as SstiResponse;
  }

  return readJson<SstiResponse>(response);
}

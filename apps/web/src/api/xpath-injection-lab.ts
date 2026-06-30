export type XpathInjectionVariantKey = "vuln" | "fixed";

export type XpathInjectionInput = {
  queryTemplate: string;
  keyword: string;
  scope: string;
};

export type XpathInjectionRiskType =
  | "none"
  | "controlled-scope-expansion"
  | "xpath-like-token";

export type XpathInjectionSignal =
  | "xpath-injection-safe-query-completed"
  | "xpath-injection-controlled-sample-detected"
  | "xpath-injection-result-scope-expanded"
  | "xpath-injection-controlled-sample-blocked"
  | "xpath-injection-template-not-found";

export type XpathInjectionDocument = {
  id: string;
  name: string;
  category: string;
  visibility: "public" | "internal";
  matchedBy: "keyword" | "controlled-expanded-scope";
  teachingOnly: boolean;
};

export type XpathInjectionInspection = {
  queryTemplateAllowed: boolean;
  scopeAllowed: boolean;
  keywordLength: number;
  keywordPreview: string;
  detectedRiskTypes: XpathInjectionRiskType[];
  matchedControlledSample: boolean;
  resultScope: "public" | "expanded" | "blocked" | "none";
};

export type XpathInjectionResult = {
  status: "ok" | "blocked" | "failed";
  variantKey: XpathInjectionVariantKey;
  queryTemplate: string;
  scope: string;
  keywordLength: number;
  keywordPreview: string;
  documents: XpathInjectionDocument[];
  inspection: XpathInjectionInspection;
  signal: XpathInjectionSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type XpathInjectionResponse = {
  status: "ok" | "blocked" | "failed";
  result: XpathInjectionResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitXpathInjectionSearch(
  variantKey: XpathInjectionVariantKey,
  token: string,
  input: XpathInjectionInput,
) {
  const response = await fetch(
    `/api/labs/web/xpath-injection/${variantKey}/search`,
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
    return (await response.json()) as XpathInjectionResponse;
  }

  return readJson<XpathInjectionResponse>(response);
}

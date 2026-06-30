export type NosqlInjectionVariantKey = "vuln" | "fixed";

export type NosqlInjectionInput = {
  queryMode: string;
  keyword: string;
  filterText?: string;
};

export type NosqlInjectionRiskType =
  | "none"
  | "controlled-operator"
  | "object-like-input"
  | "array-like-input"
  | "operator-like-token";

export type NosqlInjectionSignal =
  | "nosql-injection-safe-query-completed"
  | "nosql-injection-operator-detected"
  | "nosql-injection-query-expanded"
  | "nosql-injection-operator-blocked"
  | "nosql-injection-schema-blocked"
  | "nosql-injection-query-mode-not-found";

export type NosqlInjectionDocument = {
  id: string;
  title: string;
  channel: string;
  visibility: "public" | "hidden";
  teachingOnly: boolean;
};

export type NosqlInjectionInspection = {
  queryModeAllowed: boolean;
  keywordLength: number;
  filterTextLength: number;
  detectedRiskTypes: NosqlInjectionRiskType[];
  matchedControlledSample: boolean;
  resultScope: "public" | "expanded" | "blocked" | "none";
};

export type NosqlInjectionResult = {
  status: "ok" | "blocked" | "failed";
  variantKey: NosqlInjectionVariantKey;
  queryMode: string;
  keyword: string;
  filterTextLength: number;
  documents: NosqlInjectionDocument[];
  inspection: NosqlInjectionInspection;
  signal: NosqlInjectionSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type NosqlInjectionResponse = {
  status: "ok" | "blocked" | "failed";
  result: NosqlInjectionResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitNosqlInjectionSearch(
  variantKey: NosqlInjectionVariantKey,
  token: string,
  input: NosqlInjectionInput,
) {
  const response = await fetch(
    `/api/labs/web/nosql-injection/${variantKey}/search`,
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
    return (await response.json()) as NosqlInjectionResponse;
  }

  return readJson<NosqlInjectionResponse>(response);
}

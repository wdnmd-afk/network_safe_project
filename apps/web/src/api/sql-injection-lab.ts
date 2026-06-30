export type SqlInjectionVariantKey = "vuln" | "fixed";

export type SqlInjectionSignal =
  | "sql-injection-normal-search"
  | "sql-injection-data-exposed"
  | "sql-injection-parameterized-blocked"
  | "sql-injection-safety-boundary-blocked"
  | "sql-injection-query-error";

export type SqlInjectionProduct = {
  id: string;
  sku: string;
  name: string;
  category: string;
  priceCents: number;
  internalNote: string | null;
  isHidden: boolean;
};

export type SqlInjectionSearchInput = {
  keyword: string;
};

export type SqlInjectionSearchResult = {
  status: "ok" | "blocked" | "failed";
  variantKey: SqlInjectionVariantKey;
  keyword: string;
  detectedInjection: boolean;
  queryMode: "unsafe-concat" | "parameterized";
  queryPreview: string;
  rows: SqlInjectionProduct[];
  signal: SqlInjectionSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type SqlInjectionSearchResponse = {
  status: "ok" | "blocked" | "failed";
  result: SqlInjectionSearchResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitSqlInjectionSearch(
  variantKey: SqlInjectionVariantKey,
  token: string,
  input: SqlInjectionSearchInput,
) {
  const response = await fetch(
    `/api/labs/web/sql-injection/${variantKey}/search`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  if (response.status === 400 || response.status === 403) {
    return (await response.json()) as SqlInjectionSearchResponse;
  }

  return readJson<SqlInjectionSearchResponse>(response);
}

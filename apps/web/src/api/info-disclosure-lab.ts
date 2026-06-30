export type InfoDisclosureVariantKey = "vuln" | "fixed";

export type InfoDisclosureSignal =
  | "info-disclosure-public-report-returned"
  | "info-disclosure-debug-data-exposed"
  | "info-disclosure-debug-data-blocked"
  | "info-disclosure-report-not-found";

export type InfoDisclosureInput = {
  reportKey: string;
};

export type InfoDisclosureField = {
  label: string;
  value: string;
  sensitive: boolean;
};

export type InfoDisclosureReport = {
  key: string;
  title: string;
  reportType: "public" | "debug";
  summary: string;
  fields: InfoDisclosureField[];
  isSensitive: boolean;
};

export type InfoDisclosureInspection = {
  normalizedReportKey: string;
  requestedSensitiveReport: boolean;
  allowedPublicReport: boolean;
  exposedFieldCount: number;
  reportKeyLength: number;
};

export type InfoDisclosureResult = {
  status: "ok" | "blocked" | "not-found";
  variantKey: InfoDisclosureVariantKey;
  reportKey: string;
  inspection: InfoDisclosureInspection;
  report: InfoDisclosureReport | null;
  signal: InfoDisclosureSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type InfoDisclosureResponse = {
  status: "ok" | "blocked" | "not-found";
  result: InfoDisclosureResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitInfoDisclosureReport(
  variantKey: InfoDisclosureVariantKey,
  token: string,
  input: InfoDisclosureInput,
) {
  const response = await fetch(
    `/api/labs/web/info-disclosure/${variantKey}/report`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  if (response.status === 400 || response.status === 403 || response.status === 404) {
    return (await response.json()) as InfoDisclosureResponse;
  }

  return readJson<InfoDisclosureResponse>(response);
}

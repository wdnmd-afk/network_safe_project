export type SsrfVariantKey = "vuln" | "fixed";

export type SsrfSignal =
  | "ssrf-public-resource-fetched"
  | "ssrf-internal-metadata-exposed"
  | "ssrf-private-target-blocked"
  | "ssrf-target-not-found"
  | "ssrf-invalid-url-blocked";

export type SsrfInput = {
  targetUrl: string;
};

export type SsrfInspection = {
  normalizedUrl: string;
  protocol: string;
  hostname: string;
  pathname: string;
  allowedPublicHost: boolean;
  privateTarget: boolean;
  targetUrlLength: number;
};

export type SsrfResource = {
  url: string;
  title: string;
  resourceType: "public" | "internal";
  content: string;
  isSensitive: boolean;
};

export type SsrfResult = {
  status: "ok" | "blocked" | "not-found";
  variantKey: SsrfVariantKey;
  targetUrl: string;
  resolvedUrl: string;
  inspection: SsrfInspection;
  resource: SsrfResource | null;
  signal: SsrfSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type SsrfResponse = {
  status: "ok" | "blocked" | "not-found";
  result: SsrfResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitSsrfFetch(
  variantKey: SsrfVariantKey,
  token: string,
  input: SsrfInput,
) {
  const response = await fetch(`/api/labs/web/ssrf/${variantKey}/fetch`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (response.status === 400 || response.status === 403 || response.status === 404) {
    return (await response.json()) as SsrfResponse;
  }

  return readJson<SsrfResponse>(response);
}

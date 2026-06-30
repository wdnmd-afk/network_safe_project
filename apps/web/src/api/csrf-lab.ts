export type CsrfVariantKey = "vuln" | "fixed";

export type CsrfLabState = {
  userId: string;
  balance: number;
  status: "idle" | "transferred" | "blocked";
  lastSignal: "none" | "csrf-transfer-accepted" | "csrf-token-required" | "csrf-token-accepted";
  lastTransfer: {
    variantKey: CsrfVariantKey;
    amount: number;
    targetAccount: string;
  } | null;
};

export type CsrfTransferInput = {
  amount: number;
  targetAccount: string;
  csrfToken?: string;
};

export type CsrfStateResponse = {
  status: string;
  state: CsrfLabState;
};

export type CsrfTokenResponse = {
  status: string;
  csrfToken: string;
};

export type CsrfTransferResponse = {
  status: "ok" | "blocked";
  state: CsrfLabState;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function fetchCsrfState(token: string) {
  const response = await fetch("/api/labs/web/csrf/state", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  return readJson<CsrfStateResponse>(response);
}

export async function issueCsrfToken(token: string) {
  const response = await fetch("/api/labs/web/csrf/fixed/token", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  return readJson<CsrfTokenResponse>(response);
}

export async function submitCsrfTransfer(
  variantKey: CsrfVariantKey,
  token: string,
  input: CsrfTransferInput,
) {
  const response = await fetch(`/api/labs/web/csrf/${variantKey}/transfer`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (response.status === 403) {
    return (await response.json()) as CsrfTransferResponse;
  }

  return readJson<CsrfTransferResponse>(response);
}

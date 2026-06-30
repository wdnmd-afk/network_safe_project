export type IdorVariantKey = "vuln" | "fixed";

export type IdorSignal =
  | "idor-own-order-accepted"
  | "idor-cross-user-order-exposed"
  | "idor-cross-user-order-blocked"
  | "idor-order-not-found";

export type IdorInput = {
  orderId: string;
};

export type IdorOrder = {
  id: string;
  ownerUserId: string;
  ownerLabel: string;
  productName: string;
  amount: number;
  status: "paid" | "shipping" | "pending";
  contactMasked: string;
  internalNote: string;
};

export type IdorInspection = {
  orderIdLength: number;
  objectType: "order";
  objectFound: boolean;
  currentUserId: string;
  ownerUserId: string;
  ownerMatches: boolean;
  crossUserRequested: boolean;
};

export type IdorResult = {
  status: "ok" | "blocked" | "not-found";
  variantKey: IdorVariantKey;
  orderId: string;
  order: IdorOrder | null;
  inspection: IdorInspection;
  signal: IdorSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type IdorResponse = {
  status: "ok" | "blocked" | "not-found";
  result: IdorResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitIdorRead(
  variantKey: IdorVariantKey,
  token: string,
  input: IdorInput,
) {
  const response = await fetch(`/api/labs/auth/idor/${variantKey}/read`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (response.status === 400 || response.status === 403 || response.status === 404) {
    return (await response.json()) as IdorResponse;
  }

  return readJson<IdorResponse>(response);
}

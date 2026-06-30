export type JwtVariantKey = "vuln" | "fixed";

export type JwtSignal =
  | "jwt-valid-user-token-accepted"
  | "jwt-none-alg-admin-accepted"
  | "jwt-none-alg-blocked"
  | "jwt-signature-invalid-blocked"
  | "jwt-token-invalid";

export type JwtInput = {
  token: string;
};

export type JwtHeader = {
  alg: string;
  typ: string;
};

export type JwtPayload = {
  sub: string;
  role: string;
  scope: string;
  lab: string;
};

export type JwtInspection = {
  tokenLength: number;
  segmentCount: number;
  algorithm: string;
  signaturePresent: boolean;
  signatureValid: boolean;
  roleClaim: string;
  scopeClaim: string;
  adminClaimRequested: boolean;
  labToken: boolean;
};

export type JwtAccess = {
  subject: string;
  role: string;
  scope: string;
  resource: "user-orders" | "admin-analytics";
  granted: boolean;
};

export type JwtResult = {
  status: "ok" | "blocked" | "invalid";
  variantKey: JwtVariantKey;
  header: JwtHeader | null;
  payload: JwtPayload | null;
  inspection: JwtInspection;
  access: JwtAccess | null;
  signal: JwtSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type JwtResponse = {
  status: "ok" | "blocked" | "invalid";
  result: JwtResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitJwtVerify(
  variantKey: JwtVariantKey,
  token: string,
  input: JwtInput,
) {
  const response = await fetch(`/api/labs/auth/jwt/${variantKey}/verify`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (response.status === 400 || response.status === 403 || response.status === 404) {
    return (await response.json()) as JwtResponse;
  }

  return readJson<JwtResponse>(response);
}

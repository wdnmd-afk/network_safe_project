export type PrivilegeEscalationVariantKey = "vuln" | "fixed";

export type PrivilegeEscalationSignal =
  | "privilege-normal-operation-accepted"
  | "privilege-client-role-admin-accepted"
  | "privilege-client-role-admin-blocked"
  | "privilege-operation-not-found";

export type PrivilegeEscalationInput = {
  operationKey: string;
  requestedRole: string;
};

export type PrivilegeEscalationOperation = {
  key: string;
  title: string;
  requiredRole: "member" | "admin";
  resultSummary: string;
};

export type PrivilegeEscalationInspection = {
  operationKeyLength: number;
  requestedRole: string;
  currentUserRole: string;
  effectiveRole: string;
  trustedClientRole: boolean;
  privilegedOperation: boolean;
  roleAllowed: boolean;
};

export type PrivilegeEscalationResult = {
  status: "ok" | "blocked" | "not-found";
  variantKey: PrivilegeEscalationVariantKey;
  operationKey: string;
  requestedRole: string;
  operation: PrivilegeEscalationOperation | null;
  inspection: PrivilegeEscalationInspection;
  signal: PrivilegeEscalationSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type PrivilegeEscalationResponse = {
  status: "ok" | "blocked" | "not-found";
  result: PrivilegeEscalationResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitPrivilegeEscalationExecute(
  variantKey: PrivilegeEscalationVariantKey,
  token: string,
  input: PrivilegeEscalationInput,
) {
  const response = await fetch(
    `/api/labs/auth/privilege-escalation/${variantKey}/execute`,
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
    return (await response.json()) as PrivilegeEscalationResponse;
  }

  return readJson<PrivilegeEscalationResponse>(response);
}

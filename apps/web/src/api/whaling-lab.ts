export type WhalingVariantKey = "vuln" | "fixed";

export type WhalingCaseKey =
  | "executive-wire-approval"
  | "board-confidential-request"
  | "legal-settlement-transfer"
  | "ma-data-room-access";

export type WhalingVerificationPolicyKey =
  | "authority-context-only"
  | "trusted-channel-callback"
  | "payment-dual-approval"
  | "legal-board-channel-review"
  | "least-privilege-data-room"
  | "freeze-and-escalate";

export type WhalingRiskIndicator =
  | "executive-authority-pressure"
  | "confidentiality-pressure"
  | "payment-urgency"
  | "approval-chain-bypass"
  | "legal-settlement-pressure"
  | "data-room-access-risk"
  | "least-privilege-missing"
  | "trusted-channel-missing";

export type WhalingSignal =
  | "whaling-executive-authority-overweighted"
  | "whaling-confidential-pressure-identified"
  | "whaling-payment-freeze-required"
  | "whaling-boundary-verified";

export type WhalingInput = {
  caseKey: WhalingCaseKey;
  verificationPolicyKey: WhalingVerificationPolicyKey;
};

export type WhalingCaseSummary = {
  caseKey: WhalingCaseKey;
  title: string;
  roleContext: string;
  processContext: string;
  riskLevel: "high" | "critical";
  clueLabels: string[];
  learningNotes: string;
};

export type WhalingAssessment = {
  caseAllowed: boolean;
  policyAllowed: boolean;
  riskIndicatorCount: number;
  riskIndicators: WhalingRiskIndicator[];
  matchedControlledCase: boolean;
  authorityContextBias: boolean;
  verificationApplied: boolean;
  trustedChannelRequired: boolean;
  paymentFreezeRequired: boolean;
  legalBoardReviewRequired: boolean;
  leastPrivilegeRequired: boolean;
  recommendedAction: string;
  riskLevel: "high" | "critical";
};

export type WhalingResult = {
  status: "ok" | "blocked";
  variantKey: WhalingVariantKey;
  caseKey: string;
  verificationPolicyKey: string;
  caseSummary: WhalingCaseSummary | null;
  assessment: WhalingAssessment;
  signal: WhalingSignal;
  decision: "accepted" | "blocked";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type WhalingResponse = {
  status: "ok" | "blocked";
  result: WhalingResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitWhalingReview(
  variantKey: WhalingVariantKey,
  token: string,
  input: WhalingInput,
) {
  const response = await fetch(
    `/api/labs/social/whaling/${variantKey}/review`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        caseKey: input.caseKey,
        verificationPolicyKey: input.verificationPolicyKey,
      }),
    },
  );

  if (
    response.status === 400 ||
    response.status === 403 ||
    response.status === 404
  ) {
    return (await response.json()) as WhalingResponse;
  }

  return readJson<WhalingResponse>(response);
}

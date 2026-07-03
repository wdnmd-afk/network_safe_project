export type SpearPhishingVariantKey = "vuln" | "fixed";

export type SpearPhishingCaseKey =
  | "executive-invoice-approval"
  | "vendor-payment-change"
  | "engineering-access-request"
  | "hr-benefit-personalized";

export type SpearPhishingVerificationPolicyKey =
  | "context-only"
  | "out-of-band-confirmation"
  | "approval-chain-review"
  | "least-privilege-review"
  | "report-and-isolate";

export type SpearPhishingRiskIndicator =
  | "authority-pressure"
  | "urgency-pressure"
  | "approval-chain-bypass"
  | "business-context-trust"
  | "payment-change-risk"
  | "temporary-access-risk"
  | "least-privilege-missing"
  | "official-channel-bypass"
  | "attachment-isolation-missing";

export type SpearPhishingSignal =
  | "spear-phishing-context-trust-overweighted"
  | "spear-phishing-approval-chain-bypassed"
  | "spear-phishing-out-of-band-confirmation-required"
  | "spear-phishing-boundary-verified";

export type SpearPhishingInput = {
  caseKey: SpearPhishingCaseKey;
  verificationPolicyKey: SpearPhishingVerificationPolicyKey;
};

export type SpearPhishingCaseSummary = {
  caseKey: SpearPhishingCaseKey;
  title: string;
  roleContext: string;
  processContext: string;
  riskLevel: "medium" | "high";
  clueLabels: string[];
  learningNotes: string;
};

export type SpearPhishingAssessment = {
  caseAllowed: boolean;
  policyAllowed: boolean;
  riskIndicatorCount: number;
  riskIndicators: SpearPhishingRiskIndicator[];
  matchedControlledCase: boolean;
  contextTrustBias: boolean;
  verificationApplied: boolean;
  approvalChainRequired: boolean;
  outOfBandRequired: boolean;
  recommendedAction: string;
  riskLevel: "medium" | "high";
};

export type SpearPhishingResult = {
  status: "ok" | "blocked";
  variantKey: SpearPhishingVariantKey;
  caseKey: string;
  verificationPolicyKey: string;
  caseSummary: SpearPhishingCaseSummary | null;
  assessment: SpearPhishingAssessment;
  signal: SpearPhishingSignal;
  decision: "accepted" | "blocked";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type SpearPhishingResponse = {
  status: "ok" | "blocked";
  result: SpearPhishingResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitSpearPhishingReview(
  variantKey: SpearPhishingVariantKey,
  token: string,
  input: SpearPhishingInput,
) {
  const response = await fetch(
    `/api/labs/social/spear-phishing/${variantKey}/review`,
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
    return (await response.json()) as SpearPhishingResponse;
  }

  return readJson<SpearPhishingResponse>(response);
}

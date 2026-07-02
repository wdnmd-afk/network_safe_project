export type PhishingVariantKey = "vuln" | "fixed";

export type PhishingCaseKey =
  | "invoice-urgent-review"
  | "account-security-alert"
  | "hr-benefit-update"
  | "internal-security-newsletter";

export type PhishingReviewModeKey =
  | "surface-only"
  | "indicator-review"
  | "reporting-flow";

export type PhishingDefenseChecklistKey =
  | "none"
  | "sender-domain-check"
  | "report-isolate-confirm"
  | "safe-release-check";

export type PhishingRiskIndicator =
  | "domain-lookalike"
  | "urgency-signal"
  | "credential-request"
  | "attachment-risk"
  | "business-context-mismatch"
  | "brand-impersonation";

export type PhishingSignal =
  | "phishing-lookalike-domain-overlooked"
  | "phishing-credential-request-visible"
  | "phishing-attachment-risk-visible"
  | "phishing-reporting-flow-applied"
  | "phishing-safe-message-accepted"
  | "phishing-case-boundary-verified";

export type PhishingInput = {
  caseKey: PhishingCaseKey;
  reviewModeKey: PhishingReviewModeKey;
  defenseChecklistKey: PhishingDefenseChecklistKey;
};

export type PhishingCaseSummary = {
  caseKey: PhishingCaseKey;
  title: string;
  surfaceCue: string;
  businessContext: string;
  riskLevel: "low" | "medium" | "high";
  indicatorLabels: string[];
  learningNotes: string;
};

export type PhishingInspection = {
  caseAllowed: boolean;
  reviewModeAllowed: boolean;
  checklistAllowed: boolean;
  indicatorCount: number;
  riskIndicators: PhishingRiskIndicator[];
  matchedControlledCase: boolean;
  surfaceBias: boolean;
  checklistApplied: boolean;
  recommendedAction: string;
  riskLevel: "low" | "medium" | "high";
};

export type PhishingResult = {
  status: "ok" | "blocked";
  variantKey: PhishingVariantKey;
  caseKey: string;
  reviewModeKey: string;
  defenseChecklistKey: string;
  caseSummary: PhishingCaseSummary | null;
  inspection: PhishingInspection;
  signal: PhishingSignal;
  decision: "accepted" | "blocked";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type PhishingResponse = {
  status: "ok" | "blocked";
  result: PhishingResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitPhishingReview(
  variantKey: PhishingVariantKey,
  token: string,
  input: PhishingInput,
) {
  const response = await fetch(
    `/api/labs/social/phishing/${variantKey}/review`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        caseKey: input.caseKey,
        reviewModeKey: input.reviewModeKey,
        defenseChecklistKey: input.defenseChecklistKey,
      }),
    },
  );

  if (
    response.status === 400 ||
    response.status === 403 ||
    response.status === 404
  ) {
    return (await response.json()) as PhishingResponse;
  }

  return readJson<PhishingResponse>(response);
}

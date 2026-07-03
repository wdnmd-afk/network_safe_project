export type MisconfigurationVariantKey = "vuln" | "fixed";

export type MisconfigurationConfigCaseKey =
  | "debug-console-exposed"
  | "directory-index-enabled"
  | "wildcard-cors-with-credentials"
  | "public-admin-status"
  | "verbose-error-detail"
  | "default-credential-hint-visible";

export type MisconfigurationAuditPolicyKey =
  | "exposure-review"
  | "least-exposure-policy"
  | "authenticated-admin-only"
  | "strict-cors-audit"
  | "safe-error-reporting";

export type MisconfigurationExposureCategory =
  | "debug-surface"
  | "directory-listing"
  | "cross-origin-trust"
  | "admin-status"
  | "error-reporting"
  | "credential-hint";

export type MisconfigurationRiskIndicator =
  | "debug-surface-visible"
  | "directory-index-visible"
  | "cors-credentials-too-broad"
  | "admin-status-public"
  | "verbose-error-visible"
  | "default-credential-hint-visible";

export type MisconfigurationAuditAction =
  | "audit-missing"
  | "exposure-reviewed"
  | "exposure-reduced"
  | "debug-disabled"
  | "directory-index-disabled"
  | "admin-auth-required"
  | "cors-policy-restricted"
  | "safe-error-reporting"
  | "credential-hint-removed"
  | "audit-blocked";

export type MisconfigurationSignal =
  | "misconfiguration-debug-surface-visible"
  | "misconfiguration-directory-index-visible"
  | "misconfiguration-cors-too-broad"
  | "misconfiguration-admin-status-public"
  | "misconfiguration-error-detail-exposed"
  | "misconfiguration-default-credential-hint-visible"
  | "misconfiguration-exposure-reduced"
  | "misconfiguration-auth-required"
  | "misconfiguration-cors-policy-restricted"
  | "misconfiguration-safe-error-reporting"
  | "misconfiguration-boundary-verified";

export type MisconfigurationInput = {
  configCaseKey: MisconfigurationConfigCaseKey;
  auditPolicyKey: MisconfigurationAuditPolicyKey;
};

export type MisconfigurationConfigSummary = {
  configCaseKey: MisconfigurationConfigCaseKey;
  title: string;
  exposureCategory: MisconfigurationExposureCategory;
  visibleInVulnerableVariant: boolean;
  recommendedPolicyKey: MisconfigurationAuditPolicyKey;
  learningNotes: string;
};

export type MisconfigurationAudit = {
  exposureCategory: MisconfigurationExposureCategory | "blocked";
  exposureState: "visible" | "reduced" | "restricted" | "internal-only" | "blocked";
  authRequired: boolean;
  corsPolicyStatus: "too-broad" | "restricted" | "not-applicable";
  errorReportingStatus: "verbose" | "safe" | "not-applicable";
  matchedControlledSample: boolean;
  riskIndicatorCount: number;
  riskIndicators: MisconfigurationRiskIndicator[];
  auditActions: MisconfigurationAuditAction[];
  recommendedAction: string;
};

export type MisconfigurationResult = {
  status: "ok" | "blocked";
  variantKey: MisconfigurationVariantKey;
  configCaseKey: string;
  auditPolicyKey: string;
  configSummary: MisconfigurationConfigSummary | null;
  audit: MisconfigurationAudit;
  signal: MisconfigurationSignal;
  decision: "accepted" | "blocked";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type MisconfigurationResponse = {
  status: "ok" | "blocked";
  result: MisconfigurationResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitMisconfigurationAudit(
  variantKey: MisconfigurationVariantKey,
  token: string,
  input: MisconfigurationInput,
) {
  const response = await fetch(
    `/api/labs/infrastructure/misconfiguration/${variantKey}/audit`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        configCaseKey: input.configCaseKey,
        auditPolicyKey: input.auditPolicyKey,
      }),
    },
  );

  if (
    response.status === 400 ||
    response.status === 403 ||
    response.status === 404
  ) {
    return (await response.json()) as MisconfigurationResponse;
  }

  return readJson<MisconfigurationResponse>(response);
}

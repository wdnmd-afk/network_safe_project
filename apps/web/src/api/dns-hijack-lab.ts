export type DnsHijackVariantKey = "vuln" | "fixed";

export type DnsHijackResolverProfile = "public-cache" | "trusted-resolver";

export type DnsHijackDomainKey =
  | "customer-portal"
  | "update-service"
  | "internal-dashboard";

export type DnsHijackCertificateStatus = "trusted" | "mismatch" | "unknown";

export type DnsHijackSignal =
  | "dns-hijack-resolution-misdirected"
  | "dns-hijack-certificate-mismatch-visible"
  | "dns-hijack-trusted-resolution-restored"
  | "dns-hijack-anomaly-blocked"
  | "dns-hijack-domain-blocked"
  | "dns-hijack-normal-resolution-returned";

export type DnsHijackInput = {
  domainKey: DnsHijackDomainKey;
  resolverProfile: DnsHijackResolverProfile;
};

export type DnsHijackDomainSummary = {
  domainKey: DnsHijackDomainKey;
  title: string;
  displayDomain: string;
  businessPurpose: string;
  expectedAddressCategory: string;
  certificateExpectation: DnsHijackCertificateStatus;
  riskNotes: string;
};

export type DnsHijackResolution = {
  resolverProfile: string;
  sourceTrust: "untrusted-cache" | "trusted-source" | "unknown";
  expectedAddressCategory: string;
  resolvedAddressCategory: string;
  certificateStatus: DnsHijackCertificateStatus;
  anomalyDetected: boolean;
  matchedControlledSample: boolean;
};

export type DnsHijackAudit = {
  trustedSource: boolean;
  addressMatchesExpected: boolean;
  certificateTrusted: boolean;
  blockedByPolicy: boolean;
  learningHint: string;
};

export type DnsHijackResult = {
  status: "ok" | "blocked";
  variantKey: DnsHijackVariantKey;
  domainKey: string;
  resolverProfile: string;
  domain: DnsHijackDomainSummary | null;
  resolution: DnsHijackResolution;
  audit: DnsHijackAudit;
  signal: DnsHijackSignal;
  decision: "accepted" | "blocked";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type DnsHijackResponse = {
  status: "ok" | "blocked";
  result: DnsHijackResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitDnsHijackObservation(
  variantKey: DnsHijackVariantKey,
  token: string,
  input: DnsHijackInput,
) {
  const response = await fetch(
    `/api/labs/network/dns-hijack/${variantKey}/resolve`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  if (
    response.status === 400 ||
    response.status === 403 ||
    response.status === 404
  ) {
    return (await response.json()) as DnsHijackResponse;
  }

  return readJson<DnsHijackResponse>(response);
}

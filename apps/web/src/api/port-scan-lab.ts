export type PortScanVariantKey = "vuln" | "fixed";

export type PortScanProfile = "quick-observe" | "surface-review";

export type PortScanTargetKey =
  | "office-gateway"
  | "admin-node"
  | "hardened-service";

export type PortScanSignal =
  | "port-scan-exposure-expanded"
  | "port-scan-management-surface-visible"
  | "port-scan-surface-reduced"
  | "port-scan-target-blocked"
  | "port-scan-normal-inventory-returned";

export type PortScanInput = {
  targetKey: PortScanTargetKey;
  scanProfile: PortScanProfile;
};

export type PortScanVirtualPort = {
  port: number;
  protocol: "tcp";
  serviceLabel: string;
  exposure: "public" | "restricted" | "internal-only";
  riskLevel: "low" | "medium" | "high" | "critical";
  learningHint: string;
};

export type PortScanTargetSummary = {
  targetKey: PortScanTargetKey;
  title: string;
  profile: "exposed" | "hardened" | "baseline";
  description: string;
};

export type PortScanSummary = {
  virtualPortCount: number;
  openPortCount: number;
  restrictedPortCount: number;
  highRiskPortCount: number;
  exposureScore: number;
  matchedControlledSample: boolean;
};

export type PortScanResult = {
  status: "ok" | "blocked";
  variantKey: PortScanVariantKey;
  targetKey: string;
  scanProfile: string;
  target: PortScanTargetSummary | null;
  ports: PortScanVirtualPort[];
  summary: PortScanSummary;
  signal: PortScanSignal;
  decision: "accepted" | "blocked";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type PortScanResponse = {
  status: "ok" | "blocked";
  result: PortScanResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitPortScanObservation(
  variantKey: PortScanVariantKey,
  token: string,
  input: PortScanInput,
) {
  const response = await fetch(
    `/api/labs/network/port-scan/${variantKey}/scan`,
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
    return (await response.json()) as PortScanResponse;
  }

  return readJson<PortScanResponse>(response);
}

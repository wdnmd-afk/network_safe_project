export type DependencyConfusionVariantKey = "vuln" | "fixed";

export type DependencyConfusionManifestKey =
  | "unscoped-internal-name"
  | "scoped-private-package"
  | "mixed-source-review";

export type DependencyConfusionRegistryScenarioKey =
  | "public-name-collision"
  | "private-scope-pinned"
  | "lockfile-integrity-mismatch";

export type DependencyConfusionResolutionPolicyKey =
  | "prefer-public-latest"
  | "scope-pinned-private"
  | "lockfile-integrity-audit";

export type DependencyConfusionRiskIndicator =
  | "private-scope-missing"
  | "public-name-collision"
  | "lockfile-missing"
  | "integrity-mismatch"
  | "source-not-audited";

export type DependencyConfusionAuditAction =
  | "audit-missing"
  | "scope-registry-bound"
  | "source-audited"
  | "lockfile-integrity-checked"
  | "resolution-blocked";

export type DependencyConfusionSignal =
  | "dependency-confusion-public-source-selected"
  | "dependency-confusion-private-scope-missing"
  | "dependency-confusion-registry-source-audited"
  | "dependency-confusion-lockfile-integrity-blocked"
  | "dependency-confusion-private-scope-pinned"
  | "dependency-confusion-safe-public-package-accepted"
  | "dependency-confusion-boundary-verified";

export type DependencyConfusionInput = {
  manifestKey: DependencyConfusionManifestKey;
  registryScenarioKey: DependencyConfusionRegistryScenarioKey;
  resolutionPolicyKey: DependencyConfusionResolutionPolicyKey;
};

export type DependencyConfusionManifestSummary = {
  manifestKey: DependencyConfusionManifestKey;
  title: string;
  dependencyShape: "private-unscoped" | "private-scoped" | "mixed-public-private";
  privateScopeBound: boolean;
  lockfilePresent: boolean;
  publicDependencyPresent: boolean;
  learningNotes: string;
};

export type DependencyConfusionResolution = {
  resolvedSource:
    | "public-registry"
    | "private-registry"
    | "mixed-audited"
    | "blocked-audit"
    | "not-resolved";
  sourceTrust: "untrusted" | "trusted" | "audited" | "blocked";
  packageScopeStatus: "missing" | "pinned" | "mixed-audited";
  lockfileStatus: "missing" | "verified" | "mismatch";
  matchedControlledSample: boolean;
  riskIndicatorCount: number;
  riskIndicators: DependencyConfusionRiskIndicator[];
  auditActions: DependencyConfusionAuditAction[];
  recommendedAction: string;
};

export type DependencyConfusionResult = {
  status: "ok" | "blocked";
  variantKey: DependencyConfusionVariantKey;
  manifestKey: string;
  registryScenarioKey: string;
  resolutionPolicyKey: string;
  manifestSummary: DependencyConfusionManifestSummary | null;
  resolution: DependencyConfusionResolution;
  signal: DependencyConfusionSignal;
  decision: "accepted" | "blocked";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type DependencyConfusionResponse = {
  status: "ok" | "blocked";
  result: DependencyConfusionResult;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return body;
}

export async function submitDependencyConfusionResolution(
  variantKey: DependencyConfusionVariantKey,
  token: string,
  input: DependencyConfusionInput,
) {
  const response = await fetch(
    `/api/labs/supply-chain/dependency-confusion/${variantKey}/resolve`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        manifestKey: input.manifestKey,
        registryScenarioKey: input.registryScenarioKey,
        resolutionPolicyKey: input.resolutionPolicyKey,
      }),
    },
  );

  if (
    response.status === 400 ||
    response.status === 403 ||
    response.status === 404
  ) {
    return (await response.json()) as DependencyConfusionResponse;
  }

  return readJson<DependencyConfusionResponse>(response);
}

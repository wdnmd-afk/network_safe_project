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

export type DependencyConfusionStatus = "ok" | "blocked";

export type DependencyConfusionInput = {
  userId: string;
  variantKey: DependencyConfusionVariantKey;
  manifestKey: string;
  registryScenarioKey: string;
  resolutionPolicyKey: string;
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
  status: DependencyConfusionStatus;
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

export type DependencyConfusionLabService = {
  resolveDependency(
    input: DependencyConfusionInput,
  ): Promise<DependencyConfusionResult>;
};

type ManifestDefinition = DependencyConfusionManifestSummary & {
  baseRiskIndicators: DependencyConfusionRiskIndicator[];
};

type RegistryScenarioDefinition = {
  registryScenarioKey: DependencyConfusionRegistryScenarioKey;
  title: string;
  registrySource: "public" | "private" | "mixed";
  publicNameCollision: boolean;
  integrityMismatch: boolean;
  learningNotes: string;
};

type ResolutionPolicyDefinition = {
  resolutionPolicyKey: DependencyConfusionResolutionPolicyKey;
  title: string;
  preferPublicLatest: boolean;
  scopePinnedPrivate: boolean;
  lockfileIntegrityAudit: boolean;
  sourceAudit: boolean;
};

export const dependencyConfusionDefaultManifestKey: DependencyConfusionManifestKey =
  "unscoped-internal-name";
export const dependencyConfusionDefaultRegistryScenarioKey: DependencyConfusionRegistryScenarioKey =
  "public-name-collision";
export const dependencyConfusionDefaultResolutionPolicyKey: DependencyConfusionResolutionPolicyKey =
  "prefer-public-latest";

const manifestSamples = new Map<
  DependencyConfusionManifestKey,
  ManifestDefinition
>([
  [
    "unscoped-internal-name",
    {
      manifestKey: "unscoped-internal-name",
      title: "未使用 scope 的内部依赖摘要",
      dependencyShape: "private-unscoped",
      privateScopeBound: false,
      lockfilePresent: false,
      publicDependencyPresent: false,
      learningNotes: "观察内部依赖未使用组织 scope 时如何产生来源混淆风险。",
      baseRiskIndicators: ["private-scope-missing", "lockfile-missing"],
    },
  ],
  [
    "scoped-private-package",
    {
      manifestKey: "scoped-private-package",
      title: "已绑定 scope 的私有依赖摘要",
      dependencyShape: "private-scoped",
      privateScopeBound: true,
      lockfilePresent: true,
      publicDependencyPresent: false,
      learningNotes: "观察组织 scope 和私有来源绑定如何收敛解析边界。",
      baseRiskIndicators: [],
    },
  ],
  [
    "mixed-source-review",
    {
      manifestKey: "mixed-source-review",
      title: "公开依赖与私有依赖混合审计摘要",
      dependencyShape: "mixed-public-private",
      privateScopeBound: true,
      lockfilePresent: true,
      publicDependencyPresent: true,
      learningNotes: "观察公开依赖保持可用时，私有依赖仍需要来源审计。",
      baseRiskIndicators: [],
    },
  ],
]);

const registryScenarios = new Map<
  DependencyConfusionRegistryScenarioKey,
  RegistryScenarioDefinition
>([
  [
    "public-name-collision",
    {
      registryScenarioKey: "public-name-collision",
      title: "伪公共 registry 同名碰撞",
      registrySource: "public",
      publicNameCollision: true,
      integrityMismatch: false,
      learningNotes: "漏洞版教学策略会偏向公共更高版本来源。",
    },
  ],
  [
    "private-scope-pinned",
    {
      registryScenarioKey: "private-scope-pinned",
      title: "私有 scope 固定来源",
      registrySource: "private",
      publicNameCollision: false,
      integrityMismatch: false,
      learningNotes: "修复版通过 scope 绑定和来源审计保持私有来源。",
    },
  ],
  [
    "lockfile-integrity-mismatch",
    {
      registryScenarioKey: "lockfile-integrity-mismatch",
      title: "固定 lockfile 完整性不一致",
      registrySource: "mixed",
      publicNameCollision: false,
      integrityMismatch: true,
      learningNotes: "修复版通过完整性审计阻断异常解析结果。",
    },
  ],
]);

const resolutionPolicies = new Map<
  DependencyConfusionResolutionPolicyKey,
  ResolutionPolicyDefinition
>([
  [
    "prefer-public-latest",
    {
      resolutionPolicyKey: "prefer-public-latest",
      title: "偏向公共更高版本",
      preferPublicLatest: true,
      scopePinnedPrivate: false,
      lockfileIntegrityAudit: false,
      sourceAudit: false,
    },
  ],
  [
    "scope-pinned-private",
    {
      resolutionPolicyKey: "scope-pinned-private",
      title: "私有 scope 来源固定",
      preferPublicLatest: false,
      scopePinnedPrivate: true,
      lockfileIntegrityAudit: false,
      sourceAudit: true,
    },
  ],
  [
    "lockfile-integrity-audit",
    {
      resolutionPolicyKey: "lockfile-integrity-audit",
      title: "lockfile 完整性审计",
      preferPublicLatest: false,
      scopePinnedPrivate: true,
      lockfileIntegrityAudit: true,
      sourceAudit: true,
    },
  ],
]);

function isManifestKey(value: string): value is DependencyConfusionManifestKey {
  return manifestSamples.has(value as DependencyConfusionManifestKey);
}

function isRegistryScenarioKey(
  value: string,
): value is DependencyConfusionRegistryScenarioKey {
  return registryScenarios.has(value as DependencyConfusionRegistryScenarioKey);
}

function isResolutionPolicyKey(
  value: string,
): value is DependencyConfusionResolutionPolicyKey {
  return resolutionPolicies.has(value as DependencyConfusionResolutionPolicyKey);
}

function uniqueRiskIndicators(
  indicators: DependencyConfusionRiskIndicator[],
) {
  return [...new Set(indicators)];
}

function createManifestSummary(
  definition: ManifestDefinition,
): DependencyConfusionManifestSummary {
  return {
    manifestKey: definition.manifestKey,
    title: definition.title,
    dependencyShape: definition.dependencyShape,
    privateScopeBound: definition.privateScopeBound,
    lockfilePresent: definition.lockfilePresent,
    publicDependencyPresent: definition.publicDependencyPresent,
    learningNotes: definition.learningNotes,
  };
}

function resolveRiskIndicators(input: {
  manifest: ManifestDefinition;
  registryScenario: RegistryScenarioDefinition;
  policy: ResolutionPolicyDefinition;
}) {
  const indicators = [...input.manifest.baseRiskIndicators];

  if (input.registryScenario.publicNameCollision) {
    indicators.push("public-name-collision");
  }

  if (input.registryScenario.integrityMismatch) {
    indicators.push("integrity-mismatch");
  }

  if (!input.policy.sourceAudit) {
    indicators.push("source-not-audited");
  }

  return uniqueRiskIndicators(indicators);
}

function resolveAuditActions(input: {
  policy: ResolutionPolicyDefinition;
  blockedByPolicy: boolean;
}): DependencyConfusionAuditAction[] {
  const actions: DependencyConfusionAuditAction[] = [];

  if (!input.policy.sourceAudit) {
    actions.push("audit-missing");
  }

  if (input.policy.scopePinnedPrivate) {
    actions.push("scope-registry-bound");
  }

  if (input.policy.sourceAudit) {
    actions.push("source-audited");
  }

  if (input.policy.lockfileIntegrityAudit) {
    actions.push("lockfile-integrity-checked");
  }

  if (input.blockedByPolicy) {
    actions.push("resolution-blocked");
  }

  return actions;
}

function shouldBlockByPolicy(input: {
  variantKey: DependencyConfusionVariantKey;
  manifest: ManifestDefinition;
  registryScenario: RegistryScenarioDefinition;
  policy: ResolutionPolicyDefinition;
}) {
  if (input.variantKey !== "fixed") {
    return false;
  }

  if (
    input.registryScenario.integrityMismatch &&
    input.policy.lockfileIntegrityAudit
  ) {
    return true;
  }

  return input.policy.scopePinnedPrivate && !input.manifest.privateScopeBound;
}

function resolveSignal(input: {
  variantKey: DependencyConfusionVariantKey;
  manifest: ManifestDefinition;
  registryScenario: RegistryScenarioDefinition;
  policy: ResolutionPolicyDefinition;
  blockedByPolicy: boolean;
}): DependencyConfusionSignal {
  if (
    input.blockedByPolicy &&
    input.registryScenario.integrityMismatch &&
    input.policy.lockfileIntegrityAudit
  ) {
    return "dependency-confusion-lockfile-integrity-blocked";
  }

  if (!input.manifest.privateScopeBound) {
    if (
      input.variantKey === "vuln" &&
      input.registryScenario.publicNameCollision &&
      input.policy.preferPublicLatest
    ) {
      return "dependency-confusion-public-source-selected";
    }

    return "dependency-confusion-private-scope-missing";
  }

  if (
    input.variantKey === "fixed" &&
    input.manifest.manifestKey === "scoped-private-package" &&
    input.policy.scopePinnedPrivate
  ) {
    return "dependency-confusion-private-scope-pinned";
  }

  if (
    input.variantKey === "fixed" &&
    input.manifest.publicDependencyPresent &&
    input.policy.sourceAudit
  ) {
    return "dependency-confusion-safe-public-package-accepted";
  }

  if (input.variantKey === "fixed" && input.policy.sourceAudit) {
    return "dependency-confusion-registry-source-audited";
  }

  return "dependency-confusion-public-source-selected";
}

function resolveSource(input: {
  variantKey: DependencyConfusionVariantKey;
  manifest: ManifestDefinition;
  registryScenario: RegistryScenarioDefinition;
  policy: ResolutionPolicyDefinition;
  blockedByPolicy: boolean;
}): DependencyConfusionResolution["resolvedSource"] {
  if (input.blockedByPolicy) {
    return "blocked-audit";
  }

  if (
    input.variantKey === "fixed" &&
    input.manifest.publicDependencyPresent &&
    input.policy.sourceAudit
  ) {
    return "mixed-audited";
  }

  if (input.variantKey === "fixed" && input.policy.scopePinnedPrivate) {
    return "private-registry";
  }

  if (
    input.registryScenario.publicNameCollision &&
    input.policy.preferPublicLatest
  ) {
    return "public-registry";
  }

  return input.registryScenario.registrySource === "private"
    ? "private-registry"
    : "public-registry";
}

function resolveSourceTrust(
  source: DependencyConfusionResolution["resolvedSource"],
): DependencyConfusionResolution["sourceTrust"] {
  if (source === "blocked-audit" || source === "not-resolved") {
    return "blocked";
  }

  if (source === "mixed-audited") {
    return "audited";
  }

  return source === "private-registry" ? "trusted" : "untrusted";
}

function resolvePackageScopeStatus(
  manifest: ManifestDefinition,
): DependencyConfusionResolution["packageScopeStatus"] {
  if (manifest.dependencyShape === "mixed-public-private") {
    return "mixed-audited";
  }

  return manifest.privateScopeBound ? "pinned" : "missing";
}

function resolveLockfileStatus(input: {
  manifest: ManifestDefinition;
  registryScenario: RegistryScenarioDefinition;
}): DependencyConfusionResolution["lockfileStatus"] {
  if (input.registryScenario.integrityMismatch) {
    return "mismatch";
  }

  return input.manifest.lockfilePresent ? "verified" : "missing";
}

function createMessage(input: {
  signal: DependencyConfusionSignal;
  variantKey: DependencyConfusionVariantKey;
}) {
  if (input.signal === "dependency-confusion-public-source-selected") {
    return "漏洞版偏向伪公共来源，展示未绑定 scope 和缺少审计时的依赖混淆风险。";
  }

  if (input.signal === "dependency-confusion-private-scope-missing") {
    return "固定样例缺少私有 scope 绑定，修复版会要求先收敛来源边界。";
  }

  if (input.signal === "dependency-confusion-private-scope-pinned") {
    return "修复版将私有 scope 固定到可信来源，解析结果保持在受控边界内。";
  }

  if (input.signal === "dependency-confusion-registry-source-audited") {
    return "修复版完成来源审计，只保留固定可信来源类别和审计动作。";
  }

  if (input.signal === "dependency-confusion-lockfile-integrity-blocked") {
    return "修复版通过固定 lockfile 完整性审计阻断异常解析结果。";
  }

  if (input.signal === "dependency-confusion-safe-public-package-accepted") {
    return "修复版保留正常公开依赖路径，同时审计私有来源边界。";
  }

  return "固定样例边界已校验，服务不会处理任意包名、真实 registry 或凭据。";
}

function createNextStep(input: {
  signal: DependencyConfusionSignal;
  variantKey: DependencyConfusionVariantKey;
}) {
  if (input.variantKey === "vuln") {
    return "切换到修复版，观察 scope 固定、来源审计和完整性校验如何改变解析结果。";
  }

  if (input.signal === "dependency-confusion-lockfile-integrity-blocked") {
    return "复盘事件日志中的完整性审计动作，确认日志没有保存真实 manifest 或 registry 地址。";
  }

  if (input.signal === "dependency-confusion-safe-public-package-accepted") {
    return "对比私有依赖固定来源案例，确认修复版不会阻断正常公开依赖。";
  }

  return "继续观察固定风险标签、解析来源类别和审计动作之间的关系。";
}

function createBlockedBoundaryResult(input: {
  variantKey: DependencyConfusionVariantKey;
  manifestKey: string;
  registryScenarioKey: string;
  resolutionPolicyKey: string;
  blockedReason: string;
}): DependencyConfusionResult {
  const safeManifestKey = isManifestKey(input.manifestKey)
    ? input.manifestKey
    : "blocked-manifest";
  const safeRegistryScenarioKey = isRegistryScenarioKey(
    input.registryScenarioKey,
  )
    ? input.registryScenarioKey
    : "blocked-registry-scenario";
  const safeResolutionPolicyKey = isResolutionPolicyKey(
    input.resolutionPolicyKey,
  )
    ? input.resolutionPolicyKey
    : "blocked-policy";

  return {
    status: "blocked",
    variantKey: input.variantKey,
    manifestKey: safeManifestKey,
    registryScenarioKey: safeRegistryScenarioKey,
    resolutionPolicyKey: safeResolutionPolicyKey,
    manifestSummary: null,
    resolution: {
      resolvedSource: "not-resolved",
      sourceTrust: "blocked",
      packageScopeStatus: "missing",
      lockfileStatus: "missing",
      matchedControlledSample: false,
      riskIndicatorCount: 0,
      riskIndicators: [],
      auditActions: ["resolution-blocked"],
      recommendedAction: "只选择文档或页面列出的固定依赖解析样例。",
    },
    signal: "dependency-confusion-boundary-verified",
    decision: "blocked",
    message:
      "该依赖混淆固定样例不在允许列表中，未处理任何真实包名、registry 或凭据。",
    nextStep: "选择已登记的 manifestKey、registryScenarioKey 和 resolutionPolicyKey 后重新观察。",
    blockedReason: input.blockedReason,
  };
}

function createResolution(input: {
  manifest: ManifestDefinition;
  registryScenario: RegistryScenarioDefinition;
  policy: ResolutionPolicyDefinition;
  variantKey: DependencyConfusionVariantKey;
  blockedByPolicy: boolean;
}): DependencyConfusionResolution {
  const riskIndicators = resolveRiskIndicators(input);
  const resolvedSource = resolveSource(input);

  return {
    resolvedSource,
    sourceTrust: resolveSourceTrust(resolvedSource),
    packageScopeStatus: resolvePackageScopeStatus(input.manifest),
    lockfileStatus: resolveLockfileStatus(input),
    matchedControlledSample: true,
    riskIndicatorCount: riskIndicators.length,
    riskIndicators,
    auditActions: resolveAuditActions({
      policy: input.policy,
      blockedByPolicy: input.blockedByPolicy,
    }),
    recommendedAction: input.blockedByPolicy
      ? "停止当前解析并复核固定来源、scope 和完整性摘要。"
      : input.policy.sourceAudit
        ? "保留来源审计和完整性校验证据。"
        : "切换到修复版，补齐 scope 绑定、来源审计和 lockfile 校验。",
  };
}

export function createDependencyConfusionLabService(): DependencyConfusionLabService {
  return {
    async resolveDependency(input) {
      const manifestKey = input.manifestKey.trim();
      const registryScenarioKey = input.registryScenarioKey.trim();
      const resolutionPolicyKey = input.resolutionPolicyKey.trim();

      if (!isManifestKey(manifestKey)) {
        return createBlockedBoundaryResult({
          variantKey: input.variantKey,
          manifestKey,
          registryScenarioKey,
          resolutionPolicyKey,
          blockedReason: "manifest-not-allowed",
        });
      }

      if (!isRegistryScenarioKey(registryScenarioKey)) {
        return createBlockedBoundaryResult({
          variantKey: input.variantKey,
          manifestKey,
          registryScenarioKey,
          resolutionPolicyKey,
          blockedReason: "registry-scenario-not-allowed",
        });
      }

      if (!isResolutionPolicyKey(resolutionPolicyKey)) {
        return createBlockedBoundaryResult({
          variantKey: input.variantKey,
          manifestKey,
          registryScenarioKey,
          resolutionPolicyKey,
          blockedReason: "resolution-policy-not-allowed",
        });
      }

      const manifest = manifestSamples.get(manifestKey);
      const registryScenario = registryScenarios.get(registryScenarioKey);
      const policy = resolutionPolicies.get(resolutionPolicyKey);

      if (!manifest || !registryScenario || !policy) {
        return createBlockedBoundaryResult({
          variantKey: input.variantKey,
          manifestKey,
          registryScenarioKey,
          resolutionPolicyKey,
          blockedReason: "sample-not-found",
        });
      }

      // 依赖混淆实验只做固定样例解析，不读取本机依赖配置或真实 registry。
      const blockedByPolicy = shouldBlockByPolicy({
        variantKey: input.variantKey,
        manifest,
        registryScenario,
        policy,
      });
      const signal = resolveSignal({
        variantKey: input.variantKey,
        manifest,
        registryScenario,
        policy,
        blockedByPolicy,
      });

      return {
        status: blockedByPolicy ? "blocked" : "ok",
        variantKey: input.variantKey,
        manifestKey,
        registryScenarioKey,
        resolutionPolicyKey,
        manifestSummary: createManifestSummary(manifest),
        resolution: createResolution({
          manifest,
          registryScenario,
          policy,
          variantKey: input.variantKey,
          blockedByPolicy,
        }),
        signal,
        decision: blockedByPolicy ? "blocked" : "accepted",
        message: createMessage({
          signal,
          variantKey: input.variantKey,
        }),
        nextStep: createNextStep({
          signal,
          variantKey: input.variantKey,
        }),
        ...(blockedByPolicy
          ? {
              blockedReason:
                signal === "dependency-confusion-lockfile-integrity-blocked"
                  ? "lockfile-integrity-mismatch"
                  : "private-scope-missing",
            }
          : {}),
      };
    },
  };
}

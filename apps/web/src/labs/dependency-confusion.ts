import type {
  DependencyConfusionManifestKey,
  DependencyConfusionRegistryScenarioKey,
  DependencyConfusionResolutionPolicyKey,
  DependencyConfusionResult,
  DependencyConfusionSignal as DependencyConfusionApiSignal,
  DependencyConfusionVariantKey,
} from "../api/dependency-confusion-lab";

export type {
  DependencyConfusionManifestKey,
  DependencyConfusionRegistryScenarioKey,
  DependencyConfusionResolutionPolicyKey,
  DependencyConfusionVariantKey,
};

export type DependencyConfusionSignal =
  | DependencyConfusionApiSignal
  | "dependency-confusion-workbench-reviewed"
  | "dependency-confusion-fixed-samples-reviewed"
  | "dependency-confusion-no-real-registry-confirmed";

export type DependencyConfusionVariantConfig = {
  key: DependencyConfusionVariantKey;
  title: string;
  badge: string;
  perspective: string;
  explanation: string;
  expectedSignal: string;
  expectedOutcome: string;
  panelIntro: string;
};

export type DependencyConfusionManifestOption = {
  key: DependencyConfusionManifestKey;
  title: string;
  dependencyShape: string;
  description: string;
  vulnerableFocus: string;
  fixedFocus: string;
};

export type DependencyConfusionRegistryScenarioOption = {
  key: DependencyConfusionRegistryScenarioKey;
  title: string;
  description: string;
};

export type DependencyConfusionResolutionPolicyOption = {
  key: DependencyConfusionResolutionPolicyKey;
  title: string;
  description: string;
};

export type DependencyConfusionManifestObservationRow = {
  key: DependencyConfusionManifestKey;
  title: string;
  dependencyShape: string;
  focus: string;
  description: string;
};

export type DependencyConfusionReviewChecklistItem = {
  key: string;
  title: string;
  description: string;
};

export type DependencyConfusionLearningProgressInput = {
  variantKey: DependencyConfusionVariantKey;
  status: "in-progress";
  notes: string;
};

export type DependencyConfusionVerificationRecordInput = {
  variantKey: DependencyConfusionVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: DependencyConfusionApiSignal;
    manifestKey: string;
    registryScenarioKey: string;
    resolutionPolicyKey: string;
    resolvedSource: string;
    sourceTrust: string;
    packageScopeStatus: string;
    lockfileStatus: string;
    riskIndicatorCount: number;
    riskIndicators: string[];
    auditActions: string[];
    recommendedAction: string;
  };
};

export const defaultDependencyConfusionManifestKey: DependencyConfusionManifestKey =
  "unscoped-internal-name";
export const defaultDependencyConfusionRegistryScenarioKey: DependencyConfusionRegistryScenarioKey =
  "public-name-collision";
export const defaultDependencyConfusionResolutionPolicyKey: DependencyConfusionResolutionPolicyKey =
  "prefer-public-latest";
export const defaultDependencyConfusionFixedManifestKey: DependencyConfusionManifestKey =
  "scoped-private-package";
export const defaultDependencyConfusionFixedRegistryScenarioKey: DependencyConfusionRegistryScenarioKey =
  "private-scope-pinned";
export const defaultDependencyConfusionFixedResolutionPolicyKey: DependencyConfusionResolutionPolicyKey =
  "scope-pinned-private";

const dependencyConfusionVariantConfigs: Record<
  DependencyConfusionVariantKey,
  DependencyConfusionVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "依赖混淆解析风险观察版",
    badge: "未绑定 scope、公共同名碰撞和来源审计缺失",
    perspective: "攻击方观察",
    explanation:
      "本页从攻击方视角观察固定 manifest 摘要在未绑定来源边界时，解析链路如何偏向错误公共来源。",
    expectedSignal:
      "提交未使用 scope 的内部依赖和公共同名碰撞场景后应出现 dependency-confusion-public-source-selected 信号。",
    expectedOutcome: "完成固定 manifest、伪 registry 场景和解析策略缺失下的风险信号观察。",
    panelIntro:
      "工作台只调用本项目固定解析 API，不提供任意包名、真实 registry 地址、.npmrc、token、lockfile、安装或发布参数输入。",
  },
  fixed: {
    key: "fixed",
    title: "依赖混淆来源审计复盘版",
    badge: "私有 scope、可信来源、lockfile 和完整性审计",
    perspective: "防御方复盘",
    explanation:
      "本页从防御方视角复盘同一批固定样例，观察 scope 绑定、来源审计和完整性校验如何改变解析结果。",
    expectedSignal:
      "提交已绑定 scope 的私有依赖和来源固定策略后应出现 dependency-confusion-private-scope-pinned 信号。",
    expectedOutcome: "完成私有来源固定、完整性阻断和正常公开依赖可接受路径复盘。",
    panelIntro:
      "修复版强调私有 scope 绑定、来源审计和完整性校验；前端选择器只用于引导观察受控固定样例。",
  },
};

export const dependencyConfusionManifestOptions: DependencyConfusionManifestOption[] =
  [
    {
      key: "unscoped-internal-name",
      title: "未使用 scope 的内部依赖摘要",
      dependencyShape: "private-unscoped",
      description: "观察内部依赖未绑定组织 scope 时的来源边界缺失。",
      vulnerableFocus: "关注公共同名来源被错误选择时的风险信号。",
      fixedFocus: "关注修复版要求先收敛私有 scope 和来源边界。",
    },
    {
      key: "scoped-private-package",
      title: "已绑定 scope 的私有依赖摘要",
      dependencyShape: "private-scoped",
      description: "观察私有 scope 和可信来源绑定后的解析收敛。",
      vulnerableFocus: "关注 scope 存在时仍需明确解析策略和审计动作。",
      fixedFocus: "关注私有 scope 固定来源如何保持在受控边界内。",
    },
    {
      key: "mixed-source-review",
      title: "公开依赖与私有依赖混合审计摘要",
      dependencyShape: "mixed-public-private",
      description: "观察公开依赖可用性和私有依赖来源审计如何同时存在。",
      vulnerableFocus: "关注混合来源里缺少审计时的来源判断盲区。",
      fixedFocus: "关注正常公开依赖放行和私有来源审计的平衡。",
    },
  ];

export const dependencyConfusionRegistryScenarioOptions: DependencyConfusionRegistryScenarioOption[] =
  [
    {
      key: "public-name-collision",
      title: "伪公共来源同名碰撞",
      description: "模拟固定公共来源存在同名更高版本时的错误解析倾向。",
    },
    {
      key: "private-scope-pinned",
      title: "私有 scope 固定来源",
      description: "模拟私有 scope 被固定到可信来源后的解析边界。",
    },
    {
      key: "lockfile-integrity-mismatch",
      title: "固定 lockfile 完整性不一致",
      description: "模拟固定完整性摘要与来源元数据不一致时的阻断信号。",
    },
  ];

export const dependencyConfusionResolutionPolicyOptions: DependencyConfusionResolutionPolicyOption[] =
  [
    {
      key: "prefer-public-latest",
      title: "偏向公共更高版本",
      description: "用于观察漏洞版缺少来源审计时的错误解析倾向。",
    },
    {
      key: "scope-pinned-private",
      title: "私有 scope 来源固定",
      description: "绑定私有 scope 和可信来源，保留来源审计证据。",
    },
    {
      key: "lockfile-integrity-audit",
      title: "lockfile 完整性审计",
      description: "在来源审计基础上检查固定完整性摘要并阻断异常。",
    },
  ];

export const dependencyConfusionReviewChecklist: DependencyConfusionReviewChecklistItem[] =
  [
    {
      key: "fixed-key-only",
      title: "请求只能包含固定 key",
      description:
        "前端只提交 manifestKey、registryScenarioKey 和 resolutionPolicyKey，不提交任意包名或真实依赖文件。",
    },
    {
      key: "source-boundary",
      title: "先观察来源边界",
      description:
        "漏洞版重点观察未绑定 scope、公共同名碰撞和来源审计缺失如何共同影响解析结果。",
    },
    {
      key: "audit-actions",
      title: "审计动作必须可见",
      description:
        "复盘 scope 绑定、来源审计、lockfile 校验和阻断动作之间的关系。",
    },
    {
      key: "safe-log-summary",
      title: "日志只记录安全摘要",
      description:
        "事件日志只记录固定 key、来源类别、风险标签、审计动作和学习信号。",
    },
    {
      key: "no-real-registry",
      title: "不连接真实包生态",
      description:
        "实验不安装、登录、下载、打包或发布依赖，不访问真实 registry，也不读取凭据配置。",
    },
  ];

export function getDependencyConfusionVariantConfig(
  variant: DependencyConfusionVariantKey,
) {
  return dependencyConfusionVariantConfigs[variant];
}

export function getDefaultDependencyConfusionManifestKey(
  variant: DependencyConfusionVariantKey,
) {
  return variant === "fixed"
    ? defaultDependencyConfusionFixedManifestKey
    : defaultDependencyConfusionManifestKey;
}

export function getDefaultDependencyConfusionRegistryScenarioKey(
  variant: DependencyConfusionVariantKey,
) {
  return variant === "fixed"
    ? defaultDependencyConfusionFixedRegistryScenarioKey
    : defaultDependencyConfusionRegistryScenarioKey;
}

export function getDefaultDependencyConfusionResolutionPolicyKey(
  variant: DependencyConfusionVariantKey,
) {
  return variant === "fixed"
    ? defaultDependencyConfusionFixedResolutionPolicyKey
    : defaultDependencyConfusionResolutionPolicyKey;
}

export function getDependencyConfusionManifestObservationRows(
  variant: DependencyConfusionVariantKey,
): DependencyConfusionManifestObservationRow[] {
  return dependencyConfusionManifestOptions.map((manifest) => ({
    key: manifest.key,
    title: manifest.title,
    dependencyShape: manifest.dependencyShape,
    description: manifest.description,
    focus:
      variant === "vuln" ? manifest.vulnerableFocus : manifest.fixedFocus,
  }));
}

export function createDependencyConfusionLearningProgress(
  config: DependencyConfusionVariantConfig,
): DependencyConfusionLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createDependencyConfusionVerificationRecord(
  config: DependencyConfusionVariantConfig,
  result: DependencyConfusionResult,
): DependencyConfusionVerificationRecordInput {
  const details = {
    signal: result.signal,
    manifestKey: result.manifestKey,
    registryScenarioKey: result.registryScenarioKey,
    resolutionPolicyKey: result.resolutionPolicyKey,
    resolvedSource: result.resolution.resolvedSource,
    sourceTrust: result.resolution.sourceTrust,
    packageScopeStatus: result.resolution.packageScopeStatus,
    lockfileStatus: result.resolution.lockfileStatus,
    riskIndicatorCount: result.resolution.riskIndicatorCount,
    riskIndicators: result.resolution.riskIndicators,
    auditActions: result.resolution.auditActions,
    recommendedAction: result.resolution.recommendedAction,
  };

  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "解析风险观察版展示了固定依赖样例中的错误来源选择风险信号。",
      details,
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "来源审计复盘版展示了固定依赖样例的来源固定或完整性阻断信号。",
    details,
  };
}

export function formatDependencyConfusionSignal(
  signal: DependencyConfusionSignal,
) {
  const labels: Record<DependencyConfusionSignal, string> = {
    "dependency-confusion-workbench-reviewed": "已进入依赖混淆前端工作台",
    "dependency-confusion-fixed-samples-reviewed": "已确认固定依赖样例边界",
    "dependency-confusion-no-real-registry-confirmed": "已确认不连接真实包生态",
    "dependency-confusion-public-source-selected": "漏洞版选择了伪公共来源",
    "dependency-confusion-private-scope-missing": "私有 scope 绑定缺失",
    "dependency-confusion-registry-source-audited": "修复版来源审计已生效",
    "dependency-confusion-lockfile-integrity-blocked": "修复版完整性审计已阻断",
    "dependency-confusion-private-scope-pinned": "修复版私有 scope 已固定",
    "dependency-confusion-safe-public-package-accepted": "正常公开依赖已审计放行",
    "dependency-confusion-boundary-verified": "固定样例边界已确认",
  };

  return labels[signal];
}

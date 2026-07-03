import type {
  MisconfigurationAuditPolicyKey,
  MisconfigurationConfigCaseKey,
  MisconfigurationResult,
  MisconfigurationSignal as MisconfigurationApiSignal,
  MisconfigurationVariantKey,
} from "../api/misconfiguration-lab";

export type {
  MisconfigurationAuditPolicyKey,
  MisconfigurationConfigCaseKey,
  MisconfigurationVariantKey,
};

export type MisconfigurationSignal =
  | MisconfigurationApiSignal
  | "misconfiguration-workbench-reviewed"
  | "misconfiguration-fixed-samples-reviewed"
  | "misconfiguration-no-real-config-confirmed";

export type MisconfigurationVariantConfig = {
  key: MisconfigurationVariantKey;
  title: string;
  badge: string;
  perspective: string;
  explanation: string;
  expectedSignal: string;
  expectedOutcome: string;
  panelIntro: string;
};

export type MisconfigurationConfigCaseOption = {
  key: MisconfigurationConfigCaseKey;
  title: string;
  exposureCategory: string;
  description: string;
  vulnerableFocus: string;
  fixedFocus: string;
  recommendedPolicyKey: MisconfigurationAuditPolicyKey;
};

export type MisconfigurationAuditPolicyOption = {
  key: MisconfigurationAuditPolicyKey;
  title: string;
  description: string;
};

export type MisconfigurationObservationRow = {
  key: MisconfigurationConfigCaseKey;
  title: string;
  exposureCategory: string;
  focus: string;
  description: string;
};

export type MisconfigurationReviewChecklistItem = {
  key: string;
  title: string;
  description: string;
};

export type MisconfigurationLearningProgressInput = {
  variantKey: MisconfigurationVariantKey;
  status: "in-progress";
  notes: string;
};

export type MisconfigurationVerificationRecordInput = {
  variantKey: MisconfigurationVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: MisconfigurationApiSignal;
    configCaseKey: string;
    auditPolicyKey: string;
    exposureCategory: string;
    exposureState: string;
    authRequired: boolean;
    corsPolicyStatus: string;
    errorReportingStatus: string;
    riskIndicatorCount: number;
    riskIndicators: string[];
    auditActions: string[];
    recommendedAction: string;
  };
};

export const defaultMisconfigurationConfigCaseKey: MisconfigurationConfigCaseKey =
  "debug-console-exposed";
export const defaultMisconfigurationAuditPolicyKey: MisconfigurationAuditPolicyKey =
  "exposure-review";
export const defaultMisconfigurationFixedConfigCaseKey: MisconfigurationConfigCaseKey =
  "debug-console-exposed";
export const defaultMisconfigurationFixedAuditPolicyKey: MisconfigurationAuditPolicyKey =
  "least-exposure-policy";

const misconfigurationVariantConfigs: Record<
  MisconfigurationVariantKey,
  MisconfigurationVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "配置错误风险观察版",
    badge: "调试入口、目录索引、CORS、管理状态和错误信息暴露",
    perspective: "攻击方观察",
    explanation:
      "本页从攻击方视角观察固定配置摘要中哪些暴露面会成为可见风险信号。",
    expectedSignal:
      "提交调试入口开启样例后应出现 misconfiguration-debug-surface-visible 信号。",
    expectedOutcome: "完成固定配置暴露面信号和事件日志安全摘要观察。",
    panelIntro:
      "工作台只调用本项目固定 audit API，不提供任意配置文本、主机、端口、路径、账号、密码、token 或 Cookie 输入。",
  },
  fixed: {
    key: "fixed",
    title: "配置错误审计复盘版",
    badge: "最小暴露面、认证要求、CORS 收敛和安全错误信息",
    perspective: "防御方复盘",
    explanation:
      "本页从防御方视角复盘同一批固定样例，观察审计策略如何收敛暴露面。",
    expectedSignal:
      "提交调试入口开启样例和最小暴露面策略后应出现 misconfiguration-exposure-reduced 信号。",
    expectedOutcome: "完成暴露面收敛、管理入口认证和安全错误信息策略复盘。",
    panelIntro:
      "修复版强调默认关闭、认证要求、最小权限 CORS 和错误信息分层；前端选择器只用于引导观察受控固定样例。",
  },
};

export const misconfigurationConfigCaseOptions: MisconfigurationConfigCaseOption[] =
  [
    {
      key: "debug-console-exposed",
      title: "调试入口开启摘要",
      exposureCategory: "debug-surface",
      description: "观察调试入口默认开启时的服务能力暴露风险。",
      vulnerableFocus: "关注调试面如何变成攻击方可见的能力线索。",
      fixedFocus: "关注默认关闭和最小暴露面策略如何收敛调试入口。",
      recommendedPolicyKey: "least-exposure-policy",
    },
    {
      key: "directory-index-enabled",
      title: "目录索引开启摘要",
      exposureCategory: "directory-listing",
      description: "观察目录索引开启时的文件列表暴露风险。",
      vulnerableFocus: "关注文件列表如何泄露内部结构线索。",
      fixedFocus: "关注目录索引禁用后暴露面如何减少。",
      recommendedPolicyKey: "least-exposure-policy",
    },
    {
      key: "wildcard-cors-with-credentials",
      title: "过宽 CORS 策略摘要",
      exposureCategory: "cross-origin-trust",
      description: "观察跨域策略过宽时的浏览器信任边界风险。",
      vulnerableFocus: "关注跨域凭据策略过宽时的信任边界扩大。",
      fixedFocus: "关注可信来源、方法和凭据策略如何收敛。",
      recommendedPolicyKey: "strict-cors-audit",
    },
    {
      key: "public-admin-status",
      title: "公开管理状态页摘要",
      exposureCategory: "admin-status",
      description: "观察管理状态公开时的内部状态外显风险。",
      vulnerableFocus: "关注公开状态页如何暴露服务状态和管理线索。",
      fixedFocus: "关注认证、授权和来源限制如何阻断公开访问。",
      recommendedPolicyKey: "authenticated-admin-only",
    },
    {
      key: "verbose-error-detail",
      title: "详细错误信息外显摘要",
      exposureCategory: "error-reporting",
      description: "观察详细错误信息如何暴露技术栈和内部处理线索。",
      vulnerableFocus: "关注错误细节如何成为攻击方路径和技术线索。",
      fixedFocus: "关注用户错误信息和内部日志分层。",
      recommendedPolicyKey: "safe-error-reporting",
    },
    {
      key: "default-credential-hint-visible",
      title: "默认凭据提示可见摘要",
      exposureCategory: "credential-hint",
      description: "观察默认凭据提示即使不含真实值也会形成风险线索。",
      vulnerableFocus: "关注默认凭据提示如何影响攻击方判断。",
      fixedFocus: "关注移除提示和强化初始化流程。",
      recommendedPolicyKey: "least-exposure-policy",
    },
  ];

export const misconfigurationAuditPolicyOptions: MisconfigurationAuditPolicyOption[] =
  [
    {
      key: "exposure-review",
      title: "暴露面观察策略",
      description: "用于漏洞版观察调试入口、目录索引、CORS 或状态页暴露信号。",
    },
    {
      key: "least-exposure-policy",
      title: "最小暴露面策略",
      description: "默认关闭调试、目录索引和默认凭据提示等非必要外显信号。",
    },
    {
      key: "authenticated-admin-only",
      title: "管理入口认证策略",
      description: "要求管理入口具备认证、授权和来源限制。",
    },
    {
      key: "strict-cors-audit",
      title: "严格 CORS 审计策略",
      description: "收敛可信来源、方法和凭据策略。",
    },
    {
      key: "safe-error-reporting",
      title: "安全错误信息策略",
      description: "将用户可见错误信息和内部日志分离。",
    },
  ];

export const misconfigurationReviewChecklist: MisconfigurationReviewChecklistItem[] =
  [
    {
      key: "fixed-key-only",
      title: "请求只能包含固定 key",
      description:
        "前端只提交 configCaseKey 和 auditPolicyKey，不提交配置文本、主机、端口、路径或凭据。",
    },
    {
      key: "attacker-view",
      title: "先观察攻击方信号",
      description:
        "漏洞版重点观察调试入口、目录索引、过宽 CORS、公开状态页和详细错误信息如何扩大暴露面。",
    },
    {
      key: "defense-policy",
      title: "再复盘审计策略",
      description:
        "修复版重点观察默认关闭、认证要求、CORS 收敛和安全错误信息如何改变后端判定。",
    },
    {
      key: "safe-log-summary",
      title: "日志只记录安全摘要",
      description:
        "事件日志只记录固定 key、暴露面类别、风险标签、审计动作和学习信号。",
    },
    {
      key: "no-real-infra",
      title: "不连接真实基础设施",
      description:
        "实验不读取真实配置，不扫描服务，不连接管理接口，也不修改 nginx、MySQL、Node 或云账号配置。",
    },
  ];

export function getMisconfigurationVariantConfig(
  variant: MisconfigurationVariantKey,
) {
  return misconfigurationVariantConfigs[variant];
}

export function getDefaultMisconfigurationConfigCaseKey(
  variant: MisconfigurationVariantKey,
) {
  return variant === "fixed"
    ? defaultMisconfigurationFixedConfigCaseKey
    : defaultMisconfigurationConfigCaseKey;
}

export function getDefaultMisconfigurationAuditPolicyKey(
  variant: MisconfigurationVariantKey,
) {
  return variant === "fixed"
    ? defaultMisconfigurationFixedAuditPolicyKey
    : defaultMisconfigurationAuditPolicyKey;
}

export function getRecommendedMisconfigurationAuditPolicyKey(
  configCaseKey: MisconfigurationConfigCaseKey,
  variant: MisconfigurationVariantKey,
) {
  if (variant === "vuln") {
    return defaultMisconfigurationAuditPolicyKey;
  }

  return (
    misconfigurationConfigCaseOptions.find((item) => item.key === configCaseKey)
      ?.recommendedPolicyKey ?? defaultMisconfigurationFixedAuditPolicyKey
  );
}

export function getMisconfigurationObservationRows(
  variant: MisconfigurationVariantKey,
): MisconfigurationObservationRow[] {
  return misconfigurationConfigCaseOptions.map((configCase) => ({
    key: configCase.key,
    title: configCase.title,
    exposureCategory: configCase.exposureCategory,
    description: configCase.description,
    focus:
      variant === "vuln" ? configCase.vulnerableFocus : configCase.fixedFocus,
  }));
}

export function createMisconfigurationLearningProgress(
  config: MisconfigurationVariantConfig,
): MisconfigurationLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createMisconfigurationVerificationRecord(
  config: MisconfigurationVariantConfig,
  result: MisconfigurationResult,
): MisconfigurationVerificationRecordInput {
  const details = {
    signal: result.signal,
    configCaseKey: result.configCaseKey,
    auditPolicyKey: result.auditPolicyKey,
    exposureCategory: result.audit.exposureCategory,
    exposureState: result.audit.exposureState,
    authRequired: result.audit.authRequired,
    corsPolicyStatus: result.audit.corsPolicyStatus,
    errorReportingStatus: result.audit.errorReportingStatus,
    riskIndicatorCount: result.audit.riskIndicatorCount,
    riskIndicators: result.audit.riskIndicators,
    auditActions: result.audit.auditActions,
    recommendedAction: result.audit.recommendedAction,
  };

  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "配置风险观察版展示了固定配置样例中的暴露面风险信号。",
      details,
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "配置审计复盘版展示了固定配置样例的暴露面收敛或认证阻断信号。",
    details,
  };
}

export function formatMisconfigurationSignal(signal: MisconfigurationSignal) {
  const labels: Record<MisconfigurationSignal, string> = {
    "misconfiguration-workbench-reviewed": "已进入配置错误审计工作台",
    "misconfiguration-fixed-samples-reviewed": "已确认固定配置样例边界",
    "misconfiguration-no-real-config-confirmed": "已确认不读取真实配置",
    "misconfiguration-debug-surface-visible": "调试入口可见",
    "misconfiguration-directory-index-visible": "目录索引可见",
    "misconfiguration-cors-too-broad": "CORS 策略过宽",
    "misconfiguration-admin-status-public": "管理状态页公开",
    "misconfiguration-error-detail-exposed": "详细错误信息外显",
    "misconfiguration-default-credential-hint-visible": "默认凭据提示可见",
    "misconfiguration-exposure-reduced": "暴露面已收敛",
    "misconfiguration-auth-required": "管理入口已要求认证",
    "misconfiguration-cors-policy-restricted": "CORS 策略已收敛",
    "misconfiguration-safe-error-reporting": "错误信息已安全分层",
    "misconfiguration-boundary-verified": "固定样例边界已确认",
  };

  return labels[signal];
}

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

export type MisconfigurationStatus = "ok" | "blocked";

export type MisconfigurationInput = {
  userId: string;
  variantKey: MisconfigurationVariantKey;
  configCaseKey: string;
  auditPolicyKey: string;
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
  status: MisconfigurationStatus;
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

export type MisconfigurationLabService = {
  auditConfig(input: MisconfigurationInput): Promise<MisconfigurationResult>;
};

type ConfigCaseDefinition = MisconfigurationConfigSummary & {
  vulnerableSignal: MisconfigurationSignal;
  baseRiskIndicators: MisconfigurationRiskIndicator[];
};

type AuditPolicyDefinition = {
  auditPolicyKey: MisconfigurationAuditPolicyKey;
  title: string;
  closesCategories: MisconfigurationExposureCategory[];
  auditActions: MisconfigurationAuditAction[];
};

export const misconfigurationDefaultConfigCaseKey: MisconfigurationConfigCaseKey =
  "debug-console-exposed";
export const misconfigurationDefaultAuditPolicyKey: MisconfigurationAuditPolicyKey =
  "exposure-review";

const configCases = new Map<MisconfigurationConfigCaseKey, ConfigCaseDefinition>(
  [
    [
      "debug-console-exposed",
      {
        configCaseKey: "debug-console-exposed",
        title: "调试入口开启摘要",
        exposureCategory: "debug-surface",
        visibleInVulnerableVariant: true,
        recommendedPolicyKey: "least-exposure-policy",
        learningNotes: "观察调试入口默认开启时，攻击方可见的服务能力线索。",
        vulnerableSignal: "misconfiguration-debug-surface-visible",
        baseRiskIndicators: ["debug-surface-visible"],
      },
    ],
    [
      "directory-index-enabled",
      {
        configCaseKey: "directory-index-enabled",
        title: "目录索引开启摘要",
        exposureCategory: "directory-listing",
        visibleInVulnerableVariant: true,
        recommendedPolicyKey: "least-exposure-policy",
        learningNotes: "观察目录索引暴露时，文件列表如何成为攻击方线索。",
        vulnerableSignal: "misconfiguration-directory-index-visible",
        baseRiskIndicators: ["directory-index-visible"],
      },
    ],
    [
      "wildcard-cors-with-credentials",
      {
        configCaseKey: "wildcard-cors-with-credentials",
        title: "过宽 CORS 策略摘要",
        exposureCategory: "cross-origin-trust",
        visibleInVulnerableVariant: true,
        recommendedPolicyKey: "strict-cors-audit",
        learningNotes: "观察跨域策略过宽时，浏览器信任边界如何被扩大。",
        vulnerableSignal: "misconfiguration-cors-too-broad",
        baseRiskIndicators: ["cors-credentials-too-broad"],
      },
    ],
    [
      "public-admin-status",
      {
        configCaseKey: "public-admin-status",
        title: "公开管理状态页摘要",
        exposureCategory: "admin-status",
        visibleInVulnerableVariant: true,
        recommendedPolicyKey: "authenticated-admin-only",
        learningNotes: "观察管理状态公开时，内部状态如何变成外部可见信号。",
        vulnerableSignal: "misconfiguration-admin-status-public",
        baseRiskIndicators: ["admin-status-public"],
      },
    ],
    [
      "verbose-error-detail",
      {
        configCaseKey: "verbose-error-detail",
        title: "详细错误信息外显摘要",
        exposureCategory: "error-reporting",
        visibleInVulnerableVariant: true,
        recommendedPolicyKey: "safe-error-reporting",
        learningNotes: "观察详细错误信息如何泄露技术栈和内部处理线索。",
        vulnerableSignal: "misconfiguration-error-detail-exposed",
        baseRiskIndicators: ["verbose-error-visible"],
      },
    ],
    [
      "default-credential-hint-visible",
      {
        configCaseKey: "default-credential-hint-visible",
        title: "默认凭据提示可见摘要",
        exposureCategory: "credential-hint",
        visibleInVulnerableVariant: true,
        recommendedPolicyKey: "least-exposure-policy",
        learningNotes: "观察默认凭据提示可见时，即使不展示真实值也会形成风险线索。",
        vulnerableSignal: "misconfiguration-default-credential-hint-visible",
        baseRiskIndicators: ["default-credential-hint-visible"],
      },
    ],
  ],
);

const auditPolicies = new Map<
  MisconfigurationAuditPolicyKey,
  AuditPolicyDefinition
>([
  [
    "exposure-review",
    {
      auditPolicyKey: "exposure-review",
      title: "暴露面观察策略",
      closesCategories: [],
      auditActions: ["audit-missing"],
    },
  ],
  [
    "least-exposure-policy",
    {
      auditPolicyKey: "least-exposure-policy",
      title: "最小暴露面策略",
      closesCategories: ["debug-surface", "directory-listing", "credential-hint"],
      auditActions: ["exposure-reduced"],
    },
  ],
  [
    "authenticated-admin-only",
    {
      auditPolicyKey: "authenticated-admin-only",
      title: "管理入口认证策略",
      closesCategories: ["admin-status"],
      auditActions: ["admin-auth-required", "exposure-reduced"],
    },
  ],
  [
    "strict-cors-audit",
    {
      auditPolicyKey: "strict-cors-audit",
      title: "严格 CORS 审计策略",
      closesCategories: ["cross-origin-trust"],
      auditActions: ["cors-policy-restricted", "exposure-reduced"],
    },
  ],
  [
    "safe-error-reporting",
    {
      auditPolicyKey: "safe-error-reporting",
      title: "安全错误信息策略",
      closesCategories: ["error-reporting"],
      auditActions: ["safe-error-reporting", "exposure-reduced"],
    },
  ],
]);

function isConfigCaseKey(value: string): value is MisconfigurationConfigCaseKey {
  return configCases.has(value as MisconfigurationConfigCaseKey);
}

function isAuditPolicyKey(
  value: string,
): value is MisconfigurationAuditPolicyKey {
  return auditPolicies.has(value as MisconfigurationAuditPolicyKey);
}

function createConfigSummary(
  definition: ConfigCaseDefinition,
): MisconfigurationConfigSummary {
  return {
    configCaseKey: definition.configCaseKey,
    title: definition.title,
    exposureCategory: definition.exposureCategory,
    visibleInVulnerableVariant: definition.visibleInVulnerableVariant,
    recommendedPolicyKey: definition.recommendedPolicyKey,
    learningNotes: definition.learningNotes,
  };
}

function createBlockedAudit(input: {
  configCaseKey: string;
  auditPolicyKey: string;
}): MisconfigurationAudit {
  return {
    exposureCategory: "blocked",
    exposureState: "blocked",
    authRequired: false,
    corsPolicyStatus: "not-applicable",
    errorReportingStatus: "not-applicable",
    matchedControlledSample:
      isConfigCaseKey(input.configCaseKey) && isAuditPolicyKey(input.auditPolicyKey),
    riskIndicatorCount: 0,
    riskIndicators: [],
    auditActions: ["audit-blocked"],
    recommendedAction: "只选择文档或页面列出的固定配置样例和固定审计策略。",
  };
}

function createBlockedBoundaryResult(input: {
  variantKey: MisconfigurationVariantKey;
  configCaseKey: string;
  auditPolicyKey: string;
  blockedReason: string;
}): MisconfigurationResult {
  const safeConfigCaseKey = isConfigCaseKey(input.configCaseKey)
    ? input.configCaseKey
    : "blocked-config-case";
  const safeAuditPolicyKey = isAuditPolicyKey(input.auditPolicyKey)
    ? input.auditPolicyKey
    : "blocked-audit-policy";

  return {
    status: "blocked",
    variantKey: input.variantKey,
    configCaseKey: safeConfigCaseKey,
    auditPolicyKey: safeAuditPolicyKey,
    configSummary: null,
    audit: createBlockedAudit({
      configCaseKey: input.configCaseKey,
      auditPolicyKey: input.auditPolicyKey,
    }),
    signal: "misconfiguration-boundary-verified",
    decision: "blocked",
    message:
      "该配置样例或审计策略不在允许列表中，未读取任何真实配置、主机、端口、路径或凭据。",
    nextStep: "选择已登记的 configCaseKey 和 auditPolicyKey 后重新观察。",
    blockedReason: input.blockedReason,
  };
}

function createVulnerableAudit(
  configCase: ConfigCaseDefinition,
): MisconfigurationAudit {
  return {
    exposureCategory: configCase.exposureCategory,
    exposureState: "visible",
    authRequired: false,
    corsPolicyStatus:
      configCase.exposureCategory === "cross-origin-trust"
        ? "too-broad"
        : "not-applicable",
    errorReportingStatus:
      configCase.exposureCategory === "error-reporting"
        ? "verbose"
        : "not-applicable",
    matchedControlledSample: true,
    riskIndicatorCount: configCase.baseRiskIndicators.length,
    riskIndicators: configCase.baseRiskIndicators,
    auditActions: ["audit-missing"],
    recommendedAction: "切换到修复版，观察固定审计策略如何收敛该暴露面。",
  };
}

function createFixedAudit(input: {
  configCase: ConfigCaseDefinition;
  policy: AuditPolicyDefinition;
  blockedByPolicy: boolean;
}): MisconfigurationAudit {
  const { configCase, policy, blockedByPolicy } = input;
  const exposureState =
    configCase.exposureCategory === "admin-status"
      ? "restricted"
      : configCase.exposureCategory === "error-reporting"
        ? "internal-only"
        : "reduced";

  return {
    exposureCategory: configCase.exposureCategory,
    exposureState: blockedByPolicy ? "blocked" : exposureState,
    authRequired:
      configCase.exposureCategory === "admin-status" ||
      policy.auditActions.includes("admin-auth-required"),
    corsPolicyStatus:
      configCase.exposureCategory === "cross-origin-trust"
        ? "restricted"
        : "not-applicable",
    errorReportingStatus:
      configCase.exposureCategory === "error-reporting"
        ? "safe"
        : "not-applicable",
    matchedControlledSample: true,
    riskIndicatorCount: 0,
    riskIndicators: [],
    auditActions: [
      ...policy.auditActions,
      ...(configCase.configCaseKey === "debug-console-exposed"
        ? (["debug-disabled"] as const)
        : []),
      ...(configCase.configCaseKey === "directory-index-enabled"
        ? (["directory-index-disabled"] as const)
        : []),
      ...(configCase.configCaseKey === "default-credential-hint-visible"
        ? (["credential-hint-removed"] as const)
        : []),
    ],
    recommendedAction: blockedByPolicy
      ? "保持管理入口认证、授权和来源限制，不允许公开访问固定管理状态样例。"
      : "保留该审计策略，并在复盘中确认日志只记录固定 key 和学习信号。",
  };
}

function policyAddressesConfigCase(input: {
  configCase: ConfigCaseDefinition;
  policy: AuditPolicyDefinition;
}) {
  return input.policy.closesCategories.includes(input.configCase.exposureCategory);
}

function resolveFixedSignal(input: {
  configCase: ConfigCaseDefinition;
}): MisconfigurationSignal {
  if (input.configCase.exposureCategory === "admin-status") {
    return "misconfiguration-auth-required";
  }

  if (input.configCase.exposureCategory === "cross-origin-trust") {
    return "misconfiguration-cors-policy-restricted";
  }

  if (input.configCase.exposureCategory === "error-reporting") {
    return "misconfiguration-safe-error-reporting";
  }

  return "misconfiguration-exposure-reduced";
}

function createMessage(input: {
  signal: MisconfigurationSignal;
  variantKey: MisconfigurationVariantKey;
}) {
  if (input.signal === "misconfiguration-debug-surface-visible") {
    return "漏洞版保留固定调试入口可见信号，展示调试面暴露风险。";
  }

  if (input.signal === "misconfiguration-directory-index-visible") {
    return "漏洞版保留固定目录索引可见信号，展示文件列表暴露风险。";
  }

  if (input.signal === "misconfiguration-cors-too-broad") {
    return "漏洞版保留过宽 CORS 信任边界，展示跨域策略失控风险。";
  }

  if (input.signal === "misconfiguration-admin-status-public") {
    return "漏洞版保留公开管理状态页信号，展示内部状态外显风险。";
  }

  if (input.signal === "misconfiguration-error-detail-exposed") {
    return "漏洞版保留详细错误信息外显信号，展示技术细节泄露风险。";
  }

  if (input.signal === "misconfiguration-default-credential-hint-visible") {
    return "漏洞版保留默认凭据提示可见信号，但不会展示任何真实账号或密码。";
  }

  if (input.signal === "misconfiguration-auth-required") {
    return "修复版要求管理入口认证、授权和来源限制，已阻断公开管理状态样例。";
  }

  if (input.signal === "misconfiguration-cors-policy-restricted") {
    return "修复版将 CORS 收敛到固定可信来源、方法和凭据策略。";
  }

  if (input.signal === "misconfiguration-safe-error-reporting") {
    return "修复版将用户错误信息与内部日志分离，只保留安全提示。";
  }

  if (input.signal === "misconfiguration-exposure-reduced") {
    return "修复版通过最小暴露面策略收敛固定配置风险信号。";
  }

  return "固定配置样例边界已校验，服务不会处理真实配置、主机、端口、路径或凭据。";
}

function createNextStep(input: {
  signal: MisconfigurationSignal;
  variantKey: MisconfigurationVariantKey;
}) {
  if (input.variantKey === "vuln") {
    return "切换到修复版，使用对应固定审计策略观察暴露面如何收敛。";
  }

  if (input.signal === "misconfiguration-auth-required") {
    return "复盘事件日志，确认公开管理状态样例只记录固定 key、认证要求和学习信号。";
  }

  if (input.signal === "misconfiguration-cors-policy-restricted") {
    return "对比漏洞版过宽 CORS 信号，确认修复版没有保存真实来源或域名。";
  }

  if (input.signal === "misconfiguration-safe-error-reporting") {
    return "对比漏洞版详细错误信号，确认修复版只保留用户可见安全摘要。";
  }

  return "继续观察审计动作、风险标签和学习信号之间的关系。";
}

export function createMisconfigurationLabService(): MisconfigurationLabService {
  return {
    async auditConfig(input) {
      const configCaseKey = input.configCaseKey.trim();
      const auditPolicyKey = input.auditPolicyKey.trim();

      if (!isConfigCaseKey(configCaseKey)) {
        return createBlockedBoundaryResult({
          variantKey: input.variantKey,
          configCaseKey,
          auditPolicyKey,
          blockedReason: "config-case-not-allowed",
        });
      }

      if (!isAuditPolicyKey(auditPolicyKey)) {
        return createBlockedBoundaryResult({
          variantKey: input.variantKey,
          configCaseKey,
          auditPolicyKey,
          blockedReason: "audit-policy-not-allowed",
        });
      }

      const configCase = configCases.get(configCaseKey);
      const policy = auditPolicies.get(auditPolicyKey);

      if (!configCase || !policy) {
        return createBlockedBoundaryResult({
          variantKey: input.variantKey,
          configCaseKey,
          auditPolicyKey,
          blockedReason: "sample-not-found",
        });
      }

      // 配置错误实验只审计固定样例，不读取本机配置或连接真实管理接口。
      if (input.variantKey === "vuln") {
        const signal = configCase.vulnerableSignal;

        return {
          status: "ok",
          variantKey: input.variantKey,
          configCaseKey,
          auditPolicyKey,
          configSummary: createConfigSummary(configCase),
          audit: createVulnerableAudit(configCase),
          signal,
          decision: "accepted",
          message: createMessage({
            signal,
            variantKey: input.variantKey,
          }),
          nextStep: createNextStep({
            signal,
            variantKey: input.variantKey,
          }),
        };
      }

      if (!policyAddressesConfigCase({ configCase, policy })) {
        return createBlockedBoundaryResult({
          variantKey: input.variantKey,
          configCaseKey,
          auditPolicyKey,
          blockedReason: "audit-policy-does-not-address-config-case",
        });
      }

      const signal = resolveFixedSignal({ configCase });
      const blockedByPolicy = signal === "misconfiguration-auth-required";
      const audit = createFixedAudit({
        configCase,
        policy,
        blockedByPolicy,
      });

      return {
        status: blockedByPolicy ? "blocked" : "ok",
        variantKey: input.variantKey,
        configCaseKey,
        auditPolicyKey,
        configSummary: createConfigSummary(configCase),
        audit,
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
        ...(blockedByPolicy ? { blockedReason: "authentication-required" } : {}),
      };
    },
  };
}

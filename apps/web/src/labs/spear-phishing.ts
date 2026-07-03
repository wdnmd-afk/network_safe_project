import type {
  SpearPhishingCaseKey,
  SpearPhishingResult,
  SpearPhishingSignal as SpearPhishingApiSignal,
  SpearPhishingVariantKey,
  SpearPhishingVerificationPolicyKey,
} from "../api/spear-phishing-lab";

export type {
  SpearPhishingCaseKey,
  SpearPhishingVariantKey,
  SpearPhishingVerificationPolicyKey,
};

export type SpearPhishingSignal =
  | SpearPhishingApiSignal
  | "spear-phishing-workbench-reviewed"
  | "spear-phishing-fixed-cases-reviewed"
  | "spear-phishing-no-real-delivery-confirmed";

export type SpearPhishingVariantConfig = {
  key: SpearPhishingVariantKey;
  title: string;
  badge: string;
  perspective: string;
  explanation: string;
  expectedSignal: string;
  expectedOutcome: string;
  panelIntro: string;
};

export type SpearPhishingCaseOption = {
  key: SpearPhishingCaseKey;
  title: string;
  roleContext: string;
  processContext: string;
  riskLevel: "medium" | "high";
  clueLabels: string[];
  vulnerableFocus: string;
  fixedFocus: string;
};

export type SpearPhishingVerificationPolicyOption = {
  key: SpearPhishingVerificationPolicyKey;
  title: string;
  description: string;
};

export type SpearPhishingCaseObservationRow = {
  key: SpearPhishingCaseKey;
  title: string;
  roleContext: string;
  focus: string;
  riskLevel: "medium" | "high";
};

export type SpearPhishingReviewChecklistItem = {
  key: string;
  title: string;
  description: string;
};

export type SpearPhishingLearningProgressInput = {
  variantKey: SpearPhishingVariantKey;
  status: "in-progress";
  notes: string;
};

export type SpearPhishingVerificationRecordInput = {
  variantKey: SpearPhishingVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: SpearPhishingApiSignal;
    caseKey: string;
    verificationPolicyKey: string;
    riskIndicatorCount: number;
    riskIndicators: string[];
    matchedControlledCase: boolean;
    contextTrustBias: boolean;
    verificationApplied: boolean;
    approvalChainRequired: boolean;
    outOfBandRequired: boolean;
    recommendedAction: string;
    riskLevel: string;
  };
};

export const defaultSpearPhishingCaseKey: SpearPhishingCaseKey =
  "executive-invoice-approval";
export const defaultSpearPhishingVulnerablePolicyKey: SpearPhishingVerificationPolicyKey =
  "context-only";
export const defaultSpearPhishingFixedPolicyKey: SpearPhishingVerificationPolicyKey =
  "approval-chain-review";

const spearPhishingVariantConfigs: Record<
  SpearPhishingVariantKey,
  SpearPhishingVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "鱼叉式钓鱼针对性误判观察版",
    badge: "角色权威、业务熟悉感和审批链绕过",
    perspective: "攻击方观察",
    explanation:
      "本页从攻击方视角观察固定虚构线索卡如何利用上下文可信感、角色权威和紧急压力造成错误放行倾向。",
    expectedSignal:
      "提交高权威付款审批和只看上下文可信度策略后应出现 spear-phishing-approval-chain-bypassed 信号。",
    expectedOutcome: "完成固定线索卡和上下文误判路径观察。",
    panelIntro:
      "工作台只调用本项目固定案例 API，不提供真实姓名、真实邮箱、正文、链接、附件、凭据或投递参数输入。",
  },
  fixed: {
    key: "fixed",
    title: "鱼叉式钓鱼流程核验复盘版",
    badge: "可信通道、审批链复核和最小授权",
    perspective: "防御方复盘",
    explanation:
      "本页从防御方视角复盘同一批固定线索卡，观察可信通道、审批链和最小授权如何改变后端决策。",
    expectedSignal:
      "提交高权威付款审批和审批链复核策略后应出现 spear-phishing-out-of-band-confirmation-required 信号。",
    expectedOutcome: "完成高风险固定案例的流程核验阻断和日志摘要复盘。",
    panelIntro:
      "修复版强调可信通道二次确认、审批链复核、最小授权、隔离举报和事件日志安全摘要。",
  },
};

export const spearPhishingCaseOptions: SpearPhishingCaseOption[] = [
  {
    key: "executive-invoice-approval",
    title: "高权威付款审批线索卡",
    roleContext: "高权威业务角色与付款审批执行者",
    processContext: "财务审批链与可信通道二次确认",
    riskLevel: "high",
    clueLabels: ["角色权威", "紧急压力", "审批链绕过"],
    vulnerableFocus: "观察权威压力和紧急付款语境如何压缩正式审批链核验。",
    fixedFocus: "观察审批链复核和可信通道二次确认如何阻断高风险请求。",
  },
  {
    key: "vendor-payment-change",
    title: "供应商付款变更线索卡",
    roleContext: "供应商协作角色与主数据维护者",
    processContext: "供应商付款信息变更与可信渠道回拨",
    riskLevel: "high",
    clueLabels: ["业务熟悉感", "付款信息变更", "流程例外"],
    vulnerableFocus: "观察供应商协作语境如何让业务熟悉感覆盖主数据变更流程。",
    fixedFocus: "观察可信渠道回拨和主数据变更复核如何改变判定。",
  },
  {
    key: "engineering-access-request",
    title: "工程临时访问线索卡",
    roleContext: "跨团队协作角色与权限审批者",
    processContext: "临时访问申请、工单绑定和权限有效期",
    riskLevel: "high",
    clueLabels: ["紧急排障", "临时访问", "最小授权缺失"],
    vulnerableFocus: "观察工程协作语境下临时访问请求如何绕过最小授权。",
    fixedFocus: "观察工单绑定、权限范围和有效期复核如何阻断过宽授权。",
  },
  {
    key: "hr-benefit-personalized",
    title: "人事福利个性化线索卡",
    roleContext: "人事通知角色与员工自助处理者",
    processContext: "HR 官方入口、内部公告和附件隔离",
    riskLevel: "medium",
    clueLabels: ["个性化语境", "官方入口混淆", "附件隔离缺失"],
    vulnerableFocus: "观察人事福利语境如何诱导学习者绕开官方入口和隔离流程。",
    fixedFocus: "观察 HR 官方入口、隔离举报和内部公告复核如何降低误判。",
  },
];

export const spearPhishingVerificationPolicyOptions: SpearPhishingVerificationPolicyOption[] =
  [
    {
      key: "context-only",
      title: "只看上下文可信度",
      description: "用于观察角色、语气和业务熟悉感造成的表面放行倾向。",
    },
    {
      key: "out-of-band-confirmation",
      title: "可信通道二次确认",
      description: "通过既定可信渠道核验请求，不依赖显示名或上下文。",
    },
    {
      key: "approval-chain-review",
      title: "审批链复核",
      description: "恢复正式审批链和双人复核，阻断流程例外请求。",
    },
    {
      key: "least-privilege-review",
      title: "最小授权复核",
      description: "核验权限范围、有效期和工单绑定，减少临时访问风险。",
    },
    {
      key: "report-and-isolate",
      title: "隔离举报与复盘",
      description: "先隔离可疑材料并举报，再复盘固定风险类别和学习信号。",
    },
  ];

export const spearPhishingReviewChecklist: SpearPhishingReviewChecklistItem[] =
  [
    {
      key: "fixed-case-only",
      title: "案例只能来自固定 key",
      description:
        "页面不提供任意邮件正文、真实人员、真实邮箱、真实链接、附件或投递参数输入。",
    },
    {
      key: "context-trust",
      title: "先观察上下文误判",
      description:
        "漏洞版重点观察角色权威、紧急压力和业务熟悉感如何压缩正式核验流程。",
    },
    {
      key: "process-review",
      title: "复盘流程控制点",
      description:
        "修复版复盘可信通道、审批链、主数据变更流程、最小授权和隔离举报。",
    },
    {
      key: "safe-log-summary",
      title: "日志只记录安全摘要",
      description:
        "事件日志只记录固定 key、风险标签、建议动作和学习信号，不保存真实业务材料。",
    },
    {
      key: "no-real-delivery",
      title: "不进行真实投递",
      description:
        "实验不发送邮件、短信或消息，不连接第三方平台，也不生成可投递模板。",
    },
  ];

export function getSpearPhishingVariantConfig(
  variant: SpearPhishingVariantKey,
) {
  return spearPhishingVariantConfigs[variant];
}

export function getDefaultSpearPhishingVerificationPolicyKey(
  variant: SpearPhishingVariantKey,
) {
  return variant === "fixed"
    ? defaultSpearPhishingFixedPolicyKey
    : defaultSpearPhishingVulnerablePolicyKey;
}

export function getSpearPhishingCaseObservationRows(
  variant: SpearPhishingVariantKey,
): SpearPhishingCaseObservationRow[] {
  return spearPhishingCaseOptions.map((item) => ({
    key: item.key,
    title: item.title,
    roleContext: item.roleContext,
    riskLevel: item.riskLevel,
    focus: variant === "vuln" ? item.vulnerableFocus : item.fixedFocus,
  }));
}

export function createSpearPhishingLearningProgress(
  config: SpearPhishingVariantConfig,
): SpearPhishingLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createSpearPhishingVerificationRecord(
  config: SpearPhishingVariantConfig,
  result: SpearPhishingResult,
): SpearPhishingVerificationRecordInput {
  const details = {
    signal: result.signal,
    caseKey: result.caseKey,
    verificationPolicyKey: result.verificationPolicyKey,
    riskIndicatorCount: result.assessment.riskIndicatorCount,
    riskIndicators: result.assessment.riskIndicators,
    matchedControlledCase: result.assessment.matchedControlledCase,
    contextTrustBias: result.assessment.contextTrustBias,
    verificationApplied: result.assessment.verificationApplied,
    approvalChainRequired: result.assessment.approvalChainRequired,
    outOfBandRequired: result.assessment.outOfBandRequired,
    recommendedAction: result.assessment.recommendedAction,
    riskLevel: result.assessment.riskLevel,
  };

  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "针对性误判观察版展示了固定鱼叉式钓鱼线索卡中的错误放行风险信号。",
      details,
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "流程核验复盘版展示了固定鱼叉式钓鱼线索卡的阻断或边界确认信号。",
    details,
  };
}

export function formatSpearPhishingSignal(signal: SpearPhishingSignal) {
  const labels: Record<SpearPhishingSignal, string> = {
    "spear-phishing-workbench-reviewed": "已进入鱼叉式钓鱼工作台",
    "spear-phishing-fixed-cases-reviewed": "已确认固定案例边界",
    "spear-phishing-no-real-delivery-confirmed": "已确认不进行真实投递",
    "spear-phishing-context-trust-overweighted": "漏洞版过度信任针对性上下文",
    "spear-phishing-approval-chain-bypassed": "漏洞版审批链绕过风险可见",
    "spear-phishing-out-of-band-confirmation-required":
      "修复版要求可信通道二次确认",
    "spear-phishing-boundary-verified": "固定案例边界已确认",
  };

  return labels[signal];
}

import type {
  WhalingCaseKey,
  WhalingResult,
  WhalingSignal as WhalingApiSignal,
  WhalingVariantKey,
  WhalingVerificationPolicyKey,
} from "../api/whaling-lab";

export type {
  WhalingCaseKey,
  WhalingVariantKey,
  WhalingVerificationPolicyKey,
};

export type WhalingSignal =
  | WhalingApiSignal
  | "whaling-workbench-reviewed"
  | "whaling-fixed-cases-reviewed"
  | "whaling-no-real-delivery-confirmed";

export type WhalingVariantConfig = {
  key: WhalingVariantKey;
  title: string;
  badge: string;
  perspective: string;
  explanation: string;
  expectedSignal: string;
  expectedOutcome: string;
  panelIntro: string;
};

export type WhalingCaseOption = {
  key: WhalingCaseKey;
  title: string;
  roleContext: string;
  processContext: string;
  riskLevel: "high" | "critical";
  clueLabels: string[];
  vulnerableFocus: string;
  fixedFocus: string;
};

export type WhalingVerificationPolicyOption = {
  key: WhalingVerificationPolicyKey;
  title: string;
  description: string;
};

export type WhalingCaseObservationRow = {
  key: WhalingCaseKey;
  title: string;
  roleContext: string;
  focus: string;
  riskLevel: "high" | "critical";
};

export type WhalingReviewChecklistItem = {
  key: string;
  title: string;
  description: string;
};

export type WhalingLearningProgressInput = {
  variantKey: WhalingVariantKey;
  status: "in-progress";
  notes: string;
};

export type WhalingVerificationRecordInput = {
  variantKey: WhalingVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: WhalingApiSignal;
    caseKey: string;
    verificationPolicyKey: string;
    riskIndicatorCount: number;
    riskIndicators: string[];
    matchedControlledCase: boolean;
    authorityContextBias: boolean;
    verificationApplied: boolean;
    trustedChannelRequired: boolean;
    paymentFreezeRequired: boolean;
    legalBoardReviewRequired: boolean;
    leastPrivilegeRequired: boolean;
    recommendedAction: string;
    riskLevel: string;
  };
};

export const defaultWhalingCaseKey: WhalingCaseKey =
  "executive-wire-approval";
export const defaultWhalingVulnerablePolicyKey: WhalingVerificationPolicyKey =
  "authority-context-only";
export const defaultWhalingFixedPolicyKey: WhalingVerificationPolicyKey =
  "payment-dual-approval";

const whalingVariantConfigs: Record<WhalingVariantKey, WhalingVariantConfig> = {
  vuln: {
    key: "vuln",
    title: "捕鲸攻击高权威误判观察版",
    badge: "高权威压力、保密语境和越级审批",
    perspective: "攻击方观察",
    explanation:
      "本页从攻击方视角观察固定虚构高层决策案例如何利用高权威、保密理由和时间压力造成流程失守。",
    expectedSignal:
      "提交高层紧急大额付款和只看权威上下文策略后应出现 whaling-executive-authority-overweighted 信号。",
    expectedOutcome: "完成固定高层决策线索卡和高权威误判路径观察。",
    panelIntro:
      "工作台只调用本项目固定案例 API，不提供真实高管、组织结构、邮箱、链接、附件、付款信息、会议邀请、凭据或投递参数输入。",
  },
  fixed: {
    key: "fixed",
    title: "捕鲸攻击高风险流程核验复盘版",
    badge: "可信通道、付款冻结、法务核验和最小授权",
    perspective: "防御方复盘",
    explanation:
      "本页从防御方视角复盘同一批固定案例，观察可信通道、双人复核、例外冻结和最小授权如何改变后端决策。",
    expectedSignal:
      "提交高层紧急大额付款和大额付款双人复核策略后应出现 whaling-payment-freeze-required 信号。",
    expectedOutcome: "完成高风险固定案例的流程核验阻断和日志摘要复盘。",
    panelIntro:
      "修复版强调可信通道回拨、大额付款双人复核、法务与董事会固定通道、资料室最小授权和事件日志安全摘要。",
  },
};

export const whalingCaseOptions: WhalingCaseOption[] = [
  {
    key: "executive-wire-approval",
    title: "高层紧急大额付款线索卡",
    roleContext: "高层决策角色与大额付款执行者",
    processContext: "财务付款审批链、可信通道回拨和双人复核",
    riskLevel: "critical",
    clueLabels: ["高权威压力", "紧急时限", "审批链跳过", "保密理由"],
    vulnerableFocus: "观察高层授权标签和紧急付款语境如何压缩正式核验。",
    fixedFocus: "观察付款冻结、可信通道回拨和双人复核如何阻断高风险动作。",
  },
  {
    key: "board-confidential-request",
    title: "董事会保密事项线索卡",
    roleContext: "董事会事务角色与高敏事项协作执行者",
    processContext: "董事会固定事务通道、法务核验和例外审批记录",
    riskLevel: "critical",
    clueLabels: ["保密压力", "越级请求", "角色模糊", "审计缺失"],
    vulnerableFocus: "观察保密事项和越级请求如何削弱固定流程复核。",
    fixedFocus: "观察董事会固定通道、法务核验和例外审批记录如何恢复边界。",
  },
  {
    key: "legal-settlement-transfer",
    title: "法务结算付款线索卡",
    roleContext: "外部顾问协作角色与法务或财务执行者",
    processContext: "案件编号、顾问白名单、法务负责人确认和财务复核",
    riskLevel: "critical",
    clueLabels: ["外部顾问权威", "案件压力", "付款例外", "信息不完整"],
    vulnerableFocus: "观察法务和外部顾问语境如何制造紧急合规压力。",
    fixedFocus: "观察案件编号、顾问白名单和财务复核如何阻断付款例外。",
  },
  {
    key: "ma-data-room-access",
    title: "并购资料室临时访问线索卡",
    roleContext: "重大交易协作角色与资料室权限管理员",
    processContext: "临时资料室访问审批、安全团队复核和权限有效期",
    riskLevel: "high",
    clueLabels: ["重大交易语境", "临时权限", "审批缺失", "最小授权失守"],
    vulnerableFocus: "观察重大交易语境如何让最小授权和有效期被忽略。",
    fixedFocus: "观察资料室访问范围、有效期、独立审批和安全复核如何降低风险。",
  },
];

export const whalingVerificationPolicyOptions: WhalingVerificationPolicyOption[] =
  [
    {
      key: "authority-context-only",
      title: "只看权威和上下文",
      description: "用于观察职位标签、保密理由和紧急语境造成的表面放行倾向。",
    },
    {
      key: "trusted-channel-callback",
      title: "可信通道回拨确认",
      description: "通过预先登记的可信渠道核验请求，不依赖显示身份或语气。",
    },
    {
      key: "payment-dual-approval",
      title: "大额付款双人复核",
      description: "冻结付款动作并恢复财务审批链和双人复核。",
    },
    {
      key: "legal-board-channel-review",
      title: "法务与董事会固定通道复核",
      description: "将法务、董事会或外部顾问事项拉回固定通道和例外记录。",
    },
    {
      key: "least-privilege-data-room",
      title: "资料室最小授权复核",
      description: "核验访问范围、有效期、独立审批和安全团队复核。",
    },
    {
      key: "freeze-and-escalate",
      title: "冻结并升级复盘",
      description: "冻结高风险动作，升级到财务、法务、安全或管理层复盘。",
    },
  ];

export const whalingReviewChecklist: WhalingReviewChecklistItem[] = [
  {
    key: "fixed-case-only",
    title: "案例只能来自固定 key",
    description:
      "页面不提供任意正文、真实人员、邮箱、组织结构、链接、附件、付款信息、会议邀请或凭据输入。",
  },
  {
    key: "authority-pressure",
    title: "先观察高权威误判",
    description:
      "漏洞版重点观察高层授权、保密理由、紧急时限和越级审批如何压缩正式核验流程。",
  },
  {
    key: "process-freeze",
    title: "复盘冻结和复核动作",
    description:
      "修复版复盘可信通道、双人复核、法务核验、董事会固定通道和最小授权。",
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
      "实验不发送邮件、短信、消息或会议邀请，不连接第三方平台，也不生成可投递模板。",
  },
];

export function getWhalingVariantConfig(variant: WhalingVariantKey) {
  return whalingVariantConfigs[variant];
}

export function getDefaultWhalingVerificationPolicyKey(
  variant: WhalingVariantKey,
) {
  return variant === "fixed"
    ? defaultWhalingFixedPolicyKey
    : defaultWhalingVulnerablePolicyKey;
}

export function getWhalingCaseObservationRows(
  variant: WhalingVariantKey,
): WhalingCaseObservationRow[] {
  return whalingCaseOptions.map((item) => ({
    key: item.key,
    title: item.title,
    roleContext: item.roleContext,
    riskLevel: item.riskLevel,
    focus: variant === "vuln" ? item.vulnerableFocus : item.fixedFocus,
  }));
}

export function createWhalingLearningProgress(
  config: WhalingVariantConfig,
): WhalingLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createWhalingVerificationRecord(
  config: WhalingVariantConfig,
  result: WhalingResult,
): WhalingVerificationRecordInput {
  const details = {
    signal: result.signal,
    caseKey: result.caseKey,
    verificationPolicyKey: result.verificationPolicyKey,
    riskIndicatorCount: result.assessment.riskIndicatorCount,
    riskIndicators: result.assessment.riskIndicators,
    matchedControlledCase: result.assessment.matchedControlledCase,
    authorityContextBias: result.assessment.authorityContextBias,
    verificationApplied: result.assessment.verificationApplied,
    trustedChannelRequired: result.assessment.trustedChannelRequired,
    paymentFreezeRequired: result.assessment.paymentFreezeRequired,
    legalBoardReviewRequired: result.assessment.legalBoardReviewRequired,
    leastPrivilegeRequired: result.assessment.leastPrivilegeRequired,
    recommendedAction: result.assessment.recommendedAction,
    riskLevel: result.assessment.riskLevel,
  };

  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "高权威误判观察版展示了固定捕鲸攻击案例中的错误放行风险信号。",
      details,
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "高风险流程核验复盘版展示了固定捕鲸攻击案例的阻断或边界确认信号。",
    details,
  };
}

export function formatWhalingSignal(signal: WhalingSignal) {
  const labels: Record<WhalingSignal, string> = {
    "whaling-workbench-reviewed": "已进入捕鲸攻击工作台",
    "whaling-fixed-cases-reviewed": "已确认固定高层决策案例边界",
    "whaling-no-real-delivery-confirmed": "已确认不进行真实投递",
    "whaling-executive-authority-overweighted": "漏洞版过度相信高权威上下文",
    "whaling-confidential-pressure-identified": "漏洞版保密压力风险可见",
    "whaling-payment-freeze-required": "修复版要求冻结并复核高风险动作",
    "whaling-boundary-verified": "固定案例边界已确认",
  };

  return labels[signal];
}

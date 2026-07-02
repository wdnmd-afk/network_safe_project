import type {
  PhishingCaseKey,
  PhishingDefenseChecklistKey,
  PhishingResult,
  PhishingReviewModeKey,
  PhishingSignal as PhishingApiSignal,
  PhishingVariantKey,
} from "../api/phishing-lab";

export type {
  PhishingCaseKey,
  PhishingDefenseChecklistKey,
  PhishingReviewModeKey,
  PhishingVariantKey,
};

export type PhishingSignal =
  | PhishingApiSignal
  | "phishing-workbench-reviewed"
  | "phishing-fixed-cases-reviewed"
  | "phishing-no-real-delivery-confirmed";

export type PhishingVariantConfig = {
  key: PhishingVariantKey;
  title: string;
  badge: string;
  perspective: string;
  explanation: string;
  expectedSignal: string;
  expectedOutcome: string;
  panelIntro: string;
};

export type PhishingCaseOption = {
  key: PhishingCaseKey;
  title: string;
  surfaceCue: string;
  businessContext: string;
  riskLevel: "low" | "medium" | "high";
  indicatorLabels: string[];
  vulnerableFocus: string;
  fixedFocus: string;
};

export type PhishingReviewModeOption = {
  key: PhishingReviewModeKey;
  title: string;
  description: string;
};

export type PhishingDefenseChecklistOption = {
  key: PhishingDefenseChecklistKey;
  title: string;
  description: string;
};

export type PhishingCaseObservationRow = {
  key: PhishingCaseKey;
  title: string;
  surfaceCue: string;
  focus: string;
  riskLevel: "low" | "medium" | "high";
};

export type PhishingReviewChecklistItem = {
  key: string;
  title: string;
  description: string;
};

export type PhishingLearningProgressInput = {
  variantKey: PhishingVariantKey;
  status: "in-progress";
  notes: string;
};

export type PhishingVerificationRecordInput = {
  variantKey: PhishingVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: PhishingApiSignal;
    caseKey: string;
    reviewModeKey: string;
    defenseChecklistKey: string;
    indicatorCount: number;
    riskIndicators: string[];
    surfaceBias: boolean;
    checklistApplied: boolean;
    recommendedAction: string;
    riskLevel: string;
  };
};

export const defaultPhishingCaseKey: PhishingCaseKey =
  "account-security-alert";
export const defaultPhishingReviewModeKey: PhishingReviewModeKey =
  "surface-only";
export const defaultPhishingVulnerableDefenseChecklistKey: PhishingDefenseChecklistKey =
  "none";
export const defaultPhishingFixedReviewModeKey: PhishingReviewModeKey =
  "reporting-flow";
export const defaultPhishingFixedDefenseChecklistKey: PhishingDefenseChecklistKey =
  "report-isolate-confirm";

const phishingVariantConfigs: Record<
  PhishingVariantKey,
  PhishingVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "网络钓鱼误判观察版",
    badge: "表面可信、紧急诱导和检查缺失",
    perspective: "攻击方观察",
    explanation:
      "本页从攻击方视角观察固定线索卡如何利用显示名、紧急语气或附件提示制造错误放行倾向。",
    expectedSignal:
      "提交账号安全提醒和表面观察模式后应出现 phishing-lookalike-domain-overlooked 信号。",
    expectedOutcome: "完成固定线索卡、表面观察模式和无检查清单下的误判信号观察。",
    panelIntro:
      "工作台只调用本项目固定案例 API，不提供邮件正文、真实邮箱、真实链接、附件名、凭据或投递参数输入。",
  },
  fixed: {
    key: "fixed",
    title: "网络钓鱼识别复盘版",
    badge: "逐项复核、举报隔离和二次确认",
    perspective: "防御方复盘",
    explanation:
      "本页从防御方视角复盘同一批固定线索卡，观察检查清单如何改变后端判定和处置建议。",
    expectedSignal:
      "提交账号安全提醒和举报隔离清单后应出现 phishing-reporting-flow-applied 信号。",
    expectedOutcome: "完成高风险线索阻断、安全周报放行和处置动作复盘。",
    panelIntro:
      "修复版强调相似域名核验、风险线索复核、举报隔离和安全通道二次确认。",
  },
};

export const phishingCaseOptions: PhishingCaseOption[] = [
  {
    key: "invoice-urgent-review",
    title: "发票复核线索卡",
    surfaceCue: "紧急复核与附件提示",
    businessContext: "固定财务复核案例",
    riskLevel: "high",
    indicatorLabels: ["紧急语气", "附件诱导", "业务上下文异常"],
    vulnerableFocus: "观察紧急复核如何压缩附件来源和业务上下文核验。",
    fixedFocus: "观察隔离附件和通过财务通道二次确认如何降低风险。",
  },
  {
    key: "account-security-alert",
    title: "账号安全提醒线索卡",
    surfaceCue: "安全提醒与凭据请求",
    businessContext: "固定账号安全提醒案例",
    riskLevel: "high",
    indicatorLabels: ["相似域名", "凭据请求", "紧急语气"],
    vulnerableFocus: "观察显示名可信时，相似域名和凭据请求如何被忽略。",
    fixedFocus: "观察举报隔离和安全通道复核如何改变判定。",
  },
  {
    key: "hr-benefit-update",
    title: "人事福利更新线索卡",
    surfaceCue: "福利更新与附件提示",
    businessContext: "固定人事通知案例",
    riskLevel: "medium",
    indicatorLabels: ["品牌仿冒", "附件诱导", "业务上下文异常"],
    vulnerableFocus: "观察跨部门通知如何通过品牌外观和附件诱导制造误判。",
    fixedFocus: "观察通过人事确认通道复核来源和附件处理动作。",
  },
  {
    key: "internal-security-newsletter",
    title: "内部安全周报线索卡",
    surfaceCue: "常规安全提醒",
    businessContext: "固定安全教育消息案例",
    riskLevel: "low",
    indicatorLabels: [],
    vulnerableFocus: "观察正常安全消息在基础核验后应保持可接受。",
    fixedFocus: "观察修复版如何避免误伤正常业务通知。",
  },
];

export const phishingReviewModeOptions: PhishingReviewModeOption[] = [
  {
    key: "surface-only",
    title: "只看表面信息",
    description: "用于观察显示名、紧急程度或外观可信时的误判倾向。",
  },
  {
    key: "indicator-review",
    title: "逐项线索复核",
    description: "逐项观察相似域名、凭据请求、附件诱导和业务上下文。",
  },
  {
    key: "reporting-flow",
    title: "举报与隔离流程",
    description: "模拟先举报、隔离风险对象，再通过安全通道二次确认。",
  },
];

export const phishingDefenseChecklistOptions: PhishingDefenseChecklistOption[] =
  [
    {
      key: "none",
      title: "无检查清单",
      description: "用于观察漏洞版缺少核验动作时的错误放行倾向。",
    },
    {
      key: "sender-domain-check",
      title: "发件人与域名核验",
      description: "核验来源一致性和相似域名风险，不处理真实邮箱地址。",
    },
    {
      key: "report-isolate-confirm",
      title: "举报、隔离和确认",
      description: "对高风险线索先隔离再走安全通道确认。",
    },
    {
      key: "safe-release-check",
      title: "安全放行检查",
      description: "用于正常安全周报等低风险案例的基础核验。",
    },
  ];

export const phishingReviewChecklist: PhishingReviewChecklistItem[] = [
  {
    key: "fixed-case-only",
    title: "案例只能来自固定 key",
    description:
      "页面不提供任意邮件正文、真实邮箱、真实链接、真实附件或投递参数输入。",
  },
  {
    key: "surface-bias",
    title: "先观察表面误判",
    description:
      "漏洞版重点观察显示名、紧急语气或品牌外观如何压缩正常核验流程。",
  },
  {
    key: "indicator-review",
    title: "逐项复核风险线索",
    description:
      "复盘相似域名、凭据请求、附件诱导、品牌仿冒和业务上下文异常。",
  },
  {
    key: "safe-log-summary",
    title: "日志只记录安全摘要",
    description:
      "事件日志只记录固定 key、风险标签、建议动作和学习信号，不保存真实邮件内容。",
  },
  {
    key: "no-real-delivery",
    title: "不进行真实投递",
    description:
      "实验不发送真实邮件、短信或消息，不连接第三方投递服务，也不生成可投递模板包。",
  },
];

export function getPhishingVariantConfig(variant: PhishingVariantKey) {
  return phishingVariantConfigs[variant];
}

export function getDefaultPhishingReviewModeKey(
  variant: PhishingVariantKey,
) {
  return variant === "fixed"
    ? defaultPhishingFixedReviewModeKey
    : defaultPhishingReviewModeKey;
}

export function getDefaultPhishingDefenseChecklistKey(
  variant: PhishingVariantKey,
) {
  return variant === "fixed"
    ? defaultPhishingFixedDefenseChecklistKey
    : defaultPhishingVulnerableDefenseChecklistKey;
}

export function getPhishingCaseObservationRows(
  variant: PhishingVariantKey,
): PhishingCaseObservationRow[] {
  return phishingCaseOptions.map((item) => ({
    key: item.key,
    title: item.title,
    surfaceCue: item.surfaceCue,
    riskLevel: item.riskLevel,
    focus: variant === "vuln" ? item.vulnerableFocus : item.fixedFocus,
  }));
}

export function createPhishingLearningProgress(
  config: PhishingVariantConfig,
): PhishingLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createPhishingVerificationRecord(
  config: PhishingVariantConfig,
  result: PhishingResult,
): PhishingVerificationRecordInput {
  const details = {
    signal: result.signal,
    caseKey: result.caseKey,
    reviewModeKey: result.reviewModeKey,
    defenseChecklistKey: result.defenseChecklistKey,
    indicatorCount: result.inspection.indicatorCount,
    riskIndicators: result.inspection.riskIndicators,
    surfaceBias: result.inspection.surfaceBias,
    checklistApplied: result.inspection.checklistApplied,
    recommendedAction: result.inspection.recommendedAction,
    riskLevel: result.inspection.riskLevel,
  };

  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "误判观察版展示了固定网络钓鱼线索卡中的错误放行风险信号。",
      details,
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "识别复盘版展示了固定网络钓鱼线索卡的阻断或安全放行信号。",
    details,
  };
}

export function formatPhishingSignal(signal: PhishingSignal) {
  const labels: Record<PhishingSignal, string> = {
    "phishing-workbench-reviewed": "已进入网络钓鱼识别工作台",
    "phishing-fixed-cases-reviewed": "已确认固定案例边界",
    "phishing-no-real-delivery-confirmed": "已确认不进行真实投递",
    "phishing-lookalike-domain-overlooked": "漏洞版忽略相似域名风险",
    "phishing-credential-request-visible": "固定案例凭据请求风险可见",
    "phishing-attachment-risk-visible": "固定案例附件诱导风险可见",
    "phishing-reporting-flow-applied": "修复版举报隔离流程已生效",
    "phishing-safe-message-accepted": "固定安全消息已放行",
    "phishing-case-boundary-verified": "固定案例边界已确认",
  };

  return labels[signal];
}

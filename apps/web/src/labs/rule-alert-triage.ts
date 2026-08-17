import type {
  RuleAlertTriageResult,
  RuleAlertTriageVariantKey,
} from "../api/rule-alert-triage-lab";

export type { RuleAlertTriageVariantKey };

export type RuleAlertTriageVariantConfig = {
  key: RuleAlertTriageVariantKey;
  title: string;
  badge: string;
  perspective: string;
  explanation: string;
  expectedSignal: string;
  expectedOutcome: string;
  panelIntro: string;
  // 推荐路径只包含服务端已登记的固定 optionKey。
  recommendedPath: string[];
};

export type RuleAlertTriageLearningProgressInput = {
  variantKey: RuleAlertTriageVariantKey;
  status: "in-progress";
  notes: string;
};

export type RuleAlertTriageVerificationRecordInput = {
  variantKey: RuleAlertTriageVariantKey;
  result: "passed" | "blocked";
  summary: string;
  details: {
    signal: string;
    scenarioKey: string;
    ruleProfileKey: string;
    truePositiveCount: number;
    falsePositiveCount: number;
    falseNegativeCount: number;
    stepCount: number;
  };
};

export const ruleAlertTriageScenarioKey =
  "fixed-auth-process-alert-timeline";

const ruleAlertTriageVariantConfigs: Record<
  RuleAlertTriageVariantKey,
  RuleAlertTriageVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "检测规则与告警研判风险观察版",
    badge: "单信号偏差 + 关联告警误关闭",
    perspective: "风险观察",
    explanation:
      "选择过宽或过窄的单信号规则，观察误报与漏报，再把具备多源证据的告警错误关闭。",
    expectedSignal:
      "风险路径完成后应出现 detection-rule-alert-triage-risk-accepted 学习信号。",
    expectedOutcome:
      "完成规则画像评估和告警研判两步固定决策，观察证据不足与风险接受的影响。",
    panelIntro:
      "工作台只使用六条固定脱敏事件和预登记命中集合，不接收真实日志、规则表达式或查询。",
    recommendedPath: [
      "trust-broad-single-signal-rule",
      "dismiss-correlated-alert-as-noise",
    ],
  },
  fixed: {
    key: "fixed",
    title: "检测规则与告警研判防御复盘版",
    badge: "跨来源关联 + 证据驱动处置",
    perspective: "防御复盘",
    explanation:
      "关联认证、进程与网络固定信号，核对规则准确率与召回率，再基于证据升级告警或正常关闭维护事件。",
    expectedSignal:
      "防御路径出现 detection-rule-alert-triage-defense-escalated，正常路径出现 detection-rule-alert-triage-normal-verified。",
    expectedOutcome:
      "对比关联告警升级与已知维护事件正常关闭的固定研判结论。",
    panelIntro:
      "修复版只返回教学处置摘要，不连接真实 SIEM，也不执行隔离、封禁或告警关闭。",
    recommendedPath: [
      "correlate-multi-source-signals",
      "escalate-correlated-alert-for-containment",
    ],
  },
};

export const ruleAlertTriageNormalPath = [
  "correlate-multi-source-signals",
  "close-known-maintenance-with-evidence",
];

export const ruleAlertTriageReviewChecklist = [
  {
    key: "baseline-first",
    title: "先确认固定基线",
    description:
      "误报与漏报必须相对于固定教学基线计算，单看命中数量无法判断规则质量。",
  },
  {
    key: "correlate-sources",
    title: "关联不同来源的证据",
    description:
      "认证、进程和网络信号在固定时间线中互相补充，避免单信号规则遗漏关键上下文。",
  },
  {
    key: "separate-benign",
    title: "正常事件需要可验证证据",
    description:
      "维护窗口、签名任务和已知上下文用于支持正常关闭，不能仅凭低严重度忽略事件。",
  },
  {
    key: "safe-summary",
    title: "日志只记录安全摘要",
    description:
      "平台事件日志只记录固定 key、TP/FP/FN、步数、终止结果和学习信号。",
  },
];

export function getRuleAlertTriageVariantConfig(
  variant: RuleAlertTriageVariantKey,
) {
  return ruleAlertTriageVariantConfigs[variant];
}

export function formatRuleAlertTriageSignal(signal: string) {
  const labels: Record<string, string> = {
    "detection-rule-alert-triage-risk-accepted": "关联告警被错误关闭",
    "detection-rule-alert-triage-defense-escalated": "关联告警已升级研判",
    "detection-rule-alert-triage-normal-verified": "维护事件已凭证据关闭",
    "detection-rule-alert-triage-broad-rule-trusted": "过宽认证规则被信任",
    "detection-rule-alert-triage-narrow-rule-trusted": "过窄进程规则被信任",
    "detection-rule-alert-triage-signals-correlated": "多来源信号已关联",
    "detection-rule-alert-triage-boundary-blocked": "未登记输入被脱敏阻断",
  };

  return labels[signal] ?? signal;
}

export function formatRuleProfileTitle(ruleProfileKey: string) {
  const labels: Record<string, string> = {
    "broad-auth-failure-rule": "过宽认证失败规则",
    "narrow-unsigned-process-rule": "过窄未签名进程规则",
    "correlated-auth-process-network-rule": "跨来源关联规则",
  };

  return labels[ruleProfileKey] ?? ruleProfileKey;
}

export function createRuleAlertTriageLearningProgress(
  config: RuleAlertTriageVariantConfig,
): RuleAlertTriageLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createRuleAlertTriageVerificationRecord(
  config: RuleAlertTriageVariantConfig,
  result: RuleAlertTriageResult,
): RuleAlertTriageVerificationRecordInput {
  return {
    variantKey: config.key,
    result: result.decision === "blocked" ? "blocked" : "passed",
    summary: `${result.labKey}: ${result.signal}`,
    details: {
      signal: result.signal,
      scenarioKey: result.scenarioKey,
      ruleProfileKey:
        result.ruleAnalysis?.ruleProfileKey ?? "blocked-rule-profile",
      truePositiveCount: result.ruleAnalysis?.truePositiveCount ?? 0,
      falsePositiveCount: result.ruleAnalysis?.falsePositiveCount ?? 0,
      falseNegativeCount: result.ruleAnalysis?.falseNegativeCount ?? 0,
      stepCount: result.assessment.stepCount,
    },
  };
}

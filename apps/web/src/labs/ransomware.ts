import type {
  RansomwareResult,
  RansomwareVariantKey,
} from "../api/ransomware-lab";

export type { RansomwareVariantKey };

export type RansomwareVariantConfig = {
  key: RansomwareVariantKey;
  title: string;
  badge: string;
  perspective: string;
  explanation: string;
  expectedSignal: string;
  expectedOutcome: string;
  panelIntro: string;
  // 推荐的固定决策路径（有序 optionKey），前端只按钮驱动，不接受自由输入。
  recommendedPath: string[];
};

export type RansomwareLearningProgressInput = {
  variantKey: RansomwareVariantKey;
  status: "in-progress";
  notes: string;
};

export type RansomwareVerificationRecordInput = {
  variantKey: RansomwareVariantKey;
  result: "passed" | "blocked";
  summary: string;
  details: {
    signal: string;
    scenarioKey: string;
    stepCount: number;
    riskOutcomes: number;
    fixOutcomes: number;
    normalOutcomes: number;
  };
};

export const ransomwareScenarioKey = "synthetic-encryption-behavior";

const ransomwareVariantConfigs: Record<
  RansomwareVariantKey,
  RansomwareVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "勒索软件风险观察版",
    badge: "异常文件行为未关联 + 放任不受限加密",
    perspective: "攻击链证据观察",
    explanation:
      "本页从证据分析视角走两步决策：先忽略异常文件行为，再放任不受限加密，观察批量加密前兆如何未被关联与处置。",
    expectedSignal:
      "沿风险路径完成后应出现 malware-ransomware-risk-accepted 学习信号。",
    expectedOutcome: "完成行为关联与主机处置两步固定决策，观察加密行为被放任。",
    panelIntro:
      "工作台只提供共享目录中声明的固定决策选项，不创建、下载或执行任何真实样本，不操作真实文件。",
    recommendedPath: [
      "ignore-anomalous-file-behavior",
      "allow-unrestricted-encryption",
    ],
  },
  fixed: {
    key: "fixed",
    title: "勒索软件防御复盘版",
    badge: "行为关联检测 + 隔离与离线备份恢复",
    perspective: "防御方复盘",
    explanation:
      "本页从防御方视角复盘同一固定案例：关联异常行为触发检测后，既可隔离阻断高风险主机，也能从离线备份恢复正常业务。",
    expectedSignal:
      "防御拦截路径出现 malware-ransomware-defense-blocked，正常恢复路径出现 malware-ransomware-normal-verified。",
    expectedOutcome: "对比隔离阻断路径与离线备份恢复路径的固定判定差异。",
    panelIntro:
      "修复版强调服务端固定决策状态机、事件日志安全摘要和防御信号，前端按钮只用于引导学习流程。",
    recommendedPath: [
      "correlate-and-detect-behavior",
      "isolate-and-block-host",
    ],
  },
};

// 修复版正常流程路径：关联检测后从离线备份恢复正常业务，验证修复后业务仍可继续。
export const ransomwareNormalPath = [
  "correlate-and-detect-behavior",
  "restore-from-offline-backup",
];

export const ransomwareReviewChecklist = [
  {
    key: "fixed-decisions",
    title: "决策只能来自固定选项",
    description:
      "页面不创建、下载或执行真实样本，也不操作真实文件，所有决策都来自本实验固定 optionKey。",
  },
  {
    key: "behavior-detection",
    title: "异常文件行为应被快速关联",
    description:
      "批量文件变更、备份影响和共享枚举必须被关联为高风险事件并触发检测响应。",
  },
  {
    key: "containment-recovery",
    title: "高风险主机应被隔离并可恢复",
    description:
      "确认为高风险后必须隔离阻断主机，并依赖离线备份和恢复演练恢复正常业务。",
  },
  {
    key: "log-summary",
    title: "日志只记录脱敏摘要",
    description:
      "事件日志只记录固定案例 key、决策路径信号和结果计数，不记录真实文件、样本或原始输入。",
  },
];

export function getRansomwareVariantConfig(variant: RansomwareVariantKey) {
  return ransomwareVariantConfigs[variant];
}

export function formatRansomwareSignal(signal: string) {
  const labels: Record<string, string> = {
    "malware-ransomware-risk-accepted": "加密行为被放任（漏洞路径）",
    "malware-ransomware-defense-blocked": "隔离阻断高风险主机",
    "malware-ransomware-normal-verified": "离线备份恢复正常业务",
    "malware-ransomware-correlation-open": "异常行为未被关联",
    "malware-ransomware-correlation-enabled": "行为关联检测已启用",
    "malware-ransomware-boundary-blocked": "未登记输入被脱敏阻断",
  };

  return labels[signal] ?? signal;
}

export function createRansomwareLearningProgress(
  config: RansomwareVariantConfig,
): RansomwareLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createRansomwareVerificationRecord(
  config: RansomwareVariantConfig,
  result: RansomwareResult,
): RansomwareVerificationRecordInput {
  return {
    variantKey: config.key,
    result: result.decision === "blocked" ? "blocked" : "passed",
    summary: `${result.labKey}: ${result.signal}`,
    details: {
      signal: result.signal,
      scenarioKey: result.scenarioKey,
      stepCount: result.assessment.stepCount,
      riskOutcomes: result.recap.outcomeCounts.risk,
      fixOutcomes: result.recap.outcomeCounts.fix,
      normalOutcomes: result.recap.outcomeCounts.normal,
    },
  };
}

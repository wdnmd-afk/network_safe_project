import type {
  InsecureRandomnessResult,
  InsecureRandomnessVariantKey,
} from "../api/insecure-randomness-lab";

export type { InsecureRandomnessVariantKey };

export type InsecureRandomnessVariantConfig = {
  key: InsecureRandomnessVariantKey;
  title: string;
  badge: string;
  perspective: string;
  explanation: string;
  expectedSignal: string;
  expectedOutcome: string;
  panelIntro: string;
  // 推荐路径只包含服务端已注册的固定 optionKey，不接受 token 或随机参数。
  recommendedPath: string[];
};

export type InsecureRandomnessLearningProgressInput = {
  variantKey: InsecureRandomnessVariantKey;
  status: "in-progress";
  notes: string;
};

export type InsecureRandomnessVerificationRecordInput = {
  variantKey: InsecureRandomnessVariantKey;
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

export const insecureRandomnessScenarioKey =
  "predictable-session-token-sequence";

const insecureRandomnessVariantConfigs: Record<
  InsecureRandomnessVariantKey,
  InsecureRandomnessVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "不安全随机数风险观察版",
    badge: "时间戳/自增模式 + 缺少随机源证据",
    perspective: "风险观察",
    explanation:
      "本页通过两步固定决策观察风险：先把时间戳/自增结构误当作不可预测 token，再继续接受弱随机来源。",
    expectedSignal:
      "沿风险路径完成后应出现 crypto-insecure-randomness-risk-accepted 学习信号。",
    expectedOutcome:
      "完成熵模式判定与随机源处置两步固定决策，观察低熵策略被接受。",
    panelIntro:
      "工作台只展示来源、模式和强度摘要，不提供 token、secret、seed、时间戳、计数器或用户输入。",
    recommendedPath: [
      "trust-timestamp-counter-pattern",
      "keep-predictable-token-source",
    ],
  },
  fixed: {
    key: "fixed",
    title: "不安全随机数防御复盘版",
    badge: "低熵识别 + 操作系统 CSPRNG 策略",
    perspective: "防御复盘",
    explanation:
      "本页复盘同一固定摘要：识别低熵和单调模式后阻断弱随机来源，并验证固定 CSPRNG 策略摘要。",
    expectedSignal:
      "防御路径出现 crypto-insecure-randomness-defense-blocked，正常路径出现 crypto-insecure-randomness-normal-verified。",
    expectedOutcome: "对比弱随机源阻断与固定 CSPRNG 策略通过的判定差异。",
    panelIntro:
      "修复版只验证固定策略摘要，不生成、签发、保存或显示真实随机 token。",
    recommendedPath: [
      "detect-low-entropy-pattern",
      "block-weak-token-generation",
    ],
  },
};

export const insecureRandomnessNormalPath = [
  "detect-low-entropy-pattern",
  "verify-csprng-token-policy",
];

export const insecureRandomnessReviewChecklist = [
  {
    key: "signed-vs-random",
    title: "签名完整性不等于随机熵",
    description:
      "HMAC 可以保护载荷完整性；时间字段本身仍不是随机材料，两者必须分别评估。",
  },
  {
    key: "fixed-summary-only",
    title: "实验只使用固定摘要",
    description:
      "页面不显示或接收原始 token、secret、seed、时间戳、计数器或用户标识。",
  },
  {
    key: "csprng-policy",
    title: "随机 token 使用操作系统 CSPRNG",
    description:
      "正常策略摘要要求操作系统 CSPRNG 和至少 128 位随机材料，并保持不可预测性。",
  },
  {
    key: "log-summary",
    title: "日志只记录脱敏摘要",
    description:
      "事件日志只记录固定案例 key、决策信号和结果计数，不记录任何疑似秘密原值。",
  },
];

export function getInsecureRandomnessVariantConfig(
  variant: InsecureRandomnessVariantKey,
) {
  return insecureRandomnessVariantConfigs[variant];
}

export function formatInsecureRandomnessSignal(signal: string) {
  const labels: Record<string, string> = {
    "crypto-insecure-randomness-risk-accepted": "低熵 token 策略被接受",
    "crypto-insecure-randomness-defense-blocked": "防御阻断弱随机来源",
    "crypto-insecure-randomness-normal-verified": "固定 CSPRNG 策略通过",
    "crypto-insecure-randomness-pattern-trusted": "时间戳/自增模式被误信任",
    "crypto-insecure-randomness-pattern-detected": "低熵与单调模式已识别",
    "crypto-insecure-randomness-boundary-blocked": "未登记输入被脱敏阻断",
  };

  return labels[signal] ?? signal;
}

export function createInsecureRandomnessLearningProgress(
  config: InsecureRandomnessVariantConfig,
): InsecureRandomnessLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createInsecureRandomnessVerificationRecord(
  config: InsecureRandomnessVariantConfig,
  result: InsecureRandomnessResult,
): InsecureRandomnessVerificationRecordInput {
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

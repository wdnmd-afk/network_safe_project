import type {
  CredentialStuffingResult,
  CredentialStuffingVariantKey,
} from "../api/credential-stuffing-lab";

export type { CredentialStuffingVariantKey };

export type CredentialStuffingVariantConfig = {
  key: CredentialStuffingVariantKey;
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

export type CredentialStuffingLearningProgressInput = {
  variantKey: CredentialStuffingVariantKey;
  status: "in-progress";
  notes: string;
};

export type CredentialStuffingVerificationRecordInput = {
  variantKey: CredentialStuffingVariantKey;
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

export const credentialStuffingScenarioKey = "reused-credential-batch";

const credentialStuffingVariantConfigs: Record<
  CredentialStuffingVariantKey,
  CredentialStuffingVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "凭据填充风险观察版",
    badge: "只判断单次口令 + 无挑战放行",
    perspective: "攻击方观察",
    explanation:
      "本页从攻击方视角走两步决策：先只判断单次口令结果，再无挑战直接放行，观察批量登录如何被逐个筛选接受。",
    expectedSignal:
      "沿风险路径完成后应出现 auth-credential-stuffing-risk-accepted 学习信号。",
    expectedOutcome: "完成风险关联与挑战两步固定决策，观察批量登录被接受。",
    panelIntro:
      "工作台只提供共享目录中声明的固定决策选项，不提供真实账号、口令、凭据列表或外部目标。",
    recommendedPath: [
      "trust-single-password-result",
      "accept-without-challenge",
    ],
  },
  fixed: {
    key: "fixed",
    title: "凭据填充防御复盘版",
    badge: "跨请求风险关联 + 自适应挑战",
    perspective: "防御方复盘",
    explanation:
      "本页从防御方视角复盘同一固定案例：建立跨请求关联后，既可阻断高风险登录批次，也能在自适应挑战通过后放行正常登录。",
    expectedSignal:
      "防御阻断路径出现 auth-credential-stuffing-defense-blocked，正常登录路径出现 auth-credential-stuffing-normal-verified。",
    expectedOutcome: "对比防御阻断路径与自适应挑战通过后正常登录路径的固定判定差异。",
    panelIntro:
      "修复版强调服务端固定决策状态机、事件日志安全摘要和防御信号，前端按钮只用于引导学习流程。",
    recommendedPath: [
      "enable-cross-request-correlation",
      "defense-blocks-risky-batch",
    ],
  },
};

// 修复版正常流程路径：建立风险关联后，自适应挑战通过放行正常登录，验证修复后业务仍可继续。
export const credentialStuffingNormalPath = [
  "enable-cross-request-correlation",
  "allow-verified-legitimate-login",
];

export const credentialStuffingReviewChecklist = [
  {
    key: "fixed-decisions",
    title: "决策只能来自固定选项",
    description:
      "页面不提供真实账号、口令、凭据列表或外部目标，所有决策都来自本实验固定 optionKey。",
  },
  {
    key: "risk-correlation",
    title: "认证应建立跨请求风险关联",
    description:
      "在单次口令结果之外关联设备指纹、速率和泄露凭据信号，识别分布式批量登录。",
  },
  {
    key: "adaptive-defense",
    title: "高风险批次应触发自适应挑战",
    description:
      "对高风险登录施加速率限制、自适应验证或阻断，同时让正常用户完成挑战后继续。",
  },
  {
    key: "log-summary",
    title: "日志只记录脱敏摘要",
    description:
      "事件日志只记录固定案例 key、决策路径信号和结果计数，不记录真实账号或口令。",
  },
];

export function getCredentialStuffingVariantConfig(
  variant: CredentialStuffingVariantKey,
) {
  return credentialStuffingVariantConfigs[variant];
}

export function formatCredentialStuffingSignal(signal: string) {
  const labels: Record<string, string> = {
    "auth-credential-stuffing-risk-accepted": "批量登录被接受（漏洞路径）",
    "auth-credential-stuffing-defense-blocked": "防御阻断高风险登录批次",
    "auth-credential-stuffing-normal-verified": "自适应挑战通过后正常登录",
    "auth-credential-stuffing-correlation-open": "只判断单次口令结果",
    "auth-credential-stuffing-correlation-enabled": "跨请求风险关联已建立",
    "auth-credential-stuffing-boundary-blocked": "未登记输入被脱敏阻断",
  };

  return labels[signal] ?? signal;
}

export function createCredentialStuffingLearningProgress(
  config: CredentialStuffingVariantConfig,
): CredentialStuffingLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createCredentialStuffingVerificationRecord(
  config: CredentialStuffingVariantConfig,
  result: CredentialStuffingResult,
): CredentialStuffingVerificationRecordInput {
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

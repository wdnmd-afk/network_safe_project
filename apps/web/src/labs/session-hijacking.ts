import type {
  SessionHijackingResult,
  SessionHijackingVariantKey,
} from "../api/session-hijacking-lab";

export type { SessionHijackingVariantKey };

export type SessionHijackingVariantConfig = {
  key: SessionHijackingVariantKey;
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

export type SessionHijackingLearningProgressInput = {
  variantKey: SessionHijackingVariantKey;
  status: "in-progress";
  notes: string;
};

export type SessionHijackingVerificationRecordInput = {
  variantKey: SessionHijackingVariantKey;
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

export const sessionHijackingScenarioKey = "replayed-session-summary";

const sessionHijackingVariantConfigs: Record<
  SessionHijackingVariantKey,
  SessionHijackingVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "会话劫持风险观察版",
    badge: "长期有效会话 + 无上下文绑定",
    perspective: "攻击方观察",
    explanation:
      "本页从攻击方视角走两步决策：先信任长期有效会话，再直接接受被复用会话，观察异地会话摘要如何被冒用。",
    expectedSignal:
      "沿风险路径完成后应出现 auth-session-hijacking-risk-accepted 学习信号。",
    expectedOutcome: "完成上下文绑定与会话处置两步固定决策，观察被复用会话被接受。",
    panelIntro:
      "工作台只提供共享目录中声明的固定决策选项，不提供真实会话标识、Cookie、token 或外部目标。",
    recommendedPath: [
      "trust-long-lived-session",
      "accept-replayed-session",
    ],
  },
  fixed: {
    key: "fixed",
    title: "会话劫持防御复盘版",
    badge: "会话轮换 + 上下文绑定 + 再认证",
    perspective: "防御方复盘",
    explanation:
      "本页从防御方视角复盘同一固定案例：绑定设备上下文并启用会话轮换后，既可阻断被复用会话，也能在再认证通过后放行正常会话。",
    expectedSignal:
      "防御拦截路径出现 auth-session-hijacking-defense-blocked，正常会话路径出现 auth-session-hijacking-normal-verified。",
    expectedOutcome: "对比防御拦截路径与再认证正常会话路径的固定判定差异。",
    panelIntro:
      "修复版强调服务端固定决策状态机、事件日志安全摘要和防御信号，前端按钮只用于引导学习流程。",
    recommendedPath: [
      "bind-session-context",
      "defense-blocks-replayed-session",
    ],
  },
};

// 修复版正常流程路径：绑定上下文后在高风险动作再认证通过后放行，验证修复后业务仍可继续。
export const sessionHijackingNormalPath = [
  "bind-session-context",
  "allow-reauthenticated-session",
];

export const sessionHijackingReviewChecklist = [
  {
    key: "fixed-decisions",
    title: "决策只能来自固定选项",
    description:
      "页面不提供真实会话标识、Cookie、token 或外部目标，所有决策都来自本实验固定 optionKey。",
  },
  {
    key: "context-binding",
    title: "会话应绑定设备上下文并轮换",
    description:
      "绑定设备上下文并启用会话轮换后，异地复用的会话摘要不再被直接信任。",
  },
  {
    key: "reauth-defense",
    title: "高风险动作应要求再认证",
    description:
      "敏感或高风险动作必须触发再认证，避免被复用的会话直接完成关键操作。",
  },
  {
    key: "log-summary",
    title: "日志只记录脱敏摘要",
    description:
      "事件日志只记录固定案例 key、决策路径信号和结果计数，不记录真实会话标识或原始输入。",
  },
];

export function getSessionHijackingVariantConfig(
  variant: SessionHijackingVariantKey,
) {
  return sessionHijackingVariantConfigs[variant];
}

export function formatSessionHijackingSignal(signal: string) {
  const labels: Record<string, string> = {
    "auth-session-hijacking-risk-accepted": "被复用会话被接受（漏洞路径）",
    "auth-session-hijacking-defense-blocked": "防御阻断被复用会话",
    "auth-session-hijacking-normal-verified": "再认证正常会话流程通过",
    "auth-session-hijacking-context-open": "会话未绑定上下文",
    "auth-session-hijacking-context-bound": "会话上下文已绑定",
    "auth-session-hijacking-boundary-blocked": "未登记输入被脱敏阻断",
  };

  return labels[signal] ?? signal;
}

export function createSessionHijackingLearningProgress(
  config: SessionHijackingVariantConfig,
): SessionHijackingLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createSessionHijackingVerificationRecord(
  config: SessionHijackingVariantConfig,
  result: SessionHijackingResult,
): SessionHijackingVerificationRecordInput {
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

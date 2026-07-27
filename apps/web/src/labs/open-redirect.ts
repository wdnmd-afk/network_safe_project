import type {
  OpenRedirectResult,
  OpenRedirectVariantKey,
} from "../api/open-redirect-lab";

export type { OpenRedirectVariantKey };

export type OpenRedirectVariantConfig = {
  key: OpenRedirectVariantKey;
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

export type OpenRedirectLearningProgressInput = {
  variantKey: OpenRedirectVariantKey;
  status: "in-progress";
  notes: string;
};

export type OpenRedirectVerificationRecordInput = {
  variantKey: OpenRedirectVariantKey;
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

export const openRedirectScenarioKey = "untrusted-return-target";

const openRedirectVariantConfigs: Record<
  OpenRedirectVariantKey,
  OpenRedirectVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "开放重定向风险观察版",
    badge: "直接信任外部输入目标 + 未校验重定向",
    perspective: "攻击方观察",
    explanation:
      "本页从攻击方视角走两步决策：先直接信任外部输入的跳转目标，再未校验直接重定向，观察任意跳转如何被接受。",
    expectedSignal:
      "沿风险路径完成后应出现 web-open-redirect-risk-accepted 学习信号。",
    expectedOutcome: "完成目标来源与重定向两步固定决策，观察任意跳转被接受。",
    panelIntro:
      "工作台只提供共享目录中声明的固定决策选项，不提供真实跳转地址、外部 URL 或页面正文。",
    recommendedPath: [
      "trust-user-supplied-target",
      "redirect-without-validation",
    ],
  },
  fixed: {
    key: "fixed",
    title: "开放重定向防御复盘版",
    badge: "站内相对路径约束 + 目标允许列表",
    perspective: "防御方复盘",
    explanation:
      "本页从防御方视角复盘同一固定案例：启用允许列表与规范化后，既可拦截未受信任跳转，也能在校验后放行站内相对路径。",
    expectedSignal:
      "防御拦截路径出现 web-open-redirect-defense-blocked，正常跳转路径出现 web-open-redirect-normal-verified。",
    expectedOutcome: "对比防御拦截路径与站内正常跳转路径的固定判定差异。",
    panelIntro:
      "修复版强调服务端固定决策状态机、事件日志安全摘要和防御信号，前端按钮只用于引导学习流程。",
    recommendedPath: [
      "enforce-target-allowlist",
      "defense-blocks-untrusted-redirect",
    ],
  },
};

// 修复版正常流程路径：启用允许列表后重定向到已校验站内相对路径，验证修复后业务仍可继续。
export const openRedirectNormalPath = [
  "enforce-target-allowlist",
  "redirect-to-verified-relative-path",
];

export const openRedirectReviewChecklist = [
  {
    key: "fixed-decisions",
    title: "决策只能来自固定选项",
    description:
      "页面不提供真实跳转地址、外部 URL 或页面正文，所有决策都来自本实验固定 optionKey。",
  },
  {
    key: "target-hardening",
    title: "跳转目标应受允许列表约束",
    description:
      "启用站内相对路径约束与目标允许列表后，外部输入控制的目标不再被直接信任。",
  },
  {
    key: "redirect-safety",
    title: "重定向应先规范化再校验",
    description:
      "跳转前必须规范化并核对允许列表，避免多级跳转掩盖外部目标。",
  },
  {
    key: "log-summary",
    title: "日志只记录脱敏摘要",
    description:
      "事件日志只记录固定案例 key、决策路径信号和结果计数，不记录真实目标或原始输入。",
  },
];

export function getOpenRedirectVariantConfig(variant: OpenRedirectVariantKey) {
  return openRedirectVariantConfigs[variant];
}

export function formatOpenRedirectSignal(signal: string) {
  const labels: Record<string, string> = {
    "web-open-redirect-risk-accepted": "任意跳转被接受（漏洞路径）",
    "web-open-redirect-defense-blocked": "防御拦截未受信任跳转",
    "web-open-redirect-normal-verified": "站内正常跳转流程通过",
    "web-open-redirect-target-open": "目标信任外部输入",
    "web-open-redirect-target-restricted": "目标来源已受限",
    "web-open-redirect-boundary-blocked": "未登记输入被脱敏阻断",
  };

  return labels[signal] ?? signal;
}

export function createOpenRedirectLearningProgress(
  config: OpenRedirectVariantConfig,
): OpenRedirectLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createOpenRedirectVerificationRecord(
  config: OpenRedirectVariantConfig,
  result: OpenRedirectResult,
): OpenRedirectVerificationRecordInput {
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

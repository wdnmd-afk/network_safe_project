import type {
  ClickjackingResult,
  ClickjackingVariantKey,
} from "../api/clickjacking-lab";

export type { ClickjackingVariantKey };

export type ClickjackingVariantConfig = {
  key: ClickjackingVariantKey;
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

export type ClickjackingLearningProgressInput = {
  variantKey: ClickjackingVariantKey;
  status: "in-progress";
  notes: string;
};

export type ClickjackingVerificationRecordInput = {
  variantKey: ClickjackingVariantKey;
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

export const clickjackingScenarioKey = "embedded-approval-overlay";

const clickjackingVariantConfigs: Record<
  ClickjackingVariantKey,
  ClickjackingVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "点击劫持风险观察版",
    badge: "任意来源嵌入 + 敏感动作缺少二次确认",
    perspective: "攻击方观察",
    explanation:
      "本页从攻击方视角走两步决策：先允许任意来源框架嵌入，再无二次确认直接执行敏感动作，观察被劫持点击如何被接受。",
    expectedSignal:
      "沿风险路径完成后应出现 web-clickjacking-risk-accepted 学习信号。",
    expectedOutcome: "完成框架策略与敏感动作两步固定决策，观察风险被接受。",
    panelIntro:
      "工作台只提供共享目录中声明的固定决策选项，不提供真实框架地址、页面正文或外部目标。",
    recommendedPath: [
      "allow-any-origin-framing",
      "execute-without-confirmation",
    ],
  },
  fixed: {
    key: "fixed",
    title: "点击劫持防御复盘版",
    badge: "CSP frame-ancestors + 敏感动作确认",
    perspective: "防御方复盘",
    explanation:
      "本页从防御方视角复盘同一固定案例：启用防嵌入策略后，既可拦截被劫持动作，也能在明确确认后放行正常审批。",
    expectedSignal:
      "防御拦截路径出现 web-clickjacking-defense-blocked，正常确认路径出现 web-clickjacking-normal-verified。",
    expectedOutcome: "对比防御拦截路径与正常确认路径的固定判定差异。",
    panelIntro:
      "修复版强调服务端固定决策状态机、事件日志安全摘要和防御信号，前端按钮只用于引导学习流程。",
    recommendedPath: [
      "enforce-frame-ancestors",
      "defense-intercepts-clickjacked-action",
    ],
  },
};

// 修复版正常流程路径：启用防嵌入策略后要求明确确认，验证修复后业务仍可继续。
export const clickjackingNormalPath = [
  "enforce-frame-ancestors",
  "require-explicit-confirmation",
];

export const clickjackingReviewChecklist = [
  {
    key: "fixed-decisions",
    title: "决策只能来自固定选项",
    description:
      "页面不提供真实框架地址、页面正文、审批金额或外部目标，所有决策都来自本实验固定 optionKey。",
  },
  {
    key: "frame-hardening",
    title: "页面应限制被任意来源嵌入",
    description:
      "启用 CSP frame-ancestors 与 X-Frame-Options 后，页面不再被任意来源嵌入，透明覆盖点击被阻断。",
  },
  {
    key: "intent-confirmation",
    title: "敏感动作应要求明确确认",
    description:
      "不可逆敏感动作必须要求明确的用户确认，避免一次被劫持的点击直接触发。",
  },
  {
    key: "log-summary",
    title: "日志只记录脱敏摘要",
    description:
      "事件日志只记录固定案例 key、决策路径信号和结果计数，不记录真实目标或原始输入。",
  },
];

export function getClickjackingVariantConfig(variant: ClickjackingVariantKey) {
  return clickjackingVariantConfigs[variant];
}

export function formatClickjackingSignal(signal: string) {
  const labels: Record<string, string> = {
    "web-clickjacking-risk-accepted": "风险被接受（漏洞路径）",
    "web-clickjacking-defense-blocked": "防御拦截被劫持动作",
    "web-clickjacking-normal-verified": "正常确认流程通过",
    "web-clickjacking-frame-open": "框架允许任意来源嵌入",
    "web-clickjacking-frame-restricted": "框架嵌入已受限",
    "web-clickjacking-boundary-blocked": "未登记输入被脱敏阻断",
  };

  return labels[signal] ?? signal;
}

export function createClickjackingLearningProgress(
  config: ClickjackingVariantConfig,
): ClickjackingLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createClickjackingVerificationRecord(
  config: ClickjackingVariantConfig,
  result: ClickjackingResult,
): ClickjackingVerificationRecordInput {
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

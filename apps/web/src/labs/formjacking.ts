import type {
  FormjackingResult,
  FormjackingVariantKey,
} from "../api/formjacking-lab";

export type { FormjackingVariantKey };

export type FormjackingVariantConfig = {
  key: FormjackingVariantKey;
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

export type FormjackingLearningProgressInput = {
  variantKey: FormjackingVariantKey;
  status: "in-progress";
  notes: string;
};

export type FormjackingVerificationRecordInput = {
  variantKey: FormjackingVariantKey;
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

export const formjackingScenarioKey = "synthetic-checkout-target-change";

const formjackingVariantConfigs: Record<
  FormjackingVariantKey,
  FormjackingVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "Formjacking 风险观察版",
    badge: "未受约束第三方脚本 + 被篡改提交目标",
    perspective: "攻击方观察",
    explanation:
      "本页从攻击方视角走两步决策：先信任未受约束的第三方脚本，再提交到被篡改目标，观察结账表单如何被劫持。",
    expectedSignal:
      "沿风险路径完成后应出现 client-formjacking-risk-accepted 学习信号。",
    expectedOutcome:
      "完成脚本信任与表单目标两步固定决策，观察被篡改提交被接受。",
    panelIntro:
      "工作台只提供共享目录中声明的固定决策选项，不注入真实页面、不采集表单内容或提交目标。",
    recommendedPath: [
      "trust-unrestricted-scripts",
      "submit-to-tampered-target",
    ],
  },
  fixed: {
    key: "fixed",
    title: "Formjacking 防御复盘版",
    badge: "CSP + SRI + 提交目标校验",
    perspective: "防御方复盘",
    explanation:
      "本页从防御方视角复盘同一固定案例：启用 CSP、SRI 与脚本清单后，既可拦截被篡改提交目标，也能在校验通过后放行正常结账提交。",
    expectedSignal:
      "防御拦截路径出现 client-formjacking-defense-blocked，正常提交路径出现 client-formjacking-normal-verified。",
    expectedOutcome: "对比防御拦截路径与正常提交路径的固定判定差异。",
    panelIntro:
      "修复版强调服务端固定决策状态机、事件日志安全摘要和防御信号，前端按钮只用于引导学习流程。",
    recommendedPath: [
      "enforce-csp-sri-allowlist",
      "defense-blocks-tampered-target",
    ],
  },
};

// 修复版正常流程路径：启用脚本完整性后提交到已校验第一方目标，验证修复后业务仍可继续。
export const formjackingNormalPath = [
  "enforce-csp-sri-allowlist",
  "submit-to-verified-first-party-target",
];

export const formjackingReviewChecklist = [
  {
    key: "fixed-decisions",
    title: "决策只能来自固定选项",
    description:
      "页面不注入真实脚本、不采集表单内容或提交目标，所有决策都来自本实验固定 optionKey。",
  },
  {
    key: "script-integrity",
    title: "第三方脚本应受完整性约束",
    description:
      "敏感页面必须通过 CSP、SRI 与脚本清单约束第三方脚本，避免运行时改写表单。",
  },
  {
    key: "form-target-defense",
    title: "被篡改提交目标应被拦截",
    description:
      "提交目标被改写时必须阻断，只有校验为已登记的第一方目标才放行正常提交。",
  },
  {
    key: "log-summary",
    title: "日志只记录脱敏摘要",
    description:
      "事件日志只记录固定案例 key、决策路径信号和结果计数，不记录真实表单字段或提交目标。",
  },
];

export function getFormjackingVariantConfig(variant: FormjackingVariantKey) {
  return formjackingVariantConfigs[variant];
}

export function formatFormjackingSignal(signal: string) {
  const labels: Record<string, string> = {
    "client-formjacking-risk-accepted": "被篡改提交被接受（漏洞路径）",
    "client-formjacking-defense-blocked": "防御拦截被篡改提交目标",
    "client-formjacking-normal-verified": "正常结账提交通过",
    "client-formjacking-script-open": "第三方脚本未受约束",
    "client-formjacking-script-restricted": "脚本完整性约束已启用",
    "client-formjacking-boundary-blocked": "未登记输入被脱敏阻断",
  };

  return labels[signal] ?? signal;
}

export function createFormjackingLearningProgress(
  config: FormjackingVariantConfig,
): FormjackingLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createFormjackingVerificationRecord(
  config: FormjackingVariantConfig,
  result: FormjackingResult,
): FormjackingVerificationRecordInput {
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

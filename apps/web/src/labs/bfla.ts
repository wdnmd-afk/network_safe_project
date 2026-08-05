import type { BflaResult, BflaVariantKey } from "../api/bfla-lab";

export type { BflaVariantKey };

export type BflaVariantConfig = {
  key: BflaVariantKey;
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

export type BflaLearningProgressInput = {
  variantKey: BflaVariantKey;
  status: "in-progress";
  notes: string;
};

export type BflaVerificationRecordInput = {
  variantKey: BflaVariantKey;
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

export const bflaScenarioKey = "admin-only-operation-request";

const bflaVariantConfigs: Record<BflaVariantKey, BflaVariantConfig> = {
  vuln: {
    key: "vuln",
    title: "API 功能级授权风险观察版",
    badge: "仅前端隐藏 + 服务端缺少功能级授权",
    perspective: "攻击方观察",
    explanation:
      "本页从攻击方视角走两步决策：先只在前端隐藏管理入口，再直接执行管理操作，观察普通用户如何越权调用管理接口。",
    expectedSignal:
      "沿风险路径完成后应出现 api-functional-authorization-risk-accepted 学习信号。",
    expectedOutcome:
      "完成身份校验与操作处置两步固定决策，观察越权管理操作被接受。",
    panelIntro:
      "工作台只提供共享目录中声明的固定决策选项，不提供真实账户、角色、权限或管理接口参数。",
    recommendedPath: ["frontend-only-hidden", "execute-privileged-operation"],
  },
  fixed: {
    key: "fixed",
    title: "API 功能级授权防御复盘版",
    badge: "服务端功能级授权 + 最小权限 + 审计",
    perspective: "防御方复盘",
    explanation:
      "本页从防御方视角复盘同一固定案例：启用服务端功能级授权校验后，既可拦截越权管理操作，也能在身份校验通过后放行正常管理操作。",
    expectedSignal:
      "防御拦截路径出现 api-functional-authorization-defense-blocked，正常管理路径出现 api-functional-authorization-normal-verified。",
    expectedOutcome: "对比防御拦截路径与正常管理操作路径的固定判定差异。",
    panelIntro:
      "修复版强调服务端固定决策状态机、事件日志安全摘要和防御信号，前端按钮只用于引导学习流程。",
    recommendedPath: [
      "enforce-server-side-authorization",
      "defense-blocks-privileged-operation",
    ],
  },
};

// 修复版正常流程路径：启用服务端功能级授权后放行已校验管理员操作，验证修复后业务仍可继续。
export const bflaNormalPath = [
  "enforce-server-side-authorization",
  "allow-verified-admin-operation",
];

export const bflaReviewChecklist = [
  {
    key: "fixed-decisions",
    title: "决策只能来自固定选项",
    description:
      "页面不提供真实账户、角色、权限或管理接口参数，所有决策都来自本实验固定 optionKey。",
  },
  {
    key: "server-side-authorization",
    title: "功能级授权必须在服务端校验",
    description:
      "敏感操作不能只靠前端隐藏，服务端必须按角色和权限矩阵校验每个管理接口。",
  },
  {
    key: "least-privilege",
    title: "越权操作应被阻断",
    description:
      "普通用户请求管理操作必须被拒绝，只有身份和权限校验通过才放行正常管理操作。",
  },
  {
    key: "log-summary",
    title: "日志只记录脱敏摘要",
    description:
      "事件日志只记录固定案例 key、决策路径信号和结果计数，不记录真实账户、角色或原始输入。",
  },
];

export function getBflaVariantConfig(variant: BflaVariantKey) {
  return bflaVariantConfigs[variant];
}

export function formatBflaSignal(signal: string) {
  const labels: Record<string, string> = {
    "api-functional-authorization-risk-accepted": "越权管理操作被接受（漏洞路径）",
    "api-functional-authorization-defense-blocked": "防御拦截越权管理操作",
    "api-functional-authorization-normal-verified": "正常管理操作流程通过",
    "api-functional-authorization-control-open": "功能级授权仅前端隐藏",
    "api-functional-authorization-control-enforced": "服务端功能级授权已启用",
    "api-functional-authorization-boundary-blocked": "未登记输入被脱敏阻断",
  };

  return labels[signal] ?? signal;
}

export function createBflaLearningProgress(
  config: BflaVariantConfig,
): BflaLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createBflaVerificationRecord(
  config: BflaVariantConfig,
  result: BflaResult,
): BflaVerificationRecordInput {
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

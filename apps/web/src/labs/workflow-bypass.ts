import type {
  WorkflowBypassResult,
  WorkflowBypassVariantKey,
} from "../api/workflow-bypass-lab";

export type { WorkflowBypassVariantKey };

export type WorkflowBypassVariantConfig = {
  key: WorkflowBypassVariantKey;
  title: string;
  badge: string;
  perspective: string;
  explanation: string;
  expectedSignal: string;
  expectedOutcome: string;
  panelIntro: string;
  // 推荐路径只包含服务端已注册的固定 optionKey，不接受订单或阶段自由输入。
  recommendedPath: string[];
};

export type WorkflowBypassLearningProgressInput = {
  variantKey: WorkflowBypassVariantKey;
  status: "in-progress";
  notes: string;
};

export type WorkflowBypassVerificationRecordInput = {
  variantKey: WorkflowBypassVariantKey;
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

export const workflowBypassScenarioKey = "pending-order-shipping-request";

const workflowBypassVariantConfigs: Record<
  WorkflowBypassVariantKey,
  WorkflowBypassVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "业务流程跳步风险观察版",
    badge: "信任客户端阶段 + 缺少服务端顺序校验",
    perspective: "攻击方观察",
    explanation:
      "本页从攻击方视角走两步决策：先让服务端信任客户端目标阶段，再把待支付订单直接推进到发货，观察流程跳步风险。",
    expectedSignal:
      "沿风险路径完成后应出现 business-logic-workflow-bypass-risk-accepted 学习信号。",
    expectedOutcome:
      "完成阶段顺序策略与迁移处置两步固定决策，观察 pending -> shipping 乱序迁移被接受。",
    panelIntro:
      "工作台只提供固定订单场景和固定决策按钮，不接受订单 ID、目标阶段、金额、用户或支付信息。",
    recommendedPath: ["trust-client-stage-request", "ship-pending-order"],
  },
  fixed: {
    key: "fixed",
    title: "业务流程跳步防御复盘版",
    badge: "服务端状态机 + 阶段顺序约束 + 安全摘要",
    perspective: "防御方复盘",
    explanation:
      "本页从防御方视角复盘同一固定案例：服务端校验 pending -> paid -> shipping 顺序，阻断跳步，同时放行 paid -> shipping 正常迁移。",
    expectedSignal:
      "防御路径出现 business-logic-workflow-bypass-defense-blocked，正常路径出现 business-logic-workflow-bypass-normal-verified。",
    expectedOutcome: "对比乱序迁移阻断与合法订单阶段迁移的固定判定差异。",
    panelIntro:
      "修复版强调服务端固定状态机和事件日志安全摘要，前端按钮只用于引导学习流程。",
    recommendedPath: [
      "enforce-server-side-sequence",
      "block-out-of-order-transition",
    ],
  },
};

// 修复版正常流程：服务端确认订单已支付后，允许进入固定发货阶段。
export const workflowBypassNormalPath = [
  "enforce-server-side-sequence",
  "ship-paid-order",
];

export const workflowBypassReviewChecklist = [
  {
    key: "fixed-decisions",
    title: "决策只能来自固定选项",
    description:
      "页面不提供订单 ID、目标阶段或支付信息，所有决策都来自本实验固定 optionKey。",
  },
  {
    key: "server-side-state-machine",
    title: "阶段顺序必须由服务端校验",
    description:
      "客户端页面顺序不是安全边界，服务端必须根据当前阶段和允许迁移表做判定。",
  },
  {
    key: "normal-flow",
    title: "合法业务流程应保持可用",
    description:
      "修复逻辑阻断 pending -> shipping，同时允许 paid -> shipping，避免把所有迁移一律拒绝。",
  },
  {
    key: "log-summary",
    title: "日志只记录脱敏摘要",
    description:
      "事件日志只记录固定案例 key、决策信号和结果计数，不记录订单、用户、金额或支付信息。",
  },
];

export function getWorkflowBypassVariantConfig(
  variant: WorkflowBypassVariantKey,
) {
  return workflowBypassVariantConfigs[variant];
}

export function formatWorkflowBypassSignal(signal: string) {
  const labels: Record<string, string> = {
    "business-logic-workflow-bypass-risk-accepted":
      "待支付订单直接进入发货（漏洞路径）",
    "business-logic-workflow-bypass-defense-blocked": "防御阻断乱序阶段迁移",
    "business-logic-workflow-bypass-normal-verified": "正常订单阶段迁移通过",
    "business-logic-workflow-bypass-policy-open": "服务端信任客户端目标阶段",
    "business-logic-workflow-bypass-policy-enforced": "服务端阶段顺序校验已启用",
    "business-logic-workflow-bypass-boundary-blocked": "未登记输入被脱敏阻断",
  };

  return labels[signal] ?? signal;
}

export function createWorkflowBypassLearningProgress(
  config: WorkflowBypassVariantConfig,
): WorkflowBypassLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createWorkflowBypassVerificationRecord(
  config: WorkflowBypassVariantConfig,
  result: WorkflowBypassResult,
): WorkflowBypassVerificationRecordInput {
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

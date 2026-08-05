import {
  createGuidedScenarioMachine,
  type GuidedScenarioV2Definition,
} from "@network-safe/shared/guided-scenarios-v2";

export type WorkflowBypassVariantKey = "vuln" | "fixed";

// 三个 canonical 终止信号与 meta.json expectedSignals 保持一致。
export const workflowBypassRiskSignal =
  "business-logic-workflow-bypass-risk-accepted";
export const workflowBypassDefenseSignal =
  "business-logic-workflow-bypass-defense-blocked";
export const workflowBypassNormalSignal =
  "business-logic-workflow-bypass-normal-verified";

export const workflowBypassScenarioKey = "pending-order-shipping-request";

// 专用第二版定义只描述固定订单阶段，不连接真实订单、支付或物流系统。
const workflowBypassDefinition: GuidedScenarioV2Definition = {
  version: 2,
  id: "business-logic.workflow-bypass",
  slug: "workflow-bypass",
  category: "business-logic",
  subcategory: "workflow-bypass",
  title: "业务流程跳步",
  mode: "interactive",
  severity: "high",
  difficulty: "intermediate",
  summary:
    "通过固定待支付订单的两步决策，对比信任客户端目标阶段与服务端校验状态迁移顺序的差异。",
  phase: "phase-1",
  tags: ["business-logic", "workflow", "state-machine"],
  knowledgePoints: ["流程跳步", "服务端状态机", "顺序约束"],
  scoringDimensions: [
    {
      key: "server-side-sequencing",
      title: "服务端顺序校验",
      description: "由服务端根据当前阶段和允许迁移判断订单状态变化。",
      max: 1,
    },
    {
      key: "valid-state-transition",
      title: "合法状态迁移",
      description: "阻断待支付到发货的乱序迁移，同时保留已支付订单的正常流程。",
      max: 1,
    },
  ],
  defaultCaseKey: workflowBypassScenarioKey,
  cases: [
    {
      key: workflowBypassScenarioKey,
      title: "待支付订单请求直接发货",
      description:
        "固定案例展示订单跳过支付阶段直接请求发货的风险，用两步决策观察阶段校验策略和迁移处置。",
      assets: [
        {
          key: "fixed-order-snapshot",
          kind: "asset",
          title: "固定订单快照",
          detail:
            "SM-20260608-1099 / Priority Support Plan / 金额 89 / 测试账户；仅作为静态学习证据。",
        },
      ],
      evidence: [
        {
          key: "pending-stage",
          kind: "evidence",
          title: "当前阶段 pending",
          detail: "固定风险标签：订单仍处于待支付阶段。",
        },
        {
          key: "shipping-request",
          kind: "evidence",
          title: "请求阶段 shipping",
          detail: "固定风险标签：客户端请求直接进入发货阶段。",
        },
        {
          key: "payment-stage-missing",
          kind: "evidence",
          title: "缺少 paid 阶段",
          detail: "固定风险标签：pending -> paid -> shipping 的中间阶段被跳过。",
        },
      ],
      initialStepKey: "sequence-policy",
      steps: [
        {
          key: "sequence-policy",
          order: 1,
          title: "阶段顺序校验策略",
          prompt: "选择该固定订单阶段迁移请求的校验策略。",
          riskSignal: "business-logic-workflow-bypass-sequence-policy",
          options: [
            {
              key: "trust-client-stage-request",
              label: "信任客户端请求的目标阶段（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: "business-logic-workflow-bypass-policy-open",
              explanation:
                "服务端直接信任客户端提交的目标阶段，没有根据当前订单状态校验允许迁移。",
              nextStepKey: "transition-decision",
              scoreDeltas: { "server-side-sequencing": 0 },
            },
            {
              key: "enforce-server-side-sequence",
              label: "启用服务端阶段顺序校验",
              outcome: "fix",
              decision: "blocked",
              signal: "business-logic-workflow-bypass-policy-enforced",
              explanation:
                "服务端根据固定当前阶段和允许迁移表识别出 pending 不能直接进入 shipping。",
              nextStepKey: "transition-decision",
              scoreDeltas: { "server-side-sequencing": 1 },
            },
          ],
        },
        {
          key: "transition-decision",
          order: 2,
          title: "订单阶段迁移处置",
          prompt: "选择当前校验策略下的固定订单阶段迁移结果。",
          riskSignal: "business-logic-workflow-bypass-transition-decision",
          options: [
            {
              key: "ship-pending-order",
              label: "待支付订单直接进入发货（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: workflowBypassRiskSignal,
              explanation:
                "漏洞版接受 pending -> shipping 乱序迁移，固定订单跳过支付阶段进入发货流程。",
              nextStepKey: null,
              scoreDeltas: { "valid-state-transition": 0 },
            },
            {
              key: "block-out-of-order-transition",
              label: "阻断乱序阶段迁移",
              outcome: "fix",
              decision: "blocked",
              signal: workflowBypassDefenseSignal,
              explanation:
                "修复版通过服务端状态机阻断 pending -> shipping 乱序迁移，并记录固定防御信号。",
              nextStepKey: null,
              scoreDeltas: { "valid-state-transition": 1 },
            },
            {
              key: "ship-paid-order",
              label: "已支付订单正常进入发货",
              outcome: "normal",
              decision: "accepted",
              signal: workflowBypassNormalSignal,
              explanation:
                "修复版确认 paid -> shipping 属于允许迁移，固定正常订单流程可以继续。",
              nextStepKey: null,
              scoreDeltas: { "valid-state-transition": 1 },
            },
          ],
        },
      ],
    },
  ],
  safeBoundaries: [
    "只使用固定虚构订单快照和 pending / paid / shipping 阶段枚举。",
    "页面和 API 只接受本实验声明的固定 scenarioKey 与决策 optionKey。",
    "未知 key 会被脱敏阻断，不写入订单、用户、金额、支付信息或外部目标。",
  ],
  notes: "该实验不连接真实订单、支付或物流系统，也不提供可迁移的流程绕过工具。",
};

export type WorkflowBypassWorkbench = {
  id: string;
  slug: string;
  category: string;
  subcategory: string;
  title: string;
  mode: GuidedScenarioV2Definition["mode"];
  severity: GuidedScenarioV2Definition["severity"];
  difficulty: GuidedScenarioV2Definition["difficulty"];
  summary: string;
  defaultScenarioKey: string;
  scoringDimensions: GuidedScenarioV2Definition["scoringDimensions"];
  cases: GuidedScenarioV2Definition["cases"];
  safeBoundaries: string[];
  notes: string;
};

export type WorkflowBypassStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: "risk" | "fix" | "normal";
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type WorkflowBypassEvaluationInput = {
  variantKey: WorkflowBypassVariantKey;
  scenarioKey: string;
  decisions: string[];
};

export type WorkflowBypassEvaluationResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: WorkflowBypassVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: WorkflowBypassStepResult[];
  recap: {
    outcomeCounts: Record<"risk" | "fix" | "normal", number>;
    scores: Record<string, number>;
    terminalOutcome: "risk" | "fix" | "normal" | null;
  };
  assessment: {
    riskLevel: GuidedScenarioV2Definition["severity"];
    stepCount: number;
    matchedScenario: boolean;
  };
  blockedReason?: string;
};

export type WorkflowBypassLabService = {
  getWorkbench(): WorkflowBypassWorkbench;
  evaluate(input: WorkflowBypassEvaluationInput): WorkflowBypassEvaluationResult;
};

function createBlockedResult(input: {
  variantKey: WorkflowBypassVariantKey;
  matchedScenario: boolean;
  blockedReason: string;
}): WorkflowBypassEvaluationResult {
  return {
    status: "blocked",
    labKey: workflowBypassDefinition.id,
    variantKey: input.variantKey,
    scenarioKey: input.matchedScenario
      ? workflowBypassScenarioKey
      : "blocked-scenario",
    decision: "blocked",
    signal: "business-logic-workflow-bypass-boundary-blocked",
    message: "请求中的固定案例或决策未登记，服务未处理也未回显原始输入。",
    nextStep: "只选择工作台返回的固定 scenarioKey 与决策选项。",
    completed: false,
    steps: [],
    recap: {
      outcomeCounts: { risk: 0, fix: 0, normal: 0 },
      scores: {},
      terminalOutcome: null,
    },
    assessment: {
      riskLevel: workflowBypassDefinition.severity,
      stepCount: 0,
      matchedScenario: input.matchedScenario,
    },
    blockedReason: input.blockedReason,
  };
}

function buildNextStep(input: {
  variantKey: WorkflowBypassVariantKey;
  terminalOutcome: "risk" | "fix" | "normal" | null;
}) {
  if (input.variantKey === "vuln") {
    return "切换到修复版并沿用同一固定案例，对比服务端顺序校验如何改变阶段迁移结果。";
  }

  if (input.terminalOutcome === "fix") {
    return "复盘乱序迁移阻断信号后，选择“已支付订单正常进入发货”验证修复后的正常流程。";
  }

  return "在实验事件日志中确认固定 key、决策路径和学习信号已形成安全摘要。";
}

export function createWorkflowBypassLabService(): WorkflowBypassLabService {
  return {
    getWorkbench() {
      return {
        id: workflowBypassDefinition.id,
        slug: workflowBypassDefinition.slug,
        category: workflowBypassDefinition.category,
        subcategory: workflowBypassDefinition.subcategory,
        title: workflowBypassDefinition.title,
        mode: workflowBypassDefinition.mode,
        severity: workflowBypassDefinition.severity,
        difficulty: workflowBypassDefinition.difficulty,
        summary: workflowBypassDefinition.summary,
        defaultScenarioKey: workflowBypassDefinition.defaultCaseKey,
        scoringDimensions: workflowBypassDefinition.scoringDimensions,
        cases: workflowBypassDefinition.cases,
        safeBoundaries: workflowBypassDefinition.safeBoundaries,
        notes: workflowBypassDefinition.notes,
      };
    },

    evaluate(input) {
      if (input.scenarioKey !== workflowBypassScenarioKey) {
        return createBlockedResult({
          variantKey: input.variantKey,
          matchedScenario: false,
          blockedReason: "scenario-not-allowed",
        });
      }

      if (!Array.isArray(input.decisions) || input.decisions.length === 0) {
        return createBlockedResult({
          variantKey: input.variantKey,
          matchedScenario: true,
          blockedReason: "decisions-required",
        });
      }

      const machine = createGuidedScenarioMachine(
        workflowBypassDefinition,
        workflowBypassScenarioKey,
      );
      const steps: WorkflowBypassStepResult[] = [];

      for (const optionKey of input.decisions) {
        const step = machine.choose(optionKey);

        if (step.status === "blocked") {
          // 未登记决策或完成后继续提交时，统一脱敏阻断且不回显原始输入。
          return createBlockedResult({
            variantKey: input.variantKey,
            matchedScenario: true,
            blockedReason: step.reason,
          });
        }

        steps.push({
          stepKey: step.stepKey,
          optionKey,
          outcome: step.outcome,
          decision: step.decision,
          signal: step.signal,
          explanation: step.explanation,
        });

        if (step.completed) {
          break;
        }
      }

      if (steps.length !== input.decisions.length) {
        // 终止步骤后的多余决策也属于未登记输入，不能被静默忽略。
        return createBlockedResult({
          variantKey: input.variantKey,
          matchedScenario: true,
          blockedReason: "decisions-after-terminal",
        });
      }

      const recap = machine.recap();

      if (!recap.completed) {
        // 未走到终止步骤的路径不产生业务判定，避免部分决策被误认为完成。
        return createBlockedResult({
          variantKey: input.variantKey,
          matchedScenario: true,
          blockedReason: "path-incomplete",
        });
      }

      const terminal = steps[steps.length - 1];

      return {
        status: terminal.decision === "blocked" ? "blocked" : "ok",
        labKey: workflowBypassDefinition.id,
        variantKey: input.variantKey,
        scenarioKey: workflowBypassScenarioKey,
        decision: terminal.decision,
        signal: terminal.signal,
        message: terminal.explanation,
        nextStep: buildNextStep({
          variantKey: input.variantKey,
          terminalOutcome: recap.terminalOutcome,
        }),
        completed: true,
        steps,
        recap: {
          outcomeCounts: recap.outcomeCounts,
          scores: recap.scores,
          terminalOutcome: recap.terminalOutcome,
        },
        assessment: {
          riskLevel: workflowBypassDefinition.severity,
          stepCount: steps.length,
          matchedScenario: true,
        },
        ...(terminal.decision === "blocked"
          ? { blockedReason: "workflow-sequence-enforced" }
          : {}),
      };
    },
  };
}

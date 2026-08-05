import {
  createGuidedScenarioMachine,
  type GuidedScenarioV2Definition,
} from "@network-safe/shared/guided-scenarios-v2";

export type BflaVariantKey = "vuln" | "fixed";

// 三个 canonical 终止信号与 meta.json expectedSignals 保持一致。
export const bflaRiskSignal = "api-functional-authorization-risk-accepted";
export const bflaDefenseSignal = "api-functional-authorization-defense-blocked";
export const bflaNormalSignal = "api-functional-authorization-normal-verified";

export const bflaScenarioKey = "privileged-operation-request";

// 专用第二版定义：两步状态机（身份角色校验策略 -> 操作处置决策），只使用固定虚构选项。
const bflaDefinition: GuidedScenarioV2Definition = {
  version: 2,
  id: "api.functional-authorization",
  slug: "functional-authorization",
  category: "api",
  subcategory: "functional-authorization",
  title: "API 功能级授权",
  mode: "interactive",
  severity: "high",
  difficulty: "intermediate",
  summary:
    "通过固定管理操作请求的两步决策，对比只在前端隐藏管理入口与服务端功能级授权校验的差异。",
  phase: "phase-1",
  tags: ["api", "authorization", "bfla"],
  knowledgePoints: ["功能级授权", "服务端策略校验", "最小权限"],
  scoringDimensions: [
    {
      key: "authorization-enforcement",
      title: "授权落实",
      description: "在服务端按角色和权限矩阵校验功能级授权。",
      max: 1,
    },
    {
      key: "least-privilege",
      title: "最小权限",
      description: "对越权操作阻断，只放行经身份校验的管理操作。",
      max: 1,
    },
  ],
  defaultCaseKey: bflaScenarioKey,
  cases: [
    {
      key: bflaScenarioKey,
      title: "普通用户请求管理操作",
      description:
        "固定虚构案例展示普通用户直接调用管理员专属操作的风险，用两步决策观察身份校验策略和操作处置。",
      assets: [
        {
          key: "operation-catalog",
          kind: "asset",
          title: "固定管理操作枚举",
          detail:
            "被观察的固定管理操作枚举（如查看全量订单、修改他人角色），只含稳定 key，不触达真实业务。",
        },
      ],
      evidence: [
        {
          key: "frontend-only-control",
          kind: "evidence",
          title: "仅前端访问控制",
          detail: "固定风险标签：管理入口只在前端隐藏，服务端未校验功能级授权。",
        },
        {
          key: "role-mismatch",
          kind: "evidence",
          title: "角色不匹配",
          detail: "固定风险标签：普通用户身份发起管理员专属操作。",
        },
        {
          key: "privileged-operation",
          kind: "evidence",
          title: "高权限操作",
          detail: "固定风险标签：目标操作可修改他人数据或角色。",
        },
      ],
      initialStepKey: "role-check",
      steps: [
        {
          key: "role-check",
          order: 1,
          title: "身份角色校验策略",
          prompt: "选择该固定管理操作请求的身份角色校验策略。",
          riskSignal: "api-functional-authorization-role-check",
          options: [
            {
              key: "frontend-only-hidden",
              label: "仅前端隐藏管理入口（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: "api-functional-authorization-control-open",
              explanation:
                "管理操作只在前端隐藏，服务端不校验功能级授权，普通用户可直接调用管理接口。",
              nextStepKey: "operation-decision",
              scoreDeltas: { "authorization-enforcement": 0 },
            },
            {
              key: "enforce-server-side-authorization",
              label: "启用服务端功能级授权校验",
              outcome: "fix",
              decision: "blocked",
              signal: "api-functional-authorization-control-enforced",
              explanation:
                "服务端按角色和权限矩阵校验每个敏感操作后，越权请求被识别并进入处置路径。",
              nextStepKey: "operation-decision",
              scoreDeltas: { "authorization-enforcement": 1 },
            },
          ],
        },
        {
          key: "operation-decision",
          order: 2,
          title: "操作处置决策",
          prompt: "选择当前身份校验策略下的管理操作处置方式。",
          riskSignal: "api-functional-authorization-operation-decision",
          options: [
            {
              key: "execute-privileged-operation",
              label: "直接执行管理操作（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: bflaRiskSignal,
              explanation:
                "漏洞版因管理操作只在前端隐藏、服务端缺少功能级授权校验接受了普通用户的越权操作。",
              nextStepKey: null,
              scoreDeltas: { "least-privilege": 0 },
            },
            {
              key: "defense-blocks-privileged-operation",
              label: "防御阻断越权管理操作",
              outcome: "fix",
              decision: "blocked",
              signal: bflaDefenseSignal,
              explanation:
                "修复版识别到高风险固定案例，并通过服务端功能级授权、最小权限和审计阻断该越权操作。",
              nextStepKey: null,
              scoreDeltas: { "least-privilege": 1 },
            },
            {
              key: "allow-verified-admin-operation",
              label: "身份校验通过后放行管理操作",
              outcome: "normal",
              decision: "accepted",
              signal: bflaNormalSignal,
              explanation:
                "修复版确认服务端功能级授权与最小权限已落实，固定管理员在身份校验通过后可以继续正常管理操作。",
              nextStepKey: null,
              scoreDeltas: { "least-privilege": 1 },
            },
          ],
        },
      ],
    },
  ],
  safeBoundaries: [
    "只使用固定虚构用户与管理操作枚举，不修改真实账户、角色或权限。",
    "页面和 API 只接受本实验声明的固定 scenarioKey 与决策 optionKey。",
    "未知 key 会被脱敏阻断，不写入原始输入或外部目标信息。",
  ],
  notes: "该实验仅提供本机受控固定场景和只读验证，不允许扩展为通用攻击工具。",
};

export type BflaWorkbench = {
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

export type BflaStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: "risk" | "fix" | "normal";
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type BflaEvaluationInput = {
  variantKey: BflaVariantKey;
  scenarioKey: string;
  decisions: string[];
};

export type BflaEvaluationResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: BflaVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: BflaStepResult[];
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

export type BflaLabService = {
  getWorkbench(): BflaWorkbench;
  evaluate(input: BflaEvaluationInput): BflaEvaluationResult;
};

function createBlockedResult(input: {
  variantKey: BflaVariantKey;
  matchedScenario: boolean;
  blockedReason: string;
}): BflaEvaluationResult {
  return {
    status: "blocked",
    labKey: bflaDefinition.id,
    variantKey: input.variantKey,
    scenarioKey: input.matchedScenario ? bflaScenarioKey : "blocked-scenario",
    decision: "blocked",
    signal: "api-functional-authorization-boundary-blocked",
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
      riskLevel: bflaDefinition.severity,
      stepCount: 0,
      matchedScenario: input.matchedScenario,
    },
    blockedReason: input.blockedReason,
  };
}

function buildNextStep(input: {
  variantKey: BflaVariantKey;
  terminalOutcome: "risk" | "fix" | "normal" | null;
}) {
  if (input.variantKey === "vuln") {
    return "切换到修复版并沿用同一固定案例，对比身份校验策略与操作处置如何改变判定。";
  }

  if (input.terminalOutcome === "fix") {
    return "复盘防御拦截信号后，选择“身份校验通过后放行管理操作”验证修复后的正常流程。";
  }

  return "在实验事件日志中确认固定 key、决策路径和学习信号已形成安全摘要。";
}

export function createBflaLabService(): BflaLabService {
  return {
    getWorkbench() {
      return {
        id: bflaDefinition.id,
        slug: bflaDefinition.slug,
        category: bflaDefinition.category,
        subcategory: bflaDefinition.subcategory,
        title: bflaDefinition.title,
        mode: bflaDefinition.mode,
        severity: bflaDefinition.severity,
        difficulty: bflaDefinition.difficulty,
        summary: bflaDefinition.summary,
        defaultScenarioKey: bflaDefinition.defaultCaseKey,
        scoringDimensions: bflaDefinition.scoringDimensions,
        cases: bflaDefinition.cases,
        safeBoundaries: bflaDefinition.safeBoundaries,
        notes: bflaDefinition.notes,
      };
    },

    evaluate(input) {
      if (input.scenarioKey !== bflaScenarioKey) {
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
        bflaDefinition,
        bflaScenarioKey,
      );
      const steps: BflaStepResult[] = [];

      for (const optionKey of input.decisions) {
        const step = machine.choose(optionKey);

        if (step.status === "blocked") {
          // 未登记决策或已完成后继续：脱敏阻断，不回显原始输入。
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

      const recap = machine.recap();

      if (!recap.completed) {
        // 决策路径没有走到终止步骤：视为未完成，阻断以保证判定确定性。
        return createBlockedResult({
          variantKey: input.variantKey,
          matchedScenario: true,
          blockedReason: "path-incomplete",
        });
      }

      const terminal = steps[steps.length - 1];

      return {
        status: terminal.decision === "blocked" ? "blocked" : "ok",
        labKey: bflaDefinition.id,
        variantKey: input.variantKey,
        scenarioKey: bflaScenarioKey,
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
          riskLevel: bflaDefinition.severity,
          stepCount: steps.length,
          matchedScenario: true,
        },
        ...(terminal.decision === "blocked"
          ? { blockedReason: "bfla-defense-applied" }
          : {}),
      };
    },
  };
}

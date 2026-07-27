import {
  createGuidedScenarioMachine,
  type GuidedScenarioV2Definition,
} from "@network-safe/shared/guided-scenarios-v2";

export type SessionHijackingVariantKey = "vuln" | "fixed";

// 三个 canonical 终止信号与既有 meta.json expectedSignals 保持一致，
// 保证 exploit.py、手工验证文档和事件日志向后兼容。
export const sessionHijackingRiskSignal =
  "auth-session-hijacking-risk-accepted";
export const sessionHijackingDefenseSignal =
  "auth-session-hijacking-defense-blocked";
export const sessionHijackingNormalSignal =
  "auth-session-hijacking-normal-verified";

export const sessionHijackingScenarioKey = "replayed-session-summary";

// 专用第二版定义：两步状态机（上下文绑定策略 -> 会话处置决策），只使用固定虚构选项。
const sessionHijackingDefinition: GuidedScenarioV2Definition = {
  version: 2,
  id: "auth.session-hijacking",
  slug: "session-hijacking",
  category: "auth",
  subcategory: "session-hijacking",
  title: "会话劫持",
  mode: "interactive",
  severity: "high",
  difficulty: "intermediate",
  summary:
    "通过固定脱敏会话摘要的两步决策，对比会话标识长期有效与轮换、上下文绑定、高风险动作再认证的差异。",
  phase: "phase-1",
  tags: ["auth", "session", "hijacking"],
  knowledgePoints: ["会话生命周期", "Cookie 安全属性", "上下文绑定"],
  scoringDimensions: [
    {
      key: "context-binding",
      title: "上下文绑定",
      description: "把会话与设备上下文、轮换策略绑定。",
      max: 1,
    },
    {
      key: "reauth-defense",
      title: "再认证防御",
      description: "对高风险会话复用施加阻断或再认证。",
      max: 1,
    },
  ],
  defaultCaseKey: sessionHijackingScenarioKey,
  cases: [
    {
      key: sessionHijackingScenarioKey,
      title: "异地会话摘要复用",
      description:
        "固定脱敏摘要展示同一会话在不一致设备上下文中被重复使用的风险，用两步决策观察上下文绑定策略和会话处置。",
      assets: [
        {
          key: "session-summary",
          kind: "asset",
          title: "固定脱敏会话摘要",
          detail:
            "被观察的固定脱敏会话摘要，只含上下文比对结果，不含真实会话标识、Cookie 或 token。",
        },
      ],
      evidence: [
        {
          key: "session-replay",
          kind: "evidence",
          title: "会话复用",
          detail: "固定风险标签：同一会话标识在多处被重复使用。",
        },
        {
          key: "context-mismatch",
          kind: "evidence",
          title: "上下文不一致",
          detail: "固定风险标签：会话使用的设备与网络上下文与签发时不一致。",
        },
        {
          key: "missing-rotation",
          kind: "evidence",
          title: "缺少轮换",
          detail: "固定风险标签：会话标识长期有效且从不轮换。",
        },
      ],
      initialStepKey: "context-binding",
      steps: [
        {
          key: "context-binding",
          order: 1,
          title: "上下文绑定策略",
          prompt: "选择该固定会话摘要的上下文绑定策略。",
          riskSignal: "auth-session-hijacking-context-binding",
          options: [
            {
              key: "trust-long-lived-session",
              label: "信任长期有效会话（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: "auth-session-hijacking-context-open",
              explanation:
                "会话标识长期有效且不绑定设备上下文，攻击方复用该会话即可冒充用户。",
              nextStepKey: "session-decision",
              scoreDeltas: { "context-binding": 0 },
            },
            {
              key: "bind-session-context",
              label: "绑定设备上下文并启用会话轮换",
              outcome: "fix",
              decision: "blocked",
              signal: "auth-session-hijacking-context-bound",
              explanation:
                "绑定设备上下文并启用会话轮换后，异地复用的会话摘要被识别并进入处置路径。",
              nextStepKey: "session-decision",
              scoreDeltas: { "context-binding": 1 },
            },
          ],
        },
        {
          key: "session-decision",
          order: 2,
          title: "会话处置决策",
          prompt: "选择当前上下文绑定策略下的会话处置方式。",
          riskSignal: "auth-session-hijacking-session-decision",
          options: [
            {
              key: "accept-replayed-session",
              label: "直接接受被复用会话（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: sessionHijackingRiskSignal,
              explanation:
                "漏洞版因会话标识长期有效且没有轮换、设备上下文或高风险动作再验证接受了被复用会话。",
              nextStepKey: null,
              scoreDeltas: { "reauth-defense": 0 },
            },
            {
              key: "defense-blocks-replayed-session",
              label: "防御阻断被复用会话",
              outcome: "fix",
              decision: "blocked",
              signal: sessionHijackingDefenseSignal,
              explanation:
                "修复版识别到高风险固定案例，并通过安全 Cookie、会话轮换、上下文校验和高风险动作再认证阻断该会话。",
              nextStepKey: null,
              scoreDeltas: { "reauth-defense": 1 },
            },
            {
              key: "allow-reauthenticated-session",
              label: "再认证通过后放行正常会话",
              outcome: "normal",
              decision: "accepted",
              signal: sessionHijackingNormalSignal,
              explanation:
                "修复版确认会话轮换与上下文校验已落实，固定正常用户在完成高风险动作再认证后可以继续。",
              nextStepKey: null,
              scoreDeltas: { "reauth-defense": 1 },
            },
          ],
        },
      ],
    },
  ],
  safeBoundaries: [
    "只处理固定虚构身份与会话数据，不读取真实账号、密码、Cookie 或 token。",
    "页面和 API 只接受本实验声明的固定 scenarioKey 与决策 optionKey。",
    "未知 key 会被脱敏阻断，不写入原始输入或外部目标信息。",
  ],
  notes: "该实验仅提供本机受控固定场景和只读验证，不允许扩展为通用攻击工具。",
};

export type SessionHijackingWorkbench = {
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

export type SessionHijackingStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: "risk" | "fix" | "normal";
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type SessionHijackingEvaluationInput = {
  variantKey: SessionHijackingVariantKey;
  scenarioKey: string;
  decisions: string[];
};

export type SessionHijackingEvaluationResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: SessionHijackingVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: SessionHijackingStepResult[];
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

export type SessionHijackingLabService = {
  getWorkbench(): SessionHijackingWorkbench;
  evaluate(
    input: SessionHijackingEvaluationInput,
  ): SessionHijackingEvaluationResult;
};

function createBlockedResult(input: {
  variantKey: SessionHijackingVariantKey;
  matchedScenario: boolean;
  blockedReason: string;
}): SessionHijackingEvaluationResult {
  return {
    status: "blocked",
    labKey: sessionHijackingDefinition.id,
    variantKey: input.variantKey,
    scenarioKey: input.matchedScenario
      ? sessionHijackingScenarioKey
      : "blocked-scenario",
    decision: "blocked",
    signal: "auth-session-hijacking-boundary-blocked",
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
      riskLevel: sessionHijackingDefinition.severity,
      stepCount: 0,
      matchedScenario: input.matchedScenario,
    },
    blockedReason: input.blockedReason,
  };
}

function buildNextStep(input: {
  variantKey: SessionHijackingVariantKey;
  terminalOutcome: "risk" | "fix" | "normal" | null;
}) {
  if (input.variantKey === "vuln") {
    return "切换到修复版并沿用同一固定案例，对比上下文绑定策略与会话处置如何改变判定。";
  }

  if (input.terminalOutcome === "fix") {
    return "复盘防御拦截信号后，选择“再认证通过后放行正常会话”验证修复后的正常流程。";
  }

  return "在实验事件日志中确认固定 key、决策路径和学习信号已形成安全摘要。";
}

export function createSessionHijackingLabService(): SessionHijackingLabService {
  return {
    getWorkbench() {
      return {
        id: sessionHijackingDefinition.id,
        slug: sessionHijackingDefinition.slug,
        category: sessionHijackingDefinition.category,
        subcategory: sessionHijackingDefinition.subcategory,
        title: sessionHijackingDefinition.title,
        mode: sessionHijackingDefinition.mode,
        severity: sessionHijackingDefinition.severity,
        difficulty: sessionHijackingDefinition.difficulty,
        summary: sessionHijackingDefinition.summary,
        defaultScenarioKey: sessionHijackingDefinition.defaultCaseKey,
        scoringDimensions: sessionHijackingDefinition.scoringDimensions,
        cases: sessionHijackingDefinition.cases,
        safeBoundaries: sessionHijackingDefinition.safeBoundaries,
        notes: sessionHijackingDefinition.notes,
      };
    },

    evaluate(input) {
      if (input.scenarioKey !== sessionHijackingScenarioKey) {
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
        sessionHijackingDefinition,
        sessionHijackingScenarioKey,
      );
      const steps: SessionHijackingStepResult[] = [];

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
        labKey: sessionHijackingDefinition.id,
        variantKey: input.variantKey,
        scenarioKey: sessionHijackingScenarioKey,
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
          riskLevel: sessionHijackingDefinition.severity,
          stepCount: steps.length,
          matchedScenario: true,
        },
        ...(terminal.decision === "blocked"
          ? { blockedReason: "session-hijacking-defense-applied" }
          : {}),
      };
    },
  };
}

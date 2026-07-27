import {
  createGuidedScenarioMachine,
  type GuidedScenarioV2Definition,
} from "@network-safe/shared/guided-scenarios-v2";

export type ClickjackingVariantKey = "vuln" | "fixed";

// 三个 canonical 终止信号与既有 meta.json expectedSignals 保持一致，
// 保证 exploit.py、手工验证文档和事件日志向后兼容。
export const clickjackingRiskSignal = "web-clickjacking-risk-accepted";
export const clickjackingDefenseSignal = "web-clickjacking-defense-blocked";
export const clickjackingNormalSignal = "web-clickjacking-normal-verified";

export const clickjackingScenarioKey = "embedded-approval-overlay";

// 专用第二版定义：两步状态机（框架策略 -> 敏感动作确认），只使用固定虚构选项。
const clickjackingDefinition: GuidedScenarioV2Definition = {
  version: 2,
  id: "web.clickjacking",
  slug: "clickjacking",
  category: "web",
  subcategory: "clickjacking",
  title: "点击劫持",
  mode: "interactive",
  severity: "medium",
  difficulty: "beginner",
  summary:
    "通过固定嵌入式审批界面的两步决策，对比缺少框架限制与启用防嵌入策略、敏感动作确认的差异。",
  phase: "phase-1",
  tags: ["web", "clickjacking", "browser-policy"],
  knowledgePoints: [
    "框架嵌入边界",
    "用户意图确认",
    "CSP frame-ancestors",
  ],
  scoringDimensions: [
    {
      key: "frame-hardening",
      title: "框架防护",
      description: "限制页面被任意来源嵌入的能力。",
      max: 1,
    },
    {
      key: "intent-confirmation",
      title: "意图确认",
      description: "敏感动作是否要求明确的用户确认。",
      max: 1,
    },
  ],
  defaultCaseKey: clickjackingScenarioKey,
  cases: [
    {
      key: clickjackingScenarioKey,
      title: "透明覆盖审批按钮",
      description:
        "固定案例展示敏感审批按钮被嵌入并由透明层诱导点击的风险，用两步决策观察框架策略和动作确认。",
      assets: [
        {
          key: "approval-widget",
          kind: "asset",
          title: "固定审批组件",
          detail: "被观察的敏感审批按钮，位于固定教学页面中，不连接真实业务。",
        },
      ],
      evidence: [
        {
          key: "frame-embedding",
          kind: "evidence",
          title: "任意来源框架嵌入",
          detail: "固定风险标签：页面允许被任意来源以 iframe 嵌入。",
        },
        {
          key: "transparent-overlay",
          kind: "evidence",
          title: "透明覆盖层",
          detail: "固定风险标签：透明层诱导用户误点敏感按钮。",
        },
        {
          key: "sensitive-action",
          kind: "evidence",
          title: "敏感审批动作",
          detail: "固定风险标签：一次点击即可触发不可逆敏感动作。",
        },
      ],
      initialStepKey: "frame-policy",
      steps: [
        {
          key: "frame-policy",
          order: 1,
          title: "框架嵌入策略",
          prompt: "选择该固定审批页面的框架嵌入策略。",
          riskSignal: "web-clickjacking-frame-policy",
          options: [
            {
              key: "allow-any-origin-framing",
              label: "允许任意来源嵌入（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: "web-clickjacking-frame-open",
              explanation:
                "页面允许被任意来源以 iframe 嵌入，攻击方可叠加透明层诱导点击。",
              nextStepKey: "sensitive-action",
              scoreDeltas: { "frame-hardening": 0 },
            },
            {
              key: "enforce-frame-ancestors",
              label: "启用 CSP frame-ancestors 与 X-Frame-Options",
              outcome: "fix",
              decision: "blocked",
              signal: "web-clickjacking-frame-restricted",
              explanation:
                "启用防嵌入策略后，页面不再被任意来源嵌入，透明覆盖点击被阻断。",
              nextStepKey: "sensitive-action",
              scoreDeltas: { "frame-hardening": 1 },
            },
          ],
        },
        {
          key: "sensitive-action",
          order: 2,
          title: "敏感动作确认",
          prompt: "选择敏感审批动作在当前框架策略下的处置方式。",
          riskSignal: "web-clickjacking-sensitive-action",
          options: [
            {
              key: "execute-without-confirmation",
              label: "无二次确认直接执行（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: clickjackingRiskSignal,
              explanation:
                "漏洞版因页面允许被任意来源嵌入且敏感动作缺少二次确认接受了被劫持的点击。",
              nextStepKey: null,
              scoreDeltas: { "intent-confirmation": 0 },
            },
            {
              key: "defense-intercepts-clickjacked-action",
              label: "防御拦截被劫持的动作",
              outcome: "fix",
              decision: "blocked",
              signal: clickjackingDefenseSignal,
              explanation:
                "修复版识别到高风险固定案例，并通过 CSP frame-ancestors、X-Frame-Options 和敏感动作确认阻断该动作。",
              nextStepKey: null,
              scoreDeltas: { "intent-confirmation": 1 },
            },
            {
              key: "require-explicit-confirmation",
              label: "要求明确的用户确认后继续",
              outcome: "normal",
              decision: "accepted",
              signal: clickjackingNormalSignal,
              explanation:
                "修复版确认防嵌入策略与敏感动作确认已落实，固定正常审批流程可以继续。",
              nextStepKey: null,
              scoreDeltas: { "intent-confirmation": 1 },
            },
          ],
        },
      ],
    },
  ],
  safeBoundaries: [
    "只处理固定本机 Web 教学场景，不生成可用于外部站点的攻击载荷。",
    "页面和 API 只接受本实验声明的固定 scenarioKey 与决策 optionKey。",
    "未知 key 会被脱敏阻断，不写入原始输入或外部目标信息。",
  ],
  notes: "该实验仅提供本机受控固定场景和只读验证，不允许扩展为通用攻击工具。",
};

export type ClickjackingWorkbench = {
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

export type ClickjackingStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: "risk" | "fix" | "normal";
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type ClickjackingEvaluationInput = {
  variantKey: ClickjackingVariantKey;
  scenarioKey: string;
  decisions: string[];
};

export type ClickjackingEvaluationResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: ClickjackingVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: ClickjackingStepResult[];
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

export type ClickjackingLabService = {
  getWorkbench(): ClickjackingWorkbench;
  evaluate(
    input: ClickjackingEvaluationInput,
  ): ClickjackingEvaluationResult;
};

function createBlockedResult(input: {
  variantKey: ClickjackingVariantKey;
  matchedScenario: boolean;
  blockedReason: string;
}): ClickjackingEvaluationResult {
  return {
    status: "blocked",
    labKey: clickjackingDefinition.id,
    variantKey: input.variantKey,
    scenarioKey: input.matchedScenario ? clickjackingScenarioKey : "blocked-scenario",
    decision: "blocked",
    signal: "web-clickjacking-boundary-blocked",
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
      riskLevel: clickjackingDefinition.severity,
      stepCount: 0,
      matchedScenario: input.matchedScenario,
    },
    blockedReason: input.blockedReason,
  };
}

function buildNextStep(input: {
  variantKey: ClickjackingVariantKey;
  terminalOutcome: "risk" | "fix" | "normal" | null;
}) {
  if (input.variantKey === "vuln") {
    return "切换到修复版并沿用同一固定案例，对比框架策略与动作确认如何改变判定。";
  }

  if (input.terminalOutcome === "fix") {
    return "复盘防御拦截信号后，选择“要求明确的用户确认”验证修复后的正常流程。";
  }

  return "在实验事件日志中确认固定 key、决策路径和学习信号已形成安全摘要。";
}

export function createClickjackingLabService(): ClickjackingLabService {
  return {
    getWorkbench() {
      return {
        id: clickjackingDefinition.id,
        slug: clickjackingDefinition.slug,
        category: clickjackingDefinition.category,
        subcategory: clickjackingDefinition.subcategory,
        title: clickjackingDefinition.title,
        mode: clickjackingDefinition.mode,
        severity: clickjackingDefinition.severity,
        difficulty: clickjackingDefinition.difficulty,
        summary: clickjackingDefinition.summary,
        defaultScenarioKey: clickjackingDefinition.defaultCaseKey,
        scoringDimensions: clickjackingDefinition.scoringDimensions,
        cases: clickjackingDefinition.cases,
        safeBoundaries: clickjackingDefinition.safeBoundaries,
        notes: clickjackingDefinition.notes,
      };
    },

    evaluate(input) {
      if (input.scenarioKey !== clickjackingScenarioKey) {
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
        clickjackingDefinition,
        clickjackingScenarioKey,
      );
      const steps: ClickjackingStepResult[] = [];

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
        labKey: clickjackingDefinition.id,
        variantKey: input.variantKey,
        scenarioKey: clickjackingScenarioKey,
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
          riskLevel: clickjackingDefinition.severity,
          stepCount: steps.length,
          matchedScenario: true,
        },
        ...(terminal.decision === "blocked"
          ? { blockedReason: "clickjacking-defense-applied" }
          : {}),
      };
    },
  };
}

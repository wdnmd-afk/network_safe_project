import {
  createGuidedScenarioMachine,
  type GuidedScenarioV2Definition,
} from "@network-safe/shared/guided-scenarios-v2";

export type FormjackingVariantKey = "vuln" | "fixed";

// 三个 canonical 终止信号与既有 meta.json expectedSignals 保持一致，
// 保证手工验证文档和事件日志向后兼容。
export const formjackingRiskSignal = "client-formjacking-risk-accepted";
export const formjackingDefenseSignal = "client-formjacking-defense-blocked";
export const formjackingNormalSignal = "client-formjacking-normal-verified";

export const formjackingScenarioKey = "synthetic-checkout-target-change";

// 专用第二版定义：两步状态机（脚本信任策略 -> 表单目标决策），只使用固定虚构选项。
const formjackingDefinition: GuidedScenarioV2Definition = {
  version: 2,
  id: "client.formjacking",
  slug: "formjacking",
  category: "client",
  subcategory: "formjacking",
  title: "Formjacking",
  mode: "simulation",
  severity: "critical",
  difficulty: "intermediate",
  summary:
    "通过固定结账页提交摘要的两步决策，对比信任未受约束第三方脚本与启用 CSP、SRI、提交目标校验的差异。",
  phase: "phase-3",
  tags: ["client", "formjacking", "simulation"],
  knowledgePoints: ["第三方脚本", "表单目标", "CSP 与 SRI"],
  scoringDimensions: [
    {
      key: "script-integrity",
      title: "脚本完整性",
      description: "对第三方脚本施加完整性和来源约束。",
      max: 1,
    },
    {
      key: "form-target-defense",
      title: "表单目标防御",
      description: "对被篡改的提交目标施加校验或阻断。",
      max: 1,
    },
  ],
  defaultCaseKey: formjackingScenarioKey,
  cases: [
    {
      key: formjackingScenarioKey,
      title: "虚构结账提交目标变更",
      description:
        "固定摘要展示第三方脚本改变结账页提交目标的风险，用两步决策观察脚本信任策略和表单目标处置，不采集任何真实表单内容。",
      assets: [
        {
          key: "checkout-form",
          kind: "asset",
          title: "固定结账表单摘要",
          detail:
            "被观察的固定结账表单摘要，只含提交目标比对结果，不含真实付款卡号、字段值或用户数据。",
        },
      ],
      evidence: [
        {
          key: "submit-target-change",
          kind: "evidence",
          title: "提交目标变更",
          detail: "固定风险标签：表单提交目标从站内被改写到未知地址。",
        },
        {
          key: "third-party-script",
          kind: "evidence",
          title: "未受约束第三方脚本",
          detail: "固定风险标签：结账页加载了缺少完整性校验的第三方脚本。",
        },
        {
          key: "sensitive-form",
          kind: "evidence",
          title: "敏感表单",
          detail: "固定风险标签：受影响表单收集敏感付款信息。",
        },
      ],
      initialStepKey: "script-trust",
      steps: [
        {
          key: "script-trust",
          order: 1,
          title: "脚本信任策略",
          prompt: "选择该固定结账页对第三方脚本的信任策略。",
          riskSignal: "client-formjacking-script-trust",
          options: [
            {
              key: "trust-unrestricted-scripts",
              label: "信任未受约束第三方脚本（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: "client-formjacking-script-open",
              explanation:
                "结账页信任缺少完整性校验的第三方脚本，攻击方可注入脚本改写表单提交目标。",
              nextStepKey: "form-target-decision",
              scoreDeltas: { "script-integrity": 0 },
            },
            {
              key: "enforce-csp-sri-allowlist",
              label: "启用 CSP、SRI 与脚本清单",
              outcome: "fix",
              decision: "blocked",
              signal: "client-formjacking-script-restricted",
              explanation:
                "启用 CSP、SRI 和脚本清单后，未授权或被篡改的第三方脚本被识别并进入处置路径。",
              nextStepKey: "form-target-decision",
              scoreDeltas: { "script-integrity": 1 },
            },
          ],
        },
        {
          key: "form-target-decision",
          order: 2,
          title: "表单目标决策",
          prompt: "选择当前脚本信任策略下的表单提交目标处置方式。",
          riskSignal: "client-formjacking-form-target-decision",
          options: [
            {
              key: "submit-to-tampered-target",
              label: "提交到被篡改目标（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: formjackingRiskSignal,
              explanation:
                "漏洞版因敏感页面信任未受约束的第三方脚本和提交目标接受了被改写的表单提交目标。",
              nextStepKey: null,
              scoreDeltas: { "form-target-defense": 0 },
            },
            {
              key: "defense-blocks-tampered-target",
              label: "防御阻断被篡改提交目标",
              outcome: "fix",
              decision: "blocked",
              signal: formjackingDefenseSignal,
              explanation:
                "修复版识别到高风险固定案例，并通过 CSP、SRI、脚本清单、提交目标校验和敏感字段隔离阻断该提交。",
              nextStepKey: null,
              scoreDeltas: { "form-target-defense": 1 },
            },
            {
              key: "submit-to-verified-first-party-target",
              label: "提交到已校验的第一方目标",
              outcome: "normal",
              decision: "accepted",
              signal: formjackingNormalSignal,
              explanation:
                "修复版确认脚本完整性与提交目标校验已落实，固定正常结账提交流程可以继续。",
              nextStepKey: null,
              scoreDeltas: { "form-target-defense": 1 },
            },
          ],
        },
      ],
    },
  ],
  safeBoundaries: [
    "只使用固定浏览器行为案例，不注入真实页面、不采集表单数据。",
    "页面和 API 只接受本实验声明的固定 scenarioKey 与决策 optionKey。",
    "未知 key 会被脱敏阻断，不写入原始输入或外部目标信息。",
  ],
  notes: "该实验仅提供本机受控固定场景和只读验证，不允许扩展为通用攻击工具。",
};

export type FormjackingWorkbench = {
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

export type FormjackingStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: "risk" | "fix" | "normal";
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type FormjackingEvaluationInput = {
  variantKey: FormjackingVariantKey;
  scenarioKey: string;
  decisions: string[];
};

export type FormjackingEvaluationResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: FormjackingVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: FormjackingStepResult[];
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

export type FormjackingLabService = {
  getWorkbench(): FormjackingWorkbench;
  evaluate(input: FormjackingEvaluationInput): FormjackingEvaluationResult;
};

function createBlockedResult(input: {
  variantKey: FormjackingVariantKey;
  matchedScenario: boolean;
  blockedReason: string;
}): FormjackingEvaluationResult {
  return {
    status: "blocked",
    labKey: formjackingDefinition.id,
    variantKey: input.variantKey,
    scenarioKey: input.matchedScenario
      ? formjackingScenarioKey
      : "blocked-scenario",
    decision: "blocked",
    signal: "client-formjacking-boundary-blocked",
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
      riskLevel: formjackingDefinition.severity,
      stepCount: 0,
      matchedScenario: input.matchedScenario,
    },
    blockedReason: input.blockedReason,
  };
}

function buildNextStep(input: {
  variantKey: FormjackingVariantKey;
  terminalOutcome: "risk" | "fix" | "normal" | null;
}) {
  if (input.variantKey === "vuln") {
    return "切换到修复版并沿用同一固定案例，对比脚本信任策略与表单目标决策如何改变判定。";
  }

  if (input.terminalOutcome === "fix") {
    return "复盘防御拦截信号后，选择“校验通过后放行站内提交目标”验证修复后的正常流程。";
  }

  return "在实验事件日志中确认固定 key、决策路径和学习信号已形成安全摘要。";
}

export function createFormjackingLabService(): FormjackingLabService {
  return {
    getWorkbench() {
      return {
        id: formjackingDefinition.id,
        slug: formjackingDefinition.slug,
        category: formjackingDefinition.category,
        subcategory: formjackingDefinition.subcategory,
        title: formjackingDefinition.title,
        mode: formjackingDefinition.mode,
        severity: formjackingDefinition.severity,
        difficulty: formjackingDefinition.difficulty,
        summary: formjackingDefinition.summary,
        defaultScenarioKey: formjackingDefinition.defaultCaseKey,
        scoringDimensions: formjackingDefinition.scoringDimensions,
        cases: formjackingDefinition.cases,
        safeBoundaries: formjackingDefinition.safeBoundaries,
        notes: formjackingDefinition.notes,
      };
    },

    evaluate(input) {
      if (input.scenarioKey !== formjackingScenarioKey) {
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
        formjackingDefinition,
        formjackingScenarioKey,
      );
      const steps: FormjackingStepResult[] = [];

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
        labKey: formjackingDefinition.id,
        variantKey: input.variantKey,
        scenarioKey: formjackingScenarioKey,
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
          riskLevel: formjackingDefinition.severity,
          stepCount: steps.length,
          matchedScenario: true,
        },
        ...(terminal.decision === "blocked"
          ? { blockedReason: "formjacking-defense-applied" }
          : {}),
      };
    },
  };
}

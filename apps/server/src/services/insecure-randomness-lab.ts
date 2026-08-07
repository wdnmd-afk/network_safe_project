import {
  createGuidedScenarioMachine,
  type GuidedScenarioV2Definition,
} from "@network-safe/shared/guided-scenarios-v2";

export type InsecureRandomnessVariantKey = "vuln" | "fixed";

// 三个 canonical 终止信号与 meta.json expectedSignals 保持一致。
export const insecureRandomnessRiskSignal =
  "crypto-insecure-randomness-risk-accepted";
export const insecureRandomnessDefenseSignal =
  "crypto-insecure-randomness-defense-blocked";
export const insecureRandomnessNormalSignal =
  "crypto-insecure-randomness-normal-verified";

export const insecureRandomnessScenarioKey =
  "predictable-session-token-sequence";

// 只描述固定预生成摘要，不生成、签发或验证任何真实 token。
const insecureRandomnessDefinition: GuidedScenarioV2Definition = {
  version: 2,
  id: "crypto.insecure-randomness",
  slug: "insecure-randomness",
  category: "crypto",
  subcategory: "insecure-randomness",
  title: "不安全随机数与 token 熵",
  mode: "simulation",
  severity: "high",
  difficulty: "intermediate",
  summary:
    "通过固定 token 模式摘要，对比时间戳/自增序列与操作系统 CSPRNG 策略的可预测性边界。",
  phase: "phase-1",
  tags: ["crypto", "randomness", "token-entropy"],
  knowledgePoints: ["不安全随机数", "token 熵", "CSPRNG 策略"],
  scoringDimensions: [
    {
      key: "entropy-analysis",
      title: "熵与模式分析",
      description: "识别固定时间戳/自增结构中的低熵和单调模式。",
      max: 1,
    },
    {
      key: "secure-random-source",
      title: "安全随机源策略",
      description: "阻断弱随机源并验证固定操作系统 CSPRNG 策略摘要。",
      max: 1,
    },
  ],
  defaultCaseKey: insecureRandomnessScenarioKey,
  cases: [
    {
      key: insecureRandomnessScenarioKey,
      title: "可预测会话 token 序列摘要",
      description:
        "固定案例只展示来源、模式和强度摘要，用两步决策观察低熵识别与随机源处置。",
      assets: [
        {
          key: "weak-sequence-summary",
          kind: "asset",
          title: "固定弱随机摘要",
          detail:
            "source=timestamp-counter；sampleCount=3；entropyClass=low；原始 token 已省略。",
        },
        {
          key: "csprng-policy-summary",
          kind: "policy",
          title: "固定 CSPRNG 策略摘要",
          detail:
            "source=operating-system-csprng；targetStrength=128-bit；只展示不可用指纹。",
        },
      ],
      evidence: [
        {
          key: "monotonic-time-pattern",
          kind: "evidence",
          title: "单调时间模式",
          detail: "固定风险标签：相邻样例按时间顺序递增。",
        },
        {
          key: "incrementing-counter-pattern",
          kind: "evidence",
          title: "自增计数模式",
          detail: "固定风险标签：序列包含连续计数结构。",
        },
        {
          key: "random-material-missing",
          kind: "evidence",
          title: "缺少随机材料",
          detail: "固定风险标签：样例摘要未包含操作系统随机源证据。",
        },
      ],
      initialStepKey: "entropy-assessment",
      steps: [
        {
          key: "entropy-assessment",
          order: 1,
          title: "熵与模式判定",
          prompt: "选择该固定 token 序列摘要的判定策略。",
          riskSignal: "crypto-insecure-randomness-entropy-assessment",
          options: [
            {
              key: "trust-timestamp-counter-pattern",
              label: "把时间戳/自增结构视为不可预测（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: "crypto-insecure-randomness-pattern-trusted",
              explanation:
                "漏洞路径把结构化时间字段和计数器误当作随机熵，没有识别固定序列中的可预测模式。",
              nextStepKey: "random-source-decision",
              scoreDeltas: { "entropy-analysis": 0 },
            },
            {
              key: "detect-low-entropy-pattern",
              label: "识别低熵与单调模式",
              outcome: "fix",
              decision: "blocked",
              signal: "crypto-insecure-randomness-pattern-detected",
              explanation:
                "修复路径根据固定摘要识别时间戳、自增计数和缺少随机材料的风险。",
              nextStepKey: "random-source-decision",
              scoreDeltas: { "entropy-analysis": 1 },
            },
          ],
        },
        {
          key: "random-source-decision",
          order: 2,
          title: "随机源处置",
          prompt: "选择当前模式判定下的固定随机源处置结果。",
          riskSignal: "crypto-insecure-randomness-source-decision",
          options: [
            {
              key: "keep-predictable-token-source",
              label: "继续使用可预测 token 来源（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: insecureRandomnessRiskSignal,
              explanation:
                "漏洞版继续接受时间戳/自增来源，固定低熵 token 策略被错误放行。",
              nextStepKey: null,
              scoreDeltas: { "secure-random-source": 0 },
            },
            {
              key: "block-weak-token-generation",
              label: "阻断弱随机 token 策略",
              outcome: "fix",
              decision: "blocked",
              signal: insecureRandomnessDefenseSignal,
              explanation:
                "修复版阻断固定弱随机源策略，并要求切换到操作系统 CSPRNG。",
              nextStepKey: null,
              scoreDeltas: { "secure-random-source": 1 },
            },
            {
              key: "verify-csprng-token-policy",
              label: "验证固定 CSPRNG token 策略",
              outcome: "normal",
              decision: "accepted",
              signal: insecureRandomnessNormalSignal,
              explanation:
                "修复版确认固定策略摘要使用操作系统 CSPRNG 和 128-bit 目标强度，正常策略通过。",
              nextStepKey: null,
              scoreDeltas: { "secure-random-source": 1 },
            },
          ],
        },
      ],
    },
  ],
  safeBoundaries: [
    "只使用固定预生成的来源、模式、强度摘要和不可用指纹。",
    "页面和 API 只接受本实验声明的固定 scenarioKey 与决策 optionKey。",
    "未知 key 会被脱敏阻断，不写入 token、secret、seed、时间戳、计数器或用户信息。",
  ],
  notes:
    "该实验不生成、签发、存储或验证真实 token，也不提供序列预测、枚举或爆破能力。",
};

export type InsecureRandomnessWorkbench = {
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

export type InsecureRandomnessStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: "risk" | "fix" | "normal";
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type InsecureRandomnessEvaluationInput = {
  variantKey: InsecureRandomnessVariantKey;
  scenarioKey: string;
  decisions: string[];
};

export type InsecureRandomnessEvaluationResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: InsecureRandomnessVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: InsecureRandomnessStepResult[];
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

export type InsecureRandomnessLabService = {
  getWorkbench(): InsecureRandomnessWorkbench;
  evaluate(
    input: InsecureRandomnessEvaluationInput,
  ): InsecureRandomnessEvaluationResult;
};

function createBlockedResult(input: {
  variantKey: InsecureRandomnessVariantKey;
  matchedScenario: boolean;
  blockedReason: string;
}): InsecureRandomnessEvaluationResult {
  return {
    status: "blocked",
    labKey: insecureRandomnessDefinition.id,
    variantKey: input.variantKey,
    scenarioKey: input.matchedScenario
      ? insecureRandomnessScenarioKey
      : "blocked-scenario",
    decision: "blocked",
    signal: "crypto-insecure-randomness-boundary-blocked",
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
      riskLevel: insecureRandomnessDefinition.severity,
      stepCount: 0,
      matchedScenario: input.matchedScenario,
    },
    blockedReason: input.blockedReason,
  };
}

function buildNextStep(input: {
  variantKey: InsecureRandomnessVariantKey;
  terminalOutcome: "risk" | "fix" | "normal" | null;
}) {
  if (input.variantKey === "vuln") {
    return "切换到修复版并沿用同一固定摘要，对比低熵识别和随机源处置如何改变判定。";
  }

  if (input.terminalOutcome === "fix") {
    return "复盘弱随机源阻断信号后，选择“验证固定 CSPRNG token 策略”确认正常策略。";
  }

  return "在实验事件日志中确认固定 key、决策路径和学习信号已形成安全摘要。";
}

export function createInsecureRandomnessLabService(): InsecureRandomnessLabService {
  return {
    getWorkbench() {
      return {
        id: insecureRandomnessDefinition.id,
        slug: insecureRandomnessDefinition.slug,
        category: insecureRandomnessDefinition.category,
        subcategory: insecureRandomnessDefinition.subcategory,
        title: insecureRandomnessDefinition.title,
        mode: insecureRandomnessDefinition.mode,
        severity: insecureRandomnessDefinition.severity,
        difficulty: insecureRandomnessDefinition.difficulty,
        summary: insecureRandomnessDefinition.summary,
        defaultScenarioKey: insecureRandomnessDefinition.defaultCaseKey,
        scoringDimensions: insecureRandomnessDefinition.scoringDimensions,
        cases: insecureRandomnessDefinition.cases,
        safeBoundaries: insecureRandomnessDefinition.safeBoundaries,
        notes: insecureRandomnessDefinition.notes,
      };
    },

    evaluate(input) {
      if (input.scenarioKey !== insecureRandomnessScenarioKey) {
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
        insecureRandomnessDefinition,
        insecureRandomnessScenarioKey,
      );
      const steps: InsecureRandomnessStepResult[] = [];

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
        return createBlockedResult({
          variantKey: input.variantKey,
          matchedScenario: true,
          blockedReason: "path-incomplete",
        });
      }

      const terminal = steps[steps.length - 1];

      return {
        status: terminal.decision === "blocked" ? "blocked" : "ok",
        labKey: insecureRandomnessDefinition.id,
        variantKey: input.variantKey,
        scenarioKey: insecureRandomnessScenarioKey,
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
          riskLevel: insecureRandomnessDefinition.severity,
          stepCount: steps.length,
          matchedScenario: true,
        },
        ...(terminal.decision === "blocked"
          ? { blockedReason: "weak-random-source-blocked" }
          : {}),
      };
    },
  };
}

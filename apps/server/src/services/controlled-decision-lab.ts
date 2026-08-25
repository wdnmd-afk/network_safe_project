export type ControlledVariantKey = "vuln" | "fixed";
export type ControlledOutcome = "risk" | "fix" | "normal";
export type ControlledDecision = "accepted" | "blocked";

export type ControlledOption = {
  key: string;
  label: string;
  outcome: ControlledOutcome;
  decision: ControlledDecision;
  signal: string;
  explanation: string;
};

export type ControlledStep = {
  key: string;
  order: number;
  title: string;
  prompt: string;
  options: readonly ControlledOption[];
};

export type ControlledDefinition = {
  id: string;
  slug: string;
  category: string;
  subcategory: string;
  title: string;
  mode: "interactive" | "simulation" | "case-study";
  severity: "low" | "medium" | "high" | "critical";
  difficulty: "beginner" | "intermediate" | "advanced";
  summary: string;
  scenarioKey: string;
  caseTitle: string;
  caseDescription: string;
  steps: readonly ControlledStep[];
  evidence: readonly { key: string; title: string; detail: string }[];
  safeBoundaries: readonly string[];
  notes: string;
  signals: {
    risk: string;
    defense: string;
    normal: string;
    boundary: string;
  };
};

export type ControlledStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: ControlledOutcome;
  decision: ControlledDecision;
  signal: string;
  explanation: string;
};

export type ControlledResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: ControlledVariantKey;
  scenarioKey: string;
  decision: ControlledDecision;
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: ControlledStepResult[];
  recap: {
    outcomeCounts: Record<ControlledOutcome, number>;
    terminalOutcome: ControlledOutcome | null;
  };
  assessment: {
    riskLevel: ControlledDefinition["severity"];
    stepCount: number;
    matchedScenario: boolean;
  };
  blockedReason?: string;
};

export type ControlledWorkbench = {
  id: string;
  slug: string;
  category: string;
  subcategory: string;
  title: string;
  mode: ControlledDefinition["mode"];
  severity: ControlledDefinition["severity"];
  difficulty: ControlledDefinition["difficulty"];
  summary: string;
  defaultScenarioKey: string;
  cases: readonly [
    {
      key: string;
      title: string;
      description: string;
      evidence: readonly { key: string; title: string; detail: string }[];
      steps: readonly ControlledStep[];
    },
  ];
  safeBoundaries: readonly string[];
  notes: string;
};

function blockedResult(
  definition: ControlledDefinition,
  variantKey: ControlledVariantKey,
  matchedScenario: boolean,
  reason: string,
): ControlledResult {
  return {
    status: "blocked",
    labKey: definition.id,
    variantKey,
    scenarioKey: matchedScenario ? definition.scenarioKey : "blocked-scenario",
    decision: "blocked",
    signal: definition.signals.boundary,
    message: "请求中的固定案例或决策未登记，服务未处理也未回显原始输入。",
    nextStep: "只选择工作台返回的固定 scenarioKey 与决策选项。",
    completed: false,
    steps: [],
    recap: { outcomeCounts: { risk: 0, fix: 0, normal: 0 }, terminalOutcome: null },
    assessment: {
      riskLevel: definition.severity,
      stepCount: 0,
      matchedScenario,
    },
    blockedReason: reason,
  };
}

export function createControlledDecisionLabService(definition: ControlledDefinition) {
  return {
    getWorkbench(): ControlledWorkbench {
      return {
        id: definition.id,
        slug: definition.slug,
        category: definition.category,
        subcategory: definition.subcategory,
        title: definition.title,
        mode: definition.mode,
        severity: definition.severity,
        difficulty: definition.difficulty,
        summary: definition.summary,
        defaultScenarioKey: definition.scenarioKey,
        cases: [
          {
            key: definition.scenarioKey,
            title: definition.caseTitle,
            description: definition.caseDescription,
            evidence: definition.evidence,
            steps: definition.steps,
          },
        ],
        safeBoundaries: definition.safeBoundaries,
        notes: definition.notes,
      };
    },

    evaluate(input: {
      variantKey: ControlledVariantKey;
      scenarioKey: string;
      decisions: string[];
    }): ControlledResult {
      if (input.scenarioKey !== definition.scenarioKey) {
        return blockedResult(definition, input.variantKey, false, "scenario-not-allowed");
      }

      if (!Array.isArray(input.decisions) || input.decisions.length === 0) {
        return blockedResult(definition, input.variantKey, true, "decisions-required");
      }

      if (input.decisions.length !== definition.steps.length) {
        return blockedResult(definition, input.variantKey, true, "path-length-invalid");
      }

      const steps: ControlledStepResult[] = [];

      for (const [index, optionKey] of input.decisions.entries()) {
        const step = definition.steps[index];
        const option = step?.options.find((item) => item.key === optionKey);

        if (!step || !option) {
          return blockedResult(definition, input.variantKey, true, "option-not-allowed");
        }

        steps.push({
          stepKey: step.key,
          optionKey: option.key,
          outcome: option.outcome,
          decision: option.decision,
          signal: option.signal,
          explanation: option.explanation,
        });
      }

      const terminal = steps[steps.length - 1];
      const expectedTerminalSignal = definition.signals[terminal.outcome === "fix" ? "defense" : terminal.outcome];

      if (terminal.signal !== expectedTerminalSignal) {
        return blockedResult(
          definition,
          input.variantKey,
          true,
          "terminal-signal-mismatch",
        );
      }
      const outcomeCounts: Record<ControlledOutcome, number> = {
        risk: 0,
        fix: 0,
        normal: 0,
      };

      for (const step of steps) {
        outcomeCounts[step.outcome] += 1;
      }

      const nextStep =
        terminal.outcome === "risk"
          ? "切换到修复版并沿用同一固定案例，对比控制策略如何改变结果。"
          : terminal.outcome === "fix"
            ? "复盘防御信号后，选择固定正常流程验证修复后业务仍可继续。"
            : "在实验事件日志中确认只记录固定 key、决策路径和安全摘要。";

      return {
        status: terminal.decision === "blocked" ? "blocked" : "ok",
        labKey: definition.id,
        variantKey: input.variantKey,
        scenarioKey: definition.scenarioKey,
        decision: terminal.decision,
        signal: terminal.signal,
        message: terminal.explanation,
        nextStep,
        completed: true,
        steps,
        recap: { outcomeCounts, terminalOutcome: terminal.outcome },
        assessment: {
          riskLevel: definition.severity,
          stepCount: steps.length,
          matchedScenario: true,
        },
        ...(terminal.decision === "blocked" ? { blockedReason: "defense-applied" } : {}),
      };
    },
  };
}

export type ControlledDecisionLabService = ReturnType<
  typeof createControlledDecisionLabService
>;

import {
  getGuidedScenarioByRoute,
  type GuidedScenarioDefinition,
} from "@network-safe/shared/guided-scenarios";

export type GuidedScenarioVariantKey = "vuln" | "fixed";

export type GuidedScenarioEvaluationInput = {
  category: string;
  scene: string;
  variantKey: GuidedScenarioVariantKey;
  scenarioKey: string;
  controlKey: string;
};

export type GuidedScenarioEvaluationResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: GuidedScenarioVariantKey;
  scenarioKey: string;
  controlKey: string;
  scenarioTitle: string;
  controlTitle: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  assessment: {
    matchedScenario: boolean;
    matchedControl: boolean;
    controlApplied: boolean;
    riskLevel: GuidedScenarioDefinition["severity"];
    riskIndicatorCount: number;
    riskIndicators: string[];
    rootCause: string;
  };
  blockedReason?: string;
};

export type GuidedScenarioLabService = {
  getWorkbench(
    category: string,
    scene: string,
  ): GuidedScenarioDefinition | undefined;
  evaluate(
    input: GuidedScenarioEvaluationInput,
  ): GuidedScenarioEvaluationResult | undefined;
};

function createBoundaryResult(input: {
  definition: GuidedScenarioDefinition;
  variantKey: GuidedScenarioVariantKey;
  matchedScenario: boolean;
  matchedControl: boolean;
}): GuidedScenarioEvaluationResult {
  return {
    status: "blocked",
    labKey: input.definition.id,
    variantKey: input.variantKey,
    scenarioKey: input.matchedScenario ? "registered-scenario" : "blocked-scenario",
    controlKey: input.matchedControl ? "registered-control" : "blocked-control",
    scenarioTitle: "未登记固定案例",
    controlTitle: "边界校验",
    decision: "blocked",
    signal: "guided-scenario-boundary-blocked",
    message: "请求中的固定案例或控制策略未登记，服务未处理或回显原始输入。",
    nextStep: "只选择工作台配置接口返回的 scenarioKey 和 controlKey。",
    assessment: {
      matchedScenario: input.matchedScenario,
      matchedControl: input.matchedControl,
      controlApplied: false,
      riskLevel: input.definition.severity,
      riskIndicatorCount: 0,
      riskIndicators: [],
      rootCause: "unregistered-guided-scenario-input",
    },
    blockedReason: input.matchedScenario
      ? "control-not-allowed"
      : "scenario-not-allowed",
  };
}

export function summarizeGuidedScenarioResult(
  result: GuidedScenarioEvaluationResult,
) {
  return {
    scenarioKey: result.scenarioKey,
    controlKey: result.controlKey,
    matchedScenario: result.assessment.matchedScenario,
    matchedControl: result.assessment.matchedControl,
    controlApplied: result.assessment.controlApplied,
    riskIndicatorCount: result.assessment.riskIndicatorCount,
    riskIndicators: result.assessment.riskIndicators,
    riskLevel: result.assessment.riskLevel,
    signal: result.signal,
  };
}

export function createGuidedScenarioLabService(): GuidedScenarioLabService {
  return {
    getWorkbench(category, scene) {
      return getGuidedScenarioByRoute(category, scene);
    },

    evaluate(input) {
      const definition = getGuidedScenarioByRoute(input.category, input.scene);

      if (!definition) {
        return undefined;
      }

      const scenario = definition.scenarios.find(
        (candidate) => candidate.key === input.scenarioKey,
      );
      const control = definition.controls.find(
        (candidate) => candidate.key === input.controlKey,
      );

      if (!scenario || !control) {
        return createBoundaryResult({
          definition,
          variantKey: input.variantKey,
          matchedScenario: Boolean(scenario),
          matchedControl: Boolean(control),
        });
      }

      const isVulnerable = input.variantKey === "vuln";
      const decision = isVulnerable
        ? definition.vulnerableOutcome.decision
        : control.fixedDecision;
      const signal = isVulnerable
        ? definition.vulnerableOutcome.signal
        : control.fixedSignal;
      const message = isVulnerable
        ? definition.vulnerableOutcome.message
        : control.fixedMessage;

      return {
        status: decision === "blocked" ? "blocked" : "ok",
        labKey: definition.id,
        variantKey: input.variantKey,
        scenarioKey: scenario.key,
        controlKey: control.key,
        scenarioTitle: scenario.title,
        controlTitle: control.title,
        decision,
        signal,
        message,
        nextStep:
          input.variantKey === "vuln"
            ? "切换到修复版并使用同一固定案例，对比控制策略如何改变判定。"
            : decision === "blocked"
              ? "复盘阻断信号后，选择已落实的控制策略验证正常流程。"
              : "在实验事件日志中确认固定 key、决策和学习信号已形成安全摘要。",
        assessment: {
          matchedScenario: true,
          matchedControl: true,
          controlApplied: input.variantKey === "fixed",
          riskLevel: definition.severity,
          riskIndicatorCount: scenario.riskIndicators.length,
          riskIndicators: scenario.riskIndicators,
          rootCause: scenario.rootCause,
        },
        ...(decision === "blocked"
          ? { blockedReason: "guided-defense-required" }
          : {}),
      };
    },
  };
}

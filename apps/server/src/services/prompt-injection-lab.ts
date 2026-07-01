export type PromptInjectionVariantKey = "vuln" | "fixed";

export type PromptInjectionScenarioKey =
  | "support-kb"
  | "tool-assistant"
  | "document-qa";

export type PromptInjectionInstructionSourceKey =
  | "retrieved-note"
  | "user-followup"
  | "tool-request-note";

export type PromptInjectionDefensePolicyKey =
  | "none"
  | "layered-instructions"
  | "retrieval-isolation"
  | "tool-allowlist";

export type PromptInjectionSignal =
  | "prompt-injection-instruction-overridden"
  | "prompt-injection-retrieval-poisoning-visible"
  | "prompt-injection-tool-request-exposed"
  | "prompt-injection-tool-request-blocked"
  | "prompt-injection-policy-guardrail-applied"
  | "prompt-injection-safe-answer-returned"
  | "prompt-injection-boundary-verified"
  | "prompt-injection-sample-blocked";

export type PromptInjectionStatus = "ok" | "blocked";

export type PromptInjectionInput = {
  userId: string;
  variantKey: PromptInjectionVariantKey;
  scenarioKey: string;
  instructionSourceKey: string;
  defensePolicyKey: string;
};

export type PromptInjectionScenarioSummary = {
  scenarioKey: PromptInjectionScenarioKey;
  title: string;
  businessGoal: string;
  expectedPolicy: string;
  riskCategory: string;
  learningNotes: string;
};

export type PromptInjectionRouting = {
  inputLength: number;
  riskCategory: string;
  matchedControlledSample: boolean;
  instructionPriority: "confused" | "layered" | "isolated";
  toolRequestStatus:
    | "not-requested"
    | "requested"
    | "blocked"
    | "allowed-fixed-tool";
  outputPolicyStatus: "missing" | "applied" | "blocked";
};

export type PromptInjectionPolicyAudit = {
  layeredInstructions: boolean;
  retrievalIsolated: boolean;
  toolAllowlisted: boolean;
  outputPolicyApplied: boolean;
  blockedByPolicy: boolean;
  learningHint: string;
};

export type PromptInjectionResult = {
  status: PromptInjectionStatus;
  variantKey: PromptInjectionVariantKey;
  scenarioKey: string;
  instructionSourceKey: string;
  defensePolicyKey: string;
  scenario: PromptInjectionScenarioSummary | null;
  routing: PromptInjectionRouting;
  policyAudit: PromptInjectionPolicyAudit;
  safeAnswer: string;
  signal: PromptInjectionSignal;
  decision: "accepted" | "blocked";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type PromptInjectionLabService = {
  evaluateRoute(input: PromptInjectionInput): Promise<PromptInjectionResult>;
};

type PromptInjectionScenarioSample = PromptInjectionScenarioSummary & {
  baseInputLength: number;
};

type PromptInjectionInstructionSource = {
  instructionSourceKey: PromptInjectionInstructionSourceKey;
  title: string;
  riskCategory: string;
  inputLengthDelta: number;
  sourceKind: "retrieval" | "user" | "tool";
};

type PromptInjectionDefensePolicy = {
  defensePolicyKey: PromptInjectionDefensePolicyKey;
  title: string;
  layeredInstructions: boolean;
  retrievalIsolated: boolean;
  toolAllowlisted: boolean;
  outputPolicyApplied: boolean;
};

export const promptInjectionDefaultScenarioKey: PromptInjectionScenarioKey =
  "support-kb";
export const promptInjectionDefaultInstructionSourceKey: PromptInjectionInstructionSourceKey =
  "retrieved-note";
export const promptInjectionDefaultDefensePolicyKey: PromptInjectionDefensePolicyKey =
  "none";

const scenarioSamples = new Map<
  PromptInjectionScenarioKey,
  PromptInjectionScenarioSample
>([
  [
    "support-kb",
    {
      scenarioKey: "support-kb",
      title: "客服知识库问答",
      businessGoal: "根据固定知识库摘要回答工单范围内的问题。",
      expectedPolicy: "answer-within-scope",
      riskCategory: "retrieval-contamination",
      learningNotes: "观察外部资料摘要被错误当成高优先级指令时的边界混淆。",
      baseInputLength: 126,
    },
  ],
  [
    "tool-assistant",
    {
      scenarioKey: "tool-assistant",
      title: "内部操作助手",
      businessGoal: "只展示固定教学工具标签的审计结果，不执行真实工具。",
      expectedPolicy: "tool-allowlist-only",
      riskCategory: "tool-overreach",
      learningNotes: "观察工具请求越界时，允许列表和输出策略如何共同生效。",
      baseInputLength: 142,
    },
  ],
  [
    "document-qa",
    {
      scenarioKey: "document-qa",
      title: "文档问答助手",
      businessGoal: "围绕固定文档摘要返回范围内教学回答。",
      expectedPolicy: "safe-answer-within-document",
      riskCategory: "safe-reference",
      learningNotes: "观察正常业务问答在修复版策略下仍能返回安全结果。",
      baseInputLength: 96,
    },
  ],
]);

const instructionSources = new Map<
  PromptInjectionInstructionSourceKey,
  PromptInjectionInstructionSource
>([
  [
    "retrieved-note",
    {
      instructionSourceKey: "retrieved-note",
      title: "固定检索资料摘要",
      riskCategory: "retrieval-contamination",
      inputLengthDelta: 38,
      sourceKind: "retrieval",
    },
  ],
  [
    "user-followup",
    {
      instructionSourceKey: "user-followup",
      title: "固定用户追问摘要",
      riskCategory: "instruction-override",
      inputLengthDelta: 24,
      sourceKind: "user",
    },
  ],
  [
    "tool-request-note",
    {
      instructionSourceKey: "tool-request-note",
      title: "固定工具请求摘要",
      riskCategory: "tool-overreach",
      inputLengthDelta: 34,
      sourceKind: "tool",
    },
  ],
]);

const defensePolicies = new Map<
  PromptInjectionDefensePolicyKey,
  PromptInjectionDefensePolicy
>([
  [
    "none",
    {
      defensePolicyKey: "none",
      title: "无额外策略",
      layeredInstructions: false,
      retrievalIsolated: false,
      toolAllowlisted: false,
      outputPolicyApplied: false,
    },
  ],
  [
    "layered-instructions",
    {
      defensePolicyKey: "layered-instructions",
      title: "指令分层",
      layeredInstructions: true,
      retrievalIsolated: false,
      toolAllowlisted: false,
      outputPolicyApplied: true,
    },
  ],
  [
    "retrieval-isolation",
    {
      defensePolicyKey: "retrieval-isolation",
      title: "检索隔离",
      layeredInstructions: true,
      retrievalIsolated: true,
      toolAllowlisted: false,
      outputPolicyApplied: true,
    },
  ],
  [
    "tool-allowlist",
    {
      defensePolicyKey: "tool-allowlist",
      title: "工具允许列表",
      layeredInstructions: true,
      retrievalIsolated: true,
      toolAllowlisted: true,
      outputPolicyApplied: true,
    },
  ],
]);

function isScenarioKey(value: string): value is PromptInjectionScenarioKey {
  return scenarioSamples.has(value as PromptInjectionScenarioKey);
}

function isInstructionSourceKey(
  value: string,
): value is PromptInjectionInstructionSourceKey {
  return instructionSources.has(value as PromptInjectionInstructionSourceKey);
}

function isDefensePolicyKey(
  value: string,
): value is PromptInjectionDefensePolicyKey {
  return defensePolicies.has(value as PromptInjectionDefensePolicyKey);
}

function resolveRiskCategory(input: {
  scenario: PromptInjectionScenarioSample;
  source: PromptInjectionInstructionSource;
}) {
  if (
    input.scenario.scenarioKey === "document-qa" &&
    input.source.instructionSourceKey === "user-followup"
  ) {
    return "safe-reference";
  }

  return input.source.riskCategory;
}

function createRouting(input: {
  scenario: PromptInjectionScenarioSample;
  source: PromptInjectionInstructionSource;
  policy: PromptInjectionDefensePolicy;
  variantKey: PromptInjectionVariantKey;
  blockedByPolicy: boolean;
  riskCategory: string;
}): PromptInjectionRouting {
  const fixedVariant = input.variantKey === "fixed";
  const riskySample = input.riskCategory !== "safe-reference";
  const instructionPriority =
    fixedVariant && input.policy.retrievalIsolated
      ? "isolated"
      : fixedVariant || !riskySample
        ? "layered"
        : "confused";
  const toolRequestStatus =
    input.source.sourceKind !== "tool"
      ? "not-requested"
      : input.blockedByPolicy
        ? "blocked"
        : fixedVariant && input.policy.toolAllowlisted
          ? "allowed-fixed-tool"
          : "requested";
  const outputPolicyStatus = input.blockedByPolicy
    ? "blocked"
    : fixedVariant
      ? "applied"
      : "missing";

  return {
    inputLength: input.scenario.baseInputLength + input.source.inputLengthDelta,
    riskCategory: input.riskCategory,
    matchedControlledSample: true,
    instructionPriority,
    toolRequestStatus,
    outputPolicyStatus,
  };
}

function createPolicyAudit(input: {
  variantKey: PromptInjectionVariantKey;
  policy: PromptInjectionDefensePolicy;
  blockedByPolicy: boolean;
  riskCategory: string;
}): PromptInjectionPolicyAudit {
  const fixedVariant = input.variantKey === "fixed";
  const layeredInstructions = fixedVariant || input.policy.layeredInstructions;
  const retrievalIsolated = fixedVariant || input.policy.retrievalIsolated;
  const toolAllowlisted = fixedVariant || input.policy.toolAllowlisted;
  const outputPolicyApplied = fixedVariant || input.policy.outputPolicyApplied;

  return {
    layeredInstructions,
    retrievalIsolated,
    toolAllowlisted,
    outputPolicyApplied,
    blockedByPolicy: input.blockedByPolicy,
    learningHint: input.blockedByPolicy
      ? "修复版把外部内容保留为低优先级资料，并阻断越界路由结果。"
      : input.riskCategory === "safe-reference"
        ? "当前固定样例保持在业务范围内，可用于观察正常问答路径。"
        : "漏洞版缺少有效边界，外部内容会影响确定性路由结果。",
  };
}

function resolveSignal(input: {
  variantKey: PromptInjectionVariantKey;
  source: PromptInjectionInstructionSource;
  riskCategory: string;
  blockedByPolicy: boolean;
}): PromptInjectionSignal {
  if (input.blockedByPolicy && input.source.sourceKind === "tool") {
    return "prompt-injection-tool-request-blocked";
  }

  if (input.blockedByPolicy) {
    return "prompt-injection-policy-guardrail-applied";
  }

  if (input.riskCategory === "safe-reference") {
    return input.variantKey === "fixed"
      ? "prompt-injection-safe-answer-returned"
      : "prompt-injection-boundary-verified";
  }

  if (input.source.sourceKind === "tool") {
    return "prompt-injection-tool-request-exposed";
  }

  if (input.source.sourceKind === "retrieval") {
    return "prompt-injection-retrieval-poisoning-visible";
  }

  return "prompt-injection-instruction-overridden";
}

function createMessage(input: {
  signal: PromptInjectionSignal;
  variantKey: PromptInjectionVariantKey;
}) {
  if (input.signal === "prompt-injection-tool-request-blocked") {
    return "修复版识别到固定工具请求越界，并通过允许列表和输出策略阻断。";
  }

  if (input.signal === "prompt-injection-policy-guardrail-applied") {
    return "修复版将外部内容保留为低优先级资料，业务目标没有被覆盖。";
  }

  if (input.signal === "prompt-injection-safe-answer-returned") {
    return "修复版在固定文档范围内返回安全教学回答，正常业务路径保持可用。";
  }

  if (input.signal === "prompt-injection-tool-request-exposed") {
    return "漏洞版暴露了固定工具请求越界信号，可用于观察工具边界缺失。";
  }

  if (input.signal === "prompt-injection-retrieval-poisoning-visible") {
    return "漏洞版把固定检索资料摘要错误抬高为指令来源，业务目标出现偏离。";
  }

  if (input.signal === "prompt-injection-instruction-overridden") {
    return "漏洞版出现指令来源混淆，外部内容影响了确定性路由结果。";
  }

  return input.variantKey === "fixed"
    ? "修复版确认固定样例保持在业务范围内。"
    : "漏洞版当前样例未触发越界信号，可切换来源继续观察。";
}

function createNextStep(input: {
  signal: PromptInjectionSignal;
  variantKey: PromptInjectionVariantKey;
}) {
  if (input.variantKey === "vuln") {
    return "使用同一固定场景切换到修复版，观察指令分层、检索隔离和输出策略如何改变结果。";
  }

  if (
    input.signal === "prompt-injection-tool-request-blocked" ||
    input.signal === "prompt-injection-policy-guardrail-applied"
  ) {
    return "切换到 document-qa 和 user-followup，观察正常业务问答如何保持可用。";
  }

  return "对比漏洞版同一固定样例，复盘日志中的风险类别、策略状态和学习信号。";
}

function createSafeAnswer(input: {
  signal: PromptInjectionSignal;
  scenario: PromptInjectionScenarioSample;
}) {
  if (
    input.signal === "prompt-injection-tool-request-blocked" ||
    input.signal === "prompt-injection-policy-guardrail-applied"
  ) {
    return "已阻断越界教学样例：仅保留风险说明、策略状态和下一步复盘建议。";
  }

  if (input.signal === "prompt-injection-safe-answer-returned") {
    return "根据固定文档摘要返回范围内说明，并提示继续查看策略审计结果。";
  }

  return `教学摘要：${input.scenario.title} 当前展示确定性路由结果，不包含完整提示词或真实模型输出。`;
}

function createBlockedResult(input: {
  variantKey: PromptInjectionVariantKey;
  scenarioKey: string;
  instructionSourceKey: string;
  defensePolicyKey: string;
  blockedReason: string;
}): PromptInjectionResult {
  const safeScenarioKey = isScenarioKey(input.scenarioKey)
    ? input.scenarioKey
    : "blocked-scenario";
  const safeInstructionSourceKey = isInstructionSourceKey(
    input.instructionSourceKey,
  )
    ? input.instructionSourceKey
    : "blocked-source";
  const safeDefensePolicyKey = isDefensePolicyKey(input.defensePolicyKey)
    ? input.defensePolicyKey
    : "blocked-policy";

  return {
    status: "blocked",
    variantKey: input.variantKey,
    scenarioKey: safeScenarioKey,
    instructionSourceKey: safeInstructionSourceKey,
    defensePolicyKey: safeDefensePolicyKey,
    scenario: null,
    routing: {
      inputLength: 0,
      riskCategory: "blocked-sample",
      matchedControlledSample: false,
      instructionPriority: "isolated",
      toolRequestStatus: "not-requested",
      outputPolicyStatus: "blocked",
    },
    policyAudit: {
      layeredInstructions: true,
      retrievalIsolated: true,
      toolAllowlisted: true,
      outputPolicyApplied: true,
      blockedByPolicy: true,
      learningHint: "该固定样例 key 不在允许列表中，服务不会处理任意提示词正文。",
    },
    safeAnswer: "已阻断未知固定样例：请只选择文档或页面列出的受控 key。",
    signal: "prompt-injection-sample-blocked",
    decision: "blocked",
    message: "该 Prompt 注入固定样例不在允许列表中，未处理任何任意提示词正文。",
    nextStep: "选择已登记的 scenarioKey、instructionSourceKey 和 defensePolicyKey 后重新观察。",
    blockedReason: input.blockedReason,
  };
}

export function createPromptInjectionLabService(): PromptInjectionLabService {
  return {
    async evaluateRoute(input) {
      const scenarioKey = input.scenarioKey.trim();
      const instructionSourceKey = input.instructionSourceKey.trim();
      const defensePolicyKey = input.defensePolicyKey.trim();

      if (!isScenarioKey(scenarioKey)) {
        return createBlockedResult({
          variantKey: input.variantKey,
          scenarioKey,
          instructionSourceKey,
          defensePolicyKey,
          blockedReason: "scenario-not-allowed",
        });
      }

      if (!isInstructionSourceKey(instructionSourceKey)) {
        return createBlockedResult({
          variantKey: input.variantKey,
          scenarioKey,
          instructionSourceKey,
          defensePolicyKey,
          blockedReason: "source-not-allowed",
        });
      }

      if (!isDefensePolicyKey(defensePolicyKey)) {
        return createBlockedResult({
          variantKey: input.variantKey,
          scenarioKey,
          instructionSourceKey,
          defensePolicyKey,
          blockedReason: "policy-not-allowed",
        });
      }

      const scenario = scenarioSamples.get(scenarioKey);
      const source = instructionSources.get(instructionSourceKey);
      const policy = defensePolicies.get(defensePolicyKey);

      if (!scenario || !source || !policy) {
        return createBlockedResult({
          variantKey: input.variantKey,
          scenarioKey,
          instructionSourceKey,
          defensePolicyKey,
          blockedReason: "sample-not-found",
        });
      }

      const riskCategory = resolveRiskCategory({
        scenario,
        source,
      });
      const riskySample = riskCategory !== "safe-reference";
      const blockedByPolicy = input.variantKey === "fixed" && riskySample;
      const routing = createRouting({
        scenario,
        source,
        policy,
        variantKey: input.variantKey,
        blockedByPolicy,
        riskCategory,
      });
      const policyAudit = createPolicyAudit({
        variantKey: input.variantKey,
        policy,
        blockedByPolicy,
        riskCategory,
      });
      const signal = resolveSignal({
        variantKey: input.variantKey,
        source,
        riskCategory,
        blockedByPolicy,
      });

      return {
        status: blockedByPolicy ? "blocked" : "ok",
        variantKey: input.variantKey,
        scenarioKey,
        instructionSourceKey,
        defensePolicyKey,
        scenario: {
          scenarioKey: scenario.scenarioKey,
          title: scenario.title,
          businessGoal: scenario.businessGoal,
          expectedPolicy: scenario.expectedPolicy,
          riskCategory: scenario.riskCategory,
          learningNotes: scenario.learningNotes,
        },
        routing,
        policyAudit,
        safeAnswer: createSafeAnswer({
          signal,
          scenario,
        }),
        signal,
        decision: blockedByPolicy ? "blocked" : "accepted",
        message: createMessage({
          signal,
          variantKey: input.variantKey,
        }),
        nextStep: createNextStep({
          signal,
          variantKey: input.variantKey,
        }),
        ...(blockedByPolicy ? { blockedReason: "policy-guardrail-applied" } : {}),
      };
    },
  };
}

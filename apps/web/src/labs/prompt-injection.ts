import type {
  PromptInjectionDefensePolicyKey,
  PromptInjectionInstructionSourceKey,
  PromptInjectionResult,
  PromptInjectionScenarioKey,
  PromptInjectionSignal as PromptInjectionApiSignal,
  PromptInjectionVariantKey,
} from "../api/prompt-injection-lab";

export type {
  PromptInjectionDefensePolicyKey,
  PromptInjectionInstructionSourceKey,
  PromptInjectionScenarioKey,
  PromptInjectionVariantKey,
};

export type PromptInjectionSignal =
  | PromptInjectionApiSignal
  | "prompt-injection-workbench-reviewed"
  | "prompt-injection-fixed-samples-reviewed"
  | "prompt-injection-no-external-ai-confirmed";

export type PromptInjectionVariantConfig = {
  key: PromptInjectionVariantKey;
  title: string;
  badge: string;
  perspective: string;
  explanation: string;
  expectedSignal: string;
  expectedOutcome: string;
  panelIntro: string;
};

export type PromptInjectionScenarioOption = {
  key: PromptInjectionScenarioKey;
  title: string;
  businessGoal: string;
  description: string;
  vulnerableFocus: string;
  fixedFocus: string;
};

export type PromptInjectionInstructionSourceOption = {
  key: PromptInjectionInstructionSourceKey;
  title: string;
  description: string;
};

export type PromptInjectionDefensePolicyOption = {
  key: PromptInjectionDefensePolicyKey;
  title: string;
  description: string;
};

export type PromptInjectionScenarioObservationRow = {
  key: PromptInjectionScenarioKey;
  title: string;
  businessGoal: string;
  focus: string;
  description: string;
};

export type PromptInjectionReviewChecklistItem = {
  key: string;
  title: string;
  description: string;
};

export type PromptInjectionLearningProgressInput = {
  variantKey: PromptInjectionVariantKey;
  status: "in-progress";
  notes: string;
};

export type PromptInjectionVerificationRecordInput = {
  variantKey: PromptInjectionVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: PromptInjectionApiSignal;
    scenarioKey: string;
    instructionSourceKey: string;
    defensePolicyKey: string;
    riskCategory: string;
    instructionPriority: string;
    toolRequestStatus: string;
    outputPolicyStatus: string;
    blockedByPolicy: boolean;
  };
};

export const defaultPromptInjectionScenarioKey: PromptInjectionScenarioKey =
  "support-kb";
export const defaultPromptInjectionInstructionSourceKey: PromptInjectionInstructionSourceKey =
  "retrieved-note";
export const defaultPromptInjectionVulnerableDefensePolicyKey: PromptInjectionDefensePolicyKey =
  "none";
export const defaultPromptInjectionFixedDefensePolicyKey: PromptInjectionDefensePolicyKey =
  "retrieval-isolation";

const promptInjectionVariantConfigs: Record<
  PromptInjectionVariantKey,
  PromptInjectionVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "Prompt 注入漏洞版",
    badge: "固定外部内容、指令边界混淆和策略缺失",
    perspective: "攻击方观察",
    explanation:
      "本页从攻击方视角观察固定样例中外部内容如何影响确定性路由结果，帮助定位指令优先级边界风险。",
    expectedSignal:
      "提交客服知识库和固定检索资料后应出现 prompt-injection-retrieval-poisoning-visible 信号。",
    expectedOutcome: "完成固定样例、固定来源和策略缺失下的风险信号观察。",
    panelIntro:
      "工作台只调用本项目确定性路由 API，不提供任意提示词输入、模型配置、URL、密钥或真实工具参数。",
  },
  fixed: {
    key: "fixed",
    title: "Prompt 注入修复版",
    badge: "指令分层、检索隔离、工具允许列表和输出策略",
    perspective: "防御方复盘",
    explanation:
      "本页从防御方视角复盘同一批固定样例，观察外部内容如何被隔离、阻断或转成安全教学回答。",
    expectedSignal:
      "提交客服知识库和检索隔离策略后应出现 prompt-injection-policy-guardrail-applied 信号。",
    expectedOutcome: "完成越界样例阻断、安全问答返回和策略审计复盘。",
    panelIntro:
      "修复版强调分层、隔离、允许列表和输出策略，前端选择器只用于引导观察受控固定样例。",
  },
};

export const promptInjectionScenarioOptions: PromptInjectionScenarioOption[] = [
  {
    key: "support-kb",
    title: "客服知识库问答",
    businessGoal: "根据固定知识库摘要回答工单范围内的问题。",
    description: "观察检索资料摘要被错误抬高时，业务目标如何偏离。",
    vulnerableFocus: "关注检索资料未隔离时的指令优先级混淆。",
    fixedFocus: "关注检索隔离和输出策略如何保留业务边界。",
  },
  {
    key: "tool-assistant",
    title: "内部操作助手",
    businessGoal: "只展示固定教学工具标签的审计结果，不执行真实工具。",
    description: "观察工具请求越界时，漏洞版和修复版的工具状态差异。",
    vulnerableFocus: "关注工具请求越界暴露和输出策略缺失。",
    fixedFocus: "关注工具允许列表和阻断信号如何共同生效。",
  },
  {
    key: "document-qa",
    title: "文档问答助手",
    businessGoal: "围绕固定文档摘要返回范围内教学回答。",
    description: "观察正常业务问答在策略约束下仍保持可用。",
    vulnerableFocus: "关注固定正常追问是否保持在业务范围内。",
    fixedFocus: "关注安全教学回答和输出策略如何兼顾可用性。",
  },
];

export const promptInjectionInstructionSourceOptions: PromptInjectionInstructionSourceOption[] =
  [
    {
      key: "retrieved-note",
      title: "固定检索资料摘要",
      description: "模拟外部资料摘要进入上下文后，对指令边界造成的影响。",
    },
    {
      key: "user-followup",
      title: "固定用户追问摘要",
      description: "模拟用户追问与业务目标之间的优先级关系。",
    },
    {
      key: "tool-request-note",
      title: "固定工具请求摘要",
      description: "模拟工具请求标签进入路由判断，但不执行真实工具。",
    },
  ];

export const promptInjectionDefensePolicyOptions: PromptInjectionDefensePolicyOption[] =
  [
    {
      key: "none",
      title: "无额外策略",
      description: "用于观察漏洞版缺少边界时的路由偏离。",
    },
    {
      key: "layered-instructions",
      title: "指令分层",
      description: "把系统意图、外部资料和用户请求放入不同优先级。",
    },
    {
      key: "retrieval-isolation",
      title: "检索隔离",
      description: "外部资料只能作为参考，不允许覆盖业务目标。",
    },
    {
      key: "tool-allowlist",
      title: "工具允许列表",
      description: "只允许固定教学工具标签进入审计结果，不执行真实工具。",
    },
  ];

export const promptInjectionReviewChecklist: PromptInjectionReviewChecklistItem[] =
  [
    {
      key: "fixed-key-only",
      title: "请求只能包含固定 key",
      description:
        "前端只提交 scenarioKey、instructionSourceKey 和 defensePolicyKey，不提交任意提示词正文或模型配置。",
    },
    {
      key: "no-freeform-prompt",
      title: "页面不提供任意提示词输入",
      description:
        "学习者通过固定选择器观察差异，避免把页面变成提示词攻击测试器。",
    },
    {
      key: "policy-audit",
      title: "策略审计必须可见",
      description:
        "页面展示指令分层、检索隔离、工具允许列表和输出策略四项摘要。",
    },
    {
      key: "safe-log-summary",
      title: "日志只记录安全摘要",
      description:
        "事件日志只记录固定 key、输入长度、风险类别、策略状态和学习信号。",
    },
    {
      key: "no-external-ai",
      title: "不调用外部 AI 或真实工具",
      description:
        "实验只返回本项目确定性路由结果，不连接模型服务、第三方接口或真实工具。",
    },
  ];

export function getPromptInjectionVariantConfig(
  variant: PromptInjectionVariantKey,
) {
  return promptInjectionVariantConfigs[variant];
}

export function getDefaultPromptInjectionDefensePolicyKey(
  variant: PromptInjectionVariantKey,
) {
  return variant === "fixed"
    ? defaultPromptInjectionFixedDefensePolicyKey
    : defaultPromptInjectionVulnerableDefensePolicyKey;
}

export function getPromptInjectionScenarioObservationRows(
  variant: PromptInjectionVariantKey,
): PromptInjectionScenarioObservationRow[] {
  return promptInjectionScenarioOptions.map((scenario) => ({
    key: scenario.key,
    title: scenario.title,
    businessGoal: scenario.businessGoal,
    description: scenario.description,
    focus: variant === "vuln" ? scenario.vulnerableFocus : scenario.fixedFocus,
  }));
}

export function createPromptInjectionLearningProgress(
  config: PromptInjectionVariantConfig,
): PromptInjectionLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createPromptInjectionVerificationRecord(
  config: PromptInjectionVariantConfig,
  result: PromptInjectionResult,
): PromptInjectionVerificationRecordInput {
  const details = {
    signal: result.signal,
    scenarioKey: result.scenarioKey,
    instructionSourceKey: result.instructionSourceKey,
    defensePolicyKey: result.defensePolicyKey,
    riskCategory: result.routing.riskCategory,
    instructionPriority: result.routing.instructionPriority,
    toolRequestStatus: result.routing.toolRequestStatus,
    outputPolicyStatus: result.routing.outputPolicyStatus,
    blockedByPolicy: result.policyAudit.blockedByPolicy,
  };

  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "漏洞版展示了固定 Prompt 注入样例中的指令边界风险信号。",
      details,
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "修复版展示了固定 Prompt 注入样例的阻断或安全回答信号。",
    details,
  };
}

export function formatPromptInjectionSignal(signal: PromptInjectionSignal) {
  const labels: Record<PromptInjectionSignal, string> = {
    "prompt-injection-workbench-reviewed": "已进入 Prompt 注入前端工作台",
    "prompt-injection-fixed-samples-reviewed": "已确认固定样例边界",
    "prompt-injection-no-external-ai-confirmed": "已确认不调用外部 AI",
    "prompt-injection-instruction-overridden": "漏洞版指令来源被覆盖",
    "prompt-injection-retrieval-poisoning-visible": "漏洞版检索污染信号可见",
    "prompt-injection-tool-request-exposed": "漏洞版工具请求越界可见",
    "prompt-injection-tool-request-blocked": "修复版工具请求已阻断",
    "prompt-injection-policy-guardrail-applied": "修复版策略护栏已生效",
    "prompt-injection-safe-answer-returned": "修复版安全回答已返回",
    "prompt-injection-boundary-verified": "固定业务边界已确认",
    "prompt-injection-sample-blocked": "非固定样例已被阻断",
  };

  return labels[signal];
}

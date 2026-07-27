import {
  createGuidedScenarioMachine,
  type GuidedScenarioV2Definition,
} from "@network-safe/shared/guided-scenarios-v2";

export type CredentialStuffingVariantKey = "vuln" | "fixed";

// 三个 canonical 终止信号与既有 meta.json expectedSignals 保持一致，
// 保证 exploit.py、手工验证文档和事件日志向后兼容。
export const credentialStuffingRiskSignal =
  "auth-credential-stuffing-risk-accepted";
export const credentialStuffingDefenseSignal =
  "auth-credential-stuffing-defense-blocked";
export const credentialStuffingNormalSignal =
  "auth-credential-stuffing-normal-verified";

export const credentialStuffingScenarioKey = "reused-credential-batch";

// 专用第二版定义：两步状态机（风险关联策略 -> 挑战决策），只使用固定虚构选项。
const credentialStuffingDefinition: GuidedScenarioV2Definition = {
  version: 2,
  id: "auth.credential-stuffing",
  slug: "credential-stuffing",
  category: "auth",
  subcategory: "credential-stuffing",
  title: "凭据填充",
  mode: "interactive",
  severity: "high",
  difficulty: "intermediate",
  summary:
    "通过固定虚构登录批次的两步决策，对比只判断单次口令与建立跨请求风险关联、自适应挑战的差异。",
  phase: "phase-1",
  tags: ["auth", "credential-stuffing", "account-security"],
  knowledgePoints: ["凭据复用风险", "自适应认证", "异常登录关联"],
  scoringDimensions: [
    {
      key: "risk-correlation",
      title: "风险关联",
      description: "在单次口令结果之外建立设备、速率和泄露凭据关联。",
      max: 1,
    },
    {
      key: "adaptive-defense",
      title: "自适应防御",
      description: "对高风险登录批次施加自适应挑战或阻断。",
      max: 1,
    },
  ],
  defaultCaseKey: credentialStuffingScenarioKey,
  cases: [
    {
      key: credentialStuffingScenarioKey,
      title: "重复凭据登录批次",
      description:
        "固定虚构账号摘要展示跨站重复凭据带来的批量登录风险，用两步决策观察风险关联策略和挑战处置。",
      assets: [
        {
          key: "login-batch",
          kind: "asset",
          title: "固定登录批次摘要",
          detail: "被观察的固定虚构登录批次，只含统计摘要，不含真实账号或口令。",
        },
      ],
      evidence: [
        {
          key: "credential-reuse",
          kind: "evidence",
          title: "跨站凭据复用",
          detail: "固定风险标签：登录批次使用其他站点泄露的重复凭据。",
        },
        {
          key: "distributed-attempts",
          kind: "evidence",
          title: "分布式尝试",
          detail: "固定风险标签：登录尝试来自大量不同来源以规避简单计数。",
        },
        {
          key: "account-takeover",
          kind: "evidence",
          title: "账号接管意图",
          detail: "固定风险标签：批量登录旨在筛选可接管的有效账号。",
        },
      ],
      initialStepKey: "risk-correlation",
      steps: [
        {
          key: "risk-correlation",
          order: 1,
          title: "风险关联策略",
          prompt: "选择该固定登录批次的风险关联策略。",
          riskSignal: "auth-credential-stuffing-risk-correlation",
          options: [
            {
              key: "trust-single-password-result",
              label: "只判断单次口令结果（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: "auth-credential-stuffing-correlation-open",
              explanation:
                "认证只判断单次口令是否正确，缺少设备、速率和泄露凭据关联，批量登录可逐个筛选账号。",
              nextStepKey: "challenge-decision",
              scoreDeltas: { "risk-correlation": 0 },
            },
            {
              key: "enable-cross-request-correlation",
              label: "建立跨请求设备与速率关联",
              outcome: "fix",
              decision: "blocked",
              signal: "auth-credential-stuffing-correlation-enabled",
              explanation:
                "建立跨请求设备指纹、速率和泄露凭据关联后，高风险批次被识别并进入挑战路径。",
              nextStepKey: "challenge-decision",
              scoreDeltas: { "risk-correlation": 1 },
            },
          ],
        },
        {
          key: "challenge-decision",
          order: 2,
          title: "挑战决策",
          prompt: "选择当前风险关联策略下的登录挑战处置方式。",
          riskSignal: "auth-credential-stuffing-challenge-decision",
          options: [
            {
              key: "accept-without-challenge",
              label: "无挑战直接放行（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: credentialStuffingRiskSignal,
              explanation:
                "漏洞版因认证只判断单次口令结果且没有设备、速率和泄露凭据风险关联接受了批量登录。",
              nextStepKey: null,
              scoreDeltas: { "adaptive-defense": 0 },
            },
            {
              key: "defense-blocks-risky-batch",
              label: "防御阻断高风险登录批次",
              outcome: "fix",
              decision: "blocked",
              signal: credentialStuffingDefenseSignal,
              explanation:
                "修复版识别到高风险固定案例，并通过速率限制、泄露凭据检测、自适应验证和异常登录告警阻断该批次。",
              nextStepKey: null,
              scoreDeltas: { "adaptive-defense": 1 },
            },
            {
              key: "allow-verified-legitimate-login",
              label: "自适应挑战通过后放行正常登录",
              outcome: "normal",
              decision: "accepted",
              signal: credentialStuffingNormalSignal,
              explanation:
                "修复版确认速率限制与自适应验证已落实，固定正常用户在完成挑战后可以继续登录。",
              nextStepKey: null,
              scoreDeltas: { "adaptive-defense": 1 },
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

export type CredentialStuffingWorkbench = {
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

export type CredentialStuffingStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: "risk" | "fix" | "normal";
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type CredentialStuffingEvaluationInput = {
  variantKey: CredentialStuffingVariantKey;
  scenarioKey: string;
  decisions: string[];
};

export type CredentialStuffingEvaluationResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: CredentialStuffingVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: CredentialStuffingStepResult[];
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

export type CredentialStuffingLabService = {
  getWorkbench(): CredentialStuffingWorkbench;
  evaluate(
    input: CredentialStuffingEvaluationInput,
  ): CredentialStuffingEvaluationResult;
};

function createBlockedResult(input: {
  variantKey: CredentialStuffingVariantKey;
  matchedScenario: boolean;
  blockedReason: string;
}): CredentialStuffingEvaluationResult {
  return {
    status: "blocked",
    labKey: credentialStuffingDefinition.id,
    variantKey: input.variantKey,
    scenarioKey: input.matchedScenario
      ? credentialStuffingScenarioKey
      : "blocked-scenario",
    decision: "blocked",
    signal: "auth-credential-stuffing-boundary-blocked",
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
      riskLevel: credentialStuffingDefinition.severity,
      stepCount: 0,
      matchedScenario: input.matchedScenario,
    },
    blockedReason: input.blockedReason,
  };
}

function buildNextStep(input: {
  variantKey: CredentialStuffingVariantKey;
  terminalOutcome: "risk" | "fix" | "normal" | null;
}) {
  if (input.variantKey === "vuln") {
    return "切换到修复版并沿用同一固定案例，对比风险关联策略与挑战决策如何改变判定。";
  }

  if (input.terminalOutcome === "fix") {
    return "复盘防御阻断信号后，选择“自适应挑战通过后放行正常登录”验证修复后的正常流程。";
  }

  return "在实验事件日志中确认固定 key、决策路径和学习信号已形成安全摘要。";
}

export function createCredentialStuffingLabService(): CredentialStuffingLabService {
  return {
    getWorkbench() {
      return {
        id: credentialStuffingDefinition.id,
        slug: credentialStuffingDefinition.slug,
        category: credentialStuffingDefinition.category,
        subcategory: credentialStuffingDefinition.subcategory,
        title: credentialStuffingDefinition.title,
        mode: credentialStuffingDefinition.mode,
        severity: credentialStuffingDefinition.severity,
        difficulty: credentialStuffingDefinition.difficulty,
        summary: credentialStuffingDefinition.summary,
        defaultScenarioKey: credentialStuffingDefinition.defaultCaseKey,
        scoringDimensions: credentialStuffingDefinition.scoringDimensions,
        cases: credentialStuffingDefinition.cases,
        safeBoundaries: credentialStuffingDefinition.safeBoundaries,
        notes: credentialStuffingDefinition.notes,
      };
    },

    evaluate(input) {
      if (input.scenarioKey !== credentialStuffingScenarioKey) {
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
        credentialStuffingDefinition,
        credentialStuffingScenarioKey,
      );
      const steps: CredentialStuffingStepResult[] = [];

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
        labKey: credentialStuffingDefinition.id,
        variantKey: input.variantKey,
        scenarioKey: credentialStuffingScenarioKey,
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
          riskLevel: credentialStuffingDefinition.severity,
          stepCount: steps.length,
          matchedScenario: true,
        },
        ...(terminal.decision === "blocked"
          ? { blockedReason: "credential-stuffing-defense-applied" }
          : {}),
      };
    },
  };
}

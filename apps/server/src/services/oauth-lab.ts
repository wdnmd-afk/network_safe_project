import {
  createGuidedScenarioMachine,
  type GuidedScenarioV2Definition,
} from "@network-safe/shared/guided-scenarios-v2";

export type OauthVariantKey = "vuln" | "fixed";

// 三个 canonical 终止信号与既有 meta.json expectedSignals 保持一致，
// 保证 exploit.py、手工验证文档和事件日志向后兼容。
export const oauthRiskSignal = "auth-oauth-risk-accepted";
export const oauthDefenseSignal = "auth-oauth-defense-blocked";
export const oauthNormalSignal = "auth-oauth-normal-verified";

export const oauthScenarioKey = "tampered-authorization-response";

// 专用第二版定义：两步状态机（授权绑定策略 -> 授权响应决策），只使用固定虚构选项。
const oauthDefinition: GuidedScenarioV2Definition = {
  version: 2,
  id: "auth.oauth",
  slug: "oauth",
  category: "auth",
  subcategory: "oauth",
  title: "OAuth 漏洞",
  mode: "interactive",
  severity: "high",
  difficulty: "advanced",
  summary:
    "通过固定授权请求的两步决策，对比授权响应未绑定与精确回调地址、state、PKCE、最小 scope 的差异。",
  phase: "phase-1",
  tags: ["auth", "oauth", "pkce"],
  knowledgePoints: ["授权码流程", "回调地址校验", "PKCE 与 state"],
  scoringDimensions: [
    {
      key: "request-binding",
      title: "请求绑定",
      description: "把授权响应与原始客户端、回调地址和请求上下文绑定。",
      max: 1,
    },
    {
      key: "authorization-defense",
      title: "授权防御",
      description: "对未绑定的授权响应施加阻断或校验。",
      max: 1,
    },
  ],
  defaultCaseKey: oauthScenarioKey,
  cases: [
    {
      key: oauthScenarioKey,
      title: "授权响应关联缺失",
      description:
        "固定授权摘要展示回调地址和请求关联校验缺失的风险，用两步决策观察授权绑定策略和授权响应处置。",
      assets: [
        {
          key: "authorization-response",
          kind: "asset",
          title: "固定授权响应摘要",
          detail:
            "被观察的固定授权响应摘要，只含回调地址与 state/PKCE 比对结果，不含真实授权码、token 或客户端密钥。",
        },
      ],
      evidence: [
        {
          key: "redirect-uri-mismatch",
          kind: "evidence",
          title: "回调地址不一致",
          detail: "固定风险标签：授权响应回调地址与注册值不一致。",
        },
        {
          key: "state-missing",
          kind: "evidence",
          title: "state 缺失",
          detail: "固定风险标签：授权请求与响应缺少 state 关联，易受 CSRF。",
        },
        {
          key: "pkce-missing",
          kind: "evidence",
          title: "PKCE 缺失",
          detail: "固定风险标签：授权码流程缺少 PKCE，授权码可被拦截复用。",
        },
      ],
      initialStepKey: "authorization-binding",
      steps: [
        {
          key: "authorization-binding",
          order: 1,
          title: "授权绑定策略",
          prompt: "选择该固定授权请求的绑定策略。",
          riskSignal: "auth-oauth-authorization-binding",
          options: [
            {
              key: "accept-unbound-authorization",
              label: "接受未绑定授权响应（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: "auth-oauth-binding-open",
              explanation:
                "授权响应不与原始客户端、回调地址和请求上下文绑定，攻击方可注入或替换授权响应。",
              nextStepKey: "authorization-response-decision",
              scoreDeltas: { "request-binding": 0 },
            },
            {
              key: "bind-authorization-request",
              label: "绑定回调地址、state 与 PKCE",
              outcome: "fix",
              decision: "blocked",
              signal: "auth-oauth-binding-enforced",
              explanation:
                "启用精确回调地址、state 和 PKCE 绑定后，未关联的授权响应被识别并进入处置路径。",
              nextStepKey: "authorization-response-decision",
              scoreDeltas: { "request-binding": 1 },
            },
          ],
        },
        {
          key: "authorization-response-decision",
          order: 2,
          title: "授权响应决策",
          prompt: "选择当前绑定策略下的授权响应处置方式。",
          riskSignal: "auth-oauth-authorization-response-decision",
          options: [
            {
              key: "accept-tampered-response",
              label: "直接接受被篡改授权响应（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: oauthRiskSignal,
              explanation:
                "漏洞版因授权响应没有与原始客户端、回调地址和请求上下文严格绑定接受了被篡改的授权响应。",
              nextStepKey: null,
              scoreDeltas: { "authorization-defense": 0 },
            },
            {
              key: "defense-blocks-tampered-response",
              label: "防御阻断被篡改授权响应",
              outcome: "fix",
              decision: "blocked",
              signal: oauthDefenseSignal,
              explanation:
                "修复版识别到高风险固定案例，并通过精确回调地址、state、nonce、PKCE 和最小 scope 阻断该授权响应。",
              nextStepKey: null,
              scoreDeltas: { "authorization-defense": 1 },
            },
            {
              key: "allow-verified-authorization",
              label: "校验通过后放行正常授权",
              outcome: "normal",
              decision: "accepted",
              signal: oauthNormalSignal,
              explanation:
                "修复版确认回调地址、state 与 PKCE 已校验，固定正常授权码流程可以继续。",
              nextStepKey: null,
              scoreDeltas: { "authorization-defense": 1 },
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

export type OauthWorkbench = {
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

export type OauthStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: "risk" | "fix" | "normal";
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type OauthEvaluationInput = {
  variantKey: OauthVariantKey;
  scenarioKey: string;
  decisions: string[];
};

export type OauthEvaluationResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: OauthVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: OauthStepResult[];
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

export type OauthLabService = {
  getWorkbench(): OauthWorkbench;
  evaluate(input: OauthEvaluationInput): OauthEvaluationResult;
};

function createBlockedResult(input: {
  variantKey: OauthVariantKey;
  matchedScenario: boolean;
  blockedReason: string;
}): OauthEvaluationResult {
  return {
    status: "blocked",
    labKey: oauthDefinition.id,
    variantKey: input.variantKey,
    scenarioKey: input.matchedScenario ? oauthScenarioKey : "blocked-scenario",
    decision: "blocked",
    signal: "auth-oauth-boundary-blocked",
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
      riskLevel: oauthDefinition.severity,
      stepCount: 0,
      matchedScenario: input.matchedScenario,
    },
    blockedReason: input.blockedReason,
  };
}

function buildNextStep(input: {
  variantKey: OauthVariantKey;
  terminalOutcome: "risk" | "fix" | "normal" | null;
}) {
  if (input.variantKey === "vuln") {
    return "切换到修复版并沿用同一固定案例，对比授权绑定策略与授权响应决策如何改变判定。";
  }

  if (input.terminalOutcome === "fix") {
    return "复盘防御拦截信号后，选择“校验通过后放行正常授权”验证修复后的正常流程。";
  }

  return "在实验事件日志中确认固定 key、决策路径和学习信号已形成安全摘要。";
}

export function createOauthLabService(): OauthLabService {
  return {
    getWorkbench() {
      return {
        id: oauthDefinition.id,
        slug: oauthDefinition.slug,
        category: oauthDefinition.category,
        subcategory: oauthDefinition.subcategory,
        title: oauthDefinition.title,
        mode: oauthDefinition.mode,
        severity: oauthDefinition.severity,
        difficulty: oauthDefinition.difficulty,
        summary: oauthDefinition.summary,
        defaultScenarioKey: oauthDefinition.defaultCaseKey,
        scoringDimensions: oauthDefinition.scoringDimensions,
        cases: oauthDefinition.cases,
        safeBoundaries: oauthDefinition.safeBoundaries,
        notes: oauthDefinition.notes,
      };
    },

    evaluate(input) {
      if (input.scenarioKey !== oauthScenarioKey) {
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
        oauthDefinition,
        oauthScenarioKey,
      );
      const steps: OauthStepResult[] = [];

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
        labKey: oauthDefinition.id,
        variantKey: input.variantKey,
        scenarioKey: oauthScenarioKey,
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
          riskLevel: oauthDefinition.severity,
          stepCount: steps.length,
          matchedScenario: true,
        },
        ...(terminal.decision === "blocked"
          ? { blockedReason: "oauth-defense-applied" }
          : {}),
      };
    },
  };
}

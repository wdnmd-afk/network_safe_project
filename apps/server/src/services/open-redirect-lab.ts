import {
  createGuidedScenarioMachine,
  type GuidedScenarioV2Definition,
} from "@network-safe/shared/guided-scenarios-v2";

export type OpenRedirectVariantKey = "vuln" | "fixed";

// 三个 canonical 终止信号与既有 meta.json expectedSignals 保持一致，
// 保证 exploit.py、手工验证文档和事件日志向后兼容。
export const openRedirectRiskSignal = "web-open-redirect-risk-accepted";
export const openRedirectDefenseSignal = "web-open-redirect-defense-blocked";
export const openRedirectNormalSignal = "web-open-redirect-normal-verified";

export const openRedirectScenarioKey = "untrusted-return-target";

// 专用第二版定义：两步状态机（跳转目标来源 -> 重定向决策），只使用固定虚构选项。
const openRedirectDefinition: GuidedScenarioV2Definition = {
  version: 2,
  id: "web.open-redirect",
  slug: "open-redirect",
  category: "web",
  subcategory: "open-redirect",
  title: "开放重定向",
  mode: "interactive",
  severity: "medium",
  difficulty: "beginner",
  summary:
    "通过固定跳转场景的两步决策，对比直接信任跳转目标与站内相对路径、允许列表校验的差异。",
  phase: "phase-1",
  tags: ["web", "redirect", "input-validation"],
  knowledgePoints: ["重定向信任边界", "URL 规范化", "允许列表"],
  scoringDimensions: [
    {
      key: "target-hardening",
      title: "目标校验",
      description: "限制跳转目标只能是受信任的站内地址。",
      max: 1,
    },
    {
      key: "redirect-safety",
      title: "重定向安全",
      description: "重定向前是否完成规范化与允许列表校验。",
      max: 1,
    },
  ],
  defaultCaseKey: openRedirectScenarioKey,
  cases: [
    {
      key: openRedirectScenarioKey,
      title: "未受信任返回地址",
      description:
        "固定案例展示登录完成后直接采用未校验返回地址的风险，用两步决策观察目标来源策略和重定向处置。",
      assets: [
        {
          key: "return-parameter",
          kind: "asset",
          title: "固定返回地址参数",
          detail: "被观察的登录后返回地址参数，来自固定教学请求，不连接真实业务。",
        },
      ],
      evidence: [
        {
          key: "untrusted-target",
          kind: "evidence",
          title: "未受信任跳转目标",
          detail: "固定风险标签：跳转目标由外部输入直接控制。",
        },
        {
          key: "brand-abuse",
          kind: "evidence",
          title: "品牌信任滥用",
          detail: "固定风险标签：攻击方借站点信任跳转到外部诱导页面。",
        },
        {
          key: "redirect-chain",
          kind: "evidence",
          title: "重定向链",
          detail: "固定风险标签：多级跳转掩盖最终外部目标。",
        },
      ],
      initialStepKey: "target-source",
      steps: [
        {
          key: "target-source",
          order: 1,
          title: "跳转目标来源",
          prompt: "选择该固定登录返回地址的目标来源策略。",
          riskSignal: "web-open-redirect-target-source",
          options: [
            {
              key: "trust-user-supplied-target",
              label: "直接信任外部输入的目标（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: "web-open-redirect-target-open",
              explanation:
                "服务端直接信任外部输入的跳转目标，攻击方可把用户导向外部诱导页面。",
              nextStepKey: "redirect-decision",
              scoreDeltas: { "target-hardening": 0 },
            },
            {
              key: "enforce-target-allowlist",
              label: "启用站内相对路径与目标允许列表",
              outcome: "fix",
              decision: "blocked",
              signal: "web-open-redirect-target-restricted",
              explanation:
                "启用允许列表与站内相对路径约束后，非受信目标不再被接受。",
              nextStepKey: "redirect-decision",
              scoreDeltas: { "target-hardening": 1 },
            },
          ],
        },
        {
          key: "redirect-decision",
          order: 2,
          title: "重定向决策",
          prompt: "选择当前目标来源策略下的重定向处置方式。",
          riskSignal: "web-open-redirect-redirect-decision",
          options: [
            {
              key: "redirect-without-validation",
              label: "未校验直接重定向（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: openRedirectRiskSignal,
              explanation:
                "漏洞版因服务端直接信任跳转目标且没有规范化与允许列表接受了任意重定向。",
              nextStepKey: null,
              scoreDeltas: { "redirect-safety": 0 },
            },
            {
              key: "defense-blocks-untrusted-redirect",
              label: "防御拦截未受信任重定向",
              outcome: "fix",
              decision: "blocked",
              signal: openRedirectDefenseSignal,
              explanation:
                "修复版识别到高风险固定案例，并通过站内相对路径约束、规范化和目标允许列表阻断该跳转。",
              nextStepKey: null,
              scoreDeltas: { "redirect-safety": 1 },
            },
            {
              key: "redirect-to-verified-relative-path",
              label: "重定向到已校验的站内相对路径",
              outcome: "normal",
              decision: "accepted",
              signal: openRedirectNormalSignal,
              explanation:
                "修复版确认目标允许列表与规范化已落实，固定站内正常跳转流程可以继续。",
              nextStepKey: null,
              scoreDeltas: { "redirect-safety": 1 },
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

export type OpenRedirectWorkbench = {
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

export type OpenRedirectStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: "risk" | "fix" | "normal";
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type OpenRedirectEvaluationInput = {
  variantKey: OpenRedirectVariantKey;
  scenarioKey: string;
  decisions: string[];
};

export type OpenRedirectEvaluationResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: OpenRedirectVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: OpenRedirectStepResult[];
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

export type OpenRedirectLabService = {
  getWorkbench(): OpenRedirectWorkbench;
  evaluate(
    input: OpenRedirectEvaluationInput,
  ): OpenRedirectEvaluationResult;
};

function createBlockedResult(input: {
  variantKey: OpenRedirectVariantKey;
  matchedScenario: boolean;
  blockedReason: string;
}): OpenRedirectEvaluationResult {
  return {
    status: "blocked",
    labKey: openRedirectDefinition.id,
    variantKey: input.variantKey,
    scenarioKey: input.matchedScenario ? openRedirectScenarioKey : "blocked-scenario",
    decision: "blocked",
    signal: "web-open-redirect-boundary-blocked",
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
      riskLevel: openRedirectDefinition.severity,
      stepCount: 0,
      matchedScenario: input.matchedScenario,
    },
    blockedReason: input.blockedReason,
  };
}

function buildNextStep(input: {
  variantKey: OpenRedirectVariantKey;
  terminalOutcome: "risk" | "fix" | "normal" | null;
}) {
  if (input.variantKey === "vuln") {
    return "切换到修复版并沿用同一固定案例，对比目标来源策略与重定向决策如何改变判定。";
  }

  if (input.terminalOutcome === "fix") {
    return "复盘防御拦截信号后，选择“重定向到已校验的站内相对路径”验证修复后的正常流程。";
  }

  return "在实验事件日志中确认固定 key、决策路径和学习信号已形成安全摘要。";
}

export function createOpenRedirectLabService(): OpenRedirectLabService {
  return {
    getWorkbench() {
      return {
        id: openRedirectDefinition.id,
        slug: openRedirectDefinition.slug,
        category: openRedirectDefinition.category,
        subcategory: openRedirectDefinition.subcategory,
        title: openRedirectDefinition.title,
        mode: openRedirectDefinition.mode,
        severity: openRedirectDefinition.severity,
        difficulty: openRedirectDefinition.difficulty,
        summary: openRedirectDefinition.summary,
        defaultScenarioKey: openRedirectDefinition.defaultCaseKey,
        scoringDimensions: openRedirectDefinition.scoringDimensions,
        cases: openRedirectDefinition.cases,
        safeBoundaries: openRedirectDefinition.safeBoundaries,
        notes: openRedirectDefinition.notes,
      };
    },

    evaluate(input) {
      if (input.scenarioKey !== openRedirectScenarioKey) {
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
        openRedirectDefinition,
        openRedirectScenarioKey,
      );
      const steps: OpenRedirectStepResult[] = [];

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
        labKey: openRedirectDefinition.id,
        variantKey: input.variantKey,
        scenarioKey: openRedirectScenarioKey,
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
          riskLevel: openRedirectDefinition.severity,
          stepCount: steps.length,
          matchedScenario: true,
        },
        ...(terminal.decision === "blocked"
          ? { blockedReason: "open-redirect-defense-applied" }
          : {}),
      };
    },
  };
}

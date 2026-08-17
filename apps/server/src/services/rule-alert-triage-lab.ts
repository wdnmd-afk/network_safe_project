import {
  analyzeFixedDetectionRule,
  fixedSecurityEventDataset,
  type FixedDetectionRuleAnalysis,
  type FixedSecurityEventDataset,
} from "@network-safe/shared/fixed-security-events";
import {
  createGuidedScenarioMachine,
  type GuidedScenarioV2Definition,
} from "@network-safe/shared/guided-scenarios-v2";

export type RuleAlertTriageVariantKey = "vuln" | "fixed";

export const ruleAlertTriageScenarioKey =
  "fixed-auth-process-alert-timeline";
export const ruleAlertTriageRiskSignal =
  "detection-rule-alert-triage-risk-accepted";
export const ruleAlertTriageDefenseSignal =
  "detection-rule-alert-triage-defense-escalated";
export const ruleAlertTriageNormalSignal =
  "detection-rule-alert-triage-normal-verified";
export const ruleAlertTriageBoundarySignal =
  "detection-rule-alert-triage-boundary-blocked";

const ruleProfileByAssessmentOption = {
  "trust-broad-single-signal-rule": "broad-auth-failure-rule",
  "trust-narrow-single-signal-rule": "narrow-unsigned-process-rule",
  "correlate-multi-source-signals":
    "correlated-auth-process-network-rule",
} as const;

const triageSummaries = {
  "dismiss-correlated-alert-as-noise": {
    actionKey: "dismiss-correlated-alert-as-noise",
    disposition: "dismissed-as-noise",
    summary: "关联告警被直接当作噪声关闭，固定多源证据未进入处置流程。",
    nextAction: "保留风险接受结果并复盘被忽略的认证、进程与网络证据。",
  },
  "escalate-correlated-alert-for-containment": {
    actionKey: "escalate-correlated-alert-for-containment",
    disposition: "escalated-for-containment",
    summary: "固定多源证据达到升级条件，进入受控隔离与调查的教学处置结论。",
    nextAction: "复盘关联规则指标和升级依据，不执行任何真实隔离动作。",
  },
  "close-known-maintenance-with-evidence": {
    actionKey: "close-known-maintenance-with-evidence",
    disposition: "closed-known-maintenance",
    summary: "已知维护事件与登记窗口一致，基于固定证据正常关闭。",
    nextAction: "保留维护证据摘要并确认可疑关联时间线仍被单独处置。",
  },
} as const;

type RuleAssessmentOptionKey = keyof typeof ruleProfileByAssessmentOption;
type TriageActionKey = keyof typeof triageSummaries;

const ruleAlertTriageDefinition: GuidedScenarioV2Definition = {
  version: 2,
  id: "detection.rule-alert-triage",
  slug: "rule-alert-triage",
  category: "detection",
  subcategory: "rule-alert-triage",
  title: "固定检测规则匹配与告警研判",
  mode: "simulation",
  severity: "high",
  difficulty: "intermediate",
  summary:
    "使用固定脱敏事件，对比过宽、过窄和跨来源关联规则的误报漏报，并完成告警研判决策。",
  phase: "phase-1",
  tags: ["detection", "alert-triage", "false-positive", "false-negative"],
  knowledgePoints: ["固定规则画像", "误报与漏报", "多源证据关联", "告警研判"],
  scoringDimensions: [
    {
      key: "rule-quality",
      title: "规则质量评估",
      description: "根据固定基线识别单信号规则的误报、漏报与关联规则差异。",
      max: 1,
    },
    {
      key: "triage-decision",
      title: "告警研判决策",
      description: "根据固定多源证据选择风险接受、升级处置或正常关闭。",
      max: 1,
    },
  ],
  defaultCaseKey: ruleAlertTriageScenarioKey,
  cases: [
    {
      key: ruleAlertTriageScenarioKey,
      title: "固定认证、进程与网络告警时间线",
      description:
        "六条虚构事件和三组预登记规则画像用于确定性观察误报、漏报和研判结果。",
      assets: [
        {
          key: "fixed-event-timeline",
          kind: "asset",
          title: "固定脱敏事件时间线",
          detail: "仅包含相对时间、虚构来源、固定标签和教学基线，不读取真实日志。",
        },
        {
          key: "fixed-rule-profiles",
          kind: "policy",
          title: "预登记规则画像",
          detail: "规则只引用固定 eventId，不保存、解析或执行任何查询表达式。",
        },
      ],
      evidence: [
        {
          key: "multi-source-suspicious-chain",
          kind: "evidence",
          title: "跨来源可疑证据链",
          detail: "固定认证失败、异常登录、未签名进程和异常出口事件形成关联时间线。",
        },
        {
          key: "known-maintenance-baseline",
          kind: "evidence",
          title: "已知维护基线",
          detail: "签名维护任务和单次认证重试提供固定正常事件对照。",
        },
      ],
      initialStepKey: "rule-profile-assessment",
      steps: [
        {
          key: "rule-profile-assessment",
          order: 1,
          title: "规则画像评估",
          prompt: "选择用于分析固定事件时间线的规则画像。",
          riskSignal: "detection-rule-alert-triage-rule-assessment",
          options: [
            {
              key: "trust-broad-single-signal-rule",
              label: "信任过宽认证单信号规则（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: "detection-rule-alert-triage-broad-rule-trusted",
              explanation: "过宽规则同时命中可疑认证事件和一次正常重试，产生误报并遗漏跨源证据。",
              nextStepKey: "alert-triage-decision",
              scoreDeltas: { "rule-quality": 0 },
            },
            {
              key: "trust-narrow-single-signal-rule",
              label: "信任过窄进程单信号规则（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: "detection-rule-alert-triage-narrow-rule-trusted",
              explanation: "过窄规则只命中未签名进程，遗漏认证与网络侧的固定可疑事件。",
              nextStepKey: "alert-triage-decision",
              scoreDeltas: { "rule-quality": 0 },
            },
            {
              key: "correlate-multi-source-signals",
              label: "关联认证、进程与网络信号",
              outcome: "fix",
              decision: "blocked",
              signal: "detection-rule-alert-triage-signals-correlated",
              explanation: "关联规则命中四条固定可疑事件，并排除已知维护和单次认证重试。",
              nextStepKey: "alert-triage-decision",
              scoreDeltas: { "rule-quality": 1 },
            },
          ],
        },
        {
          key: "alert-triage-decision",
          order: 2,
          title: "告警研判处置",
          prompt: "根据固定规则指标和证据链选择研判结论。",
          riskSignal: "detection-rule-alert-triage-decision",
          options: [
            {
              key: "dismiss-correlated-alert-as-noise",
              label: "把关联告警当作噪声关闭（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: ruleAlertTriageRiskSignal,
              explanation: "漏洞版忽略固定多源证据并关闭告警，使可疑时间线未进入处置。",
              nextStepKey: null,
              scoreDeltas: { "triage-decision": 0 },
            },
            {
              key: "escalate-correlated-alert-for-containment",
              label: "按多源证据升级研判",
              outcome: "fix",
              decision: "blocked",
              signal: ruleAlertTriageDefenseSignal,
              explanation: "修复版确认固定关联证据并升级受控处置结论，不执行真实隔离。",
              nextStepKey: null,
              scoreDeltas: { "triage-decision": 1 },
            },
            {
              key: "close-known-maintenance-with-evidence",
              label: "凭维护证据正常关闭",
              outcome: "normal",
              decision: "accepted",
              signal: ruleAlertTriageNormalSignal,
              explanation: "修复版依据登记维护窗口和签名任务摘要关闭正常事件，同时保留可疑链路。",
              nextStepKey: null,
              scoreDeltas: { "triage-decision": 1 },
            },
          ],
        },
      ],
    },
  ],
  safeBoundaries: [
    "只使用共享包中的固定脱敏教学事件，不连接真实 SIEM、EDR、日志源或主机。",
    "规则画像只登记固定 eventId 命中集合，不保存、解析或执行 Sigma、YARA、正则或查询表达式。",
    "页面和 API 只接受已登记 scenarioKey 与 optionKey，未知输入会被脱敏阻断。",
    "研判结果仅为教学摘要，不执行真实隔离、封禁、告警关闭或其他处置动作。",
  ],
  notes:
    "固定事件数据集与平台 lab_event_logs 分离；后者只记录本实验的固定 key、指标计数和学习信号。",
};

export type RuleAlertTriageWorkbench = {
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
  dataset: FixedSecurityEventDataset;
  ruleAnalyses: FixedDetectionRuleAnalysis[];
};

export type RuleAlertTriageStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: "risk" | "fix" | "normal";
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type RuleAlertTriageSummary =
  (typeof triageSummaries)[TriageActionKey];

export type RuleAlertTriageEvaluationInput = {
  variantKey: RuleAlertTriageVariantKey;
  scenarioKey: string;
  decisions: string[];
};

export type RuleAlertTriageEvaluationResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: RuleAlertTriageVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: RuleAlertTriageStepResult[];
  ruleAnalysis: FixedDetectionRuleAnalysis | null;
  triage: RuleAlertTriageSummary | null;
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

export type RuleAlertTriageLabService = {
  getWorkbench(): RuleAlertTriageWorkbench;
  evaluate(
    input: RuleAlertTriageEvaluationInput,
  ): RuleAlertTriageEvaluationResult;
};

function createBlockedResult(input: {
  variantKey: RuleAlertTriageVariantKey;
  matchedScenario: boolean;
  blockedReason: string;
}): RuleAlertTriageEvaluationResult {
  return {
    status: "blocked",
    labKey: ruleAlertTriageDefinition.id,
    variantKey: input.variantKey,
    scenarioKey: input.matchedScenario
      ? ruleAlertTriageScenarioKey
      : "blocked-scenario",
    decision: "blocked",
    signal: ruleAlertTriageBoundarySignal,
    message: "请求中的固定案例或决策未登记，服务未处理也未回显原始输入。",
    nextStep: "只选择工作台返回的固定 scenarioKey 与决策选项。",
    completed: false,
    steps: [],
    ruleAnalysis: null,
    triage: null,
    recap: {
      outcomeCounts: { risk: 0, fix: 0, normal: 0 },
      scores: {},
      terminalOutcome: null,
    },
    assessment: {
      riskLevel: ruleAlertTriageDefinition.severity,
      stepCount: 0,
      matchedScenario: input.matchedScenario,
    },
    blockedReason: input.blockedReason,
  };
}

function buildNextStep(input: {
  variantKey: RuleAlertTriageVariantKey;
  terminalOutcome: "risk" | "fix" | "normal" | null;
}) {
  if (input.variantKey === "vuln") {
    return "切换到修复版并沿用同一固定时间线，对比跨源关联和证据研判如何改变结果。";
  }

  if (input.terminalOutcome === "fix") {
    return "复盘关联规则的误报漏报指标后，再验证已知维护事件的正常关闭路径。";
  }

  return "在实验事件日志中确认只记录固定 key、指标计数、终止结果和学习信号。";
}

function readRuleProfileKey(optionKey: string) {
  return ruleProfileByAssessmentOption[optionKey as RuleAssessmentOptionKey];
}

function readTriageSummary(optionKey: string) {
  return triageSummaries[optionKey as TriageActionKey];
}

export function createRuleAlertTriageLabService(): RuleAlertTriageLabService {
  const ruleAnalyses = fixedSecurityEventDataset.ruleProfiles.map((profile) => {
    const analysis = analyzeFixedDetectionRule(
      fixedSecurityEventDataset,
      profile.key,
    );

    if (!analysis) {
      throw new Error(`missing fixed rule profile analysis: ${profile.key}`);
    }

    return analysis;
  });

  return {
    getWorkbench() {
      return {
        id: ruleAlertTriageDefinition.id,
        slug: ruleAlertTriageDefinition.slug,
        category: ruleAlertTriageDefinition.category,
        subcategory: ruleAlertTriageDefinition.subcategory,
        title: ruleAlertTriageDefinition.title,
        mode: ruleAlertTriageDefinition.mode,
        severity: ruleAlertTriageDefinition.severity,
        difficulty: ruleAlertTriageDefinition.difficulty,
        summary: ruleAlertTriageDefinition.summary,
        defaultScenarioKey: ruleAlertTriageDefinition.defaultCaseKey,
        scoringDimensions: ruleAlertTriageDefinition.scoringDimensions,
        cases: ruleAlertTriageDefinition.cases,
        safeBoundaries: [...ruleAlertTriageDefinition.safeBoundaries],
        notes: ruleAlertTriageDefinition.notes,
        dataset: structuredClone(fixedSecurityEventDataset),
        ruleAnalyses: structuredClone(ruleAnalyses),
      };
    },

    evaluate(input) {
      if (input.scenarioKey !== ruleAlertTriageScenarioKey) {
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
        ruleAlertTriageDefinition,
        ruleAlertTriageScenarioKey,
      );
      const steps: RuleAlertTriageStepResult[] = [];

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
      const ruleProfileKey = readRuleProfileKey(steps[0].optionKey);
      const triage = readTriageSummary(terminal.optionKey);
      const ruleAnalysis = ruleProfileKey
        ? analyzeFixedDetectionRule(fixedSecurityEventDataset, ruleProfileKey)
        : null;

      // 状态机已经校验 optionKey；这里仍要求两个固定摘要均存在，防止定义与映射漂移。
      if (!ruleAnalysis || !triage) {
        return createBlockedResult({
          variantKey: input.variantKey,
          matchedScenario: true,
          blockedReason: "registered-summary-missing",
        });
      }

      return {
        status: terminal.decision === "blocked" ? "blocked" : "ok",
        labKey: ruleAlertTriageDefinition.id,
        variantKey: input.variantKey,
        scenarioKey: ruleAlertTriageScenarioKey,
        decision: terminal.decision,
        signal: terminal.signal,
        message: terminal.explanation,
        nextStep: buildNextStep({
          variantKey: input.variantKey,
          terminalOutcome: recap.terminalOutcome,
        }),
        completed: true,
        steps,
        ruleAnalysis,
        triage,
        recap: {
          outcomeCounts: recap.outcomeCounts,
          scores: recap.scores,
          terminalOutcome: recap.terminalOutcome,
        },
        assessment: {
          riskLevel: ruleAlertTriageDefinition.severity,
          stepCount: steps.length,
          matchedScenario: true,
        },
        ...(terminal.decision === "blocked"
          ? { blockedReason: "correlated-alert-escalated" }
          : {}),
      };
    },
  };
}

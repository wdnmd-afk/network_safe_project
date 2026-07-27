import {
  createGuidedScenarioMachine,
  type GuidedScenarioV2Definition,
} from "@network-safe/shared/guided-scenarios-v2";

export type RansomwareVariantKey = "vuln" | "fixed";

// 三个 canonical 终止信号与既有 meta.json expectedSignals 保持一致，
// 保证手工验证文档和事件日志向后兼容。
export const ransomwareRiskSignal = "malware-ransomware-risk-accepted";
export const ransomwareDefenseSignal = "malware-ransomware-defense-blocked";
export const ransomwareNormalSignal = "malware-ransomware-normal-verified";

export const ransomwareScenarioKey = "synthetic-encryption-behavior";

// 专用第二版定义：两步证据分析状态机（行为关联策略 -> 主机处置决策）。
// case-study 高风险例外：只展示固定虚构行为时间线，不创建或执行真实样本。
const ransomwareDefinition: GuidedScenarioV2Definition = {
  version: 2,
  id: "malware.ransomware",
  slug: "ransomware",
  category: "malware",
  subcategory: "ransomware",
  title: "勒索软件",
  mode: "case-study",
  severity: "critical",
  difficulty: "intermediate",
  summary:
    "通过固定行为时间线的两步证据分析，对比异常文件行为未被关联与快速检测、隔离、离线恢复的差异。",
  phase: "phase-3",
  tags: ["malware", "ransomware", "case-study"],
  knowledgePoints: ["勒索行为前兆", "主机隔离", "备份恢复"],
  scoringDimensions: [
    {
      key: "behavior-detection",
      title: "行为检测",
      description: "把异常文件行为快速关联为高风险事件。",
      max: 1,
    },
    {
      key: "containment-recovery",
      title: "隔离恢复",
      description: "对高风险主机施加隔离并从离线备份恢复。",
      max: 1,
    },
  ],
  defaultCaseKey: ransomwareScenarioKey,
  cases: [
    {
      key: ransomwareScenarioKey,
      title: "虚构批量文件变更时间线",
      description:
        "固定虚构行为时间线展示异常扩展名、影子副本操作意图和共享目录访问，用两步证据分析观察行为关联策略和主机处置。",
      assets: [
        {
          key: "behavior-timeline",
          kind: "timeline",
          title: "固定行为时间线",
          detail:
            "被观察的固定虚构行为时间线，只含行为标签和顺序，不含真实文件、样本或加密操作。",
        },
      ],
      evidence: [
        {
          key: "mass-file-change",
          kind: "evidence",
          title: "批量文件变更",
          detail: "固定风险标签：短时间内大量文件被改名或改写扩展名。",
        },
        {
          key: "backup-impact",
          kind: "evidence",
          title: "备份影响意图",
          detail: "固定风险标签：出现删除或篡改影子副本、备份的意图。",
        },
        {
          key: "share-enumeration",
          kind: "evidence",
          title: "共享目录枚举",
          detail: "固定风险标签：进程枚举并访问网络共享目录。",
        },
      ],
      initialStepKey: "behavior-correlation",
      steps: [
        {
          key: "behavior-correlation",
          order: 1,
          title: "行为关联策略",
          prompt: "选择对该固定异常文件行为时间线的关联策略。",
          riskSignal: "malware-ransomware-behavior-correlation",
          options: [
            {
              key: "ignore-anomalous-file-behavior",
              label: "忽略异常文件行为（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: "malware-ransomware-correlation-open",
              explanation:
                "终端异常文件行为未被快速关联，批量加密前兆得以继续，缺少检测与响应触发。",
              nextStepKey: "containment-decision",
              scoreDeltas: { "behavior-detection": 0 },
            },
            {
              key: "correlate-and-detect-behavior",
              label: "关联行为并触发检测",
              outcome: "fix",
              decision: "blocked",
              signal: "malware-ransomware-correlation-enabled",
              explanation:
                "把批量文件变更、备份影响和共享枚举关联为高风险事件后，异常行为被识别并进入处置路径。",
              nextStepKey: "containment-decision",
              scoreDeltas: { "behavior-detection": 1 },
            },
          ],
        },
        {
          key: "containment-decision",
          order: 2,
          title: "主机处置决策",
          prompt: "选择当前行为关联策略下的主机处置方式。",
          riskSignal: "malware-ransomware-containment-decision",
          options: [
            {
              key: "allow-unrestricted-encryption",
              label: "放任不受限加密行为（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: ransomwareRiskSignal,
              explanation:
                "漏洞版因终端异常文件行为未被快速关联、隔离和限制权限接受了持续加密行为。",
              nextStepKey: null,
              scoreDeltas: { "containment-recovery": 0 },
            },
            {
              key: "isolate-and-block-host",
              label: "隔离并阻断高风险主机",
              outcome: "fix",
              decision: "blocked",
              signal: ransomwareDefenseSignal,
              explanation:
                "修复版识别到高风险固定案例，并通过行为检测、网络隔离和最小权限阻断该主机的加密行为。",
              nextStepKey: null,
              scoreDeltas: { "containment-recovery": 1 },
            },
            {
              key: "restore-from-offline-backup",
              label: "从离线备份恢复正常业务",
              outcome: "normal",
              decision: "accepted",
              signal: ransomwareNormalSignal,
              explanation:
                "修复版确认隔离与离线备份恢复演练已落实，固定正常业务在恢复后可以继续。",
              nextStepKey: null,
              scoreDeltas: { "containment-recovery": 1 },
            },
          ],
        },
      ],
    },
  ],
  safeBoundaries: [
    "勒索软件按 case-study ready 例外收口，只代表固定案例学习闭环完成。",
    "只展示固定行为时间线和防御选择，不创建、下载或执行恶意样本。",
    "页面和 API 只接受本实验声明的固定 scenarioKey 与决策 optionKey。",
    "未知 key 会被脱敏阻断，不写入原始输入或外部目标信息。",
  ],
  notes:
    "该实验按 case-study ready 例外收口，不提供 exploit.py、攻击脚本、外部连接或真实样本。",
};

export type RansomwareWorkbench = {
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

export type RansomwareStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: "risk" | "fix" | "normal";
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type RansomwareEvaluationInput = {
  variantKey: RansomwareVariantKey;
  scenarioKey: string;
  decisions: string[];
};

export type RansomwareEvaluationResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: RansomwareVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: RansomwareStepResult[];
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

export type RansomwareLabService = {
  getWorkbench(): RansomwareWorkbench;
  evaluate(input: RansomwareEvaluationInput): RansomwareEvaluationResult;
};

function createBlockedResult(input: {
  variantKey: RansomwareVariantKey;
  matchedScenario: boolean;
  blockedReason: string;
}): RansomwareEvaluationResult {
  return {
    status: "blocked",
    labKey: ransomwareDefinition.id,
    variantKey: input.variantKey,
    scenarioKey: input.matchedScenario
      ? ransomwareScenarioKey
      : "blocked-scenario",
    decision: "blocked",
    signal: "malware-ransomware-boundary-blocked",
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
      riskLevel: ransomwareDefinition.severity,
      stepCount: 0,
      matchedScenario: input.matchedScenario,
    },
    blockedReason: input.blockedReason,
  };
}

function buildNextStep(input: {
  variantKey: RansomwareVariantKey;
  terminalOutcome: "risk" | "fix" | "normal" | null;
}) {
  if (input.variantKey === "vuln") {
    return "切换到修复版并沿用同一固定案例，对比行为关联策略与主机处置决策如何改变判定。";
  }

  if (input.terminalOutcome === "fix") {
    return "复盘防御拦截信号后，选择“从离线备份恢复正常业务”验证修复后的正常流程。";
  }

  return "在实验事件日志中确认固定 key、决策路径和学习信号已形成安全摘要。";
}

export function createRansomwareLabService(): RansomwareLabService {
  return {
    getWorkbench() {
      return {
        id: ransomwareDefinition.id,
        slug: ransomwareDefinition.slug,
        category: ransomwareDefinition.category,
        subcategory: ransomwareDefinition.subcategory,
        title: ransomwareDefinition.title,
        mode: ransomwareDefinition.mode,
        severity: ransomwareDefinition.severity,
        difficulty: ransomwareDefinition.difficulty,
        summary: ransomwareDefinition.summary,
        defaultScenarioKey: ransomwareDefinition.defaultCaseKey,
        scoringDimensions: ransomwareDefinition.scoringDimensions,
        cases: ransomwareDefinition.cases,
        safeBoundaries: ransomwareDefinition.safeBoundaries,
        notes: ransomwareDefinition.notes,
      };
    },

    evaluate(input) {
      if (input.scenarioKey !== ransomwareScenarioKey) {
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
        ransomwareDefinition,
        ransomwareScenarioKey,
      );
      const steps: RansomwareStepResult[] = [];

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
        labKey: ransomwareDefinition.id,
        variantKey: input.variantKey,
        scenarioKey: ransomwareScenarioKey,
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
          riskLevel: ransomwareDefinition.severity,
          stepCount: steps.length,
          matchedScenario: true,
        },
        ...(terminal.decision === "blocked"
          ? { blockedReason: "ransomware-defense-applied" }
          : {}),
      };
    },
  };
}

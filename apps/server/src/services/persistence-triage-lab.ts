import {
  createGuidedScenarioMachine,
  type GuidedScenarioV2Definition,
} from "@network-safe/shared/guided-scenarios-v2";

export type PersistenceTriageVariantKey = "vuln" | "fixed";

export const persistenceTriageScenarioKey =
  "fixed-windows-autorun-persistence-timeline";
export const persistenceTriageRiskSignal =
  "host-persistence-triage-risk-accepted";
export const persistenceTriageDefenseSignal =
  "host-persistence-triage-defense-blocked";
export const persistenceTriageNormalSignal =
  "host-persistence-triage-normal-verified";
export const persistenceTriageBoundarySignal =
  "host-persistence-triage-boundary-blocked";

export type FixedPersistenceEntrySnapshot = {
  readonly entryKey: string;
  readonly displayName: string;
  readonly signatureScope: "unsigned" | "publisher-verified";
  readonly imagePathAclScope: "user-writable" | "admin-only-writable";
  readonly triggerScope: "logon-high-frequency" | "scheduled-window";
  readonly runAccountScope: "high-privilege-account" | "least-privilege-account";
  readonly auditScope: "none" | "change-audited-and-alerted";
  readonly tamperableByStandardUser: boolean;
  readonly expectedPosture: "vulnerable" | "hardened";
  readonly findings: readonly string[];
};

export type PersistenceEntryAssessment = {
  entryKey: string;
  expectedPosture: FixedPersistenceEntrySnapshot["expectedPosture"];
  findingCount: number;
  criticalFindingCount: number;
  hardeningControlCount: number;
};

// 固定持久化条目快照只使用虚构标识，不含真实注册表路径、任务名或账户名
export const fixedPersistenceEntrySnapshots: readonly FixedPersistenceEntrySnapshot[] =
  Object.freeze([
    Object.freeze({
      entryKey: "virtual-unsigned-autorun-entry",
      displayName: "虚构未签名自启条目（风险基线）",
      signatureScope: "unsigned",
      imagePathAclScope: "user-writable",
      triggerScope: "logon-high-frequency",
      runAccountScope: "high-privilege-account",
      auditScope: "none",
      tamperableByStandardUser: true,
      expectedPosture: "vulnerable",
      findings: Object.freeze([
        "条目镜像未签名，无法确认发布者来源。",
        "镜像路径允许低权限用户写入，条目内容可被替换。",
        "登录即触发且频率过高，异常行为不易被察觉。",
        "缺少变更审计与告警，持久化改动无留痕。",
      ]),
    }),
    Object.freeze({
      entryKey: "virtual-signed-managed-task",
      displayName: "虚构受控计划任务（加固基线）",
      signatureScope: "publisher-verified",
      imagePathAclScope: "admin-only-writable",
      triggerScope: "scheduled-window",
      runAccountScope: "least-privilege-account",
      auditScope: "change-audited-and-alerted",
      tamperableByStandardUser: false,
      expectedPosture: "hardened",
      findings: Object.freeze([]),
    }),
  ]);

export function assessFixedPersistenceEntry(
  entry: FixedPersistenceEntrySnapshot,
): PersistenceEntryAssessment {
  const unsigned = entry.signatureScope === "unsigned";
  const userWritable = entry.imagePathAclScope === "user-writable";
  const highPrivilege = entry.runAccountScope === "high-privilege-account";
  const missingAudit = entry.auditScope === "none";

  return {
    entryKey: entry.entryKey,
    expectedPosture: entry.expectedPosture,
    findingCount: entry.findings.length,
    // 关键风险只统计"未签名且路径可写"与"高权限运行且无审计"两类组合，不放大单一属性
    criticalFindingCount:
      Number(unsigned && userWritable) + Number(highPrivilege && missingAudit),
    hardeningControlCount:
      Number(entry.signatureScope === "publisher-verified") +
      Number(entry.imagePathAclScope === "admin-only-writable") +
      Number(entry.triggerScope === "scheduled-window") +
      Number(entry.runAccountScope === "least-privilege-account") +
      Number(entry.auditScope === "change-audited-and-alerted"),
  };
}

const entryKeyByAssessmentOption = {
  "accept-unsigned-autorun-entry": "virtual-unsigned-autorun-entry",
  "harden-signature-and-path-acl": "virtual-signed-managed-task",
} as const;

const persistenceDecisions = {
  "approve-persistence-retention": {
    actionKey: "approve-persistence-retention",
    disposition: "persistence-retention-approved",
    summary:
      "未签名且路径可写的自启条目被批准保留，持久化与提权风险未被阻断。",
    nextAction: "切换到加固路径，复盘签名、路径 ACL、触发窗口与审计的组合作用。",
  },
  "block-and-remove-persistence": {
    actionKey: "block-and-remove-persistence",
    disposition: "persistence-retention-blocked",
    summary:
      "固定基线阻断可疑持久化条目，并要求签名验证、路径收敛与变更审计。",
    nextAction: "核对五项加固控制均已登记，不修改任何真实计划任务或启动项。",
  },
  "verify-managed-autorun-baseline": {
    actionKey: "verify-managed-autorun-baseline",
    disposition: "managed-autorun-baseline-verified",
    summary:
      "已签名、仅管理员可写、受控触发窗口与最小权限账户组成的固定基线通过复核。",
    nextAction: "在事件日志中确认只保留固定条目 key、计数与学习信号。",
  },
} as const;

type AssessmentOptionKey = keyof typeof entryKeyByAssessmentOption;
type PersistenceDecisionKey = keyof typeof persistenceDecisions;

const persistenceTriageDefinition: GuidedScenarioV2Definition = {
  version: 2,
  id: "host.persistence-triage",
  slug: "persistence-triage",
  category: "host",
  subcategory: "persistence-triage",
  title: "Windows 计划任务与启动项持久化固定研判",
  mode: "case-study",
  severity: "high",
  difficulty: "intermediate",
  summary:
    "对比两份虚构持久化条目快照的签名、路径 ACL、触发方式、运行账户与审计状态，完成持久化处置决策。",
  phase: "phase-1",
  tags: ["host", "windows-persistence", "autorun", "scheduled-task"],
  knowledgePoints: [
    "镜像签名与发布者验证",
    "镜像路径 ACL 收敛",
    "触发方式与运行账户范围",
    "变更审计与告警留痕",
  ],
  scoringDimensions: [
    {
      key: "persistence-assessment",
      title: "持久化范围评估",
      description: "识别签名、路径 ACL、触发方式、账户与审计的组合风险。",
      max: 1,
    },
    {
      key: "persistence-decision",
      title: "持久化处置决策",
      description: "阻断可疑持久化并确认受控自启基线。",
      max: 1,
    },
  ],
  defaultCaseKey: persistenceTriageScenarioKey,
  cases: [
    {
      key: persistenceTriageScenarioKey,
      title: "固定 Windows 持久化条目研判",
      description:
        "对比一份未签名可写路径的风险自启条目和一份受控计划任务，不读取或修改真实主机状态。",
      assets: [
        {
          key: "fixed-persistence-snapshots",
          kind: "asset",
          title: "虚构持久化条目快照",
          detail:
            "只登记 virtual-* 标识与五要素语义枚举，不含真实注册表路径、任务名或账户名。",
        },
        {
          key: "fixed-managed-autorun-policy",
          kind: "policy",
          title: "固定受控自启基线",
          detail:
            "要求发布者验证、仅管理员可写路径、受控触发窗口、最小权限账户与变更审计。",
        },
      ],
      evidence: [
        {
          key: "unsigned-user-writable-entry",
          kind: "evidence",
          title: "未签名且路径可写组合",
          detail:
            "固定风险条目同时具备未签名镜像、低权限用户可写路径与缺失审计。",
        },
        {
          key: "managed-autorun-baseline",
          kind: "evidence",
          title: "受控自启基线",
          detail: "固定加固条目登记五项收敛控制且标准用户不可篡改。",
        },
      ],
      initialStepKey: "persistence-scope-assessment",
      steps: [
        {
          key: "persistence-scope-assessment",
          order: 1,
          title: "持久化范围评估",
          prompt: "选择对固定虚构持久化条目的研判策略。",
          riskSignal: "host-persistence-triage-assessment",
          options: [
            {
              key: "accept-unsigned-autorun-entry",
              label: "接受未签名且路径可写的自启条目（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: "host-persistence-triage-unsigned-accepted",
              explanation:
                "漏洞路径忽略未签名镜像与可写路径叠加造成的替换与提权可达性。",
              nextStepKey: "persistence-disposition",
              scoreDeltas: { "persistence-assessment": 0 },
            },
            {
              key: "harden-signature-and-path-acl",
              label: "收敛签名验证、路径 ACL、触发窗口与运行账户",
              outcome: "fix",
              decision: "blocked",
              signal: "host-persistence-triage-controls-hardened",
              explanation:
                "修复路径要求发布者验证、仅管理员可写路径、受控触发、最小权限账户与变更审计同时成立。",
              nextStepKey: "persistence-disposition",
              scoreDeltas: { "persistence-assessment": 1 },
            },
          ],
        },
        {
          key: "persistence-disposition",
          order: 2,
          title: "持久化处置",
          prompt: "根据固定研判摘要选择持久化处置结论。",
          riskSignal: "host-persistence-triage-decision",
          options: [
            {
              key: "approve-persistence-retention",
              label: "批准可疑持久化条目继续保留（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: persistenceTriageRiskSignal,
              explanation:
                "漏洞版批准固定可疑自启条目，使持久化与提权风险继续存在。",
              nextStepKey: null,
              scoreDeltas: { "persistence-decision": 0 },
            },
            {
              key: "block-and-remove-persistence",
              label: "阻断并移除可疑持久化条目",
              outcome: "fix",
              decision: "blocked",
              signal: persistenceTriageDefenseSignal,
              explanation:
                "修复版阻断固定可疑持久化路径，不修改任何真实计划任务或启动项。",
              nextStepKey: null,
              scoreDeltas: { "persistence-decision": 1 },
            },
            {
              key: "verify-managed-autorun-baseline",
              label: "验证受控自启正常基线",
              outcome: "normal",
              decision: "accepted",
              signal: persistenceTriageNormalSignal,
              explanation:
                "修复版确认签名、路径 ACL、触发窗口、最小权限账户与审计的固定正常基线。",
              nextStepKey: null,
              scoreDeltas: { "persistence-decision": 1 },
            },
          ],
        },
      ],
    },
  ],
  safeBoundaries: [
    "只使用两份冻结的虚构持久化条目快照，不读取、创建、修改或删除真实计划任务与启动项。",
    "标识固定使用 virtual- 前缀，五要素只使用语义枚举，不含真实注册表路径、任务名或账户名。",
    "页面和 API 只接受已登记 scenarioKey 与 optionKey，未知输入会被脱敏阻断。",
    "不读取真实 Windows 事件日志、系统凭据、注册表或文件系统 ACL。",
    "该实验保持 case-study ready 例外：变体不声明攻击脚本自动化，只依赖 API 测试与只读一致性验证。",
  ],
  notes:
    "该实验只对固定虚构持久化条目做研判计数与决策复盘，不提供 exploit.py、持久化命令或任何真实主机变更能力。",
};

export type PersistenceTriageWorkbench = {
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
  // 固定条目是冻结的教学数据，工作台只返回只读副本
  entrySnapshots: readonly FixedPersistenceEntrySnapshot[];
  entryAssessments: PersistenceEntryAssessment[];
};

export type PersistenceTriageStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: "risk" | "fix" | "normal";
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type PersistenceDecision =
  (typeof persistenceDecisions)[PersistenceDecisionKey];

export type PersistenceTriageEvaluationInput = {
  variantKey: PersistenceTriageVariantKey;
  scenarioKey: string;
  decisions: string[];
};

export type PersistenceTriageEvaluationResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: PersistenceTriageVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: PersistenceTriageStepResult[];
  entryAssessment: PersistenceEntryAssessment | null;
  persistenceDecision: PersistenceDecision | null;
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

export type PersistenceTriageLabService = {
  getWorkbench(): PersistenceTriageWorkbench;
  evaluate(
    input: PersistenceTriageEvaluationInput,
  ): PersistenceTriageEvaluationResult;
};

function createBlockedResult(input: {
  variantKey: PersistenceTriageVariantKey;
  matchedScenario: boolean;
  blockedReason: string;
}): PersistenceTriageEvaluationResult {
  return {
    status: "blocked",
    labKey: persistenceTriageDefinition.id,
    variantKey: input.variantKey,
    scenarioKey: input.matchedScenario
      ? persistenceTriageScenarioKey
      : "blocked-scenario",
    decision: "blocked",
    signal: persistenceTriageBoundarySignal,
    message: "请求中的固定案例或决策未登记，服务未处理也未回显原始输入。",
    nextStep: "只选择工作台返回的固定 scenarioKey 与决策选项。",
    completed: false,
    steps: [],
    entryAssessment: null,
    persistenceDecision: null,
    recap: {
      outcomeCounts: { risk: 0, fix: 0, normal: 0 },
      scores: {},
      terminalOutcome: null,
    },
    assessment: {
      riskLevel: persistenceTriageDefinition.severity,
      stepCount: 0,
      matchedScenario: input.matchedScenario,
    },
    blockedReason: input.blockedReason,
  };
}

function buildNextStep(input: {
  variantKey: PersistenceTriageVariantKey;
  terminalOutcome: "risk" | "fix" | "normal" | null;
}) {
  if (input.variantKey === "vuln") {
    return "切换到修复版，对比签名、路径 ACL、触发方式、运行账户和审计收敛如何改变研判结论。";
  }

  if (input.terminalOutcome === "fix") {
    return "复盘持久化阻断结果后，再验证固定受控自启正常基线。";
  }

  return "在事件日志中确认只记录固定条目 key、研判计数、终止结果和学习信号。";
}

function findEntry(entryKey: string) {
  return fixedPersistenceEntrySnapshots.find(
    (entry) => entry.entryKey === entryKey,
  );
}

export function createPersistenceTriageLabService(): PersistenceTriageLabService {
  const entryAssessments = fixedPersistenceEntrySnapshots.map(
    assessFixedPersistenceEntry,
  );

  return {
    getWorkbench() {
      return {
        id: persistenceTriageDefinition.id,
        slug: persistenceTriageDefinition.slug,
        category: persistenceTriageDefinition.category,
        subcategory: persistenceTriageDefinition.subcategory,
        title: persistenceTriageDefinition.title,
        mode: persistenceTriageDefinition.mode,
        severity: persistenceTriageDefinition.severity,
        difficulty: persistenceTriageDefinition.difficulty,
        summary: persistenceTriageDefinition.summary,
        defaultScenarioKey: persistenceTriageDefinition.defaultCaseKey,
        scoringDimensions: persistenceTriageDefinition.scoringDimensions,
        cases: persistenceTriageDefinition.cases,
        safeBoundaries: [...persistenceTriageDefinition.safeBoundaries],
        notes: persistenceTriageDefinition.notes,
        entrySnapshots: structuredClone(fixedPersistenceEntrySnapshots),
        entryAssessments: structuredClone(entryAssessments),
      };
    },

    evaluate(input) {
      if (input.scenarioKey !== persistenceTriageScenarioKey) {
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
        persistenceTriageDefinition,
        persistenceTriageScenarioKey,
      );
      const steps: PersistenceTriageStepResult[] = [];

      for (const optionKey of input.decisions) {
        const step = machine.choose(optionKey);

        if (step.status === "blocked") {
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

      // 终止步骤之后追加的多余决策一律阻断，避免路径被拼接
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
      const entryKey =
        entryKeyByAssessmentOption[steps[0].optionKey as AssessmentOptionKey];
      const entry = entryKey ? findEntry(entryKey) : undefined;
      const persistenceDecision =
        persistenceDecisions[terminal.optionKey as PersistenceDecisionKey];

      if (!entry || !persistenceDecision) {
        return createBlockedResult({
          variantKey: input.variantKey,
          matchedScenario: true,
          blockedReason: "registered-summary-missing",
        });
      }

      return {
        status: terminal.decision === "blocked" ? "blocked" : "ok",
        labKey: persistenceTriageDefinition.id,
        variantKey: input.variantKey,
        scenarioKey: persistenceTriageScenarioKey,
        decision: terminal.decision,
        signal: terminal.signal,
        message: terminal.explanation,
        nextStep: buildNextStep({
          variantKey: input.variantKey,
          terminalOutcome: recap.terminalOutcome,
        }),
        completed: true,
        steps,
        entryAssessment: assessFixedPersistenceEntry(entry),
        persistenceDecision,
        recap: {
          outcomeCounts: recap.outcomeCounts,
          scores: recap.scores,
          terminalOutcome: recap.terminalOutcome,
        },
        assessment: {
          riskLevel: persistenceTriageDefinition.severity,
          stepCount: steps.length,
          matchedScenario: true,
        },
        ...(terminal.decision === "blocked"
          ? { blockedReason: "persistence-retention-blocked" }
          : {}),
      };
    },
  };
}

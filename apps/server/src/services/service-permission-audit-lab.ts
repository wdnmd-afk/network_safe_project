import {
  createGuidedScenarioMachine,
  type GuidedScenarioV2Definition,
} from "@network-safe/shared/guided-scenarios-v2";

export type ServicePermissionAuditVariantKey = "vuln" | "fixed";

export const servicePermissionAuditScenarioKey =
  "fixed-windows-service-permission-audit";
export const servicePermissionAuditRiskSignal =
  "host-service-permission-audit-risk-accepted";
export const servicePermissionAuditDefenseSignal =
  "host-service-permission-audit-defense-blocked";
export const servicePermissionAuditNormalSignal =
  "host-service-permission-audit-normal-verified";
export const servicePermissionAuditBoundarySignal =
  "host-service-permission-audit-boundary-blocked";

export type FixedServicePermissionProfile = {
  readonly serviceKey: string;
  readonly displayName: string;
  readonly runAs: "virtual-local-system" | "virtual-service-account";
  readonly executablePath: string;
  readonly pathQuoted: boolean;
  readonly binaryDirectoryAcl:
    | "users-write"
    | "administrators-write"
    | "system-only";
  readonly serviceConfigAcl:
    | "users-change"
    | "administrators-change"
    | "system-only";
  readonly expectedPosture: "vulnerable" | "hardened";
  readonly findings: readonly string[];
};

export type ServicePermissionProfileAssessment = {
  serviceKey: string;
  expectedPosture: FixedServicePermissionProfile["expectedPosture"];
  findingCount: number;
  criticalFindingCount: number;
  hardenedControlCount: number;
};

export const fixedServicePermissionProfiles: readonly FixedServicePermissionProfile[] =
  Object.freeze([
    Object.freeze({
      serviceKey: "virtual-update-service-risky",
      displayName: "虚构更新服务（风险基线）",
      runAs: "virtual-local-system",
      executablePath: "C:\\LabVirtual\\Update Service\\updater.exe",
      pathQuoted: false,
      binaryDirectoryAcl: "users-write",
      serviceConfigAcl: "users-change",
      expectedPosture: "vulnerable",
      findings: Object.freeze([
        "服务使用高权限虚构身份运行。",
        "包含空格的固定可执行路径未加引号。",
        "低权限用户可写入固定二进制目录。",
        "低权限用户可修改固定服务配置。",
      ]),
    }),
    Object.freeze({
      serviceKey: "virtual-update-service-hardened",
      displayName: "虚构更新服务（加固基线）",
      runAs: "virtual-service-account",
      executablePath: '"C:\\LabVirtual\\Update Service\\updater.exe"',
      pathQuoted: true,
      binaryDirectoryAcl: "administrators-write",
      serviceConfigAcl: "system-only",
      expectedPosture: "hardened",
      findings: Object.freeze([]),
    }),
  ]);

export function assessFixedServicePermissionProfile(
  profile: FixedServicePermissionProfile,
): ServicePermissionProfileAssessment {
  const elevatedIdentity = profile.runAs === "virtual-local-system";
  const userWritableBinary = profile.binaryDirectoryAcl === "users-write";
  const userChangeableConfig = profile.serviceConfigAcl === "users-change";

  return {
    serviceKey: profile.serviceKey,
    expectedPosture: profile.expectedPosture,
    findingCount: profile.findings.length,
    criticalFindingCount:
      Number(elevatedIdentity && userWritableBinary) +
      Number(elevatedIdentity && userChangeableConfig),
    hardenedControlCount:
      Number(profile.pathQuoted) +
      Number(!userWritableBinary) +
      Number(!userChangeableConfig) +
      Number(profile.runAs === "virtual-service-account"),
  };
}

const profileKeyByAssessmentOption = {
  "accept-user-writable-unquoted-path": "virtual-update-service-risky",
  "harden-path-and-service-acl": "virtual-update-service-hardened",
} as const;

const permissionDecisions = {
  "allow-unprivileged-service-replacement": {
    actionKey: "allow-unprivileged-service-replacement",
    disposition: "replacement-risk-accepted",
    summary: "低权限可写路径和服务配置被错误接受，高权限服务替换风险未被阻断。",
    nextAction: "切换到加固路径，复盘运行身份、路径引号和两类 ACL 的组合影响。",
  },
  "block-unprivileged-service-modification": {
    actionKey: "block-unprivileged-service-modification",
    disposition: "unauthorized-change-blocked",
    summary: "固定策略阻断低权限目录写入和服务配置修改，并要求使用受限服务身份。",
    nextAction: "核对四项加固控制均已登记，不执行任何真实 ACL 或服务修改。",
  },
  "verify-hardened-service-baseline": {
    actionKey: "verify-hardened-service-baseline",
    disposition: "hardened-baseline-verified",
    summary: "加引号路径、收敛 ACL 和虚构服务账号组成的固定基线通过复核。",
    nextAction: "在事件日志中确认只保留固定配置 key、计数和学习信号。",
  },
} as const;

type AssessmentOptionKey = keyof typeof profileKeyByAssessmentOption;
type PermissionDecisionKey = keyof typeof permissionDecisions;

const servicePermissionAuditDefinition: GuidedScenarioV2Definition = {
  version: 2,
  id: "host.service-permission-audit",
  slug: "service-permission-audit",
  category: "host",
  subcategory: "service-permission-audit",
  title: "Windows 服务 ACL 与权限固定审计",
  mode: "simulation",
  severity: "high",
  difficulty: "intermediate",
  summary:
    "通过两组虚构 Windows 服务配置，对比高权限可写路径与收敛 ACL、最小身份后的审计结果。",
  phase: "phase-1",
  tags: ["host", "windows-service", "acl", "least-privilege"],
  knowledgePoints: ["服务路径引号", "目录 ACL", "服务配置权限", "最小权限身份"],
  scoringDimensions: [
    {
      key: "permission-assessment",
      title: "服务权限评估",
      description: "识别路径、目录 ACL、服务配置 ACL 和运行身份的组合风险。",
      max: 1,
    },
    {
      key: "permission-decision",
      title: "权限处置决策",
      description: "阻断未授权修改并确认加固服务基线。",
      max: 1,
    },
  ],
  defaultCaseKey: servicePermissionAuditScenarioKey,
  cases: [
    {
      key: servicePermissionAuditScenarioKey,
      title: "固定 Windows 服务权限审计",
      description:
        "对比一组高权限低约束风险配置和一组最小权限加固配置，不读取本机服务状态。",
      assets: [
        {
          key: "fixed-service-configurations",
          kind: "asset",
          title: "虚构服务配置摘要",
          detail: "只登记 LabVirtual 路径、虚构身份和语义 ACL 枚举。",
        },
        {
          key: "fixed-permission-policy",
          kind: "policy",
          title: "固定加固策略",
          detail: "要求路径加引号、目录和服务配置最小授权、运行身份最小化。",
        },
      ],
      evidence: [
        {
          key: "writable-elevated-service-path",
          kind: "evidence",
          title: "高权限可写路径组合",
          detail: "固定风险配置同时具备高权限身份、未加引号路径和低权限修改权。",
        },
        {
          key: "hardened-service-baseline",
          kind: "evidence",
          title: "加固服务基线",
          detail: "固定正常配置登记受限身份、加引号路径和收敛 ACL。",
        },
      ],
      initialStepKey: "service-path-acl-assessment",
      steps: [
        {
          key: "service-path-acl-assessment",
          order: 1,
          title: "服务路径与 ACL 评估",
          prompt: "选择对固定虚构服务配置的审计策略。",
          riskSignal: "host-service-permission-audit-assessment",
          options: [
            {
              key: "accept-user-writable-unquoted-path",
              label: "接受低权限可写且未加引号的服务路径（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: "host-service-permission-audit-weak-path-accepted",
              explanation: "漏洞路径忽略高权限身份、未加引号路径和低权限修改权的组合风险。",
              nextStepKey: "service-permission-decision",
              scoreDeltas: { "permission-assessment": 0 },
            },
            {
              key: "harden-path-and-service-acl",
              label: "加引号并收敛目录与服务配置 ACL",
              outcome: "fix",
              decision: "blocked",
              signal: "host-service-permission-audit-controls-hardened",
              explanation: "修复路径要求固定路径加引号、收敛两类 ACL 并改用虚构受限服务账号。",
              nextStepKey: "service-permission-decision",
              scoreDeltas: { "permission-assessment": 1 },
            },
          ],
        },
        {
          key: "service-permission-decision",
          order: 2,
          title: "服务权限处置",
          prompt: "根据固定审计摘要选择服务权限处置结论。",
          riskSignal: "host-service-permission-audit-decision",
          options: [
            {
              key: "allow-unprivileged-service-replacement",
              label: "允许低权限替换风险继续存在（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: servicePermissionAuditRiskSignal,
              explanation: "漏洞版接受固定低权限修改权，使高权限服务路径风险继续存在。",
              nextStepKey: null,
              scoreDeltas: { "permission-decision": 0 },
            },
            {
              key: "block-unprivileged-service-modification",
              label: "阻断低权限目录与服务配置修改",
              outcome: "fix",
              decision: "blocked",
              signal: servicePermissionAuditDefenseSignal,
              explanation: "修复版阻断固定未授权修改路径，不执行真实 ACL 或服务变更。",
              nextStepKey: null,
              scoreDeltas: { "permission-decision": 1 },
            },
            {
              key: "verify-hardened-service-baseline",
              label: "验证加固服务正常基线",
              outcome: "normal",
              decision: "accepted",
              signal: servicePermissionAuditNormalSignal,
              explanation: "修复版确认加引号路径、收敛 ACL 和受限身份的固定正常基线。",
              nextStepKey: null,
              scoreDeltas: { "permission-decision": 1 },
            },
          ],
        },
      ],
    },
  ],
  safeBoundaries: [
    "只使用两组冻结的虚构服务配置，不读取或修改真实 Windows 服务、注册表、文件或 ACL。",
    "路径固定使用 C:\\LabVirtual，ACL 只使用语义枚举，不包含真实 SID、账号或 SDDL。",
    "页面和 API 只接受已登记 scenarioKey 与 optionKey，未知输入会被脱敏阻断。",
    "不执行 PowerShell、CMD、sc.exe、WMI、服务重启、文件替换或权限修改。",
  ],
  notes:
    "该实验仅生成固定审计与学习摘要，不枚举本机服务，不提供提权命令、payload 或 exploit.py。",
};

export type ServicePermissionAuditWorkbench = {
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
  serviceProfiles: FixedServicePermissionProfile[];
  profileAssessments: ServicePermissionProfileAssessment[];
};

export type ServicePermissionAuditStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: "risk" | "fix" | "normal";
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type ServicePermissionDecision =
  (typeof permissionDecisions)[PermissionDecisionKey];

export type ServicePermissionAuditEvaluationInput = {
  variantKey: ServicePermissionAuditVariantKey;
  scenarioKey: string;
  decisions: string[];
};

export type ServicePermissionAuditEvaluationResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: ServicePermissionAuditVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: ServicePermissionAuditStepResult[];
  profileAssessment: ServicePermissionProfileAssessment | null;
  permissionDecision: ServicePermissionDecision | null;
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

export type ServicePermissionAuditLabService = {
  getWorkbench(): ServicePermissionAuditWorkbench;
  evaluate(
    input: ServicePermissionAuditEvaluationInput,
  ): ServicePermissionAuditEvaluationResult;
};

function createBlockedResult(input: {
  variantKey: ServicePermissionAuditVariantKey;
  matchedScenario: boolean;
  blockedReason: string;
}): ServicePermissionAuditEvaluationResult {
  return {
    status: "blocked",
    labKey: servicePermissionAuditDefinition.id,
    variantKey: input.variantKey,
    scenarioKey: input.matchedScenario
      ? servicePermissionAuditScenarioKey
      : "blocked-scenario",
    decision: "blocked",
    signal: servicePermissionAuditBoundarySignal,
    message: "请求中的固定案例或决策未登记，服务未处理也未回显原始输入。",
    nextStep: "只选择工作台返回的固定 scenarioKey 与决策选项。",
    completed: false,
    steps: [],
    profileAssessment: null,
    permissionDecision: null,
    recap: {
      outcomeCounts: { risk: 0, fix: 0, normal: 0 },
      scores: {},
      terminalOutcome: null,
    },
    assessment: {
      riskLevel: servicePermissionAuditDefinition.severity,
      stepCount: 0,
      matchedScenario: input.matchedScenario,
    },
    blockedReason: input.blockedReason,
  };
}

function buildNextStep(input: {
  variantKey: ServicePermissionAuditVariantKey;
  terminalOutcome: "risk" | "fix" | "normal" | null;
}) {
  if (input.variantKey === "vuln") {
    return "切换到修复版，对比路径引号、目录 ACL、服务配置 ACL 和最小身份如何改变审计结论。";
  }

  if (input.terminalOutcome === "fix") {
    return "复盘未授权修改阻断结果后，再验证固定加固服务正常基线。";
  }

  return "在事件日志中确认只记录固定配置 key、审计计数、终止结果和学习信号。";
}

function findProfile(serviceKey: string) {
  return fixedServicePermissionProfiles.find(
    (profile) => profile.serviceKey === serviceKey,
  );
}

export function createServicePermissionAuditLabService(): ServicePermissionAuditLabService {
  const profileAssessments = fixedServicePermissionProfiles.map(
    assessFixedServicePermissionProfile,
  );

  return {
    getWorkbench() {
      return {
        id: servicePermissionAuditDefinition.id,
        slug: servicePermissionAuditDefinition.slug,
        category: servicePermissionAuditDefinition.category,
        subcategory: servicePermissionAuditDefinition.subcategory,
        title: servicePermissionAuditDefinition.title,
        mode: servicePermissionAuditDefinition.mode,
        severity: servicePermissionAuditDefinition.severity,
        difficulty: servicePermissionAuditDefinition.difficulty,
        summary: servicePermissionAuditDefinition.summary,
        defaultScenarioKey: servicePermissionAuditDefinition.defaultCaseKey,
        scoringDimensions: servicePermissionAuditDefinition.scoringDimensions,
        cases: servicePermissionAuditDefinition.cases,
        safeBoundaries: [...servicePermissionAuditDefinition.safeBoundaries],
        notes: servicePermissionAuditDefinition.notes,
        serviceProfiles: structuredClone(fixedServicePermissionProfiles),
        profileAssessments: structuredClone(profileAssessments),
      };
    },

    evaluate(input) {
      if (input.scenarioKey !== servicePermissionAuditScenarioKey) {
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
        servicePermissionAuditDefinition,
        servicePermissionAuditScenarioKey,
      );
      const steps: ServicePermissionAuditStepResult[] = [];

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
      const serviceKey =
        profileKeyByAssessmentOption[
          steps[0].optionKey as AssessmentOptionKey
        ];
      const profile = serviceKey ? findProfile(serviceKey) : undefined;
      const permissionDecision =
        permissionDecisions[terminal.optionKey as PermissionDecisionKey];

      if (!profile || !permissionDecision) {
        return createBlockedResult({
          variantKey: input.variantKey,
          matchedScenario: true,
          blockedReason: "registered-summary-missing",
        });
      }

      return {
        status: terminal.decision === "blocked" ? "blocked" : "ok",
        labKey: servicePermissionAuditDefinition.id,
        variantKey: input.variantKey,
        scenarioKey: servicePermissionAuditScenarioKey,
        decision: terminal.decision,
        signal: terminal.signal,
        message: terminal.explanation,
        nextStep: buildNextStep({
          variantKey: input.variantKey,
          terminalOutcome: recap.terminalOutcome,
        }),
        completed: true,
        steps,
        profileAssessment: assessFixedServicePermissionProfile(profile),
        permissionDecision,
        recap: {
          outcomeCounts: recap.outcomeCounts,
          scores: recap.scores,
          terminalOutcome: recap.terminalOutcome,
        },
        assessment: {
          riskLevel: servicePermissionAuditDefinition.severity,
          stepCount: steps.length,
          matchedScenario: true,
        },
        ...(terminal.decision === "blocked"
          ? { blockedReason: "unprivileged-service-modification-blocked" }
          : {}),
      };
    },
  };
}

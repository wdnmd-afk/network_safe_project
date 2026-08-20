import {
  createGuidedScenarioMachine,
  type GuidedScenarioV2Definition,
} from "@network-safe/shared/guided-scenarios-v2";

export type IamPolicyAuditVariantKey = "vuln" | "fixed";

export const iamPolicyAuditScenarioKey = "fixed-cloud-iam-policy-audit";
export const iamPolicyAuditRiskSignal =
  "infrastructure-iam-policy-audit-risk-accepted";
export const iamPolicyAuditDefenseSignal =
  "infrastructure-iam-policy-audit-defense-blocked";
export const iamPolicyAuditNormalSignal =
  "infrastructure-iam-policy-audit-normal-verified";
export const iamPolicyAuditBoundarySignal =
  "infrastructure-iam-policy-audit-boundary-blocked";

export type FixedIamPolicySnapshot = {
  readonly policyKey: string;
  readonly displayName: string;
  readonly principalScope: "wildcard-all" | "named-role";
  readonly actionScope:
    | "wildcard-all"
    | "wildcard-service"
    | "explicit-actions";
  readonly resourceScope: "wildcard-all" | "explicit-resources";
  readonly conditionScope: "none" | "source-restricted";
  readonly privilegeEscalationReachable: boolean;
  readonly expectedPosture: "vulnerable" | "hardened";
  readonly findings: readonly string[];
};

export type IamPolicyAssessment = {
  policyKey: string;
  expectedPosture: FixedIamPolicySnapshot["expectedPosture"];
  findingCount: number;
  criticalFindingCount: number;
  leastPrivilegeControlCount: number;
};

// 固定策略快照只使用虚构标识，不包含真实账号、ARN、区域端点或密钥
export const fixedIamPolicySnapshots: readonly FixedIamPolicySnapshot[] =
  Object.freeze([
    Object.freeze({
      policyKey: "virtual-admin-wildcard-policy",
      displayName: "虚构管理策略（风险基线）",
      principalScope: "wildcard-all",
      actionScope: "wildcard-all",
      resourceScope: "wildcard-all",
      conditionScope: "none",
      privilegeEscalationReachable: true,
      expectedPosture: "vulnerable",
      findings: Object.freeze([
        "主体范围为通配符，任何虚构身份都可使用该策略。",
        "动作范围为通配符，未限定具体操作。",
        "资源范围为通配符，未限定具体虚构资源。",
        "缺少来源或上下文条件约束。",
      ]),
    }),
    Object.freeze({
      policyKey: "virtual-scoped-least-privilege-policy",
      displayName: "虚构最小权限策略（加固基线）",
      principalScope: "named-role",
      actionScope: "explicit-actions",
      resourceScope: "explicit-resources",
      conditionScope: "source-restricted",
      privilegeEscalationReachable: false,
      expectedPosture: "hardened",
      findings: Object.freeze([]),
    }),
  ]);

export function assessFixedIamPolicy(
  policy: FixedIamPolicySnapshot,
): IamPolicyAssessment {
  const wildcardPrincipal = policy.principalScope === "wildcard-all";
  const wildcardAction = policy.actionScope === "wildcard-all";
  const wildcardResource = policy.resourceScope === "wildcard-all";
  const missingCondition = policy.conditionScope === "none";

  return {
    policyKey: policy.policyKey,
    expectedPosture: policy.expectedPosture,
    findingCount: policy.findings.length,
    // 关键发现只统计"通配符叠加无条件"与"可达提权"这两类组合风险
    criticalFindingCount:
      Number(wildcardAction && wildcardResource && missingCondition) +
      Number(policy.privilegeEscalationReachable),
    leastPrivilegeControlCount:
      Number(!wildcardPrincipal) +
      Number(policy.actionScope === "explicit-actions") +
      Number(policy.resourceScope === "explicit-resources") +
      Number(policy.conditionScope === "source-restricted"),
  };
}

const policyKeyByAssessmentOption = {
  "accept-wildcard-admin-policy": "virtual-admin-wildcard-policy",
  "scope-policy-to-least-privilege": "virtual-scoped-least-privilege-policy",
} as const;

const policyDecisions = {
  "approve-overbroad-policy-grant": {
    actionKey: "approve-overbroad-policy-grant",
    disposition: "overbroad-grant-approved",
    summary: "通配符主体、动作与资源在无条件约束下被批准，越权与提权风险未被阻断。",
    nextAction: "切换到最小权限路径，复盘四要素收敛与条件约束的组合作用。",
  },
  "block-overbroad-policy-grant": {
    actionKey: "block-overbroad-policy-grant",
    disposition: "overbroad-grant-blocked",
    summary: "固定策略基线阻断通配符授权，并要求显式动作、显式资源与来源条件。",
    nextAction: "核对四项最小权限控制均已登记，不修改任何真实云策略。",
  },
  "verify-least-privilege-baseline": {
    actionKey: "verify-least-privilege-baseline",
    disposition: "least-privilege-baseline-verified",
    summary: "具名角色、显式动作、显式资源与来源受限组成的固定基线通过复核。",
    nextAction: "在事件日志中确认只保留固定策略 key、计数与学习信号。",
  },
} as const;

type AssessmentOptionKey = keyof typeof policyKeyByAssessmentOption;
type PolicyDecisionKey = keyof typeof policyDecisions;

const iamPolicyAuditDefinition: GuidedScenarioV2Definition = {
  version: 2,
  id: "infrastructure.iam-policy-audit",
  slug: "iam-policy-audit",
  category: "infrastructure",
  subcategory: "iam-policy-audit",
  title: "云 IAM 策略最小权限固定审计",
  mode: "simulation",
  severity: "high",
  difficulty: "intermediate",
  summary:
    "通过两份虚构 IAM 策略快照，对比通配符无条件授权与收敛到最小权限后的审计结果。",
  phase: "phase-1",
  tags: ["infrastructure", "cloud-iam", "least-privilege", "policy-audit"],
  knowledgePoints: ["主体范围", "动作与资源范围", "条件约束", "提权可达性"],
  scoringDimensions: [
    {
      key: "policy-assessment",
      title: "策略范围评估",
      description: "识别主体、动作、资源与条件四要素的组合风险。",
      max: 1,
    },
    {
      key: "policy-decision",
      title: "授权处置决策",
      description: "阻断过宽授权并确认最小权限基线。",
      max: 1,
    },
  ],
  defaultCaseKey: iamPolicyAuditScenarioKey,
  cases: [
    {
      key: iamPolicyAuditScenarioKey,
      title: "固定云 IAM 策略审计",
      description:
        "对比一份通配符无条件风险策略和一份最小权限加固策略，不连接真实云账户。",
      assets: [
        {
          key: "fixed-policy-snapshots",
          kind: "asset",
          title: "虚构策略快照",
          detail: "只登记 virtual-* 标识与四要素语义枚举，不含真实账号或 ARN。",
        },
        {
          key: "fixed-least-privilege-policy",
          kind: "policy",
          title: "固定最小权限基线",
          detail: "要求具名主体、显式动作、显式资源和来源条件约束。",
        },
      ],
      evidence: [
        {
          key: "wildcard-unconditional-grant",
          kind: "evidence",
          title: "通配符无条件授权组合",
          detail: "固定风险策略同时具备通配符动作、通配符资源和缺失条件。",
        },
        {
          key: "least-privilege-baseline",
          kind: "evidence",
          title: "最小权限基线",
          detail: "固定加固策略登记四项收敛控制且提权不可达。",
        },
      ],
      initialStepKey: "iam-policy-scope-assessment",
      steps: [
        {
          key: "iam-policy-scope-assessment",
          order: 1,
          title: "策略范围评估",
          prompt: "选择对固定虚构 IAM 策略的审计策略。",
          riskSignal: "infrastructure-iam-policy-audit-assessment",
          options: [
            {
              key: "accept-wildcard-admin-policy",
              label: "接受通配符主体、动作与资源的无条件策略（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: "infrastructure-iam-policy-audit-wildcard-accepted",
              explanation:
                "漏洞路径忽略通配符四要素叠加与条件缺失造成的越权和提权可达性。",
              nextStepKey: "iam-policy-decision",
              scoreDeltas: { "policy-assessment": 0 },
            },
            {
              key: "scope-policy-to-least-privilege",
              label: "收敛主体、动作、资源并附加来源条件",
              outcome: "fix",
              decision: "blocked",
              signal: "infrastructure-iam-policy-audit-controls-scoped",
              explanation:
                "修复路径要求具名角色、显式动作、显式资源和来源受限条件四项同时成立。",
              nextStepKey: "iam-policy-decision",
              scoreDeltas: { "policy-assessment": 1 },
            },
          ],
        },
        {
          key: "iam-policy-decision",
          order: 2,
          title: "授权处置",
          prompt: "根据固定审计摘要选择授权处置结论。",
          riskSignal: "infrastructure-iam-policy-audit-decision",
          options: [
            {
              key: "approve-overbroad-policy-grant",
              label: "批准过宽授权继续生效（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: iamPolicyAuditRiskSignal,
              explanation:
                "漏洞版批准固定通配符授权，使越权与提权风险继续存在。",
              nextStepKey: null,
              scoreDeltas: { "policy-decision": 0 },
            },
            {
              key: "block-overbroad-policy-grant",
              label: "阻断过宽授权申请",
              outcome: "fix",
              decision: "blocked",
              signal: iamPolicyAuditDefenseSignal,
              explanation:
                "修复版阻断固定过宽授权路径，不修改任何真实云策略或角色。",
              nextStepKey: null,
              scoreDeltas: { "policy-decision": 1 },
            },
            {
              key: "verify-least-privilege-baseline",
              label: "验证最小权限正常基线",
              outcome: "normal",
              decision: "accepted",
              signal: iamPolicyAuditNormalSignal,
              explanation:
                "修复版确认具名主体、显式动作资源和来源条件的固定正常基线。",
              nextStepKey: null,
              scoreDeltas: { "policy-decision": 1 },
            },
          ],
        },
      ],
    },
  ],
  safeBoundaries: [
    "只使用两份冻结的虚构 IAM 策略快照，不连接或修改真实云账户、角色与策略。",
    "标识固定使用 virtual-* 前缀，四要素只使用语义枚举，不含真实账号、ARN 或密钥。",
    "页面和 API 只接受已登记 scenarioKey 与 optionKey，未知输入会被脱敏阻断。",
    "不调用云 SDK、CLI、Terraform 或 Kubernetes API，也不读取本机云凭据。",
  ],
  notes:
    "该实验仅生成固定策略审计与学习摘要，不解析真实策略语言，也不提供越权策略文本或 exploit.py。",
};

export type IamPolicyAuditWorkbench = {
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
  // 固定策略是冻结的教学数据，工作台只返回只读副本
  policySnapshots: readonly FixedIamPolicySnapshot[];
  policyAssessments: IamPolicyAssessment[];
};

export type IamPolicyAuditStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: "risk" | "fix" | "normal";
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type IamPolicyDecision =
  (typeof policyDecisions)[PolicyDecisionKey];

export type IamPolicyAuditEvaluationInput = {
  variantKey: IamPolicyAuditVariantKey;
  scenarioKey: string;
  decisions: string[];
};

export type IamPolicyAuditEvaluationResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: IamPolicyAuditVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: IamPolicyAuditStepResult[];
  policyAssessment: IamPolicyAssessment | null;
  policyDecision: IamPolicyDecision | null;
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

export type IamPolicyAuditLabService = {
  getWorkbench(): IamPolicyAuditWorkbench;
  evaluate(
    input: IamPolicyAuditEvaluationInput,
  ): IamPolicyAuditEvaluationResult;
};

function createBlockedResult(input: {
  variantKey: IamPolicyAuditVariantKey;
  matchedScenario: boolean;
  blockedReason: string;
}): IamPolicyAuditEvaluationResult {
  return {
    status: "blocked",
    labKey: iamPolicyAuditDefinition.id,
    variantKey: input.variantKey,
    scenarioKey: input.matchedScenario
      ? iamPolicyAuditScenarioKey
      : "blocked-scenario",
    decision: "blocked",
    signal: iamPolicyAuditBoundarySignal,
    message: "请求中的固定案例或决策未登记，服务未处理也未回显原始输入。",
    nextStep: "只选择工作台返回的固定 scenarioKey 与决策选项。",
    completed: false,
    steps: [],
    policyAssessment: null,
    policyDecision: null,
    recap: {
      outcomeCounts: { risk: 0, fix: 0, normal: 0 },
      scores: {},
      terminalOutcome: null,
    },
    assessment: {
      riskLevel: iamPolicyAuditDefinition.severity,
      stepCount: 0,
      matchedScenario: input.matchedScenario,
    },
    blockedReason: input.blockedReason,
  };
}

function buildNextStep(input: {
  variantKey: IamPolicyAuditVariantKey;
  terminalOutcome: "risk" | "fix" | "normal" | null;
}) {
  if (input.variantKey === "vuln") {
    return "切换到修复版，对比主体、动作、资源和条件四要素收敛如何改变审计结论。";
  }

  if (input.terminalOutcome === "fix") {
    return "复盘过宽授权阻断结果后，再验证固定最小权限正常基线。";
  }

  return "在事件日志中确认只记录固定策略 key、审计计数、终止结果和学习信号。";
}

function findPolicy(policyKey: string) {
  return fixedIamPolicySnapshots.find(
    (policy) => policy.policyKey === policyKey,
  );
}

export function createIamPolicyAuditLabService(): IamPolicyAuditLabService {
  const policyAssessments = fixedIamPolicySnapshots.map(assessFixedIamPolicy);

  return {
    getWorkbench() {
      return {
        id: iamPolicyAuditDefinition.id,
        slug: iamPolicyAuditDefinition.slug,
        category: iamPolicyAuditDefinition.category,
        subcategory: iamPolicyAuditDefinition.subcategory,
        title: iamPolicyAuditDefinition.title,
        mode: iamPolicyAuditDefinition.mode,
        severity: iamPolicyAuditDefinition.severity,
        difficulty: iamPolicyAuditDefinition.difficulty,
        summary: iamPolicyAuditDefinition.summary,
        defaultScenarioKey: iamPolicyAuditDefinition.defaultCaseKey,
        scoringDimensions: iamPolicyAuditDefinition.scoringDimensions,
        cases: iamPolicyAuditDefinition.cases,
        safeBoundaries: [...iamPolicyAuditDefinition.safeBoundaries],
        notes: iamPolicyAuditDefinition.notes,
        policySnapshots: structuredClone(fixedIamPolicySnapshots),
        policyAssessments: structuredClone(policyAssessments),
      };
    },

    evaluate(input) {
      if (input.scenarioKey !== iamPolicyAuditScenarioKey) {
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
        iamPolicyAuditDefinition,
        iamPolicyAuditScenarioKey,
      );
      const steps: IamPolicyAuditStepResult[] = [];

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
      const policyKey =
        policyKeyByAssessmentOption[steps[0].optionKey as AssessmentOptionKey];
      const policy = policyKey ? findPolicy(policyKey) : undefined;
      const policyDecision =
        policyDecisions[terminal.optionKey as PolicyDecisionKey];

      if (!policy || !policyDecision) {
        return createBlockedResult({
          variantKey: input.variantKey,
          matchedScenario: true,
          blockedReason: "registered-summary-missing",
        });
      }

      return {
        status: terminal.decision === "blocked" ? "blocked" : "ok",
        labKey: iamPolicyAuditDefinition.id,
        variantKey: input.variantKey,
        scenarioKey: iamPolicyAuditScenarioKey,
        decision: terminal.decision,
        signal: terminal.signal,
        message: terminal.explanation,
        nextStep: buildNextStep({
          variantKey: input.variantKey,
          terminalOutcome: recap.terminalOutcome,
        }),
        completed: true,
        steps,
        policyAssessment: assessFixedIamPolicy(policy),
        policyDecision,
        recap: {
          outcomeCounts: recap.outcomeCounts,
          scores: recap.scores,
          terminalOutcome: recap.terminalOutcome,
        },
        assessment: {
          riskLevel: iamPolicyAuditDefinition.severity,
          stepCount: steps.length,
          matchedScenario: true,
        },
        ...(terminal.decision === "blocked"
          ? { blockedReason: "overbroad-policy-grant-blocked" }
          : {}),
      };
    },
  };
}




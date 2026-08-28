import {
  createGuidedScenarioMachine,
  type GuidedScenarioV2Definition,
} from "@network-safe/shared/guided-scenarios-v2";

export type KubernetesRbacAuditVariantKey = "vuln" | "fixed";

export const kubernetesRbacAuditScenarioKey = "fixed-kubernetes-rbac-audit";
export const kubernetesRbacAuditRiskSignal =
  "infrastructure-kubernetes-rbac-audit-risk-accepted";
export const kubernetesRbacAuditDefenseSignal =
  "infrastructure-kubernetes-rbac-audit-defense-blocked";
export const kubernetesRbacAuditNormalSignal =
  "infrastructure-kubernetes-rbac-audit-normal-verified";
export const kubernetesRbacAuditBoundarySignal =
  "infrastructure-kubernetes-rbac-audit-boundary-blocked";

export type FixedRbacBindingSnapshot = {
  readonly bindingKey: string;
  readonly displayName: string;
  readonly roleScope: "cluster-wide" | "namespace-scoped";
  readonly verbScope: "wildcard-all" | "write-verbs" | "read-only-verbs";
  readonly resourceScope: "wildcard-all" | "explicit-resources";
  readonly subjectScope: "broad-group" | "named-service-account";
  readonly secretsReadable: boolean;
  readonly privilegeEscalationReachable: boolean;
  readonly expectedPosture: "vulnerable" | "hardened";
  readonly findings: readonly string[];
};

export type RbacBindingAssessment = {
  bindingKey: string;
  expectedPosture: FixedRbacBindingSnapshot["expectedPosture"];
  findingCount: number;
  criticalFindingCount: number;
  leastPrivilegeControlCount: number;
};

// 固定 RBAC 快照只使用虚构标识，不包含真实集群、命名空间、ServiceAccount 或证书
export const fixedRbacBindingSnapshots: readonly FixedRbacBindingSnapshot[] =
  Object.freeze([
    Object.freeze({
      bindingKey: "virtual-cluster-admin-broad-binding",
      displayName: "虚构集群级宽泛绑定（风险基线）",
      roleScope: "cluster-wide",
      verbScope: "wildcard-all",
      resourceScope: "wildcard-all",
      subjectScope: "broad-group",
      secretsReadable: true,
      privilegeEscalationReachable: true,
      expectedPosture: "vulnerable",
      findings: Object.freeze([
        "角色范围为集群级，权限跨越所有虚构命名空间。",
        "动词范围为通配符，未限定具体操作。",
        "资源范围为通配符，未限定具体虚构资源。",
        "绑定主体为宽泛用户组，未收敛到具名 ServiceAccount。",
      ]),
    }),
    Object.freeze({
      bindingKey: "virtual-namespaced-readonly-binding",
      displayName: "虚构命名空间只读绑定（加固基线）",
      roleScope: "namespace-scoped",
      verbScope: "read-only-verbs",
      resourceScope: "explicit-resources",
      subjectScope: "named-service-account",
      secretsReadable: false,
      privilegeEscalationReachable: false,
      expectedPosture: "hardened",
      findings: Object.freeze([]),
    }),
  ]);

export function assessFixedRbacBinding(
  binding: FixedRbacBindingSnapshot,
): RbacBindingAssessment {
  const clusterWide = binding.roleScope === "cluster-wide";
  const wildcardVerb = binding.verbScope === "wildcard-all";
  const wildcardResource = binding.resourceScope === "wildcard-all";

  return {
    bindingKey: binding.bindingKey,
    expectedPosture: binding.expectedPosture,
    findingCount: binding.findings.length,
    // 关键风险只统计"集群级通配符组合"、"Secret 可读"与"可达提权"三类
    criticalFindingCount:
      Number(clusterWide && wildcardVerb && wildcardResource) +
      Number(binding.secretsReadable) +
      Number(binding.privilegeEscalationReachable),
    leastPrivilegeControlCount:
      Number(binding.roleScope === "namespace-scoped") +
      Number(!wildcardVerb) +
      Number(binding.resourceScope === "explicit-resources") +
      Number(binding.subjectScope === "named-service-account") +
      Number(!binding.secretsReadable),
  };
}

const bindingKeyByAssessmentOption = {
  "accept-cluster-admin-binding": "virtual-cluster-admin-broad-binding",
  "scope-binding-to-namespace": "virtual-namespaced-readonly-binding",
} as const;

const bindingDecisions = {
  "approve-overbroad-binding": {
    actionKey: "approve-overbroad-binding",
    disposition: "overbroad-binding-approved",
    summary:
      "集群级通配符角色绑定给宽泛主体后被批准，跨命名空间越权与 Secret 读取风险未被阻断。",
    nextAction: "切换到命名空间收敛路径，复盘角色范围、动词与绑定主体的组合作用。",
  },
  "block-overbroad-binding": {
    actionKey: "block-overbroad-binding",
    disposition: "overbroad-binding-blocked",
    summary:
      "固定 RBAC 基线阻断集群级宽泛绑定，并要求命名空间范围、只读动词与具名 ServiceAccount。",
    nextAction: "核对五项最小权限控制均已登记，不修改任何真实集群绑定。",
  },
  "verify-namespaced-baseline": {
    actionKey: "verify-namespaced-baseline",
    disposition: "namespaced-baseline-verified",
    summary:
      "命名空间范围、只读动词、显式资源与具名 ServiceAccount 组成的固定基线通过复核。",
    nextAction: "在事件日志中确认只保留固定绑定 key、计数与学习信号。",
  },
} as const;

type AssessmentOptionKey = keyof typeof bindingKeyByAssessmentOption;
type BindingDecisionKey = keyof typeof bindingDecisions;

const kubernetesRbacAuditDefinition: GuidedScenarioV2Definition = {
  version: 2,
  id: "infrastructure.kubernetes-rbac-audit",
  slug: "kubernetes-rbac-audit",
  category: "infrastructure",
  subcategory: "kubernetes-rbac-audit",
  title: "Kubernetes RBAC 固定配置审计",
  mode: "simulation",
  severity: "high",
  difficulty: "intermediate",
  summary:
    "通过两份虚构 Role/Binding 快照，对比集群级通配符绑定与命名空间最小权限绑定的审计结果。",
  phase: "phase-1",
  tags: [
    "infrastructure",
    "kubernetes-rbac",
    "least-privilege",
    "namespace-boundary",
  ],
  knowledgePoints: [
    "角色范围与命名空间边界",
    "动词与资源范围",
    "绑定主体收敛",
    "Secret 可读性与提权可达性",
  ],
  scoringDimensions: [
    {
      key: "rbac-assessment",
      title: "绑定范围评估",
      description: "识别角色范围、动词、资源与绑定主体的组合风险。",
      max: 1,
    },
    {
      key: "rbac-decision",
      title: "授权处置决策",
      description: "阻断过宽绑定并确认命名空间最小权限基线。",
      max: 1,
    },
  ],
  defaultCaseKey: kubernetesRbacAuditScenarioKey,
  cases: [
    {
      key: kubernetesRbacAuditScenarioKey,
      title: "固定 Kubernetes RBAC 审计",
      description:
        "对比一份集群级通配符绑定和一份命名空间只读绑定，不连接真实集群。",
      assets: [
        {
          key: "fixed-rbac-snapshots",
          kind: "asset",
          title: "虚构绑定快照",
          detail:
            "只登记 virtual-* 标识与角色范围、动词、资源、主体语义枚举，不含真实集群或 ServiceAccount。",
        },
        {
          key: "fixed-least-privilege-binding",
          kind: "policy",
          title: "固定最小权限基线",
          detail:
            "要求命名空间范围、只读动词、显式资源、具名 ServiceAccount 且 Secret 不可读。",
        },
      ],
      evidence: [
        {
          key: "cluster-wide-wildcard-binding",
          kind: "evidence",
          title: "集群级通配符绑定组合",
          detail:
            "固定风险绑定同时具备集群范围、通配符动词、通配符资源与宽泛主体。",
        },
        {
          key: "namespaced-readonly-baseline",
          kind: "evidence",
          title: "命名空间只读基线",
          detail: "固定加固绑定登记五项收敛控制且提权不可达。",
        },
      ],
      initialStepKey: "rbac-scope-assessment",
      steps: [
        {
          key: "rbac-scope-assessment",
          order: 1,
          title: "绑定范围评估",
          prompt: "选择对固定虚构 Kubernetes RBAC 绑定的审计策略。",
          riskSignal: "infrastructure-kubernetes-rbac-audit-assessment",
          options: [
            {
              key: "accept-cluster-admin-binding",
              label: "接受集群级通配符角色绑定给宽泛主体（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal:
                "infrastructure-kubernetes-rbac-audit-cluster-wide-accepted",
              explanation:
                "漏洞路径忽略集群范围叠加通配符动词资源后跨命名空间越权与 Secret 读取的可达性。",
              nextStepKey: "rbac-binding-decision",
              scoreDeltas: { "rbac-assessment": 0 },
            },
            {
              key: "scope-binding-to-namespace",
              label: "收敛到命名空间范围、只读动词与具名 ServiceAccount",
              outcome: "fix",
              decision: "blocked",
              signal: "infrastructure-kubernetes-rbac-audit-controls-scoped",
              explanation:
                "修复路径要求命名空间范围、只读动词、显式资源、具名 ServiceAccount 与 Secret 不可读五项同时成立。",
              nextStepKey: "rbac-binding-decision",
              scoreDeltas: { "rbac-assessment": 1 },
            },
          ],
        },
        {
          key: "rbac-binding-decision",
          order: 2,
          title: "授权处置",
          prompt: "根据固定审计摘要选择绑定处置结论。",
          riskSignal: "infrastructure-kubernetes-rbac-audit-decision",
          options: [
            {
              key: "approve-overbroad-binding",
              label: "批准过宽绑定继续生效（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: kubernetesRbacAuditRiskSignal,
              explanation:
                "漏洞版批准固定集群级通配符绑定，使跨命名空间越权与提权风险继续存在。",
              nextStepKey: null,
              scoreDeltas: { "rbac-decision": 0 },
            },
            {
              key: "block-overbroad-binding",
              label: "阻断过宽绑定申请",
              outcome: "fix",
              decision: "blocked",
              signal: kubernetesRbacAuditDefenseSignal,
              explanation:
                "修复版阻断固定过宽绑定路径，不修改任何真实集群角色或绑定。",
              nextStepKey: null,
              scoreDeltas: { "rbac-decision": 1 },
            },
            {
              key: "verify-namespaced-baseline",
              label: "验证命名空间最小权限基线",
              outcome: "normal",
              decision: "accepted",
              signal: kubernetesRbacAuditNormalSignal,
              explanation:
                "修复版确认命名空间范围、只读动词、显式资源与具名 ServiceAccount 的固定正常基线。",
              nextStepKey: null,
              scoreDeltas: { "rbac-decision": 1 },
            },
          ],
        },
      ],
    },
  ],
  safeBoundaries: [
    "只使用两份冻结的虚构 RBAC 绑定快照，不连接或修改真实集群、命名空间、Role 与 Binding。",
    "标识固定使用 virtual- 前缀，范围只使用语义枚举，不含真实集群名、ServiceAccount 或 token。",
    "页面和 API 只接受已登记 scenarioKey 与 optionKey，未知输入会被脱敏阻断。",
    "不调用 kubectl、Kubernetes API、client-go 或 helm，也不读取 kubeconfig 与集群证书。",
  ],
  notes:
    "该实验仅生成固定 RBAC 审计与学习摘要，不解析真实 YAML，也不提供提权清单或 exploit.py。",
};

export type KubernetesRbacAuditWorkbench = {
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
  // 固定绑定是冻结的教学数据，工作台只返回只读副本
  bindingSnapshots: readonly FixedRbacBindingSnapshot[];
  bindingAssessments: RbacBindingAssessment[];
};

export type KubernetesRbacAuditStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: "risk" | "fix" | "normal";
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type RbacBindingDecision =
  (typeof bindingDecisions)[BindingDecisionKey];

export type KubernetesRbacAuditEvaluationInput = {
  variantKey: KubernetesRbacAuditVariantKey;
  scenarioKey: string;
  decisions: string[];
};

export type KubernetesRbacAuditEvaluationResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: KubernetesRbacAuditVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: KubernetesRbacAuditStepResult[];
  bindingAssessment: RbacBindingAssessment | null;
  bindingDecision: RbacBindingDecision | null;
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

export type KubernetesRbacAuditLabService = {
  getWorkbench(): KubernetesRbacAuditWorkbench;
  evaluate(
    input: KubernetesRbacAuditEvaluationInput,
  ): KubernetesRbacAuditEvaluationResult;
};

function createBlockedResult(input: {
  variantKey: KubernetesRbacAuditVariantKey;
  matchedScenario: boolean;
  blockedReason: string;
}): KubernetesRbacAuditEvaluationResult {
  return {
    status: "blocked",
    labKey: kubernetesRbacAuditDefinition.id,
    variantKey: input.variantKey,
    scenarioKey: input.matchedScenario
      ? kubernetesRbacAuditScenarioKey
      : "blocked-scenario",
    decision: "blocked",
    signal: kubernetesRbacAuditBoundarySignal,
    message: "请求中的固定案例或决策未登记，服务未处理也未回显原始输入。",
    nextStep: "只选择工作台返回的固定 scenarioKey 与决策选项。",
    completed: false,
    steps: [],
    bindingAssessment: null,
    bindingDecision: null,
    recap: {
      outcomeCounts: { risk: 0, fix: 0, normal: 0 },
      scores: {},
      terminalOutcome: null,
    },
    assessment: {
      riskLevel: kubernetesRbacAuditDefinition.severity,
      stepCount: 0,
      matchedScenario: input.matchedScenario,
    },
    blockedReason: input.blockedReason,
  };
}

function buildNextStep(input: {
  variantKey: KubernetesRbacAuditVariantKey;
  terminalOutcome: "risk" | "fix" | "normal" | null;
}) {
  if (input.variantKey === "vuln") {
    return "切换到修复版，对比角色范围、动词、资源和绑定主体收敛如何改变审计结论。";
  }

  if (input.terminalOutcome === "fix") {
    return "复盘过宽绑定阻断结果后，再验证固定命名空间最小权限正常基线。";
  }

  return "在事件日志中确认只记录固定绑定 key、审计计数、终止结果和学习信号。";
}

function findBinding(bindingKey: string) {
  return fixedRbacBindingSnapshots.find(
    (binding) => binding.bindingKey === bindingKey,
  );
}

export function createKubernetesRbacAuditLabService(): KubernetesRbacAuditLabService {
  const bindingAssessments = fixedRbacBindingSnapshots.map(
    assessFixedRbacBinding,
  );

  return {
    getWorkbench() {
      return {
        id: kubernetesRbacAuditDefinition.id,
        slug: kubernetesRbacAuditDefinition.slug,
        category: kubernetesRbacAuditDefinition.category,
        subcategory: kubernetesRbacAuditDefinition.subcategory,
        title: kubernetesRbacAuditDefinition.title,
        mode: kubernetesRbacAuditDefinition.mode,
        severity: kubernetesRbacAuditDefinition.severity,
        difficulty: kubernetesRbacAuditDefinition.difficulty,
        summary: kubernetesRbacAuditDefinition.summary,
        defaultScenarioKey: kubernetesRbacAuditDefinition.defaultCaseKey,
        scoringDimensions: kubernetesRbacAuditDefinition.scoringDimensions,
        cases: kubernetesRbacAuditDefinition.cases,
        safeBoundaries: [...kubernetesRbacAuditDefinition.safeBoundaries],
        notes: kubernetesRbacAuditDefinition.notes,
        bindingSnapshots: structuredClone(fixedRbacBindingSnapshots),
        bindingAssessments: structuredClone(bindingAssessments),
      };
    },

    evaluate(input) {
      if (input.scenarioKey !== kubernetesRbacAuditScenarioKey) {
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
        kubernetesRbacAuditDefinition,
        kubernetesRbacAuditScenarioKey,
      );
      const steps: KubernetesRbacAuditStepResult[] = [];

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
      const bindingKey =
        bindingKeyByAssessmentOption[steps[0].optionKey as AssessmentOptionKey];
      const binding = bindingKey ? findBinding(bindingKey) : undefined;
      const bindingDecision =
        bindingDecisions[terminal.optionKey as BindingDecisionKey];

      if (!binding || !bindingDecision) {
        return createBlockedResult({
          variantKey: input.variantKey,
          matchedScenario: true,
          blockedReason: "registered-summary-missing",
        });
      }

      return {
        status: terminal.decision === "blocked" ? "blocked" : "ok",
        labKey: kubernetesRbacAuditDefinition.id,
        variantKey: input.variantKey,
        scenarioKey: kubernetesRbacAuditScenarioKey,
        decision: terminal.decision,
        signal: terminal.signal,
        message: terminal.explanation,
        nextStep: buildNextStep({
          variantKey: input.variantKey,
          terminalOutcome: recap.terminalOutcome,
        }),
        completed: true,
        steps,
        bindingAssessment: assessFixedRbacBinding(binding),
        bindingDecision,
        recap: {
          outcomeCounts: recap.outcomeCounts,
          scores: recap.scores,
          terminalOutcome: recap.terminalOutcome,
        },
        assessment: {
          riskLevel: kubernetesRbacAuditDefinition.severity,
          stepCount: steps.length,
          matchedScenario: true,
        },
        ...(terminal.decision === "blocked"
          ? { blockedReason: "overbroad-binding-blocked" }
          : {}),
      };
    },
  };
}

import type {
  KubernetesRbacAuditResult,
  KubernetesRbacAuditVariantKey,
} from "../api/kubernetes-rbac-audit-lab";

export type { KubernetesRbacAuditVariantKey };

export type KubernetesRbacAuditVariantConfig = {
  key: KubernetesRbacAuditVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
  panelIntro: string;
  recommendedPath: string[];
};

export const kubernetesRbacAuditScenarioKey =
  "fixed-kubernetes-rbac-binding-audit";

const kubernetesRbacAuditVariantConfigs: Record<
  KubernetesRbacAuditVariantKey,
  KubernetesRbacAuditVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "Kubernetes RBAC 风险观察版",
    badge: "cluster-wide + 通配符动词资源 + 可读 Secret",
    explanation:
      "观察固定 ClusterRoleBinding 同时具备集群级作用域、全体 ServiceAccount 主体、通配符动词与资源时的组合风险。",
    expectedSignal:
      "风险路径完成后应出现 infrastructure-kubernetes-rbac-audit-risk-accepted 学习信号。",
    panelIntro:
      "页面只显示 virtual-* 虚构标识和四要素语义枚举，不连接真实集群，也不读取本机 kubeconfig。",
    recommendedPath: [
      "accept-cluster-wide-wildcard-binding",
      "approve-cluster-admin-binding",
    ],
  },
  fixed: {
    key: "fixed",
    title: "Kubernetes RBAC 防御复盘版",
    badge: "single-namespace + 显式动词资源 + Secret 不可读",
    explanation:
      "对同一虚构绑定收敛到单命名空间 RoleBinding、具名 ServiceAccount 与显式动词资源，再对比阻断与正常基线。",
    expectedSignal:
      "防御路径出现 infrastructure-kubernetes-rbac-audit-defense-blocked，正常路径出现 infrastructure-kubernetes-rbac-audit-normal-verified。",
    panelIntro:
      "修复版只验证固定最小权限摘要，不调用 kubectl、Kubernetes API、云 SDK 或 Terraform。",
    recommendedPath: [
      "scope-binding-to-namespace",
      "block-cluster-admin-binding",
    ],
  },
};

export const kubernetesRbacAuditNormalPath = [
  "scope-binding-to-namespace",
  "verify-namespaced-baseline",
];

// 首步 optionKey 到固定绑定 key 的映射与服务端 bindingKeyByAssessmentOption 一致
export const bindingKeyByAssessmentOption: Record<string, string> = {
  "accept-cluster-admin-binding": "virtual-cluster-admin-broad-binding",
  "scope-binding-to-namespace": "virtual-namespaced-readonly-binding",
};

export const kubernetesRbacAuditChecklist = [
  {
    key: "binding-scope",
    title: "收敛绑定作用域",
    description:
      "应使用命名空间内的 RoleBinding，而不是覆盖全集群的 ClusterRoleBinding。",
  },
  {
    key: "subject-scope",
    title: "绑定具名主体",
    description:
      "绑定到 system:serviceaccounts 组会把权限授予集群内全部 ServiceAccount。",
  },
  {
    key: "verb-scope",
    title: "显式列出允许动词",
    description: "通配符动词会一并授予 delete、patch 与 escalate 等高危操作。",
  },
  {
    key: "resource-scope",
    title: "限定资源范围",
    description:
      "资源通配符会让绑定覆盖 secrets，使凭据读取成为提权起点。",
  },
];

export function getKubernetesRbacAuditVariantConfig(
  variant: KubernetesRbacAuditVariantKey,
) {
  return kubernetesRbacAuditVariantConfigs[variant];
}

export function formatKubernetesRbacAuditSignal(signal: string) {
  const labels: Record<string, string> = {
    "infrastructure-kubernetes-rbac-audit-risk-accepted": "过宽绑定被批准",
    "infrastructure-kubernetes-rbac-audit-defense-blocked": "过宽绑定已阻断",
    "infrastructure-kubernetes-rbac-audit-normal-verified":
      "命名空间基线通过",
    "infrastructure-kubernetes-rbac-audit-wildcard-accepted":
      "通配符绑定被接受",
    "infrastructure-kubernetes-rbac-audit-controls-scoped": "绑定范围已收敛",
    "infrastructure-kubernetes-rbac-audit-boundary-blocked":
      "未登记输入被脱敏阻断",
  };

  return labels[signal] ?? signal;
}

export function createKubernetesRbacAuditLearningProgress(
  config: KubernetesRbacAuditVariantConfig,
) {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createKubernetesRbacAuditVerificationRecord(
  config: KubernetesRbacAuditVariantConfig,
  result: KubernetesRbacAuditResult,
) {
  return {
    variantKey: config.key,
    result: result.decision === "blocked" ? "blocked" : "passed",
    summary: `${result.labKey}: ${result.signal}`,
    details: {
      signal: result.signal,
      scenarioKey: result.scenarioKey,
      bindingKey:
        result.bindingAssessment?.bindingKey ?? "blocked-rbac-binding",
      findingCount: result.bindingAssessment?.findingCount ?? 0,
      criticalFindingCount: result.bindingAssessment?.criticalFindingCount ?? 0,
      leastPrivilegeControlCount:
        result.bindingAssessment?.leastPrivilegeControlCount ?? 0,
      stepCount: result.assessment.stepCount,
    },
  };
}

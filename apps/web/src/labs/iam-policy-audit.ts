import type {
  IamPolicyAuditResult,
  IamPolicyAuditVariantKey,
} from "../api/iam-policy-audit-lab";

export type { IamPolicyAuditVariantKey };

export type IamPolicyAuditVariantConfig = {
  key: IamPolicyAuditVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
  panelIntro: string;
  recommendedPath: string[];
};

export const iamPolicyAuditScenarioKey = "fixed-cloud-iam-policy-audit";

const iamPolicyAuditVariantConfigs: Record<
  IamPolicyAuditVariantKey,
  IamPolicyAuditVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "云 IAM 策略风险观察版",
    badge: "通配符主体 + 通配符动作资源 + 无条件",
    explanation:
      "观察固定策略同时具备通配符主体、通配符动作、通配符资源和缺失条件约束时的组合风险。",
    expectedSignal:
      "风险路径完成后应出现 infrastructure-iam-policy-audit-risk-accepted 学习信号。",
    panelIntro:
      "页面只显示 virtual-* 虚构标识和四要素语义枚举，不连接真实云账户，也不读取本机云凭据。",
    recommendedPath: [
      "accept-wildcard-admin-policy",
      "approve-overbroad-policy-grant",
    ],
  },
  fixed: {
    key: "fixed",
    title: "云 IAM 策略防御复盘版",
    badge: "具名主体 + 显式动作资源 + 来源条件",
    explanation:
      "对同一虚构策略收敛主体、动作与资源范围并附加来源条件，再对比阻断与正常基线。",
    expectedSignal:
      "防御路径出现 infrastructure-iam-policy-audit-defense-blocked，正常路径出现 infrastructure-iam-policy-audit-normal-verified。",
    panelIntro:
      "修复版只验证固定最小权限摘要，不调用云 SDK、CLI、Terraform 或 Kubernetes API。",
    recommendedPath: [
      "scope-policy-to-least-privilege",
      "block-overbroad-policy-grant",
    ],
  },
};

export const iamPolicyAuditNormalPath = [
  "scope-policy-to-least-privilege",
  "verify-least-privilege-baseline",
];

export const iamPolicyAuditChecklist = [
  {
    key: "principal-scope",
    title: "收敛主体范围",
    description: "策略应绑定具名角色，而不是允许任意身份使用。",
  },
  {
    key: "action-scope",
    title: "显式列出允许动作",
    description: "通配符动作会把未来新增的高危操作一并授予。",
  },
  {
    key: "resource-scope",
    title: "限定资源范围",
    description: "资源通配符会让策略越过预期的数据与配置边界。",
  },
  {
    key: "condition-scope",
    title: "附加条件约束",
    description: "来源或上下文条件是通配符收敛之外的第二道边界。",
  },
];

export function getIamPolicyAuditVariantConfig(
  variant: IamPolicyAuditVariantKey,
) {
  return iamPolicyAuditVariantConfigs[variant];
}

export function formatIamPolicyAuditSignal(signal: string) {
  const labels: Record<string, string> = {
    "infrastructure-iam-policy-audit-risk-accepted": "过宽授权被批准",
    "infrastructure-iam-policy-audit-defense-blocked": "过宽授权已阻断",
    "infrastructure-iam-policy-audit-normal-verified": "最小权限基线通过",
    "infrastructure-iam-policy-audit-wildcard-accepted": "通配符策略被接受",
    "infrastructure-iam-policy-audit-controls-scoped": "策略范围已收敛",
    "infrastructure-iam-policy-audit-boundary-blocked": "未登记输入被脱敏阻断",
  };

  return labels[signal] ?? signal;
}

export function createIamPolicyAuditLearningProgress(
  config: IamPolicyAuditVariantConfig,
) {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createIamPolicyAuditVerificationRecord(
  config: IamPolicyAuditVariantConfig,
  result: IamPolicyAuditResult,
) {
  return {
    variantKey: config.key,
    result: result.decision === "blocked" ? "blocked" : "passed",
    summary: `${result.labKey}: ${result.signal}`,
    details: {
      signal: result.signal,
      scenarioKey: result.scenarioKey,
      policyKey:
        result.policyAssessment?.policyKey ?? "blocked-policy-snapshot",
      findingCount: result.policyAssessment?.findingCount ?? 0,
      criticalFindingCount: result.policyAssessment?.criticalFindingCount ?? 0,
      leastPrivilegeControlCount:
        result.policyAssessment?.leastPrivilegeControlCount ?? 0,
      stepCount: result.assessment.stepCount,
    },
  };
}

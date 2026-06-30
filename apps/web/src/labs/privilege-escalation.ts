import type {
  PrivilegeEscalationResult,
  PrivilegeEscalationSignal,
  PrivilegeEscalationVariantKey,
} from "../api/privilege-escalation-lab";

export type { PrivilegeEscalationVariantKey };

export type PrivilegeEscalationVariantConfig = {
  key: PrivilegeEscalationVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
};

export type PrivilegeEscalationLearningProgressInput = {
  variantKey: PrivilegeEscalationVariantKey;
  status: "in-progress";
  notes: string;
};

export type PrivilegeEscalationVerificationRecordInput = {
  variantKey: PrivilegeEscalationVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: PrivilegeEscalationSignal;
    operationKey: string;
    requestedRole: string;
    currentUserRole: string;
    effectiveRole: string;
    trustedClientRole: boolean;
  };
};

export const normalOperationKeySample = "view-profile-summary";
export const adminOperationKeySample = "approve-refund";
export const normalRequestedRoleSample = "member";
export const attackRequestedRoleSample = "admin";

const privilegeEscalationVariantConfigs: Record<
  PrivilegeEscalationVariantKey,
  PrivilegeEscalationVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "权限提升漏洞版",
    badge: "信任客户端 requestedRole",
    explanation:
      "漏洞版模拟后端把请求体中的 requestedRole 当作授权依据。普通用户把 requestedRole 改成 admin 后，可以执行受控管理操作。",
    expectedSignal:
      "提交客户端 admin 声明样例后应出现 privilege-client-role-admin-accepted 信号。",
  },
  fixed: {
    key: "fixed",
    title: "权限提升修复版",
    badge: "只信任服务端登录态角色",
    explanation:
      "修复版忽略客户端角色声明，只使用登录态中的服务端角色做权限判断。普通用户请求管理操作会被阻断。",
    expectedSignal:
      "提交客户端 admin 声明样例后应出现 privilege-client-role-admin-blocked 信号。",
  },
};

export function getPrivilegeEscalationVariantConfig(
  variant: PrivilegeEscalationVariantKey,
) {
  return privilegeEscalationVariantConfigs[variant];
}

export function createPrivilegeEscalationLearningProgress(
  config: PrivilegeEscalationVariantConfig,
): PrivilegeEscalationLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createPrivilegeEscalationVerificationRecord(
  config: PrivilegeEscalationVariantConfig,
  result: PrivilegeEscalationResult,
): PrivilegeEscalationVerificationRecordInput {
  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "漏洞版信任客户端 admin 声明，普通用户执行了管理操作。",
      details: {
        signal: result.signal,
        operationKey: result.operationKey,
        requestedRole: result.inspection.requestedRole,
        currentUserRole: result.inspection.currentUserRole,
        effectiveRole: result.inspection.effectiveRole,
        trustedClientRole: result.inspection.trustedClientRole,
      },
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "修复版只信任服务端角色，阻断了客户端 admin 声明。",
    details: {
      signal: result.signal,
      operationKey: result.operationKey,
      requestedRole: result.inspection.requestedRole,
      currentUserRole: result.inspection.currentUserRole,
      effectiveRole: result.inspection.effectiveRole,
      trustedClientRole: result.inspection.trustedClientRole,
    },
  };
}

export function formatPrivilegeEscalationSignal(
  signal: PrivilegeEscalationSignal,
) {
  const labels: Record<PrivilegeEscalationSignal, string> = {
    "privilege-normal-operation-accepted": "普通操作验证通过",
    "privilege-client-role-admin-accepted": "漏洞版接受了客户端 admin 声明",
    "privilege-client-role-admin-blocked": "修复版阻断了客户端 admin 声明",
    "privilege-operation-not-found": "未找到受控教学操作",
  };

  return labels[signal];
}

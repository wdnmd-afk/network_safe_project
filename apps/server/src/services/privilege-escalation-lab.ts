export type PrivilegeEscalationVariantKey = "vuln" | "fixed";

export type PrivilegeEscalationSignal =
  | "privilege-normal-operation-accepted"
  | "privilege-client-role-admin-accepted"
  | "privilege-client-role-admin-blocked"
  | "privilege-operation-not-found";

export type PrivilegeEscalationStatus = "ok" | "blocked" | "not-found";

export type PrivilegeEscalationInput = {
  userId: string;
  currentUserRole: string;
  variantKey: PrivilegeEscalationVariantKey;
  operationKey: string;
  requestedRole: string;
};

export type PrivilegeEscalationOperation = {
  key: string;
  title: string;
  requiredRole: "member" | "admin";
  resultSummary: string;
};

export type PrivilegeEscalationInspection = {
  operationKeyLength: number;
  requestedRole: string;
  currentUserRole: string;
  effectiveRole: string;
  trustedClientRole: boolean;
  privilegedOperation: boolean;
  roleAllowed: boolean;
};

export type PrivilegeEscalationResult = {
  status: PrivilegeEscalationStatus;
  variantKey: PrivilegeEscalationVariantKey;
  operationKey: string;
  requestedRole: string;
  operation: PrivilegeEscalationOperation | null;
  inspection: PrivilegeEscalationInspection;
  signal: PrivilegeEscalationSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type PrivilegeEscalationLabSamples = {
  normalOperationKey: string;
  adminOperationKey: string;
  normalRequestedRole: string;
  attackRequestedRole: string;
};

export type PrivilegeEscalationLabService = {
  executeOperation(
    input: PrivilegeEscalationInput,
  ): Promise<PrivilegeEscalationResult>;
  getSamples(): PrivilegeEscalationLabSamples;
};

const privilegeOperations: PrivilegeEscalationOperation[] = [
  {
    key: "view-profile-summary",
    title: "查看个人资料摘要",
    requiredRole: "member",
    resultSummary: "返回当前用户自己的资料摘要",
  },
  {
    key: "approve-refund",
    title: "审批高风险退款",
    requiredRole: "admin",
    resultSummary: "虚拟审批了高风险退款请求",
  },
];

const privilegeEscalationSamples: PrivilegeEscalationLabSamples = {
  normalOperationKey: "view-profile-summary",
  adminOperationKey: "approve-refund",
  normalRequestedRole: "member",
  attackRequestedRole: "admin",
};

function findOperation(operationKey: string) {
  return (
    privilegeOperations.find((operation) => operation.key === operationKey) ?? null
  );
}

function isRoleAllowed(input: {
  effectiveRole: string;
  operation: PrivilegeEscalationOperation;
}) {
  if (input.operation.requiredRole === "member") {
    return input.effectiveRole === "member" || input.effectiveRole === "admin";
  }

  return input.effectiveRole === "admin";
}

function createInspection(input: {
  operationKey: string;
  requestedRole: string;
  currentUserRole: string;
  effectiveRole: string;
  trustedClientRole: boolean;
  operation: PrivilegeEscalationOperation | null;
}): PrivilegeEscalationInspection {
  return {
    operationKeyLength: input.operationKey.length,
    requestedRole: input.requestedRole,
    currentUserRole: input.currentUserRole,
    effectiveRole: input.effectiveRole,
    trustedClientRole: input.trustedClientRole,
    privilegedOperation: input.operation?.requiredRole === "admin",
    roleAllowed: input.operation
      ? isRoleAllowed({
          effectiveRole: input.effectiveRole,
          operation: input.operation,
        })
      : false,
  };
}

export function createPrivilegeEscalationLabService(): PrivilegeEscalationLabService {
  return {
    getSamples() {
      return privilegeEscalationSamples;
    },

    async executeOperation(input) {
      const operationKey = input.operationKey.trim();
      const requestedRole = input.requestedRole.trim();
      const operation = findOperation(operationKey);
      const trustedClientRole = input.variantKey === "vuln";
      const effectiveRole = trustedClientRole
        ? requestedRole
        : input.currentUserRole;
      const inspection = createInspection({
        operationKey,
        requestedRole,
        currentUserRole: input.currentUserRole,
        effectiveRole,
        trustedClientRole,
        operation,
      });

      if (!operation) {
        return {
          status: "not-found",
          variantKey: input.variantKey,
          operationKey,
          requestedRole,
          operation: null,
          inspection,
          signal: "privilege-operation-not-found",
          decision: "failed",
          message: "未找到对应的受控教学操作。",
          nextStep: "使用普通操作样例或客户端 admin 声明样例继续观察。",
          blockedReason: "operation-not-found",
        };
      }

      if (!inspection.roleAllowed) {
        return {
          status: "blocked",
          variantKey: input.variantKey,
          operationKey,
          requestedRole,
          operation: null,
          inspection,
          signal: "privilege-client-role-admin-blocked",
          decision: "blocked",
          message: "修复版只信任登录态中的服务端角色，已阻断管理操作。",
          nextStep: "切回漏洞版提交同样请求，观察客户端角色声明为什么不应被信任。",
          blockedReason: "server-role-not-allowed",
        };
      }

      if (inspection.privilegedOperation && trustedClientRole) {
        return {
          status: "ok",
          variantKey: input.variantKey,
          operationKey,
          requestedRole,
          operation,
          inspection,
          signal: "privilege-client-role-admin-accepted",
          decision: "accepted",
          message: "漏洞版信任客户端 requestedRole，普通用户执行了管理操作。",
          nextStep: "切到修复版提交同样请求，观察服务端角色校验如何阻断。",
        };
      }

      return {
        status: "ok",
        variantKey: input.variantKey,
        operationKey,
        requestedRole,
        operation,
        inspection,
        signal: "privilege-normal-operation-accepted",
        decision: "accepted",
        message: "普通操作符合当前用户权限，正常业务请求被接受。",
        nextStep: "填入客户端 admin 声明样例，观察漏洞版和修复版对角色来源的差异。",
      };
    },
  };
}

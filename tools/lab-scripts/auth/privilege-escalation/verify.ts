import { pathToFileURL } from "node:url";

export type PrivilegeEscalationVerificationCase = {
  key: string;
  variantKey: "vuln" | "fixed";
  method: "POST";
  path: string;
  body: {
    operationKey: string;
    requestedRole: string;
  };
  expectedStatus: number;
  expectedSignal:
    | "privilege-normal-operation-accepted"
    | "privilege-client-role-admin-accepted"
    | "privilege-client-role-admin-blocked";
  description: string;
};

export const privilegeNormalOperationKey = "view-profile-summary";
export const privilegeAdminOperationKey = "approve-refund";
export const privilegeNormalRequestedRole = "member";
export const privilegeAttackRequestedRole = "admin";

export const privilegeEscalationVerificationCases: PrivilegeEscalationVerificationCase[] =
  [
    {
      key: "privilege-vuln-normal-operation",
      variantKey: "vuln",
      method: "POST",
      path: "/api/labs/auth/privilege-escalation/vuln/execute",
      body: {
        operationKey: privilegeNormalOperationKey,
        requestedRole: privilegeNormalRequestedRole,
      },
      expectedStatus: 200,
      expectedSignal: "privilege-normal-operation-accepted",
      description: "漏洞版普通用户执行普通操作应被接受。",
    },
    {
      key: "privilege-vuln-client-admin-role",
      variantKey: "vuln",
      method: "POST",
      path: "/api/labs/auth/privilege-escalation/vuln/execute",
      body: {
        operationKey: privilegeAdminOperationKey,
        requestedRole: privilegeAttackRequestedRole,
      },
      expectedStatus: 200,
      expectedSignal: "privilege-client-role-admin-accepted",
      description: "漏洞版受控客户端 admin 声明样例会被接受。",
    },
    {
      key: "privilege-fixed-client-admin-role-blocked",
      variantKey: "fixed",
      method: "POST",
      path: "/api/labs/auth/privilege-escalation/fixed/execute",
      body: {
        operationKey: privilegeAdminOperationKey,
        requestedRole: privilegeAttackRequestedRole,
      },
      expectedStatus: 403,
      expectedSignal: "privilege-client-role-admin-blocked",
      description: "修复版应阻断同一客户端 admin 声明请求。",
    },
  ];

export const privilegeEscalationVerificationNotes = [
  "这些配置只描述本项目本机接口的预期行为。",
  "执行真实请求前需要先通过平台登录获得本机演示账号 token。",
  "本文件不枚举权限，不访问外部目标，不修改真实用户角色。",
];

export function getPrivilegeEscalationVerificationPlan() {
  return {
    labKey: "auth.privilege-escalation",
    scope: "localhost-only",
    safeBoundary:
      "仅验证本项目本机虚拟管理操作接口的校验差异，不修改真实用户角色，不访问外部目标。",
    cases: privilegeEscalationVerificationCases,
    notes: privilegeEscalationVerificationNotes,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(
    JSON.stringify(getPrivilegeEscalationVerificationPlan(), null, 2),
  );
}

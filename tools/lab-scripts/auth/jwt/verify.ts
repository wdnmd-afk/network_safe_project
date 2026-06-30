import { pathToFileURL } from "node:url";

export type JwtVerificationCase = {
  key: string;
  variantKey: "vuln" | "fixed";
  method: "POST";
  path: string;
  body: {
    token: string;
  };
  expectedStatus: number;
  expectedSignal:
    | "jwt-valid-user-token-accepted"
    | "jwt-none-alg-admin-accepted"
    | "jwt-none-alg-blocked";
  description: string;
};

export const jwtNormalToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJsZWFybmVyLTEwMDEiLCJyb2xlIjoidXNlciIsInNjb3BlIjoib3JkZXJzOnJlYWQiLCJsYWIiOiJhdXRoLmp3dCJ9.i4vSiN1Y9cj8ill96WjA8USna6pgus1LHWrb7PUyU3M";
export const jwtControlledNoneAlgToken =
  "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJsZWFybmVyLTEwMDEiLCJyb2xlIjoiYWRtaW4iLCJzY29wZSI6ImFkbWluOnJlYWQiLCJsYWIiOiJhdXRoLmp3dCJ9.";

export const jwtVerificationCases: JwtVerificationCase[] = [
  {
    key: "jwt-vuln-signed-user-token",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/auth/jwt/vuln/verify",
    body: {
      token: jwtNormalToken,
    },
    expectedStatus: 200,
    expectedSignal: "jwt-valid-user-token-accepted",
    description: "漏洞版正常签名教学 token 应被接受。",
  },
  {
    key: "jwt-vuln-none-admin-token",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/auth/jwt/vuln/verify",
    body: {
      token: jwtControlledNoneAlgToken,
    },
    expectedStatus: 200,
    expectedSignal: "jwt-none-alg-admin-accepted",
    description: "漏洞版受控 alg=none 管理员声明样例会被接受。",
  },
  {
    key: "jwt-fixed-none-admin-token-blocked",
    variantKey: "fixed",
    method: "POST",
    path: "/api/labs/auth/jwt/fixed/verify",
    body: {
      token: jwtControlledNoneAlgToken,
    },
    expectedStatus: 403,
    expectedSignal: "jwt-none-alg-blocked",
    description: "修复版应阻断同一 alg=none 管理员声明 token。",
  },
];

export const jwtVerificationNotes = [
  "这些配置只描述本项目本机接口的预期行为。",
  "执行真实请求前需要先通过平台登录获得本机演示账号 token。",
  "本文件不爆破密钥，不访问外部目标，不保存真实 token。",
];

export function getJwtVerificationPlan() {
  return {
    labKey: "auth.jwt",
    scope: "localhost-only",
    safeBoundary:
      "仅验证本项目本机教学 JWT 验证接口的校验差异，不复用真实登录 token，不访问外部目标。",
    cases: jwtVerificationCases,
    notes: jwtVerificationNotes,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(getJwtVerificationPlan(), null, 2));
}

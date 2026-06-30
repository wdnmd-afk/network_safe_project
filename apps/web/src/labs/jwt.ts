import type { JwtResult, JwtSignal, JwtVariantKey } from "../api/jwt-lab";

export type { JwtVariantKey };

export type JwtVariantConfig = {
  key: JwtVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
};

export type JwtLearningProgressInput = {
  variantKey: JwtVariantKey;
  status: "in-progress";
  notes: string;
};

export type JwtVerificationRecordInput = {
  variantKey: JwtVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: JwtSignal;
    algorithm: string;
    roleClaim: string;
    adminClaimRequested: boolean;
  };
};

export const normalJwtSample =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJsZWFybmVyLTEwMDEiLCJyb2xlIjoidXNlciIsInNjb3BlIjoib3JkZXJzOnJlYWQiLCJsYWIiOiJhdXRoLmp3dCJ9.i4vSiN1Y9cj8ill96WjA8USna6pgus1LHWrb7PUyU3M";
export const attackJwtSample =
  "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJsZWFybmVyLTEwMDEiLCJyb2xlIjoiYWRtaW4iLCJzY29wZSI6ImFkbWluOnJlYWQiLCJsYWIiOiJhdXRoLmp3dCJ9.";

const jwtVariantConfigs: Record<JwtVariantKey, JwtVariantConfig> = {
  vuln: {
    key: "vuln",
    title: "JWT 攻击漏洞版",
    badge: "信任 alg=none 并接受未签名角色声明",
    explanation:
      "漏洞版模拟后端按 JWT header 中的 alg 决定校验方式。当攻击方提交 alg=none 的管理员声明 token 时，服务端跳过签名校验并信任 payload。",
    expectedSignal:
      "提交 alg=none 管理员样例后应出现 jwt-none-alg-admin-accepted 信号。",
  },
  fixed: {
    key: "fixed",
    title: "JWT 攻击修复版",
    badge: "算法白名单与 HS256 签名校验",
    explanation:
      "修复版只允许 HS256 教学 token，并校验签名。未签名 token 或篡改过的角色声明不会被信任。",
    expectedSignal:
      "提交 alg=none 管理员样例后应出现 jwt-none-alg-blocked 信号。",
  },
};

export function getJwtVariantConfig(variant: JwtVariantKey) {
  return jwtVariantConfigs[variant];
}

export function createJwtLearningProgress(
  config: JwtVariantConfig,
): JwtLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createJwtVerificationRecord(
  config: JwtVariantConfig,
  result: JwtResult,
): JwtVerificationRecordInput {
  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "漏洞版接受了 alg=none 管理员声明，未签名 token 获得管理区访问结果。",
      details: {
        signal: result.signal,
        algorithm: result.inspection.algorithm,
        roleClaim: result.inspection.roleClaim,
        adminClaimRequested: result.inspection.adminClaimRequested,
      },
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "修复版通过算法白名单和签名校验阻断了 alg=none 管理员声明。",
    details: {
      signal: result.signal,
      algorithm: result.inspection.algorithm,
      roleClaim: result.inspection.roleClaim,
      adminClaimRequested: result.inspection.adminClaimRequested,
    },
  };
}

export function formatJwtSignal(signal: JwtSignal) {
  const labels: Record<JwtSignal, string> = {
    "jwt-valid-user-token-accepted": "签名用户 token 验证通过",
    "jwt-none-alg-admin-accepted": "漏洞版接受了未签名管理员声明",
    "jwt-none-alg-blocked": "修复版阻断了 alg=none token",
    "jwt-signature-invalid-blocked": "签名无效，已阻断",
    "jwt-token-invalid": "JWT 结构或教学声明无效",
  };

  return labels[signal];
}

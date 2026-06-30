import { pathToFileURL } from "node:url";

export type BruteForceVerificationCase = {
  key: string;
  variantKey: "vuln" | "fixed";
  method: "POST";
  path: string;
  body: {
    targetUsername: string;
    passwordCandidates: string[];
  };
  expectedStatus: number;
  expectedSignal:
    | "brute-force-normal-login-accepted"
    | "brute-force-password-guessed"
    | "brute-force-rate-limit-blocked";
  description: string;
};

export const targetUsername = "training-user";
export const normalPasswordCandidates = ["training-login-weak"];
export const attackPasswordCandidates = [
  "summer2024",
  "password123",
  "letmein",
  "training-login-weak",
];

export const bruteForceVerificationCases: BruteForceVerificationCase[] = [
  {
    key: "brute-force-vuln-normal-login",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/auth/brute-force/vuln/attempt",
    body: {
      targetUsername,
      passwordCandidates: normalPasswordCandidates,
    },
    expectedStatus: 200,
    expectedSignal: "brute-force-normal-login-accepted",
    description: "漏洞版正常单次教学登录应被接受。",
  },
  {
    key: "brute-force-vuln-password-guessed",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/auth/brute-force/vuln/attempt",
    body: {
      targetUsername,
      passwordCandidates: attackPasswordCandidates,
    },
    expectedStatus: 200,
    expectedSignal: "brute-force-password-guessed",
    description: "漏洞版连续候选口令会在第 4 次命中虚拟教学账号。",
  },
  {
    key: "brute-force-fixed-rate-limit-blocked",
    variantKey: "fixed",
    method: "POST",
    path: "/api/labs/auth/brute-force/fixed/attempt",
    body: {
      targetUsername,
      passwordCandidates: attackPasswordCandidates,
    },
    expectedStatus: 429,
    expectedSignal: "brute-force-rate-limit-blocked",
    description: "修复版连续失败达到 3 次后触发节流，不继续检查后续候选口令。",
  },
];

export const bruteForceVerificationNotes = [
  "这些配置只描述本项目本机接口的预期行为。",
  "执行真实请求前需要先通过平台登录获得本机演示账号 token。",
  "本文件不加载字典、不枚举账号、不并发请求、不访问外部目标。",
];

export function getBruteForceVerificationPlan() {
  return {
    labKey: "auth.brute-force",
    scope: "localhost-only",
    safeBoundary:
      "仅验证本项目本机虚拟教学账号的候选口令检查差异，不调用真实登录接口，不访问外部目标。",
    cases: bruteForceVerificationCases,
    notes: bruteForceVerificationNotes,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(getBruteForceVerificationPlan(), null, 2));
}

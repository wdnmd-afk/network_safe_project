export type CsrfVerificationCase = {
  key: string;
  variantKey: "vuln" | "fixed";
  method: "GET" | "POST";
  path: string;
  body?: {
    amount: number;
    targetAccount: string;
    csrfToken?: string;
  };
  expectedStatus: number;
  expectedSignal: "csrf-transfer-accepted" | "csrf-token-required" | "csrf-token-accepted";
  description: string;
};

export const csrfVerificationPayload = {
  amount: 200,
  targetAccount: "safe-mart-training",
};

export const csrfVerificationCases: CsrfVerificationCase[] = [
  {
    key: "csrf-vuln-cross-site",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/web/csrf/vuln/transfer",
    body: csrfVerificationPayload,
    expectedStatus: 200,
    expectedSignal: "csrf-transfer-accepted",
    description: "漏洞版缺少 CSRF token 的受控模拟请求会被接受。",
  },
  {
    key: "csrf-fixed-cross-site-blocked",
    variantKey: "fixed",
    method: "POST",
    path: "/api/labs/web/csrf/fixed/transfer",
    body: csrfVerificationPayload,
    expectedStatus: 403,
    expectedSignal: "csrf-token-required",
    description: "修复版缺少 CSRF token 的受控模拟请求会被阻断。",
  },
  {
    key: "csrf-fixed-normal-submit",
    variantKey: "fixed",
    method: "POST",
    path: "/api/labs/web/csrf/fixed/transfer",
    body: {
      ...csrfVerificationPayload,
      csrfToken: "<token from /api/labs/web/csrf/fixed/token>",
    },
    expectedStatus: 200,
    expectedSignal: "csrf-token-accepted",
    description: "修复版携带后端颁发 token 的正常请求会被接受。",
  },
];

export const csrfVerificationNotes = [
  "这些配置只描述本项目本机接口的预期行为。",
  "执行真实请求前需要先通过平台登录获得本机演示账号 token。",
  "本文件不包含外部站点投递逻辑，不作为通用 CSRF 攻击脚本使用。",
];

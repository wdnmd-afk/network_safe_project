import { pathToFileURL } from "node:url";

export type IdorVerificationCase = {
  key: string;
  variantKey: "vuln" | "fixed";
  method: "POST";
  path: string;
  body: {
    orderId: string;
  };
  expectedStatus: number;
  expectedSignal:
    | "idor-own-order-accepted"
    | "idor-cross-user-order-exposed"
    | "idor-cross-user-order-blocked";
  description: string;
};

export const idorOwnOrderId = "order-1001";
export const idorOtherUserOrderId = "order-2001";

export const idorVerificationCases: IdorVerificationCase[] = [
  {
    key: "idor-vuln-own-order",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/auth/idor/vuln/read",
    body: {
      orderId: idorOwnOrderId,
    },
    expectedStatus: 200,
    expectedSignal: "idor-own-order-accepted",
    description: "漏洞版读取当前用户自己的订单应被接受。",
  },
  {
    key: "idor-vuln-cross-user-order",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/auth/idor/vuln/read",
    body: {
      orderId: idorOtherUserOrderId,
    },
    expectedStatus: 200,
    expectedSignal: "idor-cross-user-order-exposed",
    description: "漏洞版受控跨用户订单样例会被返回。",
  },
  {
    key: "idor-fixed-cross-user-order-blocked",
    variantKey: "fixed",
    method: "POST",
    path: "/api/labs/auth/idor/fixed/read",
    body: {
      orderId: idorOtherUserOrderId,
    },
    expectedStatus: 403,
    expectedSignal: "idor-cross-user-order-blocked",
    description: "修复版应阻断同一跨用户订单读取请求。",
  },
];

export const idorVerificationNotes = [
  "这些配置只描述本项目本机接口的预期行为。",
  "执行真实请求前需要先通过平台登录获得本机演示账号 token。",
  "本文件不扫描对象 ID，不访问外部目标，不保存真实 token。",
];

export function getIdorVerificationPlan() {
  return {
    labKey: "auth.idor",
    scope: "localhost-only",
    safeBoundary:
      "仅验证本项目本机虚拟订单读取接口的校验差异，不访问真实订单表，不访问外部目标。",
    cases: idorVerificationCases,
    notes: idorVerificationNotes,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(getIdorVerificationPlan(), null, 2));
}

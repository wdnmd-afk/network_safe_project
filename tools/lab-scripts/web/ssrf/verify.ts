import { pathToFileURL } from "node:url";

export type SsrfVerificationCase = {
  key: string;
  variantKey: "vuln" | "fixed";
  method: "POST";
  path: string;
  body: {
    targetUrl: string;
  };
  expectedStatus: number;
  expectedSignal:
    | "ssrf-public-resource-fetched"
    | "ssrf-internal-metadata-exposed"
    | "ssrf-private-target-blocked";
  description: string;
};

export const ssrfNormalTarget =
  "https://safe-mart-cdn.local/public/catalog.json";
export const ssrfControlledPayload =
  "http://169.254.169.254/latest/meta-data/iam/security-credentials/demo";

export const ssrfVerificationCases: SsrfVerificationCase[] = [
  {
    key: "ssrf-vuln-public-resource",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/web/ssrf/vuln/fetch",
    body: {
      targetUrl: ssrfNormalTarget,
    },
    expectedStatus: 200,
    expectedSignal: "ssrf-public-resource-fetched",
    description: "漏洞版正常公开资源应被读取。",
  },
  {
    key: "ssrf-vuln-internal-metadata",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/web/ssrf/vuln/fetch",
    body: {
      targetUrl: ssrfControlledPayload,
    },
    expectedStatus: 200,
    expectedSignal: "ssrf-internal-metadata-exposed",
    description: "漏洞版受控内部元数据样例会被模拟读取。",
  },
  {
    key: "ssrf-fixed-private-target-blocked",
    variantKey: "fixed",
    method: "POST",
    path: "/api/labs/web/ssrf/fixed/fetch",
    body: {
      targetUrl: ssrfControlledPayload,
    },
    expectedStatus: 403,
    expectedSignal: "ssrf-private-target-blocked",
    description: "修复版应阻断同一内部目标 URL。",
  },
];

export const ssrfVerificationNotes = [
  "这些配置只描述本项目本机接口的预期行为。",
  "执行真实请求前需要先通过平台登录获得本机演示账号 token。",
  "本文件不发起真实 SSRF 探测，不访问外部目标，不保存真实凭据。",
];

export function getSsrfVerificationPlan() {
  return {
    labKey: "web.ssrf",
    scope: "localhost-only",
    safeBoundary:
      "仅验证本项目本机虚拟 URL 抓取接口的校验差异，不发起真实网络请求，不访问外部目标。",
    cases: ssrfVerificationCases,
    notes: ssrfVerificationNotes,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(getSsrfVerificationPlan(), null, 2));
}

import { pathToFileURL } from "node:url";

export type InfoDisclosureVerificationCase = {
  key: string;
  variantKey: "vuln" | "fixed";
  method: "POST";
  path: string;
  body: {
    reportKey: string;
  };
  expectedStatus: number;
  expectedSignal:
    | "info-disclosure-public-report-returned"
    | "info-disclosure-debug-data-exposed"
    | "info-disclosure-debug-data-blocked";
  description: string;
};

export const infoDisclosureNormalReportKey = "public-status";
export const infoDisclosureControlledReportKey = "debug-diagnostics";

export const infoDisclosureVerificationCases: InfoDisclosureVerificationCase[] = [
  {
    key: "info-disclosure-vuln-public-report",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/web/info-disclosure/vuln/report",
    body: {
      reportKey: infoDisclosureNormalReportKey,
    },
    expectedStatus: 200,
    expectedSignal: "info-disclosure-public-report-returned",
    description: "漏洞版正常公开报告应被读取。",
  },
  {
    key: "info-disclosure-vuln-debug-report",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/web/info-disclosure/vuln/report",
    body: {
      reportKey: infoDisclosureControlledReportKey,
    },
    expectedStatus: 200,
    expectedSignal: "info-disclosure-debug-data-exposed",
    description: "漏洞版受控调试报告样例会被返回。",
  },
  {
    key: "info-disclosure-fixed-debug-report-blocked",
    variantKey: "fixed",
    method: "POST",
    path: "/api/labs/web/info-disclosure/fixed/report",
    body: {
      reportKey: infoDisclosureControlledReportKey,
    },
    expectedStatus: 403,
    expectedSignal: "info-disclosure-debug-data-blocked",
    description: "修复版应阻断同一调试报告 key。",
  },
];

export const infoDisclosureVerificationNotes = [
  "这些配置只描述本项目本机接口的预期行为。",
  "执行真实请求前需要先通过平台登录获得本机演示账号 token。",
  "本文件不读取真实环境变量、真实日志、真实文件或真实 token。",
];

export function getInfoDisclosureVerificationPlan() {
  return {
    labKey: "web.info-disclosure",
    scope: "localhost-only",
    safeBoundary:
      "仅验证本项目本机虚拟诊断报告接口的校验差异，不读取真实系统信息，不访问外部目标。",
    cases: infoDisclosureVerificationCases,
    notes: infoDisclosureVerificationNotes,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(getInfoDisclosureVerificationPlan(), null, 2));
}

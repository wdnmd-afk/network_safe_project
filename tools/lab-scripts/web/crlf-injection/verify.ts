import { pathToFileURL } from "node:url";

export type CrlfInjectionVerificationCase = {
  key: string;
  variantKey: "vuln" | "fixed";
  method: "POST";
  path: string;
  body: {
    headerTemplate: string;
    fileName: string;
    dispositionType: string;
  };
  expectedStatus: number;
  expectedSignal:
    | "crlf-injection-safe-header-previewed"
    | "crlf-injection-virtual-header-injected"
    | "crlf-injection-control-chars-blocked";
  description: string;
};

export const crlfInjectionHeaderTemplate = "download-filename";
export const crlfInjectionDispositionType = "attachment";
export const crlfInjectionNormalFileName = "invoice.pdf";
export const crlfInjectionControlledFileName =
  "invoice.pdf\r\nX-Lab-Debug: exposed";

export const crlfInjectionVerificationCases: CrlfInjectionVerificationCase[] = [
  {
    key: "crlf-vuln-normal-preview",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/web/crlf-injection/vuln/preview",
    body: {
      headerTemplate: crlfInjectionHeaderTemplate,
      fileName: crlfInjectionNormalFileName,
      dispositionType: crlfInjectionDispositionType,
    },
    expectedStatus: 200,
    expectedSignal: "crlf-injection-safe-header-previewed",
    description: "漏洞版正常文件名应只生成未污染的虚拟响应头。",
  },
  {
    key: "crlf-vuln-controlled-sample",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/web/crlf-injection/vuln/preview",
    body: {
      headerTemplate: crlfInjectionHeaderTemplate,
      fileName: crlfInjectionControlledFileName,
      dispositionType: crlfInjectionDispositionType,
    },
    expectedStatus: 200,
    expectedSignal: "crlf-injection-virtual-header-injected",
    description: "漏洞版受控样例应返回虚拟响应头污染信号。",
  },
  {
    key: "crlf-fixed-controlled-sample",
    variantKey: "fixed",
    method: "POST",
    path: "/api/labs/web/crlf-injection/fixed/preview",
    body: {
      headerTemplate: crlfInjectionHeaderTemplate,
      fileName: crlfInjectionControlledFileName,
      dispositionType: crlfInjectionDispositionType,
    },
    expectedStatus: 403,
    expectedSignal: "crlf-injection-control-chars-blocked",
    description: "修复版受控样例应在虚拟头部构造前被服务端阻断。",
  },
];

export const crlfInjectionVerificationNotes = [
  "这些配置只描述本项目本机接口的预期行为。",
  "执行真实请求前需要先通过平台登录获得本机演示账号 token。",
  "本文件不构造真实 HTTP 响应拆分，不访问外部目标。",
  "日志复盘只能查看脱敏摘要，不应展示完整 fileName 或完整 header 文本。",
];

export function getCrlfInjectionVerificationPlan() {
  return {
    labKey: "web.crlf-injection",
    scope: "localhost-only",
    safeBoundary:
      "仅验证本项目本机下载响应头预览接口的漏洞版与修复版差异，不生成通用 CRLF payload 库，不访问外部目标。",
    cases: crlfInjectionVerificationCases,
    notes: crlfInjectionVerificationNotes,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(getCrlfInjectionVerificationPlan(), null, 2));
}

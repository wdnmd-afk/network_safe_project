import { pathToFileURL } from "node:url";

export type XxeVerificationCase = {
  key: string;
  variantKey: "vuln" | "fixed";
  method: "POST";
  path: string;
  body: {
    importKind: string;
    xmlDocument: string;
  };
  expectedStatus: number;
  expectedSignal:
    | "xxe-safe-xml-imported"
    | "xxe-internal-resource-exposed"
    | "xxe-doctype-blocked";
  description: string;
};

export const xxeImportKind = "invoice-preview";
export const xxeNormalXml =
  "<invoice><customerName>演示用户</customerName><amount>128</amount></invoice>";
export const xxeVirtualEntityXml =
  '<!DOCTYPE invoice [<!ENTITY labSecret SYSTEM "file:///virtual/lab/internal-note">]><invoice><note>&labSecret;</note></invoice>';

export const xxeVerificationCases: XxeVerificationCase[] = [
  {
    key: "xxe-vuln-normal-import",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/web/xxe/vuln/import",
    body: {
      importKind: xxeImportKind,
      xmlDocument: xxeNormalXml,
    },
    expectedStatus: 200,
    expectedSignal: "xxe-safe-xml-imported",
    description: "漏洞版正常 XML 应完成导入预览。",
  },
  {
    key: "xxe-vuln-controlled-entity",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/web/xxe/vuln/import",
    body: {
      importKind: xxeImportKind,
      xmlDocument: xxeVirtualEntityXml,
    },
    expectedStatus: 200,
    expectedSignal: "xxe-internal-resource-exposed",
    description: "漏洞版受控实体会返回固定虚拟内部资源信号。",
  },
  {
    key: "xxe-fixed-controlled-entity",
    variantKey: "fixed",
    method: "POST",
    path: "/api/labs/web/xxe/fixed/import",
    body: {
      importKind: xxeImportKind,
      xmlDocument: xxeVirtualEntityXml,
    },
    expectedStatus: 403,
    expectedSignal: "xxe-doctype-blocked",
    description: "修复版应在解析前阻断 DTD 与外部实体声明。",
  },
];

export const xxeVerificationNotes = [
  "这些配置只描述本项目本机接口的预期行为。",
  "执行真实请求前需要先通过平台登录获得本机演示账号 token。",
  "本文件不读取本机文件，不请求外部目标，不解析真实外部实体。",
];

export function getXxeVerificationPlan() {
  return {
    labKey: "web.xxe",
    scope: "localhost-only",
    safeBoundary:
      "仅验证本项目本机 XML 导入预览接口的校验差异，不读取真实文件，不访问外部目标。",
    cases: xxeVerificationCases,
    notes: xxeVerificationNotes,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(getXxeVerificationPlan(), null, 2));
}

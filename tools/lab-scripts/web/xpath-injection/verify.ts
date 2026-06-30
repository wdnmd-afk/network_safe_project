import { pathToFileURL } from "node:url";

export type XpathInjectionVerificationCase = {
  key: string;
  variantKey: "vuln" | "fixed";
  method: "POST";
  path: string;
  body: {
    queryTemplate: string;
    keyword: string;
    scope: string;
  };
  expectedStatus: number;
  expectedSignal:
    | "xpath-injection-safe-query-completed"
    | "xpath-injection-result-scope-expanded"
    | "xpath-injection-controlled-sample-blocked";
  description: string;
};

export const xpathInjectionQueryTemplate = "product-catalog-by-name";
export const xpathInjectionScope = "public-catalog";
export const xpathInjectionKeyword = "camera";
export const xpathInjectionControlledKeyword =
  "LAB_CONTROLLED_XPATH:expand-product-catalog";

export const xpathInjectionVerificationCases: XpathInjectionVerificationCase[] =
  [
    {
      key: "xpath-vuln-normal-search",
      variantKey: "vuln",
      method: "POST",
      path: "/api/labs/web/xpath-injection/vuln/search",
      body: {
        queryTemplate: xpathInjectionQueryTemplate,
        keyword: xpathInjectionKeyword,
        scope: xpathInjectionScope,
      },
      expectedStatus: 200,
      expectedSignal: "xpath-injection-safe-query-completed",
      description: "漏洞版正常关键词应只返回公开虚拟产品目录结果。",
    },
    {
      key: "xpath-vuln-controlled-sample",
      variantKey: "vuln",
      method: "POST",
      path: "/api/labs/web/xpath-injection/vuln/search",
      body: {
        queryTemplate: xpathInjectionQueryTemplate,
        keyword: xpathInjectionControlledKeyword,
        scope: xpathInjectionScope,
      },
      expectedStatus: 200,
      expectedSignal: "xpath-injection-result-scope-expanded",
      description: "漏洞版受控样例应返回虚拟结果范围扩大信号。",
    },
    {
      key: "xpath-fixed-controlled-sample",
      variantKey: "fixed",
      method: "POST",
      path: "/api/labs/web/xpath-injection/fixed/search",
      body: {
        queryTemplate: xpathInjectionQueryTemplate,
        keyword: xpathInjectionControlledKeyword,
        scope: xpathInjectionScope,
      },
      expectedStatus: 403,
      expectedSignal: "xpath-injection-controlled-sample-blocked",
      description: "修复版受控样例应在虚拟查询前被服务端模板边界阻断。",
    },
  ];

export const xpathInjectionVerificationNotes = [
  "这些配置只描述本项目本机接口的预期行为。",
  "执行真实请求前需要先通过平台登录获得本机演示账号 token。",
  "本文件不读取真实 XML 文件，不执行任意 XPath 表达式，不访问外部目标。",
  "日志复盘只能查看脱敏摘要，不应展示完整 keyword 或完整查询表达式。",
];

export function getXpathInjectionVerificationPlan() {
  return {
    labKey: "web.xpath-injection",
    scope: "localhost-only",
    safeBoundary:
      "仅验证本项目本机 XML 产品目录查询预览接口的漏洞版与修复版差异，不生成通用 XPath payload 库，不访问外部目标。",
    cases: xpathInjectionVerificationCases,
    notes: xpathInjectionVerificationNotes,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(getXpathInjectionVerificationPlan(), null, 2));
}

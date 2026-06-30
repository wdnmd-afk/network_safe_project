import { pathToFileURL } from "node:url";

export type SqlInjectionVerificationCase = {
  key: string;
  variantKey: "vuln" | "fixed";
  method: "POST";
  path: string;
  body: {
    keyword: string;
  };
  expectedStatus: number;
  expectedSignal:
    | "sql-injection-data-exposed"
    | "sql-injection-parameterized-blocked"
    | "sql-injection-normal-search";
  description: string;
};

export const sqlInjectionNormalKeyword = "router";
export const sqlInjectionControlledPayload = "%' OR 1=1 #";

export const sqlInjectionVerificationCases: SqlInjectionVerificationCase[] = [
  {
    key: "sql-injection-vuln-normal-search",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/web/sql-injection/vuln/search",
    body: {
      keyword: sqlInjectionNormalKeyword,
    },
    expectedStatus: 200,
    expectedSignal: "sql-injection-normal-search",
    description: "漏洞版正常关键词只返回公开商品。",
  },
  {
    key: "sql-injection-vuln-data-exposed",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/web/sql-injection/vuln/search",
    body: {
      keyword: sqlInjectionControlledPayload,
    },
    expectedStatus: 200,
    expectedSignal: "sql-injection-data-exposed",
    description: "漏洞版固定注入样例会返回隐藏商品。",
  },
  {
    key: "sql-injection-fixed-parameterized-blocked",
    variantKey: "fixed",
    method: "POST",
    path: "/api/labs/web/sql-injection/fixed/search",
    body: {
      keyword: sqlInjectionControlledPayload,
    },
    expectedStatus: 403,
    expectedSignal: "sql-injection-parameterized-blocked",
    description: "修复版使用参数化查询阻断同样输入。",
  },
];

export const sqlInjectionVerificationNotes = [
  "这些配置只描述本项目本机接口的预期行为。",
  "执行真实请求前需要先通过平台登录获得本机演示账号 token。",
  "本文件不包含外部目标扫描、破坏性 SQL 或通用攻击逻辑。",
];

export function getSqlInjectionVerificationPlan() {
  return {
    labKey: "web.sql-injection",
    scope: "localhost-only",
    safeBoundary:
      "仅验证本项目本机商品搜索接口的读数据差异，不访问外部目标，不执行破坏性 SQL。",
    cases: sqlInjectionVerificationCases,
    notes: sqlInjectionVerificationNotes,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(getSqlInjectionVerificationPlan(), null, 2));
}

import { pathToFileURL } from "node:url";

export type NosqlInjectionVerificationCase = {
  key: string;
  variantKey: "vuln" | "fixed";
  method: "POST";
  path: string;
  body: {
    queryMode: string;
    keyword: string;
    filterText: string;
  };
  expectedStatus: number;
  expectedSignal:
    | "nosql-injection-safe-query-completed"
    | "nosql-injection-query-expanded"
    | "nosql-injection-operator-blocked";
  description: string;
};

export const nosqlInjectionQueryMode = "coupon-search";
export const nosqlInjectionKeyword = "shipping";
export const nosqlInjectionNormalFilterText = "public-only";
export const nosqlInjectionControlledFilterText =
  "LAB_CONTROLLED_OPERATOR:include-hidden-coupons";

export const nosqlInjectionVerificationCases: NosqlInjectionVerificationCase[] =
  [
    {
      key: "nosql-vuln-normal-search",
      variantKey: "vuln",
      method: "POST",
      path: "/api/labs/web/nosql-injection/vuln/search",
      body: {
        queryMode: nosqlInjectionQueryMode,
        keyword: nosqlInjectionKeyword,
        filterText: nosqlInjectionNormalFilterText,
      },
      expectedStatus: 200,
      expectedSignal: "nosql-injection-safe-query-completed",
      description: "漏洞版正常关键词应只返回公开虚拟优惠券。",
    },
    {
      key: "nosql-vuln-controlled-operator",
      variantKey: "vuln",
      method: "POST",
      path: "/api/labs/web/nosql-injection/vuln/search",
      body: {
        queryMode: nosqlInjectionQueryMode,
        keyword: nosqlInjectionKeyword,
        filterText: nosqlInjectionControlledFilterText,
      },
      expectedStatus: 200,
      expectedSignal: "nosql-injection-query-expanded",
      description: "漏洞版受控样例应返回虚拟查询范围扩大信号。",
    },
    {
      key: "nosql-fixed-controlled-operator",
      variantKey: "fixed",
      method: "POST",
      path: "/api/labs/web/nosql-injection/fixed/search",
      body: {
        queryMode: nosqlInjectionQueryMode,
        keyword: nosqlInjectionKeyword,
        filterText: nosqlInjectionControlledFilterText,
      },
      expectedStatus: 403,
      expectedSignal: "nosql-injection-operator-blocked",
      description: "修复版受控样例应在查询前被服务端模板边界阻断。",
    },
  ];

export const nosqlInjectionVerificationNotes = [
  "这些配置只描述本项目本机接口的预期行为。",
  "执行真实请求前需要先通过平台登录获得本机演示账号 token。",
  "本文件不连接 MongoDB、Redis、Elasticsearch 或任何外部 NoSQL 服务。",
  "日志复盘只能查看脱敏摘要，不应展示完整 filterText 或查询结构。",
];

export function getNosqlInjectionVerificationPlan() {
  return {
    labKey: "web.nosql-injection",
    scope: "localhost-only",
    safeBoundary:
      "仅验证本项目本机优惠券文档检索接口的漏洞版与修复版差异，不生成通用 NoSQL payload 库，不访问外部目标。",
    cases: nosqlInjectionVerificationCases,
    notes: nosqlInjectionVerificationNotes,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(getNosqlInjectionVerificationPlan(), null, 2));
}

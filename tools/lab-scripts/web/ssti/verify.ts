import { pathToFileURL } from "node:url";

export type SstiVerificationCase = {
  key: string;
  variantKey: "vuln" | "fixed";
  method: "POST";
  path: string;
  body: {
    templateKey: string;
    templateText: string;
    variables: {
      customerName: string;
      orderNo: string;
      noticeTitle: string;
    };
  };
  expectedStatus: number;
  expectedSignal:
    | "ssti-safe-template-rendered"
    | "ssti-expression-evaluated"
    | "ssti-template-context-exposed"
    | "ssti-expression-blocked";
  description: string;
};

export const sstiTemplateKey = "shipping-notice";
export const sstiNormalTemplate =
  "尊敬的 {{ customerName }}，您的订单 {{ orderNo }} 已进入处理流程。";
export const sstiMathTemplate =
  "尊敬的 {{ customerName }}，调试结果：{{ 7 * 7 }}";
export const sstiDebugTemplate =
  "尊敬的 {{ customerName }}，上下文：{{ debugContext }}";
export const sstiVariables = {
  customerName: "演示用户",
  orderNo: "ORDER-1001",
  noticeTitle: "发货提醒",
};

export const sstiVerificationCases: SstiVerificationCase[] = [
  {
    key: "ssti-vuln-normal-template",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/web/ssti/vuln/preview",
    body: {
      templateKey: sstiTemplateKey,
      templateText: sstiNormalTemplate,
      variables: sstiVariables,
    },
    expectedStatus: 200,
    expectedSignal: "ssti-safe-template-rendered",
    description: "漏洞版正常模板变量应在教学模拟器中渲染。",
  },
  {
    key: "ssti-vuln-controlled-math",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/web/ssti/vuln/preview",
    body: {
      templateKey: sstiTemplateKey,
      templateText: sstiMathTemplate,
      variables: sstiVariables,
    },
    expectedStatus: 200,
    expectedSignal: "ssti-expression-evaluated",
    description: "漏洞版受控数学表达式会返回固定教学结果。",
  },
  {
    key: "ssti-vuln-controlled-context",
    variantKey: "vuln",
    method: "POST",
    path: "/api/labs/web/ssti/vuln/preview",
    body: {
      templateKey: sstiTemplateKey,
      templateText: sstiDebugTemplate,
      variables: sstiVariables,
    },
    expectedStatus: 200,
    expectedSignal: "ssti-template-context-exposed",
    description: "漏洞版受控上下文样例只返回虚拟上下文说明。",
  },
  {
    key: "ssti-fixed-controlled-math",
    variantKey: "fixed",
    method: "POST",
    path: "/api/labs/web/ssti/fixed/preview",
    body: {
      templateKey: sstiTemplateKey,
      templateText: sstiMathTemplate,
      variables: sstiVariables,
    },
    expectedStatus: 403,
    expectedSignal: "ssti-expression-blocked",
    description: "修复版应阻断非允许变量表达式。",
  },
];

export const sstiVerificationNotes = [
  "这些配置只描述本项目本机接口的预期行为。",
  "执行真实请求前需要先通过平台登录获得本机演示账号 token。",
  "本文件不执行模板表达式，不读取真实文件，不访问外部目标。",
];

export function getSstiVerificationPlan() {
  return {
    labKey: "web.ssti",
    scope: "localhost-only",
    safeBoundary:
      "仅验证本项目本机通知模板预览接口的校验差异，不执行真实模板表达式，不访问外部目标。",
    cases: sstiVerificationCases,
    notes: sstiVerificationNotes,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(getSstiVerificationPlan(), null, 2));
}

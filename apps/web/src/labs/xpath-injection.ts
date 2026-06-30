import type {
  XpathInjectionResult,
  XpathInjectionSignal,
  XpathInjectionVariantKey,
} from "../api/xpath-injection-lab";

export type { XpathInjectionVariantKey };

export type XpathInjectionVariantConfig = {
  key: XpathInjectionVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
};

export type XpathInjectionLearningProgressInput = {
  variantKey: XpathInjectionVariantKey;
  status: "in-progress";
  notes: string;
};

export type XpathInjectionVerificationRecordInput = {
  variantKey: XpathInjectionVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: XpathInjectionSignal;
    resultScope: string;
    detectedRiskTypes: string[];
    matchedControlledSample: boolean;
    documentCount: number;
  };
};

export const normalXpathQueryTemplate = "product-catalog-by-name";
export const normalXpathScope = "public-catalog";
export const normalXpathKeyword = "camera";
export const attackXpathKeyword =
  "LAB_CONTROLLED_XPATH:expand-product-catalog";

const xpathInjectionVariantConfigs: Record<
  XpathInjectionVariantKey,
  XpathInjectionVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "XPath 注入漏洞版",
    badge: "虚拟 XML 产品目录查询器会接受固定受控样例",
    explanation:
      "漏洞版模拟产品目录查询把关键词误拼进查询语义，受控样例会让虚拟结果范围扩大。",
    expectedSignal:
      "提交受控 XPath 样例后应出现 xpath-injection-result-scope-expanded 信号。",
  },
  fixed: {
    key: "fixed",
    title: "XPath 注入修复版",
    badge: "服务端固定查询模板与文本值边界",
    explanation:
      "修复版只接受服务端定义的查询模板和范围，并把关键词作为文本值处理，同样样例会在查询前被阻断。",
    expectedSignal:
      "提交受控 XPath 样例后应出现 xpath-injection-controlled-sample-blocked 信号。",
  },
};

export function getXpathInjectionVariantConfig(
  variant: XpathInjectionVariantKey,
) {
  return xpathInjectionVariantConfigs[variant];
}

export function createXpathInjectionLearningProgress(
  config: XpathInjectionVariantConfig,
): XpathInjectionLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createXpathInjectionVerificationRecord(
  config: XpathInjectionVariantConfig,
  result: XpathInjectionResult,
): XpathInjectionVerificationRecordInput {
  const details = {
    signal: result.signal,
    resultScope: result.inspection.resultScope,
    detectedRiskTypes: result.inspection.detectedRiskTypes,
    matchedControlledSample: result.inspection.matchedControlledSample,
    documentCount: result.documents.length,
  };

  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "漏洞版接受受控 XPath 样例，并展示虚拟结果范围扩大信号。",
      details,
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "修复版检测到受控 XPath 样例，并通过服务端固定查询模板阻断请求。",
    details,
  };
}

export function formatXpathInjectionSignal(signal: XpathInjectionSignal) {
  const labels: Record<XpathInjectionSignal, string> = {
    "xpath-injection-safe-query-completed": "公开产品目录查询正常完成",
    "xpath-injection-controlled-sample-detected": "检测到受控 XPath 学习样例",
    "xpath-injection-result-scope-expanded": "漏洞版虚拟结果范围被扩大",
    "xpath-injection-controlled-sample-blocked": "修复版阻断受控 XPath 样例",
    "xpath-injection-template-not-found": "查询模板或范围不在允许列表",
  };

  return labels[signal];
}

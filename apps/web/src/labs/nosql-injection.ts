import type {
  NosqlInjectionResult,
  NosqlInjectionSignal,
  NosqlInjectionVariantKey,
} from "../api/nosql-injection-lab";

export type { NosqlInjectionVariantKey };

export type NosqlInjectionVariantConfig = {
  key: NosqlInjectionVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
};

export type NosqlInjectionLearningProgressInput = {
  variantKey: NosqlInjectionVariantKey;
  status: "in-progress";
  notes: string;
};

export type NosqlInjectionVerificationRecordInput = {
  variantKey: NosqlInjectionVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: NosqlInjectionSignal;
    resultScope: string;
    detectedRiskTypes: string[];
    matchedControlledSample: boolean;
    documentCount: number;
  };
};

export const normalNosqlInjectionQueryMode = "coupon-search";
export const normalNosqlInjectionKeyword = "shipping";
export const normalNosqlInjectionFilterText = "public-only";
export const attackNosqlInjectionFilterText =
  "LAB_CONTROLLED_OPERATOR:include-hidden-coupons";

const nosqlInjectionVariantConfigs: Record<
  NosqlInjectionVariantKey,
  NosqlInjectionVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "NoSQL 注入漏洞版",
    badge: "虚拟文档查询器会接受固定受控操作符样例",
    explanation:
      "漏洞版模拟优惠券检索把筛选文本误当成结构化查询条件，受控样例会让虚拟结果范围扩大。",
    expectedSignal:
      "提交受控 NoSQL 样例后应出现 nosql-injection-query-expanded 信号。",
  },
  fixed: {
    key: "fixed",
    title: "NoSQL 注入修复版",
    badge: "服务端查询模板与输入类型约束",
    explanation:
      "修复版只接受服务端定义的查询模式，并把筛选文本作为风险分类输入，同样样例会在查询前被阻断。",
    expectedSignal:
      "提交受控 NoSQL 样例后应出现 nosql-injection-operator-blocked 信号。",
  },
};

export function getNosqlInjectionVariantConfig(
  variant: NosqlInjectionVariantKey,
) {
  return nosqlInjectionVariantConfigs[variant];
}

export function createNosqlInjectionLearningProgress(
  config: NosqlInjectionVariantConfig,
): NosqlInjectionLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createNosqlInjectionVerificationRecord(
  config: NosqlInjectionVariantConfig,
  result: NosqlInjectionResult,
): NosqlInjectionVerificationRecordInput {
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
      summary: "漏洞版接受受控 NoSQL 样例，并展示虚拟查询范围扩大信号。",
      details,
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "修复版检测到受控 NoSQL 样例，并通过服务端查询模板边界阻断请求。",
    details,
  };
}

export function formatNosqlInjectionSignal(signal: NosqlInjectionSignal) {
  const labels: Record<NosqlInjectionSignal, string> = {
    "nosql-injection-safe-query-completed": "公开优惠券查询正常完成",
    "nosql-injection-operator-detected": "漏洞版检测到受控操作符样例",
    "nosql-injection-query-expanded": "漏洞版虚拟查询范围被扩大",
    "nosql-injection-operator-blocked": "修复版阻断受控操作符样例",
    "nosql-injection-schema-blocked": "修复版阻断非模板化输入结构",
    "nosql-injection-query-mode-not-found": "查询模式不在允许列表",
  };

  return labels[signal];
}

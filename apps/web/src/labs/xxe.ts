import type {
  XxeImportResult,
  XxeSignal,
  XxeVariantKey,
} from "../api/xxe-lab";

export type { XxeVariantKey };

export type XxeVariantConfig = {
  key: XxeVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
};

export type XxeLearningProgressInput = {
  variantKey: XxeVariantKey;
  status: "in-progress";
  notes: string;
};

export type XxeVerificationRecordInput = {
  variantKey: XxeVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: XxeSignal;
    containsDoctype: boolean;
    referencedEntityNames: string[];
    matchedControlledSample: boolean;
  };
};

export const normalXxeImportKind = "invoice-preview";
export const normalXxeInvoiceSample =
  "<invoice><customerName>演示用户</customerName><amount>128</amount></invoice>";
export const attackXxeVirtualEntitySample =
  '<!DOCTYPE invoice [<!ENTITY labSecret SYSTEM "file:///virtual/lab/internal-note">]><invoice><note>&labSecret;</note></invoice>';

const xxeVariantConfigs: Record<XxeVariantKey, XxeVariantConfig> = {
  vuln: {
    key: "vuln",
    title: "XXE 漏洞版",
    badge: "虚拟 XML 资源解析器会解析固定受控实体",
    explanation:
      "漏洞版模拟 XML 导入预览解析固定受控外部实体，返回虚拟内部资源信号。",
    expectedSignal:
      "提交受控 XXE 样例后应出现 xxe-virtual-entity-resolved 或 xxe-internal-resource-exposed 信号。",
  },
  fixed: {
    key: "fixed",
    title: "XXE 修复版",
    badge: "禁用 DTD 与外部实体",
    explanation:
      "修复版在解析前阻断 DTD、外部实体声明和不可信实体引用，普通 XML 仍可导入。",
    expectedSignal: "提交受控 XXE 样例后应出现 xxe-doctype-blocked 信号。",
  },
};

export function getXxeVariantConfig(variant: XxeVariantKey) {
  return xxeVariantConfigs[variant];
}

export function createXxeLearningProgress(
  config: XxeVariantConfig,
): XxeLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createXxeVerificationRecord(
  config: XxeVariantConfig,
  result: XxeImportResult,
): XxeVerificationRecordInput {
  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "漏洞版解析了受控虚拟实体，并返回教学模拟器信号。",
      details: {
        signal: result.signal,
        containsDoctype: result.inspection.containsDoctype,
        referencedEntityNames: result.inspection.referencedEntityNames,
        matchedControlledSample: result.inspection.matchedControlledSample,
      },
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "修复版检测到 DTD 或外部实体声明，并在解析前阻断请求。",
    details: {
      signal: result.signal,
      containsDoctype: result.inspection.containsDoctype,
      referencedEntityNames: result.inspection.referencedEntityNames,
      matchedControlledSample: result.inspection.matchedControlledSample,
    },
  };
}

export function formatXxeSignal(signal: XxeSignal) {
  const labels: Record<XxeSignal, string> = {
    "xxe-safe-xml-imported": "安全 XML 正常导入",
    "xxe-virtual-entity-resolved": "漏洞版解析了受控虚拟实体",
    "xxe-internal-resource-exposed": "漏洞版暴露了虚拟内部资源",
    "xxe-doctype-blocked": "修复版阻断 DTD 或外部实体",
    "xxe-entity-not-found": "实体不在受控映射中",
    "xxe-import-kind-not-found": "导入类型不在允许列表",
    "xxe-xml-too-large": "XML 超出教学长度限制",
  };

  return labels[signal];
}

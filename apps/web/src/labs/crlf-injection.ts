import type {
  CrlfInjectionResult,
  CrlfInjectionSignal,
  CrlfInjectionVariantKey,
} from "../api/crlf-injection-lab";

export type { CrlfInjectionVariantKey };

export type CrlfInjectionVariantConfig = {
  key: CrlfInjectionVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
};

export type CrlfInjectionLearningProgressInput = {
  variantKey: CrlfInjectionVariantKey;
  status: "in-progress";
  notes: string;
};

export type CrlfInjectionVerificationRecordInput = {
  variantKey: CrlfInjectionVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: CrlfInjectionSignal;
    headerTemplate: string;
    dispositionType: string;
    detectedControlChars: string[];
    matchedControlledSample: boolean;
    virtualHeaderCount: number;
    pollutedHeaderCount: number;
  };
};

export const normalCrlfHeaderTemplate = "download-filename";
export const normalCrlfDispositionType = "attachment";
export const normalCrlfFileName = "invoice.pdf";
export const attackCrlfFileName = "invoice.pdf\r\nX-Lab-Debug: exposed";

const crlfInjectionVariantConfigs: Record<
  CrlfInjectionVariantKey,
  CrlfInjectionVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "CRLF 注入漏洞版",
    badge: "虚拟响应头预览器会展示固定受控样例造成的教学污染头部",
    explanation:
      "漏洞版模拟下载文件名进入响应头构造流程，固定 CRLF 样例会让虚拟头部预览出现额外教学头部。",
    expectedSignal:
      "提交受控 CRLF 样例后应出现 crlf-injection-virtual-header-injected 信号。",
  },
  fixed: {
    key: "fixed",
    title: "CRLF 注入修复版",
    badge: "服务端模板化响应头构造与控制字符阻断",
    explanation:
      "修复版只接受固定响应头模板和下载方式，文件名中的控制字符会在进入虚拟头部构造器前被阻断。",
    expectedSignal:
      "提交受控 CRLF 样例后应出现 crlf-injection-control-chars-blocked 信号。",
  },
};

export function getCrlfInjectionVariantConfig(
  variant: CrlfInjectionVariantKey,
) {
  return crlfInjectionVariantConfigs[variant];
}

export function createCrlfInjectionLearningProgress(
  config: CrlfInjectionVariantConfig,
): CrlfInjectionLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createCrlfInjectionVerificationRecord(
  config: CrlfInjectionVariantConfig,
  result: CrlfInjectionResult,
): CrlfInjectionVerificationRecordInput {
  const details = {
    signal: result.signal,
    headerTemplate: result.headerTemplate,
    dispositionType: result.dispositionType,
    detectedControlChars: result.inspection.detectedControlChars,
    matchedControlledSample: result.inspection.matchedControlledSample,
    virtualHeaderCount: result.inspection.virtualHeaderCount,
    pollutedHeaderCount: result.inspection.pollutedHeaderCount,
  };

  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "漏洞版接受受控 CRLF 样例，并展示虚拟响应头污染信号。",
      details,
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "修复版检测到受控 CRLF 样例，并在响应头构造前阻断请求。",
    details,
  };
}

export function formatCrlfInjectionSignal(signal: CrlfInjectionSignal) {
  const labels: Record<CrlfInjectionSignal, string> = {
    "crlf-injection-safe-header-previewed": "虚拟响应头预览正常完成",
    "crlf-injection-control-chars-detected": "检测到控制字符但超出受控样例",
    "crlf-injection-virtual-header-injected": "漏洞版虚拟头部结构被污染",
    "crlf-injection-control-chars-blocked": "修复版阻断控制字符",
    "crlf-injection-template-not-found": "响应头模板或下载方式不在允许列表",
  };

  return labels[signal];
}

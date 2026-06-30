import type {
  InfoDisclosureResult,
  InfoDisclosureSignal,
  InfoDisclosureVariantKey,
} from "../api/info-disclosure-lab";

export type { InfoDisclosureVariantKey };

export type InfoDisclosureVariantConfig = {
  key: InfoDisclosureVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
};

export type InfoDisclosureLearningProgressInput = {
  variantKey: InfoDisclosureVariantKey;
  status: "in-progress";
  notes: string;
};

export type InfoDisclosureVerificationRecordInput = {
  variantKey: InfoDisclosureVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: InfoDisclosureSignal;
    normalizedReportKey: string;
    requestedSensitiveReport: boolean;
  };
};

export const normalInfoDisclosureSample = "public-status";
export const attackInfoDisclosureSample = "debug-diagnostics";

const infoDisclosureVariantConfigs: Record<
  InfoDisclosureVariantKey,
  InfoDisclosureVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "信息泄露漏洞版",
    badge: "普通用户可读取调试诊断报告",
    explanation:
      "漏洞版模拟诊断接口没有隔离调试报告，攻击方只需要控制 reportKey，就能读取堆栈摘要、内部配置键名和 token 形态等教学占位信息。",
    expectedSignal:
      "提交调试报告样例后应出现 info-disclosure-debug-data-exposed 信号。",
  },
  fixed: {
    key: "fixed",
    title: "信息泄露修复版",
    badge: "调试报告阻断与错误信息收敛",
    explanation:
      "修复版只允许普通用户读取公开状态报告，调试报告会被阻断，并返回通用说明，不暴露内部字段。",
    expectedSignal:
      "提交调试报告样例后应出现 info-disclosure-debug-data-blocked 信号。",
  },
};

export function getInfoDisclosureVariantConfig(
  variant: InfoDisclosureVariantKey,
) {
  return infoDisclosureVariantConfigs[variant];
}

export function createInfoDisclosureLearningProgress(
  config: InfoDisclosureVariantConfig,
): InfoDisclosureLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createInfoDisclosureVerificationRecord(
  config: InfoDisclosureVariantConfig,
  result: InfoDisclosureResult,
): InfoDisclosureVerificationRecordInput {
  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "漏洞版返回了内部调试诊断报告，教学占位信息被暴露。",
      details: {
        signal: result.signal,
        normalizedReportKey: result.inspection.normalizedReportKey,
        requestedSensitiveReport: result.inspection.requestedSensitiveReport,
      },
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "修复版阻断了调试诊断报告，并返回通用阻断结果。",
    details: {
      signal: result.signal,
      normalizedReportKey: result.inspection.normalizedReportKey,
      requestedSensitiveReport: result.inspection.requestedSensitiveReport,
    },
  };
}

export function formatInfoDisclosureSignal(signal: InfoDisclosureSignal) {
  const labels: Record<InfoDisclosureSignal, string> = {
    "info-disclosure-public-report-returned": "公开状态报告正常返回",
    "info-disclosure-debug-data-exposed": "漏洞版暴露了调试诊断信息",
    "info-disclosure-debug-data-blocked": "修复版阻断了调试诊断报告",
    "info-disclosure-report-not-found": "虚拟报告索引未命中",
  };

  return labels[signal];
}

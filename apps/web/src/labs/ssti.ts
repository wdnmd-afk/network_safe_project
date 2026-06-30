import type {
  SstiPreviewResult,
  SstiSignal,
  SstiTemplateVariables,
  SstiVariantKey,
} from "../api/ssti-lab";

export type { SstiVariantKey };

export type SstiVariantConfig = {
  key: SstiVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
};

export type SstiLearningProgressInput = {
  variantKey: SstiVariantKey;
  status: "in-progress";
  notes: string;
};

export type SstiVerificationRecordInput = {
  variantKey: SstiVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: SstiSignal;
    expressionTypes: string[];
    matchedControlledSample: boolean;
  };
};

export const normalSstiTemplateKey = "shipping-notice";
export const normalSstiTemplateSample =
  "尊敬的 {{ customerName }}，您的订单 {{ orderNo }} 已进入处理流程。";
export const attackSstiMathTemplateSample =
  "尊敬的 {{ customerName }}，调试结果：{{ 7 * 7 }}";
export const attackSstiDebugTemplateSample =
  "尊敬的 {{ customerName }}，上下文：{{ debugContext }}";
export const normalSstiVariables: SstiTemplateVariables = {
  customerName: "演示用户",
  orderNo: "ORDER-1001",
  noticeTitle: "发货提醒",
};

const sstiVariantConfigs: Record<SstiVariantKey, SstiVariantConfig> = {
  vuln: {
    key: "vuln",
    title: "SSTI 漏洞版",
    badge: "教学模拟器会解释固定受控表达式",
    explanation:
      "漏洞版模拟通知模板预览把模板文本中的受控表达式当作语法解释，返回固定教学信号。",
    expectedSignal:
      "提交受控表达式样例后应出现 ssti-expression-evaluated 或 ssti-template-context-exposed 信号。",
  },
  fixed: {
    key: "fixed",
    title: "SSTI 修复版",
    badge: "系统模板与变量允许列表",
    explanation:
      "修复版只允许系统维护模板和固定变量插值，遇到非允许表达式会阻断。",
    expectedSignal:
      "提交受控表达式样例后应出现 ssti-expression-blocked 信号。",
  },
};

export function getSstiVariantConfig(variant: SstiVariantKey) {
  return sstiVariantConfigs[variant];
}

export function createSstiLearningProgress(
  config: SstiVariantConfig,
): SstiLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createSstiVerificationRecord(
  config: SstiVariantConfig,
  result: SstiPreviewResult,
): SstiVerificationRecordInput {
  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "漏洞版接受了受控模板表达式，并返回教学模拟器信号。",
      details: {
        signal: result.signal,
        expressionTypes: result.inspection.expressionTypes,
        matchedControlledSample: result.inspection.matchedControlledSample,
      },
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "修复版检测到非允许变量表达式，并通过模板来源隔离阻断请求。",
    details: {
      signal: result.signal,
      expressionTypes: result.inspection.expressionTypes,
      matchedControlledSample: result.inspection.matchedControlledSample,
    },
  };
}

export function formatSstiSignal(signal: SstiSignal) {
  const labels: Record<SstiSignal, string> = {
    "ssti-safe-template-rendered": "安全模板正常渲染",
    "ssti-expression-evaluated": "漏洞版解释了受控数学表达式",
    "ssti-template-context-exposed": "漏洞版暴露了虚拟模板上下文",
    "ssti-expression-blocked": "修复版阻断非允许表达式",
    "ssti-template-not-found": "模板不在允许列表",
  };

  return labels[signal];
}

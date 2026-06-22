export type XssVariantKey = "vuln" | "fixed";
export type XssRenderMode = "html" | "text";

export type XssVariantConfig = {
  key: XssVariantKey;
  title: string;
  badge: string;
  renderMode: XssRenderMode;
  expectedSignal: string;
  explanation: string;
};

export type XssSubmission = {
  author: string;
  title: string;
  renderedContent: string;
  renderMode: XssRenderMode;
};

export type XssLearningProgressInput = {
  variantKey: XssVariantKey;
  status: "in-progress";
  notes: string;
};

export type XssVerificationRecordInput = {
  variantKey: XssVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: string;
  };
};

export const xssSamplePayload =
  '<mark data-xss-lab-signal="xss">XSS 模拟信号</mark>';

const xssVariantConfigs: Record<XssVariantKey, XssVariantConfig> = {
  vuln: {
    key: "vuln",
    title: "XSS 漏洞版",
    badge: "未转义输出",
    renderMode: "html",
    expectedSignal: "页面会把留言内容解释为 HTML，并出现黄色模拟信号。",
    explanation:
      "漏洞版模拟客服系统直接信任用户留言并写入页面结构，展示输出编码缺失带来的风险。",
  },
  fixed: {
    key: "fixed",
    title: "XSS 修复版",
    badge: "文本渲染",
    renderMode: "text",
    expectedSignal: "页面会原样显示输入文本，不解释 HTML 标记。",
    explanation:
      "修复版使用文本渲染处理同样输入，避免用户内容改变页面结构。",
  },
};

export function getXssVariantConfig(variant: XssVariantKey) {
  return xssVariantConfigs[variant];
}

export function createXssSubmission(
  message: string,
  config: XssVariantConfig,
): XssSubmission {
  return {
    author: "林安",
    title: config.key === "vuln" ? "漏洞版客服留言" : "修复版客服留言",
    renderedContent: message,
    renderMode: config.renderMode,
  };
}

export function createXssLearningProgress(
  config: XssVariantConfig,
): XssLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createXssVerificationRecord(
  config: XssVariantConfig,
): XssVerificationRecordInput {
  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "漏洞版出现 XSS 模拟信号",
      details: {
        signal: "data-xss-lab-signal",
      },
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "修复版原样显示 HTML 字符串",
    details: {
      signal: "text-rendered",
    },
  };
}

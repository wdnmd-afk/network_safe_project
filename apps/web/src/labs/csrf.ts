import type { CsrfLabState, CsrfVariantKey } from "../api/csrf-lab";

export type { CsrfVariantKey };

export type CsrfVariantConfig = {
  key: CsrfVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
};

export type CsrfLearningProgressInput = {
  variantKey: CsrfVariantKey;
  status: "in-progress";
  notes: string;
};

export type CsrfVerificationRecordInput = {
  variantKey: CsrfVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: CsrfLabState["lastSignal"];
  };
};

export const csrfSampleTransfer = {
  amount: 200,
  targetAccount: "safe-mart-training",
};

const csrfVariantConfigs: Record<CsrfVariantKey, CsrfVariantConfig> = {
  vuln: {
    key: "vuln",
    title: "CSRF 漏洞版",
    badge: "缺少请求令牌校验",
    explanation:
      "漏洞版模拟账户转账接口只依赖登录态，不验证请求是否来自当前页面，因此本机受控的第三方请求可以完成状态变更。",
    expectedSignal: "模拟第三方请求会被后端接受，并出现 csrf-transfer-accepted 信号。",
  },
  fixed: {
    key: "fixed",
    title: "CSRF 修复版",
    badge: "校验一次性 CSRF token",
    explanation:
      "修复版在正常提交时携带后端颁发的 CSRF token，模拟第三方请求缺少 token 时会被阻断。",
    expectedSignal: "模拟第三方请求会被后端拒绝，并出现 csrf-token-required 信号。",
  },
};

export function getCsrfVariantConfig(variant: CsrfVariantKey) {
  return csrfVariantConfigs[variant];
}

export function createCsrfLearningProgress(
  config: CsrfVariantConfig,
): CsrfLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createCsrfVerificationRecord(
  config: CsrfVariantConfig,
  signal: CsrfLabState["lastSignal"],
): CsrfVerificationRecordInput {
  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "漏洞版未校验 CSRF token，模拟第三方请求完成了转账",
      details: {
        signal,
      },
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "修复版要求 CSRF token，模拟第三方请求已被阻断",
    details: {
      signal,
    },
  };
}

export function formatCsrfSignal(signal: CsrfLabState["lastSignal"]) {
  const labels: Record<CsrfLabState["lastSignal"], string> = {
    none: "尚未触发",
    "csrf-transfer-accepted": "漏洞版接受了缺少 token 的请求",
    "csrf-token-required": "修复版阻断了缺少 token 的请求",
    "csrf-token-accepted": "修复版接受了携带 token 的正常请求",
  };

  return labels[signal];
}

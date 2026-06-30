import type {
  SsrfResult,
  SsrfSignal,
  SsrfVariantKey,
} from "../api/ssrf-lab";

export type { SsrfVariantKey };

export type SsrfVariantConfig = {
  key: SsrfVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
};

export type SsrfLearningProgressInput = {
  variantKey: SsrfVariantKey;
  status: "in-progress";
  notes: string;
};

export type SsrfVerificationRecordInput = {
  variantKey: SsrfVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: SsrfSignal;
    hostname: string;
    privateTarget: boolean;
  };
};

export const normalSsrfSample = "https://safe-mart-cdn.local/public/catalog.json";
export const attackSsrfSample =
  "http://169.254.169.254/latest/meta-data/iam/security-credentials/demo";

const ssrfVariantConfigs: Record<SsrfVariantKey, SsrfVariantConfig> = {
  vuln: {
    key: "vuln",
    title: "SSRF 漏洞版",
    badge: "未限制服务端请求目标",
    explanation:
      "漏洞版模拟服务端代用户抓取 URL 元数据，但只检查 URL 格式，不限制目标主机，因此攻击方可以让服务端访问内部模拟元数据。",
    expectedSignal:
      "提交 SSRF 样例后应出现 ssrf-internal-metadata-exposed 信号，并看到内部模拟资源。",
  },
  fixed: {
    key: "fixed",
    title: "SSRF 修复版",
    badge: "协议限制、主机白名单与私有目标阻断",
    explanation:
      "修复版只允许公开白名单主机，并阻断私有地址、链路本地地址和内部域名，服务端不会代请求内部目标。",
    expectedSignal:
      "提交 SSRF 样例后应出现 ssrf-private-target-blocked 信号。",
  },
};

export function getSsrfVariantConfig(variant: SsrfVariantKey) {
  return ssrfVariantConfigs[variant];
}

export function createSsrfLearningProgress(
  config: SsrfVariantConfig,
): SsrfLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createSsrfVerificationRecord(
  config: SsrfVariantConfig,
  result: SsrfResult,
): SsrfVerificationRecordInput {
  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "漏洞版接受了内部目标 URL，内部模拟元数据被服务端读取。",
      details: {
        signal: result.signal,
        hostname: result.inspection.hostname,
        privateTarget: result.inspection.privateTarget,
      },
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "修复版通过白名单和私有目标检查阻断了内部 URL。",
    details: {
      signal: result.signal,
      hostname: result.inspection.hostname,
      privateTarget: result.inspection.privateTarget,
    },
  };
}

export function formatSsrfSignal(signal: SsrfSignal) {
  const labels: Record<SsrfSignal, string> = {
    "ssrf-public-resource-fetched": "公开白名单资源被读取",
    "ssrf-internal-metadata-exposed": "漏洞版暴露了内部模拟元数据",
    "ssrf-private-target-blocked": "修复版阻断了内部或非白名单目标",
    "ssrf-target-not-found": "虚拟资源表未命中",
    "ssrf-invalid-url-blocked": "URL 格式无效，已阻断",
  };

  return labels[signal];
}

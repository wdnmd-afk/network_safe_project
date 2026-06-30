import type { IdorResult, IdorSignal, IdorVariantKey } from "../api/idor-lab";

export type { IdorVariantKey };

export type IdorVariantConfig = {
  key: IdorVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
};

export type IdorLearningProgressInput = {
  variantKey: IdorVariantKey;
  status: "in-progress";
  notes: string;
};

export type IdorVerificationRecordInput = {
  variantKey: IdorVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: IdorSignal;
    orderId: string;
    ownerUserId: string;
    ownerMatches: boolean;
    crossUserRequested: boolean;
  };
};

export const ownOrderIdSample = "order-1001";
export const otherUserOrderIdSample = "order-2001";

const idorVariantConfigs: Record<IdorVariantKey, IdorVariantConfig> = {
  vuln: {
    key: "vuln",
    title: "IDOR 漏洞版",
    badge: "只按 orderId 读取对象，不校验归属",
    explanation:
      "漏洞版模拟后端只根据前端传入的 orderId 返回订单详情。攻击方把自己的订单 ID 替换为他人的订单 ID 后，服务端仍返回对象。",
    expectedSignal:
      "提交他人订单样例后应出现 idor-cross-user-order-exposed 信号。",
  },
  fixed: {
    key: "fixed",
    title: "IDOR 修复版",
    badge: "后端对象级授权与归属校验",
    explanation:
      "修复版在读取订单后校验 ownerUserId 是否等于当前登录用户，跨用户对象读取会被阻断。",
    expectedSignal:
      "提交他人订单样例后应出现 idor-cross-user-order-blocked 信号。",
  },
};

export function getIdorVariantConfig(variant: IdorVariantKey) {
  return idorVariantConfigs[variant];
}

export function createIdorLearningProgress(
  config: IdorVariantConfig,
): IdorLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createIdorVerificationRecord(
  config: IdorVariantConfig,
  result: IdorResult,
): IdorVerificationRecordInput {
  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "漏洞版未校验对象归属，跨用户订单详情被返回。",
      details: {
        signal: result.signal,
        orderId: result.orderId,
        ownerUserId: result.inspection.ownerUserId,
        ownerMatches: result.inspection.ownerMatches,
        crossUserRequested: result.inspection.crossUserRequested,
      },
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "修复版通过对象级授权阻断了跨用户订单读取。",
    details: {
      signal: result.signal,
      orderId: result.orderId,
      ownerUserId: result.inspection.ownerUserId,
      ownerMatches: result.inspection.ownerMatches,
      crossUserRequested: result.inspection.crossUserRequested,
    },
  };
}

export function formatIdorSignal(signal: IdorSignal) {
  const labels: Record<IdorSignal, string> = {
    "idor-own-order-accepted": "自己的订单读取通过",
    "idor-cross-user-order-exposed": "漏洞版暴露了他人订单",
    "idor-cross-user-order-blocked": "修复版阻断了跨用户读取",
    "idor-order-not-found": "未找到受控教学订单",
  };

  return labels[signal];
}

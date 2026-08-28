import type {
  RateLimitIdempotencyResult,
  RateLimitIdempotencyVariantKey,
} from "../api/rate-limit-idempotency-lab";

export type { RateLimitIdempotencyVariantKey };

export type RateLimitIdempotencyVariantConfig = {
  key: RateLimitIdempotencyVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
  panelIntro: string;
  recommendedPath: string[];
};

export const rateLimitIdempotencyScenarioKey =
  "fixed-webhook-batch-quota-audit";

// 首步 optionKey 到固定批次 key 的映射与服务端 batchKeyByAssessmentOption 一致
export const batchKeyByAssessmentOption: Record<string, string> = {
  "accept-unthrottled-replayable-batch": "virtual-unthrottled-replayable-batch",
  "enforce-quota-and-idempotency": "virtual-quota-idempotent-batch",
};

const rateLimitIdempotencyVariantConfigs: Record<
  RateLimitIdempotencyVariantKey,
  RateLimitIdempotencyVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "API 配额与重放风险观察版",
    badge: "无配额 + 无幂等键 + 无时间戳窗口",
    explanation:
      "观察固定 Webhook 批次在缺少配额、幂等键、签名时间窗和降级策略时，超额请求与重放请求同时被接受的组合风险。",
    expectedSignal:
      "风险路径完成后应出现 api-rate-limit-idempotency-risk-accepted 学习信号。",
    panelIntro:
      "页面只显示 virtual-* 虚构批次摘要与语义枚举，不发起真实并发请求，也不连接真实上游服务。",
    recommendedPath: [
      "accept-unthrottled-replayable-batch",
      "approve-overload-and-replay",
    ],
  },
  fixed: {
    key: "fixed",
    title: "API 配额与幂等防御复盘版",
    badge: "窗口配额 + 幂等键 + 签名时间窗 + 降级",
    explanation:
      "对同一固定批次施加窗口配额、幂等键、签名时间窗与节流降级四项控制，再对比阻断与正常基线。",
    expectedSignal:
      "防御路径出现 api-rate-limit-idempotency-defense-blocked，正常路径出现 api-rate-limit-idempotency-normal-verified。",
    panelIntro:
      "修复版只验证固定批次的资源控制摘要，不执行真实压测、并发扣减或外部 Webhook 投递。",
    recommendedPath: [
      "enforce-quota-and-idempotency",
      "block-overload-and-replay",
    ],
  },
};

export const rateLimitIdempotencyNormalPath = [
  "enforce-quota-and-idempotency",
  "verify-throttled-baseline",
];

export const rateLimitIdempotencyChecklist = [
  {
    key: "quota-scope",
    title: "设定窗口配额",
    description: "无上限的请求批次会把单一客户端的异常放大成服务不可用。",
  },
  {
    key: "idempotency-scope",
    title: "要求幂等键",
    description: "缺少幂等键时，重复投递的同一事件会被当作多笔业务处理。",
  },
  {
    key: "timestamp-scope",
    title: "校验签名时间窗",
    description: "时间窗把可重放区间压缩到有限范围，是幂等键之外的第二道边界。",
  },
  {
    key: "degrade-scope",
    title: "准备节流与降级",
    description: "触达配额后应节流降级而不是直接拒绝全部正常业务。",
  },
];

export function getRateLimitIdempotencyVariantConfig(
  variant: RateLimitIdempotencyVariantKey,
) {
  return rateLimitIdempotencyVariantConfigs[variant];
}

export function formatRateLimitIdempotencySignal(signal: string) {
  const labels: Record<string, string> = {
    "api-rate-limit-idempotency-risk-accepted": "超额与重放被接受",
    "api-rate-limit-idempotency-defense-blocked": "超额与重放已阻断",
    "api-rate-limit-idempotency-normal-verified": "节流基线通过",
    "api-rate-limit-idempotency-batch-accepted": "无配额批次被接受",
    "api-rate-limit-idempotency-controls-enforced": "资源控制已施加",
    "api-rate-limit-idempotency-boundary-blocked": "未登记输入被脱敏阻断",
  };

  return labels[signal] ?? signal;
}

export function createRateLimitIdempotencyLearningProgress(
  config: RateLimitIdempotencyVariantConfig,
) {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createRateLimitIdempotencyVerificationRecord(
  config: RateLimitIdempotencyVariantConfig,
  result: RateLimitIdempotencyResult,
) {
  return {
    variantKey: config.key,
    result: result.decision === "blocked" ? "blocked" : "passed",
    summary: `${result.labKey}: ${result.signal}`,
    details: {
      signal: result.signal,
      scenarioKey: result.scenarioKey,
      batchKey: result.batchAssessment?.batchKey ?? "blocked-batch-snapshot",
      findingCount: result.batchAssessment?.findingCount ?? 0,
      criticalFindingCount: result.batchAssessment?.criticalFindingCount ?? 0,
      resourceControlCount: result.batchAssessment?.resourceControlCount ?? 0,
      stepCount: result.assessment.stepCount,
    },
  };
}

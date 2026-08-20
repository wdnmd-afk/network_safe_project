import type {
  MitbTransactionResult,
  MitbTransactionVariantKey,
} from "../api/mitb-transaction-lab";

export type { MitbTransactionVariantKey };

export type MitbTransactionVariantConfig = {
  key: MitbTransactionVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
  panelIntro: string;
  recommendedPath: string[];
};

export const mitbTransactionScenarioKey =
  "fixed-browser-transaction-view-audit";

const mitbTransactionVariantConfigs: Record<
  MitbTransactionVariantKey,
  MitbTransactionVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "浏览器 MITB 风险观察版",
    badge: "只信任浏览器显示 + 交易未签名",
    explanation:
      "观察固定交易在浏览器显示、服务端记录和带外通道三方不一致且未签名时被提交的风险。",
    expectedSignal:
      "风险路径完成后应出现 client-mitb-risk-accepted 学习信号。",
    panelIntro:
      "页面只显示 virtual-* 收款方与教学金额，不读取真实浏览器 DOM、扩展、Cookie 或凭据。",
    recommendedPath: [
      "trust-browser-rendered-view",
      "submit-transaction-from-browser-view",
    ],
  },
  fixed: {
    key: "fixed",
    title: "浏览器 MITB 防御复盘版",
    badge: "三方视图对照 + 交易签名验证",
    explanation:
      "比对服务端记录与带外确认通道并要求独立交易签名，再对比阻断与正常放行基线。",
    expectedSignal:
      "防御路径出现 client-mitb-defense-blocked，正常路径出现 client-mitb-normal-verified。",
    panelIntro:
      "修复版只验证固定对照摘要，不发起真实支付、转账、扣款或撤销操作。",
    recommendedPath: [
      "compare-server-and-out-of-band-view",
      "block-mismatched-transaction",
    ],
  },
};

export const mitbTransactionNormalPath = [
  "compare-server-and-out-of-band-view",
  "confirm-consistent-transaction",
];

export const mitbTransactionChecklist = [
  {
    key: "server-record",
    title: "以服务端记录为准",
    description: "浏览器渲染结果可能被篡改，交易内容应以服务端实际记录为基准。",
  },
  {
    key: "out-of-band",
    title: "使用带外确认通道",
    description: "独立通道能在浏览器上下文之外复核收款方与金额。",
  },
  {
    key: "transaction-signing",
    title: "要求独立交易签名",
    description: "签名把用户确认绑定到具体交易内容，而不是绑定到会话。",
  },
  {
    key: "trusted-path",
    title: "建立受信路径",
    description: "高风险交易不应把确认权完全交给可能被篡改的客户端渲染层。",
  },
];

export function getMitbTransactionVariantConfig(
  variant: MitbTransactionVariantKey,
) {
  return mitbTransactionVariantConfigs[variant];
}

export function formatMitbTransactionSignal(signal: string) {
  const labels: Record<string, string> = {
    "client-mitb-risk-accepted": "篡改交易被提交",
    "client-mitb-defense-blocked": "不一致交易已阻断",
    "client-mitb-normal-verified": "一致交易通过确认",
    "client-mitb-browser-view-trusted": "只信任浏览器显示",
    "client-mitb-trusted-path-compared": "受信路径已比对",
    "client-mitb-boundary-blocked": "未登记输入被脱敏阻断",
  };

  return labels[signal] ?? signal;
}

export function createMitbTransactionLearningProgress(
  config: MitbTransactionVariantConfig,
) {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createMitbTransactionVerificationRecord(
  config: MitbTransactionVariantConfig,
  result: MitbTransactionResult,
) {
  return {
    variantKey: config.key,
    result: result.decision === "blocked" ? "blocked" : "passed",
    summary: `${result.labKey}: ${result.signal}`,
    details: {
      signal: result.signal,
      scenarioKey: result.scenarioKey,
      viewKey: result.viewAssessment?.viewKey ?? "blocked-transaction-view",
      findingCount: result.viewAssessment?.findingCount ?? 0,
      mismatchCount: result.viewAssessment?.mismatchCount ?? 0,
      trustedPathControlCount:
        result.viewAssessment?.trustedPathControlCount ?? 0,
      stepCount: result.assessment.stepCount,
    },
  };
}

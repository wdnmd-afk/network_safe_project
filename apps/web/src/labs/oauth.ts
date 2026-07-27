import type {
  OauthResult,
  OauthVariantKey,
} from "../api/oauth-lab";

export type { OauthVariantKey };

export type OauthVariantConfig = {
  key: OauthVariantKey;
  title: string;
  badge: string;
  perspective: string;
  explanation: string;
  expectedSignal: string;
  expectedOutcome: string;
  panelIntro: string;
  // 推荐的固定决策路径（有序 optionKey），前端只按钮驱动，不接受自由输入。
  recommendedPath: string[];
};

export type OauthLearningProgressInput = {
  variantKey: OauthVariantKey;
  status: "in-progress";
  notes: string;
};

export type OauthVerificationRecordInput = {
  variantKey: OauthVariantKey;
  result: "passed" | "blocked";
  summary: string;
  details: {
    signal: string;
    scenarioKey: string;
    stepCount: number;
    riskOutcomes: number;
    fixOutcomes: number;
    normalOutcomes: number;
  };
};

export const oauthScenarioKey = "tampered-authorization-response";

const oauthVariantConfigs: Record<OauthVariantKey, OauthVariantConfig> = {
  vuln: {
    key: "vuln",
    title: "OAuth 漏洞风险观察版",
    badge: "授权响应未绑定 + 接受被篡改响应",
    perspective: "攻击方观察",
    explanation:
      "本页从攻击方视角走两步决策：先接受未绑定授权响应，再直接接受被篡改授权响应，观察授权码流程如何被劫持。",
    expectedSignal:
      "沿风险路径完成后应出现 auth-oauth-risk-accepted 学习信号。",
    expectedOutcome: "完成授权绑定与授权响应两步固定决策，观察被篡改响应被接受。",
    panelIntro:
      "工作台只提供共享目录中声明的固定决策选项，不提供真实客户端、回调地址、授权码或 token。",
    recommendedPath: [
      "accept-unbound-authorization",
      "accept-tampered-response",
    ],
  },
  fixed: {
    key: "fixed",
    title: "OAuth 漏洞防御复盘版",
    badge: "精确回调地址 + state + PKCE",
    perspective: "防御方复盘",
    explanation:
      "本页从防御方视角复盘同一固定案例：绑定回调地址、state 与 PKCE 后，既可拦截被篡改授权响应，也能在校验通过后放行正常授权。",
    expectedSignal:
      "防御拦截路径出现 auth-oauth-defense-blocked，正常授权路径出现 auth-oauth-normal-verified。",
    expectedOutcome: "对比防御拦截路径与正常授权路径的固定判定差异。",
    panelIntro:
      "修复版强调服务端固定决策状态机、事件日志安全摘要和防御信号，前端按钮只用于引导学习流程。",
    recommendedPath: [
      "bind-authorization-request",
      "defense-blocks-tampered-response",
    ],
  },
};

// 修复版正常流程路径：绑定授权请求后校验通过放行正常授权，验证修复后业务仍可继续。
export const oauthNormalPath = [
  "bind-authorization-request",
  "allow-verified-authorization",
];

export const oauthReviewChecklist = [
  {
    key: "fixed-decisions",
    title: "决策只能来自固定选项",
    description:
      "页面不提供真实客户端、回调地址、授权码或 token，所有决策都来自本实验固定 optionKey。",
  },
  {
    key: "request-binding",
    title: "授权响应应与请求上下文绑定",
    description:
      "授权响应必须与原始客户端、精确回调地址、state 和 PKCE 严格绑定，避免注入或替换。",
  },
  {
    key: "authorization-defense",
    title: "被篡改授权响应应被拦截",
    description:
      "校验失败的授权响应必须被阻断，只有回调地址、state 与 PKCE 校验通过才放行正常授权。",
  },
  {
    key: "log-summary",
    title: "日志只记录脱敏摘要",
    description:
      "事件日志只记录固定案例 key、决策路径信号和结果计数，不记录真实授权码、token 或原始输入。",
  },
];

export function getOauthVariantConfig(variant: OauthVariantKey) {
  return oauthVariantConfigs[variant];
}

export function formatOauthSignal(signal: string) {
  const labels: Record<string, string> = {
    "auth-oauth-risk-accepted": "被篡改授权响应被接受（漏洞路径）",
    "auth-oauth-defense-blocked": "防御拦截被篡改授权响应",
    "auth-oauth-normal-verified": "正常授权流程通过",
    "auth-oauth-binding-open": "授权响应未绑定请求上下文",
    "auth-oauth-binding-enforced": "授权请求绑定已启用",
    "auth-oauth-boundary-blocked": "未登记输入被脱敏阻断",
  };

  return labels[signal] ?? signal;
}

export function createOauthLearningProgress(
  config: OauthVariantConfig,
): OauthLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createOauthVerificationRecord(
  config: OauthVariantConfig,
  result: OauthResult,
): OauthVerificationRecordInput {
  return {
    variantKey: config.key,
    result: result.decision === "blocked" ? "blocked" : "passed",
    summary: `${result.labKey}: ${result.signal}`,
    details: {
      signal: result.signal,
      scenarioKey: result.scenarioKey,
      stepCount: result.assessment.stepCount,
      riskOutcomes: result.recap.outcomeCounts.risk,
      fixOutcomes: result.recap.outcomeCounts.fix,
      normalOutcomes: result.recap.outcomeCounts.normal,
    },
  };
}

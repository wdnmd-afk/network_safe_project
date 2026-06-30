import type {
  SessionFixationResult,
  SessionFixationSignal,
  SessionFixationVariantKey,
} from "../api/session-fixation-lab";

export type { SessionFixationVariantKey };

export type SessionFixationVariantConfig = {
  key: SessionFixationVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
};

export type SessionFixationLearningProgressInput = {
  variantKey: SessionFixationVariantKey;
  status: "in-progress";
  notes: string;
};

export type SessionFixationVerificationRecordInput = {
  variantKey: SessionFixationVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: SessionFixationSignal;
    preLoginSessionId: string;
    sessionSource: string;
    attackerControlled: boolean;
    acceptedClientSessionId: boolean;
    rotatedSessionId: boolean;
  };
};

export const normalPreLoginSessionIdSample = "browser-prelogin-session-1024";
export const attackPreLoginSessionIdSample = "attacker-fixed-session-9001";
export const normalSessionSourceSample = "browser";
export const attackSessionSourceSample = "external-link";

const sessionFixationVariantConfigs: Record<
  SessionFixationVariantKey,
  SessionFixationVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "会话固定漏洞版",
    badge: "登录后继续使用客户端预登录会话 ID",
    explanation:
      "漏洞版模拟后端在登录完成后继续信任 preLoginSessionId。攻击者通过外部链接让用户带着固定 ID 进入登录流程后，该 ID 会被绑定到当前用户。",
    expectedSignal:
      "提交外部链接固定会话样例后应出现 session-fixed-id-bound 信号。",
  },
  fixed: {
    key: "fixed",
    title: "会话固定修复版",
    badge: "登录后由服务端轮换教学会话 ID",
    explanation:
      "修复版忽略客户端传入的预登录教学会话 ID，登录完成后生成新的服务端教学会话 ID。攻击者提前知道的 ID 不会成为用户登录后的会话。",
    expectedSignal:
      "提交外部链接固定会话样例后应出现 session-fixed-id-rotated 信号。",
  },
};

export function getSessionFixationVariantConfig(
  variant: SessionFixationVariantKey,
) {
  return sessionFixationVariantConfigs[variant];
}

export function createSessionFixationLearningProgress(
  config: SessionFixationVariantConfig,
): SessionFixationLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createSessionFixationVerificationRecord(
  config: SessionFixationVariantConfig,
  result: SessionFixationResult,
): SessionFixationVerificationRecordInput {
  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary:
        "漏洞版把外部链接带来的固定教学会话 ID 绑定给当前用户，会话固定模拟成功。",
      details: {
        signal: result.signal,
        preLoginSessionId: result.preLoginSessionId,
        sessionSource: result.inspection.sessionSource,
        attackerControlled: result.inspection.attackerControlled,
        acceptedClientSessionId: result.inspection.acceptedClientSessionId,
        rotatedSessionId: result.inspection.rotatedSessionId,
      },
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary:
      "修复版在登录后轮换教学会话 ID，外部链接带来的固定 ID 没有被绑定。",
    details: {
      signal: result.signal,
      preLoginSessionId: result.preLoginSessionId,
      sessionSource: result.inspection.sessionSource,
      attackerControlled: result.inspection.attackerControlled,
      acceptedClientSessionId: result.inspection.acceptedClientSessionId,
      rotatedSessionId: result.inspection.rotatedSessionId,
    },
  };
}

export function formatSessionFixationSignal(signal: SessionFixationSignal) {
  const labels: Record<SessionFixationSignal, string> = {
    "session-normal-id-accepted": "漏洞版接受普通预登录会话 ID",
    "session-normal-id-rotated": "修复版轮换普通预登录会话 ID",
    "session-fixed-id-bound": "漏洞版绑定了攻击者已知会话 ID",
    "session-fixed-id-rotated": "修复版轮换了攻击者已知会话 ID",
  };

  return labels[signal];
}

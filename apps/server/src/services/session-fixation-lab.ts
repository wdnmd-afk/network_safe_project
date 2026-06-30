import { randomUUID } from "node:crypto";

export type SessionFixationVariantKey = "vuln" | "fixed";

export type SessionFixationSessionSource =
  | "browser"
  | "external-link"
  | "unknown";

export type SessionFixationSignal =
  | "session-normal-id-accepted"
  | "session-normal-id-rotated"
  | "session-fixed-id-bound"
  | "session-fixed-id-rotated";

export type SessionFixationInput = {
  userId: string;
  username: string;
  variantKey: SessionFixationVariantKey;
  preLoginSessionId: string;
  sessionSource: string;
};

export type SessionFixationTeachingSession = {
  ownerUserId: string;
  ownerUsername: string;
  sessionId: string;
  source: "client" | "server";
  accessSummary: string;
};

export type SessionFixationInspection = {
  preLoginSessionIdLength: number;
  sessionSource: SessionFixationSessionSource;
  attackerControlled: boolean;
  acceptedClientSessionId: boolean;
  rotatedSessionId: boolean;
  sessionIdChanged: boolean;
  currentUserId: string;
  boundSessionIdLength: number;
};

export type SessionFixationResult = {
  status: "ok";
  variantKey: SessionFixationVariantKey;
  preLoginSessionId: string;
  sessionSource: SessionFixationSessionSource;
  teachingSession: SessionFixationTeachingSession;
  inspection: SessionFixationInspection;
  signal: SessionFixationSignal;
  decision: "accepted";
  message: string;
  nextStep: string;
};

export type SessionFixationLabSamples = {
  normalPreLoginSessionId: string;
  attackPreLoginSessionId: string;
  normalSessionSource: "browser";
  attackSessionSource: "external-link";
};

export type SessionFixationLabService = {
  submitTeachingLogin(
    input: SessionFixationInput,
  ): Promise<SessionFixationResult>;
  getSamples(): SessionFixationLabSamples;
};

export type CreateSessionFixationLabServiceOptions = {
  generateSessionId?: () => string;
};

const sessionFixationSamples: SessionFixationLabSamples = {
  normalPreLoginSessionId: "browser-prelogin-session-1024",
  attackPreLoginSessionId: "attacker-fixed-session-9001",
  normalSessionSource: "browser",
  attackSessionSource: "external-link",
};

function normalizeSessionSource(source: string): SessionFixationSessionSource {
  if (source === "browser" || source === "external-link") {
    return source;
  }

  return "unknown";
}

function createDefaultSessionId() {
  return `server-rotated-${randomUUID()}`;
}

function createInspection(input: {
  userId: string;
  preLoginSessionId: string;
  sessionSource: SessionFixationSessionSource;
  boundSessionId: string;
  acceptedClientSessionId: boolean;
  rotatedSessionId: boolean;
}): SessionFixationInspection {
  const attackerControlled = input.sessionSource === "external-link";

  return {
    preLoginSessionIdLength: input.preLoginSessionId.length,
    sessionSource: input.sessionSource,
    attackerControlled,
    acceptedClientSessionId: input.acceptedClientSessionId,
    rotatedSessionId: input.rotatedSessionId,
    sessionIdChanged: input.preLoginSessionId !== input.boundSessionId,
    currentUserId: input.userId,
    boundSessionIdLength: input.boundSessionId.length,
  };
}

function getSignal(input: {
  variantKey: SessionFixationVariantKey;
  attackerControlled: boolean;
}): SessionFixationSignal {
  if (input.variantKey === "vuln") {
    return input.attackerControlled
      ? "session-fixed-id-bound"
      : "session-normal-id-accepted";
  }

  return input.attackerControlled
    ? "session-fixed-id-rotated"
    : "session-normal-id-rotated";
}

function getMessage(signal: SessionFixationSignal) {
  const messages: Record<SessionFixationSignal, string> = {
    "session-normal-id-accepted":
      "漏洞版继续使用普通浏览器预登录教学会话 ID，正常流程被接受。",
    "session-normal-id-rotated":
      "修复版在登录后轮换教学会话 ID，普通流程仍然登录成功。",
    "session-fixed-id-bound":
      "漏洞版把外部链接带来的固定教学会话 ID 绑定给当前用户，会话固定模拟成功。",
    "session-fixed-id-rotated":
      "修复版忽略外部链接带来的固定教学会话 ID，并在登录后生成新的教学会话 ID。",
  };

  return messages[signal];
}

function getNextStep(signal: SessionFixationSignal) {
  const nextSteps: Record<SessionFixationSignal, string> = {
    "session-normal-id-accepted":
      "填入外部链接固定会话样例，观察漏洞版为什么会绑定攻击者已知的 ID。",
    "session-normal-id-rotated":
      "切换到漏洞版提交外部链接样例，对比登录后是否继续使用预登录会话 ID。",
    "session-fixed-id-bound":
      "切换到修复版提交同样样例，观察服务端轮换会话 ID 后攻击者已知 ID 为什么失效。",
    "session-fixed-id-rotated":
      "回到日志摘要，重点观察 sessionSource、rotatedSessionId 和 acceptedClientSessionId 的差异。",
  };

  return nextSteps[signal];
}

export function createSessionFixationLabService(
  options: CreateSessionFixationLabServiceOptions = {},
): SessionFixationLabService {
  const generateSessionId = options.generateSessionId ?? createDefaultSessionId;

  return {
    getSamples() {
      return sessionFixationSamples;
    },

    async submitTeachingLogin(input) {
      const preLoginSessionId = input.preLoginSessionId.trim();
      const sessionSource = normalizeSessionSource(input.sessionSource.trim());
      const acceptedClientSessionId = input.variantKey === "vuln";
      const boundSessionId = acceptedClientSessionId
        ? preLoginSessionId
        : generateSessionId();
      const inspection = createInspection({
        userId: input.userId,
        preLoginSessionId,
        sessionSource,
        boundSessionId,
        acceptedClientSessionId,
        rotatedSessionId: !acceptedClientSessionId,
      });
      const signal = getSignal({
        variantKey: input.variantKey,
        attackerControlled: inspection.attackerControlled,
      });

      return {
        status: "ok",
        variantKey: input.variantKey,
        preLoginSessionId,
        sessionSource,
        teachingSession: {
          ownerUserId: input.userId,
          ownerUsername: input.username,
          sessionId: boundSessionId,
          source: acceptedClientSessionId ? "client" : "server",
          accessSummary:
            "仅用于会话固定实验观察的教学会话，不是真实登录 token。",
        },
        inspection,
        signal,
        decision: "accepted",
        message: getMessage(signal),
        nextStep: getNextStep(signal),
      };
    },
  };
}

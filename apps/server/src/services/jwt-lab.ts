import { createHmac, timingSafeEqual } from "node:crypto";

export type JwtVariantKey = "vuln" | "fixed";

export type JwtSignal =
  | "jwt-valid-user-token-accepted"
  | "jwt-none-alg-admin-accepted"
  | "jwt-none-alg-blocked"
  | "jwt-signature-invalid-blocked"
  | "jwt-token-invalid";

export type JwtStatus = "ok" | "blocked" | "invalid";

export type JwtInput = {
  userId: string;
  variantKey: JwtVariantKey;
  token: string;
};

export type JwtHeader = {
  alg: string;
  typ: string;
};

export type JwtPayload = {
  sub: string;
  role: string;
  scope: string;
  lab: string;
};

export type JwtInspection = {
  tokenLength: number;
  segmentCount: number;
  algorithm: string;
  signaturePresent: boolean;
  signatureValid: boolean;
  roleClaim: string;
  scopeClaim: string;
  adminClaimRequested: boolean;
  labToken: boolean;
};

export type JwtAccess = {
  subject: string;
  role: string;
  scope: string;
  resource: "user-orders" | "admin-analytics";
  granted: boolean;
};

export type JwtResult = {
  status: JwtStatus;
  variantKey: JwtVariantKey;
  header: JwtHeader | null;
  payload: JwtPayload | null;
  inspection: JwtInspection;
  access: JwtAccess | null;
  signal: JwtSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type JwtLabSamples = {
  normalUserToken: string;
  noneAlgAdminToken: string;
};

export type JwtLabService = {
  verifyToken(input: JwtInput): Promise<JwtResult>;
  getSamples(): JwtLabSamples;
};

const jwtLabSecret = "jwt-lab-local-training-secret";
const normalHeader: JwtHeader = {
  alg: "HS256",
  typ: "JWT",
};
const normalPayload: JwtPayload = {
  sub: "learner-1001",
  role: "user",
  scope: "orders:read",
  lab: "auth.jwt",
};
const attackHeader: JwtHeader = {
  alg: "none",
  typ: "JWT",
};
const attackPayload: JwtPayload = {
  sub: "learner-1001",
  role: "admin",
  scope: "admin:read",
  lab: "auth.jwt",
};

function encodeJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signJwtSegments(headerSegment: string, payloadSegment: string) {
  return createHmac("sha256", jwtLabSecret)
    .update(`${headerSegment}.${payloadSegment}`)
    .digest("base64url");
}

function createSignedToken(header: JwtHeader, payload: JwtPayload) {
  const headerSegment = encodeJson(header);
  const payloadSegment = encodeJson(payload);
  const signature = signJwtSegments(headerSegment, payloadSegment);

  return `${headerSegment}.${payloadSegment}.${signature}`;
}

function createNoneAlgToken(header: JwtHeader, payload: JwtPayload) {
  return `${encodeJson(header)}.${encodeJson(payload)}.`;
}

const jwtLabSamples: JwtLabSamples = {
  normalUserToken: createSignedToken(normalHeader, normalPayload),
  noneAlgAdminToken: createNoneAlgToken(attackHeader, attackPayload),
};

function signaturesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function readJsonSegment<T>(segment: string): T | null {
  try {
    return JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function isJwtHeader(value: JwtHeader | null): value is JwtHeader {
  return Boolean(
    value &&
      typeof value.alg === "string" &&
      typeof value.typ === "string" &&
      value.typ === "JWT",
  );
}

function isJwtPayload(value: JwtPayload | null): value is JwtPayload {
  return Boolean(
    value &&
      typeof value.sub === "string" &&
      typeof value.role === "string" &&
      typeof value.scope === "string" &&
      value.lab === "auth.jwt",
  );
}

function createInspection(input: {
  token: string;
  segmentCount: number;
  header: JwtHeader | null;
  payload: JwtPayload | null;
  signaturePresent: boolean;
  signatureValid: boolean;
}): JwtInspection {
  const roleClaim = input.payload?.role ?? "";
  const scopeClaim = input.payload?.scope ?? "";

  return {
    tokenLength: input.token.length,
    segmentCount: input.segmentCount,
    algorithm: input.header?.alg ?? "",
    signaturePresent: input.signaturePresent,
    signatureValid: input.signatureValid,
    roleClaim,
    scopeClaim,
    adminClaimRequested: roleClaim === "admin" || scopeClaim.includes("admin"),
    labToken: input.payload?.lab === "auth.jwt",
  };
}

function createInvalidResult(input: {
  variantKey: JwtVariantKey;
  token: string;
  segmentCount: number;
  header: JwtHeader | null;
  payload: JwtPayload | null;
}): JwtResult {
  return {
    status: "invalid",
    variantKey: input.variantKey,
    header: input.header,
    payload: input.payload,
    inspection: createInspection({
      token: input.token,
      segmentCount: input.segmentCount,
      header: input.header,
      payload: input.payload,
      signaturePresent: false,
      signatureValid: false,
    }),
    access: null,
    signal: "jwt-token-invalid",
    decision: "failed",
    message: "JWT 结构或教学声明无效，实验入口已拒绝请求。",
    nextStep: "填入正常签名 token 或 alg=none 攻击样例，再观察校验差异。",
    blockedReason: "invalid-token",
  };
}

function createAccess(payload: JwtPayload): JwtAccess {
  const isAdmin = payload.role === "admin" && payload.scope === "admin:read";

  return {
    subject: payload.sub,
    role: payload.role,
    scope: payload.scope,
    resource: isAdmin ? "admin-analytics" : "user-orders",
    granted: true,
  };
}

export function createJwtLabService(): JwtLabService {
  return {
    getSamples() {
      return jwtLabSamples;
    },

    async verifyToken(input) {
      const token = input.token.trim();
      const parts = token.split(".");
      const [headerSegment = "", payloadSegment = "", signature = ""] = parts;
      const header = readJsonSegment<JwtHeader>(headerSegment);
      const payload = readJsonSegment<JwtPayload>(payloadSegment);
      const signaturePresent = Boolean(signature);

      if (
        parts.length !== 3 ||
        !headerSegment ||
        !payloadSegment ||
        !isJwtHeader(header) ||
        !isJwtPayload(payload)
      ) {
        return createInvalidResult({
          variantKey: input.variantKey,
          token,
          segmentCount: parts.length,
          header,
          payload,
        });
      }

      const expectedSignature = signJwtSegments(headerSegment, payloadSegment);
      const signatureValid =
        signaturePresent && signaturesMatch(signature, expectedSignature);
      const inspection = createInspection({
        token,
        segmentCount: parts.length,
        header,
        payload,
        signaturePresent,
        signatureValid,
      });

      if (input.variantKey === "fixed" && header.alg === "none") {
        return {
          status: "blocked",
          variantKey: input.variantKey,
          header,
          payload,
          inspection,
          access: null,
          signal: "jwt-none-alg-blocked",
          decision: "blocked",
          message: "修复版只允许 HS256 签名 token，已阻断 alg=none 令牌。",
          nextStep: "切回漏洞版提交同样 token，观察未签名管理员声明为什么会被接受。",
          blockedReason: "algorithm-not-allowed",
        };
      }

      if (header.alg !== "HS256" && header.alg !== "none") {
        return {
          status: "blocked",
          variantKey: input.variantKey,
          header,
          payload,
          inspection,
          access: null,
          signal: "jwt-signature-invalid-blocked",
          decision: "blocked",
          message: "JWT 算法不在实验允许范围内，已阻断。",
          nextStep: "使用正常签名 token 或受控 alg=none 样例继续观察。",
          blockedReason: "algorithm-not-supported",
        };
      }

      if (header.alg === "HS256" && !signatureValid) {
        return {
          status: "blocked",
          variantKey: input.variantKey,
          header,
          payload,
          inspection,
          access: null,
          signal: "jwt-signature-invalid-blocked",
          decision: "blocked",
          message: "签名校验失败，后端拒绝信任 payload 声明。",
          nextStep: "对比正常签名 token，观察签名如何保护角色声明。",
          blockedReason: "signature-invalid",
        };
      }

      if (header.alg === "none") {
        return {
          status: "ok",
          variantKey: input.variantKey,
          header,
          payload,
          inspection,
          access: createAccess(payload),
          signal: "jwt-none-alg-admin-accepted",
          decision: "accepted",
          message: "漏洞版信任 alg=none，未签名管理员声明被接受。",
          nextStep: "切到修复版提交同样 token，观察算法白名单如何阻断。",
        };
      }

      return {
        status: "ok",
        variantKey: input.variantKey,
        header,
        payload,
        inspection,
        access: createAccess(payload),
        signal: "jwt-valid-user-token-accepted",
        decision: "accepted",
        message: "签名教学 token 校验通过，普通用户访问范围被接受。",
        nextStep: "填入 alg=none 攻击样例，观察漏洞版和修复版对角色声明的差异。",
      };
    },
  };
}

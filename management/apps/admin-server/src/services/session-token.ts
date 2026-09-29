import { createHmac, timingSafeEqual } from "node:crypto";

// token 格式与主项目 apps/server/src/services/session-token.ts 相同，
// 但密钥取 ADMIN_TOKEN_SECRET。两个密钥不同，因此主站 token 无法用于管理端，
// 管理端 token 也无法用于主站。
//
// 载荷刻意不含 role：权限每个请求都重新查库判定，主项目改了角色立即生效。

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function signaturesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export type AdminTokenData = {
  userId: string;
  issuedAt: number;
  expiresAt: number;
};

export function createAdminToken(
  userId: string,
  secret: string,
  issuedAt = Date.now(),
  ttlMs = 8 * 60 * 60 * 1000,
) {
  const payload = `${userId}.${issuedAt}`;

  return `${payload}.${signPayload(payload, secret)}`;
}

export function readAdminToken(
  token: string,
  secret: string,
  now = Date.now(),
  ttlMs = 8 * 60 * 60 * 1000,
): AdminTokenData | null {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [userId, issuedAtText, signature] = parts;

  if (!userId || !issuedAtText || !signature) {
    return null;
  }

  const issuedAt = Number(issuedAtText);
  const expiresAt = issuedAt + ttlMs;

  if (
    !Number.isSafeInteger(issuedAt) ||
    !Number.isSafeInteger(expiresAt) ||
    now < issuedAt ||
    now >= expiresAt
  ) {
    return null;
  }

  const expected = signPayload(`${userId}.${issuedAtText}`, secret);

  if (!signaturesMatch(signature, expected)) {
    return null;
  }

  return { userId, issuedAt, expiresAt };
}

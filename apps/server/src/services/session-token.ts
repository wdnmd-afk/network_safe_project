import { createHmac, timingSafeEqual } from "node:crypto";

export const defaultTokenTtlMs = 8 * 60 * 60 * 1000;

export function resolveTokenTtlMs(
  value: string | number | undefined = process.env.AUTH_TOKEN_TTL_SECONDS,
) {
  const seconds = typeof value === "number" ? value : Number(value);

  if (!Number.isSafeInteger(seconds) || seconds <= 0) {
    return defaultTokenTtlMs;
  }

  return seconds * 1000;
}

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

export type SessionTokenData = {
  userId: string;
  issuedAt: number;
  expiresAt: number;
};

export function createSessionToken(
  userId: string,
  secret: string,
  issuedAt = Date.now(),
  ttlMs = resolveTokenTtlMs(),
) {
  const payload = `${userId}.${issuedAt}`;
  const signature = signPayload(payload, secret);

  return `${payload}.${signature}`;
}

export function readSessionToken(
  token: string,
  secret: string,
  now = Date.now(),
  ttlMs = resolveTokenTtlMs(),
): SessionTokenData | null {
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

  const expectedSignature = signPayload(`${userId}.${issuedAtText}`, secret);

  if (!signaturesMatch(signature, expectedSignature)) {
    return null;
  }

  return {
    userId,
    issuedAt,
    expiresAt,
  };
}

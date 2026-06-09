import { createHmac, timingSafeEqual } from "node:crypto";

const tokenTtlMs = 8 * 60 * 60 * 1000;

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

export function createSessionToken(userId: string, secret: string, issuedAt = Date.now()) {
  const payload = `${userId}.${issuedAt}`;
  const signature = signPayload(payload, secret);

  return `${payload}.${signature}`;
}

export function readSessionToken(token: string, secret: string, now = Date.now()) {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [userId, issuedAtText, signature] = parts;

  if (!userId || !issuedAtText || !signature) {
    return null;
  }

  const issuedAt = Number(issuedAtText);

  if (!Number.isSafeInteger(issuedAt) || now - issuedAt > tokenTtlMs) {
    return null;
  }

  const expectedSignature = signPayload(`${userId}.${issuedAtText}`, secret);

  if (!signaturesMatch(signature, expectedSignature)) {
    return null;
  }

  return {
    userId,
  };
}

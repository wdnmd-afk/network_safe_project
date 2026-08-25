import assert from "node:assert/strict";
import test from "node:test";

import { createSessionToken, defaultTokenTtlMs, readSessionToken, resolveTokenTtlMs } from "../src/services/session-token.js";

test("session token exposes issued and expiry timestamps", () => {
  const issuedAt = 1_800_000_000_000;
  const token = createSessionToken("1", "test-secret", issuedAt, 60_000);
  const session = readSessionToken(token, "test-secret", issuedAt + 30_000, 60_000);

  assert.deepEqual(session, {
    userId: "1",
    issuedAt,
    expiresAt: issuedAt + 60_000,
  });
});

test("session token rejects expiry, future timestamps and invalid signatures", () => {
  const issuedAt = 1_800_000_000_000;
  const token = createSessionToken("1", "test-secret", issuedAt, 60_000);

  assert.equal(readSessionToken(token, "test-secret", issuedAt + 60_000, 60_000), null);
  assert.equal(readSessionToken(token, "test-secret", issuedAt - 1, 60_000), null);
  assert.equal(readSessionToken(token, "wrong-secret", issuedAt + 1, 60_000), null);
});

test("token TTL accepts positive seconds and otherwise uses the eight-hour default", () => {
  assert.equal(resolveTokenTtlMs("60"), 60_000);
  assert.equal(resolveTokenTtlMs(120), 120_000);
  assert.equal(resolveTokenTtlMs("0"), defaultTokenTtlMs);
  assert.equal(resolveTokenTtlMs("invalid"), defaultTokenTtlMs);
});


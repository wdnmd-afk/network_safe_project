import { createHash, randomBytes } from "node:crypto";

import { verifyPassword } from "./password.js";
import {
  createSessionToken,
  readSessionToken,
  resolveTokenTtlMs,
} from "./session-token.js";
import {
  findUserById as findStoredUserById,
  findUserByUsername as findStoredUserByUsername,
  type StoredUser,
} from "./user-repository.js";

export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  role: string;
  status: string;
};

export type LoginInput = {
  username: string;
  password: string;
};

export type AuthService = {
  login(input: LoginInput): Promise<{
    token: string;
    user: AuthUser;
    expiresAt?: string;
  } | null>;
  getCurrentUser(token: string): Promise<AuthUser | null>;
  getSessionExpiresAt?(token: string): string | null;
  logout?(token: string): Promise<void>;
};

type CreateAuthServiceOptions = {
  findUserByUsername?: (username: string) => Promise<StoredUser | null>;
  findUserById?: (id: string) => Promise<StoredUser | null>;
  tokenSecret?: string;
  tokenTtlMs?: number;
};

function toAuthUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
  };
}

function getTokenSecret(secret?: string) {
  const configuredSecret = secret ?? process.env.AUTH_TOKEN_SECRET;

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_TOKEN_SECRET is required in production");
  }

  return randomBytes(32).toString("hex");
}

export function createAuthService(options: CreateAuthServiceOptions = {}): AuthService {
  const findUserByUsername = options.findUserByUsername ?? findStoredUserByUsername;
  const findUserById = options.findUserById ?? findStoredUserById;
  const tokenSecret = getTokenSecret(options.tokenSecret);
  const tokenTtlMs = options.tokenTtlMs ?? resolveTokenTtlMs();
  const revokedTokenFingerprints = new Map<string, number>();

  function tokenFingerprint(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  function removeExpiredRevocations(now = Date.now()) {
    for (const [fingerprint, expiresAt] of revokedTokenFingerprints) {
      if (expiresAt <= now) {
        revokedTokenFingerprints.delete(fingerprint);
      }
    }
  }

  function readActiveSession(token: string) {
    const session = readSessionToken(token, tokenSecret, Date.now(), tokenTtlMs);

    if (!session) {
      return null;
    }

    removeExpiredRevocations();

    return revokedTokenFingerprints.has(tokenFingerprint(token)) ? null : session;
  }

  return {
    async login(input) {
      const username = input.username.trim();

      if (!username || !input.password) {
        return null;
      }

      const user = await findUserByUsername(username);

      if (!user || user.status !== "active") {
        return null;
      }

      const passwordMatches = await verifyPassword(input.password, user.passwordHash);

      if (!passwordMatches) {
        return null;
      }

      const issuedAt = Date.now();
      const token = createSessionToken(user.id, tokenSecret, issuedAt, tokenTtlMs);

      return {
        token,
        user: toAuthUser(user),
        expiresAt: new Date(issuedAt + tokenTtlMs).toISOString(),
      };
    },

    async getCurrentUser(token) {
      const session = readActiveSession(token);

      if (!session) {
        return null;
      }

      const user = await findUserById(session.userId);

      return user ? toAuthUser(user) : null;
    },

    getSessionExpiresAt(token) {
      const session = readActiveSession(token);
      return session ? new Date(session.expiresAt).toISOString() : null;
    },

    async logout(token) {
      const session = readSessionToken(token, tokenSecret, Date.now(), tokenTtlMs);

      if (!session) {
        return;
      }

      removeExpiredRevocations();
      revokedTokenFingerprints.set(tokenFingerprint(token), session.expiresAt);
    },
  };
}

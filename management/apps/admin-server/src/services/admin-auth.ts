import { createHash } from "node:crypto";

import type { AdminUser } from "@nsm/shared";

import type { AdminRepository, StoredAdminUser } from "./admin-repository.js";
import { verifyPassword } from "./password.js";
import { createAdminToken, readAdminToken } from "./session-token.js";

export type LoginOutcome =
  | { ok: true; token: string; user: AdminUser; expiresAt: string }
  | { ok: false; status: 401; message: string }
  | { ok: false; status: 403; message: string };

export type AuthenticateOutcome =
  | { ok: true; user: AdminUser }
  | { ok: false; status: 401 | 403; message: string };

export type AdminAuthService = {
  login(input: { username: unknown; password: unknown }): Promise<LoginOutcome>;
  authenticate(token: string | undefined): Promise<AuthenticateOutcome>;
  logout(token: string | undefined): Promise<void>;
};

export type AdminAuthOptions = {
  repository: AdminRepository;
  tokenSecret: string;
  tokenTtlMs: number;
};

function toAdminUser(user: StoredAdminUser): AdminUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  };
}

function isAdminUser(user: StoredAdminUser) {
  return user.role === "admin" && user.status === "active";
}

export function createAdminAuthService(
  options: AdminAuthOptions,
): AdminAuthService {
  const { repository, tokenSecret, tokenTtlMs } = options;
  // 进程内吊销：与主项目 auth.ts 的做法一致，重启即清空
  const revokedTokenFingerprints = new Map<string, number>();

  function fingerprint(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  function removeExpiredRevocations(now = Date.now()) {
    for (const [key, expiresAt] of revokedTokenFingerprints) {
      if (expiresAt <= now) {
        revokedTokenFingerprints.delete(key);
      }
    }
  }

  function readActiveToken(token: string) {
    const data = readAdminToken(token, tokenSecret, Date.now(), tokenTtlMs);

    if (!data) {
      return null;
    }

    removeExpiredRevocations();

    return revokedTokenFingerprints.has(fingerprint(token)) ? null : data;
  }

  return {
    async login(input) {
      const username = typeof input.username === "string" ? input.username.trim() : "";
      const password = typeof input.password === "string" ? input.password : "";

      if (!username || !password) {
        return {
          ok: false,
          status: 401,
          message: "invalid credentials",
        };
      }

      const user = await repository.findUserByUsername(username);

      if (!user || user.status !== "active") {
        return { ok: false, status: 401, message: "invalid credentials" };
      }

      const passwordMatches = await verifyPassword(password, user.passwordHash);

      if (!passwordMatches) {
        return { ok: false, status: 401, message: "invalid credentials" };
      }

      // 凭据正确但不是管理员：身份已确认、权限不足，因此是 403 而不是 401
      if (!isAdminUser(user)) {
        return {
          ok: false,
          status: 403,
          message: "administrator role required",
        };
      }

      const issuedAt = Date.now();
      const token = createAdminToken(user.id, tokenSecret, issuedAt, tokenTtlMs);

      return {
        ok: true,
        token,
        user: toAdminUser(user),
        expiresAt: new Date(issuedAt + tokenTtlMs).toISOString(),
      };
    },

    async authenticate(token) {
      if (!token) {
        return { ok: false, status: 401, message: "missing session token" };
      }

      const data = readActiveToken(token);

      if (!data) {
        return { ok: false, status: 401, message: "invalid session token" };
      }

      // 每个请求都重新查库判角色：token 载荷不含 role，
      // 因此主项目把角色改成 member 后，旧 token 下一个请求即失效
      const user = await repository.findUserById(data.userId);

      if (!user) {
        return { ok: false, status: 401, message: "invalid session token" };
      }

      if (!isAdminUser(user)) {
        return { ok: false, status: 403, message: "administrator role required" };
      }

      return { ok: true, user: toAdminUser(user) };
    },

    async logout(token) {
      if (!token) {
        return;
      }

      const data = readAdminToken(token, tokenSecret, Date.now(), tokenTtlMs);

      if (!data) {
        return;
      }

      removeExpiredRevocations();
      revokedTokenFingerprints.set(fingerprint(token), data.expiresAt);
    },
  };
}

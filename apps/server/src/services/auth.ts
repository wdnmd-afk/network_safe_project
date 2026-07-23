import { randomBytes } from "node:crypto";

import { verifyPassword } from "./password.js";
import { createSessionToken, readSessionToken } from "./session-token.js";
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
  } | null>;
  getCurrentUser(token: string): Promise<AuthUser | null>;
};

type CreateAuthServiceOptions = {
  findUserByUsername?: (username: string) => Promise<StoredUser | null>;
  findUserById?: (id: string) => Promise<StoredUser | null>;
  tokenSecret?: string;
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

      return {
        token: createSessionToken(user.id, tokenSecret),
        user: toAuthUser(user),
      };
    },

    async getCurrentUser(token) {
      const session = readSessionToken(token, tokenSecret);

      if (!session) {
        return null;
      }

      const user = await findUserById(session.userId);

      return user ? toAuthUser(user) : null;
    },
  };
}

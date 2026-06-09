import { defineStore } from "pinia";

import {
  fetchCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  type AuthUser,
  type LoginInput,
} from "../api/auth";

const tokenStorageKey = "network-safe-session-token";

function readStoredToken() {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  return sessionStorage.getItem(tokenStorageKey);
}

function writeStoredToken(token: string) {
  sessionStorage.setItem(tokenStorageKey, token);
}

function clearStoredToken() {
  sessionStorage.removeItem(tokenStorageKey);
}

export const useSessionStore = defineStore("session", {
  state: () => ({
    token: readStoredToken(),
    user: null as AuthUser | null,
    isLoading: false,
    errorMessage: "",
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token && state.user),
    displayName: (state) => state.user?.displayName ?? "未登录用户",
  },
  actions: {
    setSession(session: { token: string; user: AuthUser }) {
      this.token = session.token;
      this.user = session.user;
      this.errorMessage = "";
      writeStoredToken(session.token);
    },

    clearSession() {
      this.token = null;
      this.user = null;
      this.errorMessage = "";
      clearStoredToken();
    },

    async login(input: LoginInput) {
      this.isLoading = true;
      this.errorMessage = "";

      try {
        const result = await loginRequest(input);
        this.setSession(result);
      } catch (error) {
        this.clearSession();
        this.errorMessage =
          error instanceof Error ? error.message : "登录失败";
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async loadCurrentUser() {
      if (!this.token) {
        return;
      }

      this.isLoading = true;
      this.errorMessage = "";

      try {
        const result = await fetchCurrentUser(this.token);
        this.user = result.user;
      } catch (error) {
        this.clearSession();
        this.errorMessage =
          error instanceof Error ? error.message : "登录状态已失效";
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      if (this.token) {
        await logoutRequest();
      }

      this.clearSession();
    },
  },
});

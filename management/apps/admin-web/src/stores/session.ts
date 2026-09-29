import { defineStore } from "pinia";

import type { AdminUser } from "@nsm/shared";

import {
  fetchCurrentAdmin,
  login as loginRequest,
  logout as logoutRequest,
} from "../api/admin";
import { ApiError, setAuthToken } from "../api/client";

// 与主项目一致：令牌放 sessionStorage，关闭标签页即失效
const tokenStorageKey = "network-safe-admin-token";

function readStoredToken() {
  try {
    return window.sessionStorage.getItem(tokenStorageKey);
  } catch {
    // 隐私模式等场景下 storage 可能不可用，此时退化为仅内存保存
    return null;
  }
}

function writeStoredToken(token: string | null) {
  try {
    if (token) {
      window.sessionStorage.setItem(tokenStorageKey, token);
    } else {
      window.sessionStorage.removeItem(tokenStorageKey);
    }
  } catch {
    // 写入失败不影响本次会话可用
  }
}

export const useSessionStore = defineStore("admin-session", {
  state: () => {
    const token = readStoredToken();
    setAuthToken(token);

    return {
      token,
      user: null as AdminUser | null,
      isLoading: false,
      errorMessage: "",
    };
  },
  getters: {
    isAuthenticated: (state) => Boolean(state.token && state.user),
  },
  actions: {
    async login(input: { username: string; password: string }) {
      this.isLoading = true;
      this.errorMessage = "";

      try {
        const response = await loginRequest(input);

        this.token = response.token;
        this.user = response.user;
        writeStoredToken(response.token);
        setAuthToken(response.token);

        return true;
      } catch (error) {
        this.errorMessage =
          error instanceof ApiError
            ? error.message
            : "登录失败，请检查后端服务是否已启动";
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async loadCurrentUser() {
      if (!this.token) {
        return false;
      }

      try {
        const response = await fetchCurrentAdmin();

        this.user = response.user;
        return true;
      } catch (error) {
        // 令牌失效或角色被降级：清空会话并回到登录页
        this.clearSession();
        this.errorMessage =
          error instanceof ApiError ? error.message : "会话已失效";
        return false;
      }
    },

    async logout() {
      try {
        await logoutRequest();
      } catch {
        // 服务端不可达也要清掉本地会话，否则用户被困在管理端
      } finally {
        this.clearSession();
      }
    },

    clearSession() {
      this.token = null;
      this.user = null;
      writeStoredToken(null);
      setAuthToken(null);
    },
  },
});

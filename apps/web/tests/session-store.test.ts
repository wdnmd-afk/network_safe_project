import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { login, logout } from "../src/api/auth";
import { fetchCurrentUserLabRecords } from "../src/api/lab-records";
import { useSessionStore } from "../src/stores/session";

vi.mock("../src/api/auth", () => ({
  login: vi.fn(),
  fetchCurrentUser: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("../src/api/lab-records", () => ({
  fetchCurrentUserLabRecords: vi.fn(),
}));

describe("session store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    sessionStorage.clear();
    vi.mocked(login).mockReset();
    vi.mocked(logout).mockReset();
    vi.mocked(fetchCurrentUserLabRecords).mockReset();
  });

  it("stores token and user after login", async () => {
    vi.mocked(login).mockResolvedValue({
      token: "local-session-token",
      user: {
        id: "1",
        username: "demo_user",
        displayName: "演示用户",
        role: "member",
        status: "active",
      },
    });
    const session = useSessionStore();

    await session.login({
      username: "demo_user",
      password: "Demo@123456",
    });

    expect(session.isAuthenticated).toBe(true);
    expect(session.user?.username).toBe("demo_user");
    expect(sessionStorage.getItem("network-safe-session-token")).toBe(
      "local-session-token",
    );
  });

  it("clears local session state on logout", async () => {
    const session = useSessionStore();
    session.setSession({
      token: "local-session-token",
      user: {
        id: "1",
        username: "demo_user",
        displayName: "演示用户",
        role: "member",
        status: "active",
      },
    });

    await session.logout();

    expect(session.isAuthenticated).toBe(false);
    expect(session.user).toBeNull();
    expect(sessionStorage.getItem("network-safe-session-token")).toBeNull();
  });

  it("loads current user lab record summary with session token", async () => {
    vi.mocked(fetchCurrentUserLabRecords).mockResolvedValue({
      status: "ok",
      records: {
        progress: [
          {
            labKey: "web.xss",
            title: "XSS",
            variantKey: "fixed",
            status: "completed",
            updatedAt: "2026-06-22T09:00:00.000Z",
          },
        ],
        verifications: [
          {
            labKey: "web.xss",
            title: "XSS",
            variantKey: "fixed",
            result: "passed",
            summary: "修复版原样显示 HTML 字符串",
            createdAt: "2026-06-22T09:01:00.000Z",
          },
        ],
      },
    });
    const session = useSessionStore();
    session.setSession({
      token: "local-session-token",
      user: {
        id: "1",
        username: "demo_user",
        displayName: "演示用户",
        role: "member",
        status: "active",
      },
    });

    await session.loadLabRecordSummary();

    expect(fetchCurrentUserLabRecords).toHaveBeenCalledWith("local-session-token");
    expect(session.labRecords.progress[0]?.labKey).toBe("web.xss");
    expect(session.labRecords.verifications[0]?.result).toBe("passed");
  });
});

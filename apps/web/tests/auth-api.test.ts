import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchCurrentUser, login, logout } from "../src/api/auth";

describe("auth api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("login posts credentials to the auth endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          token: "local-session-token",
          user: {
            id: "1",
            username: "demo_user",
            displayName: "演示用户",
            role: "member",
            status: "active",
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const result = await login({
      username: "demo_user",
      password: "Demo@123456",
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        username: "demo_user",
        password: "Demo@123456",
      }),
    });
    expect(result.user.username).toBe("demo_user");
    expect(result.token).toBe("local-session-token");
  });

  it("fetchCurrentUser reads the account profile with bearer token", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          user: {
            id: "1",
            username: "demo_user",
            displayName: "演示用户",
            role: "member",
            status: "active",
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const result = await fetchCurrentUser("local-session-token");

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/me", {
      headers: {
        authorization: "Bearer local-session-token",
      },
    });
    expect(result.user.displayName).toBe("演示用户");
  });

  it("logout posts to the auth logout endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    await logout();

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
    });
  });
});

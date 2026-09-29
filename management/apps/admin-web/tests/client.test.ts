import { describe, expect, it, vi } from "vitest";

import { ApiError, request, setAuthToken, toQueryString } from "../src/api/client";

describe("查询串构造", () => {
  it("剔除空值，避免发送空参数被服务端判为非法枚举", () => {
    expect(toQueryString({ page: 1, pageSize: 20 })).toBe("?page=1&pageSize=20");
    expect(toQueryString({ page: 1, action: "", labKey: undefined, userId: null })).toBe(
      "?page=1",
    );
  });

  it("布尔与数字转成字符串", () => {
    expect(toQueryString({ isEnabled: false })).toBe("?isEnabled=false");
  });

  it("全部为空时返回空串", () => {
    expect(toQueryString({ a: "", b: undefined })).toBe("");
  });
});

describe("请求封装", () => {
  it("带上 Bearer 令牌与 JSON 内容类型", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    setAuthToken("token-abc");

    await request("/api/admin/health", {
      method: "POST",
      body: JSON.stringify({ a: 1 }),
    });

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(headers.get("authorization")).toBe("Bearer token-abc");
    expect(headers.get("content-type")).toBe("application/json");

    setAuthToken(null);
    vi.unstubAllGlobals();
  });

  it("非 2xx 抛 ApiError 并带上服务端消息", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ status: "error", message: "invalid session token" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    await expect(request("/api/admin/overview")).rejects.toBeInstanceOf(ApiError);

    try {
      await request("/api/admin/overview");
    } catch (error) {
      expect((error as ApiError).status).toBe(401);
      expect((error as ApiError).message).toBe("invalid session token");
    }

    vi.unstubAllGlobals();
  });

  it("响应不是 JSON 时回退为状态码描述", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html>502</html>", { status: 502 })),
    );

    await expect(request("/api/admin/health")).rejects.toThrow("502");

    vi.unstubAllGlobals();
  });
});

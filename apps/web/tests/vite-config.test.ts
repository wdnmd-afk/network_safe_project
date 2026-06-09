import { describe, expect, it } from "vitest";

import { apiProxyTarget, webDevPort } from "../src/config/runtime";

describe("Vite 开发服务配置", () => {
  it("使用前端 6666 端口并代理 API 到后端 6667", () => {
    expect(webDevPort).toBe(6666);
    expect(apiProxyTarget).toBe("http://localhost:6667");
  });
});

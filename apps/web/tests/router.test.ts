import { describe, expect, it } from "vitest";

import { routes } from "../src/router/routes";

describe("SafeMart 路由清单", () => {
  it("包含功能型网站的核心页面路径", () => {
    const paths = routes.map((route) => route.path);

    expect(paths).toEqual([
      "/",
      "/products",
      "/login",
      "/account",
      "/orders",
      "/support",
      "/labs",
      "/labs/web/xss/vuln",
      "/labs/web/xss/fixed",
    ]);
  });
});

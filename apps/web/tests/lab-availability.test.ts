import { describe, expect, it, vi } from "vitest";

import type { LabAvailability } from "../src/api/labs";
import {
  createLabVariantGuard,
  isCatalogVariantEnabled,
  parseLabVariantRoute,
  resolveVariantRedirect,
} from "../src/router/lab-availability";

function createAvailability(
  variants: { key: string; enabled: boolean }[],
): LabAvailability {
  return {
    source: "database",
    labEnabled: true,
    variants,
  };
}

describe("parseLabVariantRoute", () => {
  it("识别实验变体页并拼出 labKey", () => {
    expect(parseLabVariantRoute("/labs/web/xss/vuln")).toEqual({
      category: "web",
      scene: "xss",
      variant: "vuln",
    });
    expect(parseLabVariantRoute("/labs/auth/idor/fixed")).toEqual({
      category: "auth",
      scene: "idor",
      variant: "fixed",
    });
  });

  it("容忍结尾斜杠", () => {
    expect(parseLabVariantRoute("/labs/web/xss/vuln/")?.variant).toBe("vuln");
  });

  it("不处理详情页、目录页与其他页面", () => {
    for (const path of [
      "/labs/web/xss",
      "/labs",
      "/status",
      "/",
      "/labs/web/xss/vuln/extra",
    ]) {
      expect(parseLabVariantRoute(path)).toBeNull();
    }
  });

  it("不把非 vuln/fixed 的第三段当作变体", () => {
    expect(parseLabVariantRoute("/labs/web/csrf/state")).toBeNull();
  });
});

describe("resolveVariantRedirect", () => {
  const target = { category: "web", scene: "xss", variant: "vuln" as const };

  it("变体停用时重定向回详情页并带停用标记", () => {
    const redirect = resolveVariantRedirect(
      target,
      createAvailability([{ key: "vuln", enabled: false }]),
    );

    expect(redirect).toEqual({
      path: "/labs/web/xss",
      query: { disabled: "vuln" },
    });
  });

  it("变体启用时放行", () => {
    expect(
      resolveVariantRedirect(
        target,
        createAvailability([{ key: "vuln", enabled: true }]),
      ),
    ).toBeNull();
  });

  it("可用性缺失时放行", () => {
    // 接口失败或数据库不可用时不阻断学习，与服务端 metadata-fallback 语义一致
    expect(resolveVariantRedirect(target, null)).toBeNull();
  });

  it("可用性里没有该变体时放行", () => {
    expect(
      resolveVariantRedirect(
        target,
        createAvailability([{ key: "fixed", enabled: false }]),
      ),
    ).toBeNull();
  });
});

describe("isCatalogVariantEnabled", () => {
  it("明确返回 enabled: false 时视为停用", () => {
    expect(
      isCatalogVariantEnabled(
        createAvailability([{ key: "vuln", enabled: false }]),
        "vuln",
      ),
    ).toBe(false);
  });

  it("启用或缺失可用性时视为可进入", () => {
    expect(
      isCatalogVariantEnabled(
        createAvailability([{ key: "vuln", enabled: true }]),
        "vuln",
      ),
    ).toBe(true);
    expect(isCatalogVariantEnabled(undefined, "vuln")).toBe(true);
    expect(isCatalogVariantEnabled(null, "vuln")).toBe(true);
  });
});

describe("createLabVariantGuard", () => {
  it("非变体页不请求可用性", async () => {
    const loader = vi.fn();
    const guard = createLabVariantGuard(loader);

    await expect(guard({ path: "/labs/web/xss" })).resolves.toBe(true);
    await expect(guard({ path: "/status" })).resolves.toBe(true);
    expect(loader).not.toHaveBeenCalled();
  });

  it("停用的变体被重定向", async () => {
    const guard = createLabVariantGuard(async () =>
      createAvailability([{ key: "vuln", enabled: false }]),
    );

    await expect(guard({ path: "/labs/web/xss/vuln" })).resolves.toEqual({
      path: "/labs/web/xss",
      query: { disabled: "vuln" },
    });
  });

  it("启用的变体放行", async () => {
    const guard = createLabVariantGuard(async () =>
      createAvailability([{ key: "vuln", enabled: true }]),
    );

    await expect(guard({ path: "/labs/web/xss/vuln" })).resolves.toBe(true);
  });

  it("可用性请求失败时放行，不阻断学习", async () => {
    const guard = createLabVariantGuard(async () => {
      throw new Error("network down");
    });

    await expect(guard({ path: "/labs/web/xss/vuln" })).resolves.toBe(true);
  });
});

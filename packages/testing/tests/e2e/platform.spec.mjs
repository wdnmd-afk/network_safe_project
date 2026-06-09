import { expect, test } from "@playwright/test";

test("首页展示 SafeMart 品牌和核心导航", async ({ page }) => {
  await page.goto("/");

  const mainNav = page.getByRole("navigation", { name: "主导航" });

  await expect(page.getByRole("link", { name: "SafeMart 首页" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "常见业务网站的本机训练样板" })).toBeVisible();
  await expect(mainNav.getByRole("link", { name: "商品", exact: true })).toBeVisible();
  await expect(mainNav.getByRole("link", { name: "实验", exact: true })).toBeVisible();
});

test("商品页支持按关键字搜索商品", async ({ page }) => {
  await page.goto("/products");

  await page.getByLabel("搜索商品").fill("secure");

  await expect(page.getByRole("cell", { name: /Secure Key Pro/ })).toBeVisible();
  await expect(page.getByRole("cell", { name: /Home WiFi Camera/ })).toHaveCount(0);
});

test("前端代理可以访问后端健康检查", async ({ page }) => {
  await page.goto("/");

  const health = await page.evaluate(async () => {
    const response = await fetch("/api/health");
    return {
      status: response.status,
      body: await response.json(),
    };
  });

  expect(health).toMatchObject({
    status: 200,
    body: {
      status: "ok",
      service: "server",
    },
  });
});

test("实验页展示真实元数据列表", async ({ page }) => {
  await page.goto("/labs");

  await expect(page.getByRole("heading", { name: "实验入口" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Web 漏洞" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "认证授权" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "XSS" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "JWT 攻击" })).toBeVisible();
  await expect(page.getByRole("link", { name: "漏洞版" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "修复版" }).first()).toBeVisible();
});

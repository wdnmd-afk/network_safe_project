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

test("XSS 漏洞版和修复版对同一样例呈现不同结果", async ({ page }) => {
  const samplePayload =
    '<mark data-xss-lab-signal="xss">XSS 模拟信号</mark>';

  await page.goto("/labs/web/xss/vuln");
  await page.getByRole("button", { name: "填入样例" }).click();
  await page.getByRole("button", { name: "提交留言" }).click();

  await expect(page.locator("[data-xss-lab-signal='xss']")).toBeVisible();

  await page.goto("/labs/web/xss/fixed");
  await page.getByRole("button", { name: "填入样例" }).click();
  await page.getByRole("button", { name: "提交留言" }).click();

  await expect(page.locator("[data-xss-lab-signal='xss']")).toHaveCount(0);
  await expect(page.getByText(samplePayload)).toBeVisible();
});

test("登录用户完成 XSS 样例后可在账户中心看到实验记录", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("用户名").fill("demo_user");
  await page.getByLabel("密码").fill("Demo@123456");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page.getByRole("heading", { name: "账户中心" })).toBeVisible();

  await page.goto("/labs/web/xss/fixed");
  await page.getByRole("button", { name: "填入样例" }).click();
  await page.getByRole("button", { name: "提交留言" }).click();

  await page.goto("/account");

  await expect(page.getByRole("heading", { name: "学习进度" })).toBeVisible();
  await expect(page.getByText("fixed / completed")).toBeVisible();
  await expect(page.getByRole("heading", { name: "最近验证" })).toBeVisible();
  await expect(page.getByText("修复版原样显示 HTML 字符串").first()).toBeVisible();
});

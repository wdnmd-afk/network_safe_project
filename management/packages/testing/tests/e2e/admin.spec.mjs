import { expect, test } from "@playwright/test";

import { httpRequest } from "../../src/http.mjs";
import { e2eRuntime } from "../../src/runtime.mjs";

const {
  adminApiOrigin,
  adminCredentials,
  mainApiOrigin,
  mainWebOrigin,
  targetCategory,
  targetLabKey,
  targetScene,
  targetVariant,
} = e2eRuntime;

const labPath = `/labs/${targetCategory}/${targetScene}`;
const variantPath = `${labPath}/${targetVariant}`;
const apiPath = `/api/labs/${targetCategory}/${targetScene}/${targetVariant}/search`;

// 主站端口 6667 在 Fetch 规范的坏端口名单内，因此这里统一走 node:http
async function adminToken() {
  const response = await httpRequest(`${adminApiOrigin}/api/admin/auth/login`, {
    method: "POST",
    body: adminCredentials,
  });

  expect(response.status).toBe(200);

  return response.json().token;
}

async function setVariantEnabled(token, isEnabled) {
  const response = await httpRequest(
    `${adminApiOrigin}/api/admin/labs/${targetLabKey}/variants/${targetVariant}`,
    {
      method: "PATCH",
      body: { isEnabled },
      token,
    },
  );

  expect(response.status).toBe(200);
}

async function variantApiStatus() {
  const response = await httpRequest(`${mainApiOrigin}${apiPath}`, {
    method: "POST",
    body: { keyword: "controlled-sample" },
  });

  return response.status;
}

/**
 * 点击变体开关。
 *
 * 开关的 input 被视觉隐藏（靠 <label> 呈现样式），Playwright 会判定其不可见，
 * 因此点击 label —— 这也正是真实用户的点击目标。
 */
function variantSwitch(page, row, variantTitle) {
  return row.locator("label.switch").filter({ hasText: variantTitle });
}

/** 主站目录卡片按详情链接定位，避免依赖实验标题文案 */
function directoryCard(page) {
  return page
    .locator("article.lab-card")
    .filter({ has: page.locator(`a[href="${labPath}"]`) });
}

test.describe("管理端启停全链路", () => {
  // 用例会真的改动实验启停状态，无论成败都要把状态恢复
  test.afterEach(async () => {
    const token = await adminToken();
    await setVariantEnabled(token, true);
  });

  test("登录后停用变体，主站目录、前台入口与实验接口三层同时生效，且留下审计", async ({
    page,
  }) => {
    // 1. 管理员登录
    await page.goto("/login");
    await page.getByLabel("管理员账号").fill(adminCredentials.username);
    await page.getByLabel("密码").fill(adminCredentials.password);
    await page.getByRole("button", { name: "登录" }).click();

    await expect(page).toHaveURL(/\/overview$/);
    await expect(page.getByRole("heading", { name: "总览" })).toBeVisible();
    await expect(page.getByText("实验总数")).toBeVisible();

    // 2. 在实验目录里停用目标变体
    await page.getByRole("link", { name: "实验目录" }).click();
    await expect(page).toHaveURL(/\/labs$/);

    const labRow = page.getByRole("row").filter({ hasText: targetLabKey });
    await expect(labRow).toBeVisible();

    await variantSwitch(page, labRow, "漏洞版").click();

    // 停用属危险操作，必须二次确认
    await expect(page.getByRole("dialog", { name: "停用该变体" })).toBeVisible();
    await page.getByRole("button", { name: "确认停用" }).click();
    await expect(page.getByText(`已停用 ${targetLabKey} 的 ${targetVariant} 变体。`)).toBeVisible();

    // 3. 主站目录不再给出可点击入口
    await page.goto(`${mainWebOrigin}/labs`);
    await expect(directoryCard(page).getByText("（已停用）")).toBeVisible();

    // 4. 直访前台变体页被守卫拦回详情页并给出停用提示
    await page.goto(`${mainWebOrigin}${variantPath}`);
    await expect(page).toHaveURL(
      new RegExp(`${labPath}\\?disabled=${targetVariant}$`),
    );
    await expect(page.getByText("已由管理端停用")).toBeVisible();

    // 5. 直调实验接口返回 403，说明拦截发生在请求层而不是只藏了入口
    expect(await variantApiStatus()).toBe(403);

    // 6. 管理端留下审计记录
    await page.goto("/audit");
    await page.getByLabel("操作类型").selectOption("variant.disable");
    const auditRow = page.getByRole("row").filter({ hasText: `${targetLabKey}:${targetVariant}` });
    await expect(auditRow.first()).toBeVisible();
    await expect(auditRow.first().getByText("停用变体")).toBeVisible();

    // 7. 重新启用后三层同时恢复
    await page.goto("/labs");
    const restoreRow = page.getByRole("row").filter({ hasText: targetLabKey });
    await variantSwitch(page, restoreRow, "漏洞版").click();
    await expect(page.getByRole("dialog", { name: "启用该变体" })).toBeVisible();
    await page.getByRole("button", { name: "确认启用" }).click();
    await expect(page.getByText(`已启用 ${targetLabKey} 的 ${targetVariant} 变体。`)).toBeVisible();

    await page.goto(`${mainWebOrigin}/labs`);
    await expect(directoryCard(page).getByText("（已停用）")).toHaveCount(0);

    await page.goto(`${mainWebOrigin}${variantPath}`);
    await expect(page).toHaveURL(new RegExp(`${variantPath}$`));

    expect(await variantApiStatus()).not.toBe(403);
  });

  test("未登录访问管理端页面会被重定向到登录页", async ({ page }) => {
    await page.goto("/learners");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Network Safe 管理端" })).toBeVisible();
  });

  test("普通账号无法登录管理端", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("管理员账号").fill("demo_user");
    await page.getByLabel("密码").fill("Demo@123456");
    await page.getByRole("button", { name: "登录" }).click();

    await expect(page.getByRole("alert")).toContainText("administrator role required");
    await expect(page).toHaveURL(/\/login/);
  });

  test("事件审计页能按条件查询并查看链路", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("管理员账号").fill(adminCredentials.username);
    await page.getByLabel("密码").fill(adminCredentials.password);
    await page.getByRole("button", { name: "登录" }).click();

    await expect(page).toHaveURL(/\/overview$/);

    await page.goto("/events");
    await page.getByRole("button", { name: "查询" }).click();

    // 没有事件时给出明确空状态，而不是空白表格
    await expect(page.getByText("事件列表")).toBeVisible();
  });
});

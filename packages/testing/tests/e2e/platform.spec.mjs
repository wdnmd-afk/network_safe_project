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

test("XSS 实验详情页展示元数据、验证方式和变体入口", async ({ page }) => {
  await page.goto("/labs/web/xss");

  await expect(page.getByRole("heading", { name: "XSS" })).toBeVisible();
  await expect(page.getByText("在客服留言业务上下文中对比未转义输出与文本渲染")).toBeVisible();
  await expect(page.getByRole("heading", { name: "知识点" })).toBeVisible();
  await expect(page.getByText("用户输入不应直接作为 HTML 输出")).toBeVisible();
  await expect(page.getByRole("heading", { name: "验证方式" })).toBeVisible();
  await expect(
    page.getByText("labs/web/xss/docs/manual-verification.md").first(),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "进入漏洞版" })).toHaveAttribute(
    "href",
    "/labs/web/xss/vuln",
  );
  await expect(page.getByRole("link", { name: "进入修复版" })).toHaveAttribute(
    "href",
    "/labs/web/xss/fixed",
  );
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
  await expect(
    page.getByRole("listitem").filter({ hasText: "XSS" }).filter({
      hasText: "fixed / completed",
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "最近验证" })).toBeVisible();
  await expect(page.getByText("修复版原样显示 HTML 字符串").first()).toBeVisible();
});

test("登录用户可在 XSS 详情页看到当前实验记录", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("用户名").fill("demo_user");
  await page.getByLabel("密码").fill("Demo@123456");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page.getByRole("heading", { name: "账户中心" })).toBeVisible();

  await page.goto("/labs/web/xss/fixed");
  await page.getByRole("button", { name: "填入样例" }).click();
  await page.getByRole("button", { name: "提交留言" }).click();

  await page.goto("/labs/web/xss");

  await expect(page.getByRole("heading", { name: "当前实验记录" })).toBeVisible();
  await expect(page.getByText("fixed / completed")).toBeVisible();
  await expect(page.getByText("修复版原样显示 HTML 字符串").first()).toBeVisible();
});

test("登录用户可以观察 CSRF 漏洞版接受缺少 token 的模拟请求", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("用户名").fill("demo_user");
  await page.getByLabel("密码").fill("Demo@123456");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page.getByRole("heading", { name: "账户中心" })).toBeVisible();

  await page.goto("/labs/web/csrf/vuln");
  await expect(page.getByRole("heading", { name: "CSRF 漏洞版" })).toBeVisible();

  const balanceMetric = page
    .locator(".status-metric")
    .filter({ hasText: "账户余额" })
    .locator("strong");
  const balanceBefore = Number(await balanceMetric.textContent());

  await page.getByRole("button", { name: "模拟第三方请求" }).click();

  await expect(page.getByText("模拟第三方请求已被漏洞版接受")).toBeVisible();
  await expect(page.getByText("漏洞版接受了缺少 token 的请求")).toBeVisible();
  await expect(balanceMetric).toHaveText(String(balanceBefore - 200));
});

test("登录用户可以观察 CSRF 修复版阻断缺少 token 的模拟请求", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("用户名").fill("demo_user");
  await page.getByLabel("密码").fill("Demo@123456");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page.getByRole("heading", { name: "账户中心" })).toBeVisible();

  await page.goto("/labs/web/csrf/fixed");
  await expect(page.getByRole("heading", { name: "CSRF 修复版" })).toBeVisible();

  const balanceMetric = page
    .locator(".status-metric")
    .filter({ hasText: "账户余额" })
    .locator("strong");
  const balanceBefore = await balanceMetric.textContent();

  await page.getByRole("button", { name: "模拟第三方请求" }).click();

  await expect(page.getByText("模拟第三方请求已被修复版阻断")).toBeVisible();
  await expect(page.getByText("修复版阻断了缺少 token 的请求")).toBeVisible();
  await expect(balanceMetric).toHaveText(balanceBefore ?? "");
});

test("登录用户可以对比 LDAP 漏洞版扩大范围与修复版阻断", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("用户名").fill("demo_user");
  await page.getByLabel("密码").fill("Demo@123456");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page.getByRole("heading", { name: "账户中心" })).toBeVisible();

  await page.goto("/labs/web/ldap-injection/vuln");
  await expect(page.getByRole("heading", { name: "LDAP 注入漏洞版" })).toBeVisible();

  await page.getByRole("button", { name: "填入受控样例" }).click();
  await page.getByRole("button", { name: "查询虚拟目录" }).click();

  const vulnStatusPanel = page.locator(".ldap-injection-status-panel");

  await expect(page.getByText("漏洞版虚拟目录结果范围被扩大")).toBeVisible();
  await expect(
    vulnStatusPanel.locator(".status-metric strong").filter({
      hasText: /^accepted$/,
    }),
  ).toBeVisible();
  await expect(
    vulnStatusPanel.locator(".inspection-grid dd").filter({
      hasText: /^expanded$/,
    }),
  ).toBeVisible();
  await expect(page.getByText("虚拟受限成员记录")).toBeVisible();

  await page.goto("/labs/web/ldap-injection/fixed");
  await expect(page.getByRole("heading", { name: "LDAP 注入修复版" })).toBeVisible();

  await page.getByRole("button", { name: "填入受控样例" }).click();
  await page.getByRole("button", { name: "查询虚拟目录" }).click();

  const fixedStatusPanel = page.locator(".ldap-injection-status-panel");

  await expect(page.getByText("修复版阻断受控 LDAP 样例")).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".status-metric strong").filter({
      hasText: /^blocked$/,
    }),
  ).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".inspection-grid dd").filter({
      hasText: /^blocked$/,
    }),
  ).toBeVisible();
  await expect(page.getByText("虚拟受限成员记录")).toHaveCount(0);
});

test("登录用户可以对比端口扫描漏洞版暴露面与修复版收敛", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("用户名").fill("demo_user");
  await page.getByLabel("密码").fill("Demo@123456");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page.getByRole("heading", { name: "账户中心" })).toBeVisible();

  await page.goto("/labs/network/port-scan/vuln");
  await expect(page.getByRole("heading", { name: "端口扫描漏洞版" })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);

  await page.getByRole("button", { name: "后台管理节点" }).click();
  await page.getByRole("button", { name: "观察暴露面" }).click();

  const vulnStatusPanel = page.locator(".port-scan-status-panel");

  await expect(page.getByText("漏洞版管理面公开可见")).toBeVisible();
  await expect(
    vulnStatusPanel.locator(".status-metric strong").filter({
      hasText: /^accepted$/,
    }),
  ).toBeVisible();
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "暴露面评分",
    }).locator("dd"),
  ).toHaveText("155");
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "高风险端口",
    }).locator("dd"),
  ).toHaveText("3");
  await expect(page.getByText("3306/tcp · 数据库服务")).toBeVisible();
  await expect(page.getByText("public / critical")).toBeVisible();

  await page.goto("/labs/network/port-scan/fixed");
  await expect(page.getByRole("heading", { name: "端口扫描修复版" })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);

  await page.getByRole("button", { name: "后台管理节点" }).click();
  await page.getByRole("button", { name: "观察暴露面" }).click();

  const fixedStatusPanel = page.locator(".port-scan-status-panel");

  await expect(page.getByText("修复版暴露面已收敛")).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".status-metric strong").filter({
      hasText: /^accepted$/,
    }),
  ).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "公开端口数量",
    }).locator("dd"),
  ).toHaveText("0");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "高风险端口",
    }).locator("dd"),
  ).toHaveText("0");
  await expect(page.getByText("3306/tcp · 数据库服务")).toBeVisible();
  await expect(page.getByText("internal-only / medium").first()).toBeVisible();
});

test("登录用户可以对比 DNS 劫持漏洞版错误解析与修复版阻断恢复", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("用户名").fill("demo_user");
  await page.getByLabel("密码").fill("Demo@123456");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page.getByRole("heading", { name: "账户中心" })).toBeVisible();

  await page.goto("/labs/network/dns-hijack/vuln");
  await expect(page.getByRole("heading", { name: "DNS 劫持漏洞版" })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);

  await page.getByRole("button", { name: "客户门户" }).click();
  await page.getByRole("button", { name: "观察解析结果" }).click();

  const vulnStatusPanel = page.locator(".dns-hijack-status-panel");

  await expect(page.getByText("漏洞版证书不匹配可见")).toBeVisible();
  await expect(page.getByText("漏洞版接受了错误虚拟解析结果")).toBeVisible();
  await expect(
    vulnStatusPanel.locator(".status-metric strong").filter({
      hasText: /^accepted$/,
    }),
  ).toBeVisible();
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "当前虚拟地址",
    }).locator("dd"),
  ).toHaveText("shadow-customer-portal");
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "证书状态",
    }).locator("dd"),
  ).toHaveText("mismatch");
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "策略阻断",
    }).locator("dd"),
  ).toHaveText("否");

  await page.goto("/labs/network/dns-hijack/fixed");
  await expect(page.getByRole("heading", { name: "DNS 劫持修复版" })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);

  await page.getByRole("button", { name: "客户门户" }).click();
  await page.getByRole("button", { name: "观察解析结果" }).click();

  const fixedStatusPanel = page.locator(".dns-hijack-status-panel");

  await expect(page.getByText("修复版异常解析已阻断")).toBeVisible();
  await expect(page.getByText("修复版识别到不可信解析来源")).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".status-metric strong").filter({
      hasText: /^blocked$/,
    }),
  ).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "当前虚拟地址",
    }).locator("dd"),
  ).toHaveText("shadow-customer-portal");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "策略阻断",
    }).locator("dd"),
  ).toHaveText("是");

  await page.getByRole("button", { name: "可信解析" }).click();
  await page.getByRole("button", { name: "观察解析结果" }).click();

  await expect(page.getByText("修复版可信解析已恢复")).toBeVisible();
  await expect(page.getByText("修复版使用可信解析视角恢复到期望虚拟地址类别")).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".status-metric strong").filter({
      hasText: /^accepted$/,
    }),
  ).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "当前虚拟地址",
    }).locator("dd"),
  ).toHaveText("trusted-customer-portal");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "证书状态",
    }).locator("dd"),
  ).toHaveText("trusted");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "异常解析",
    }).locator("dd"),
  ).toHaveText("否");
});

test("登录用户可以对比 Prompt 注入漏洞版边界混淆与修复版策略护栏", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("用户名").fill("demo_user");
  await page.getByLabel("密码").fill("Demo@123456");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page.getByRole("heading", { name: "账户中心" })).toBeVisible();

  await page.goto("/labs/ai/prompt-injection/vuln");
  await expect(page.getByRole("heading", { name: "Prompt 注入漏洞版" })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);

  await page.getByRole("button", { name: "客服知识库" }).click();
  await page.getByRole("button", { name: "观察路由结果" }).click();

  const vulnStatusPanel = page.locator(".prompt-injection-status-panel");

  await expect(page.getByText("漏洞版检索污染信号可见")).toBeVisible();
  await expect(page.getByText("漏洞版把固定检索资料摘要错误抬高为指令来源")).toBeVisible();
  await expect(
    vulnStatusPanel.locator(".status-metric strong").filter({
      hasText: /^accepted$/,
    }),
  ).toBeVisible();
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "风险类别",
    }).locator("dd").first(),
  ).toHaveText("retrieval-contamination");
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "指令优先级",
    }).locator("dd"),
  ).toHaveText("confused");
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "输出策略状态",
    }).locator("dd"),
  ).toHaveText("missing");
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "策略阻断",
    }).locator("dd"),
  ).toHaveText("否");

  await page.goto("/labs/ai/prompt-injection/fixed");
  await expect(page.getByRole("heading", { name: "Prompt 注入修复版" })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);

  await page.getByRole("button", { name: "客服知识库" }).click();
  await page.getByRole("button", { name: "观察路由结果" }).click();

  const fixedStatusPanel = page.locator(".prompt-injection-status-panel");

  await expect(page.getByText("修复版策略护栏已生效")).toBeVisible();
  await expect(page.getByText("修复版将外部内容保留为低优先级资料")).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".status-metric strong").filter({
      hasText: /^blocked$/,
    }),
  ).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "指令优先级",
    }).locator("dd"),
  ).toHaveText("isolated");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "输出策略状态",
    }).locator("dd"),
  ).toHaveText("blocked");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "策略阻断",
    }).locator("dd"),
  ).toHaveText("是");

  await page.getByRole("button", { name: "文档问答" }).click();
  await page.getByRole("button", { name: "观察路由结果" }).click();

  await expect(page.getByText("修复版安全回答已返回")).toBeVisible();
  await expect(page.getByText("修复版在固定文档范围内返回安全教学回答")).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".status-metric strong").filter({
      hasText: /^accepted$/,
    }),
  ).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "风险类别",
    }).locator("dd").first(),
  ).toHaveText("safe-reference");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "输出策略状态",
    }).locator("dd"),
  ).toHaveText("applied");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "策略阻断",
    }).locator("dd"),
  ).toHaveText("否");
});

test("登录用户可以对比依赖混淆漏洞版公共来源与修复版审计路径", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("用户名").fill("demo_user");
  await page.getByLabel("密码").fill("Demo@123456");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page.getByRole("heading", { name: "账户中心" })).toBeVisible();

  await page.goto("/labs/supply-chain/dependency-confusion/vuln");
  await expect(
    page.getByRole("heading", { name: "依赖混淆解析风险观察版" }),
  ).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);

  await page.getByRole("button", { name: "未绑定 scope" }).click();
  await page.getByRole("button", { name: "观察解析结果" }).click();

  const vulnStatusPanel = page.locator(".dependency-confusion-status-panel");

  await expect(page.getByText("漏洞版选择了伪公共来源")).toBeVisible();
  await expect(
    page.getByText(
      "漏洞版偏向伪公共来源，展示未绑定 scope 和缺少审计时的依赖混淆风险。",
    ),
  ).toBeVisible();
  await expect(
    vulnStatusPanel.locator(".status-metric strong").filter({
      hasText: /^accepted$/,
    }),
  ).toBeVisible();
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "解析来源",
    }).locator("dd"),
  ).toHaveText("public-registry");
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "来源信任",
    }).locator("dd"),
  ).toHaveText("untrusted");
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "scope 状态",
    }).locator("dd"),
  ).toHaveText("missing");
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "lockfile 状态",
    }).locator("dd"),
  ).toHaveText("missing");

  await page.goto("/labs/supply-chain/dependency-confusion/fixed");
  await expect(
    page.getByRole("heading", { name: "依赖混淆来源审计复盘版" }),
  ).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);

  await page.getByRole("button", { name: "私有 scope" }).click();
  await page.getByRole("button", { name: "观察解析结果" }).click();

  const fixedStatusPanel = page.locator(".dependency-confusion-status-panel");

  await expect(page.getByText("修复版私有 scope 已固定")).toBeVisible();
  await expect(
    page.getByText(
      "修复版将私有 scope 固定到可信来源，解析结果保持在受控边界内。",
    ),
  ).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".status-metric strong").filter({
      hasText: /^accepted$/,
    }),
  ).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "解析来源",
    }).locator("dd"),
  ).toHaveText("private-registry");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "来源信任",
    }).locator("dd"),
  ).toHaveText("trusted");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "scope 状态",
    }).locator("dd"),
  ).toHaveText("pinned");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "lockfile 状态",
    }).locator("dd"),
  ).toHaveText("verified");

  await page.getByRole("button", { name: "完整性审计" }).click();
  await page.getByRole("button", { name: "观察解析结果" }).click();

  await expect(page.getByText("修复版完整性审计已阻断")).toBeVisible();
  await expect(
    page.getByText("修复版通过固定 lockfile 完整性审计阻断异常解析结果。"),
  ).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".status-metric strong").filter({
      hasText: /^blocked$/,
    }),
  ).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "解析来源",
    }).locator("dd"),
  ).toHaveText("blocked-audit");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "来源信任",
    }).locator("dd"),
  ).toHaveText("blocked");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "lockfile 状态",
    }).locator("dd"),
  ).toHaveText("mismatch");

  await page.getByRole("button", { name: "混合来源" }).click();
  await page.getByRole("button", { name: "观察解析结果" }).click();

  await expect(page.getByText("正常公开依赖已审计放行")).toBeVisible();
  await expect(
    page.getByText("修复版保留正常公开依赖路径，同时审计私有来源边界。"),
  ).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".status-metric strong").filter({
      hasText: /^accepted$/,
    }),
  ).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "解析来源",
    }).locator("dd"),
  ).toHaveText("mixed-audited");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "来源信任",
    }).locator("dd"),
  ).toHaveText("audited");
});

test("登录用户可以对比配置错误漏洞版暴露信号与修复版审计路径", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("用户名").fill("demo_user");
  await page.getByLabel("密码").fill("Demo@123456");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page.getByRole("heading", { name: "账户中心" })).toBeVisible();

  await page.goto("/labs/infrastructure/misconfiguration/vuln");
  await expect(page.getByRole("heading", { name: "配置错误风险观察版" })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);

  await page.getByRole("button", { name: "调试入口" }).click();
  await page.getByRole("button", { name: "观察审计结果" }).click();

  const vulnStatusPanel = page.locator(".misconfiguration-status-panel");

  await expect(
    vulnStatusPanel.locator(".status-metric strong").filter({
      hasText: /^调试入口可见$/,
    }),
  ).toBeVisible();
  await expect(page.getByText("漏洞版保留固定调试入口可见信号")).toBeVisible();
  await expect(
    vulnStatusPanel.locator(".status-metric strong").filter({
      hasText: /^accepted$/,
    }),
  ).toBeVisible();
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "暴露面类别",
    }).locator("dd"),
  ).toHaveText("debug-surface");
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "暴露状态",
    }).locator("dd"),
  ).toHaveText("visible");
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "认证要求",
    }).locator("dd"),
  ).toHaveText("not-required");
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "审计动作",
    }).locator("dd"),
  ).toHaveText("audit-missing");

  await page.getByRole("button", { name: "CORS 策略" }).click();
  await page.getByRole("button", { name: "观察审计结果" }).click();

  await expect(
    vulnStatusPanel.locator(".status-metric strong").filter({
      hasText: /^CORS 策略过宽$/,
    }),
  ).toBeVisible();
  await expect(page.getByText("漏洞版保留过宽 CORS 信任边界")).toBeVisible();
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "暴露面类别",
    }).locator("dd"),
  ).toHaveText("cross-origin-trust");
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "CORS 状态",
    }).locator("dd"),
  ).toHaveText("too-broad");

  await page.goto("/labs/infrastructure/misconfiguration/fixed");
  await expect(page.getByRole("heading", { name: "配置错误审计复盘版" })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);

  await page.getByRole("button", { name: "调试入口" }).click();
  await page.getByRole("button", { name: "观察审计结果" }).click();

  const fixedStatusPanel = page.locator(".misconfiguration-status-panel");

  await expect(
    fixedStatusPanel.locator(".status-metric strong").filter({
      hasText: /^暴露面已收敛$/,
    }),
  ).toBeVisible();
  await expect(page.getByText("修复版通过最小暴露面策略收敛固定配置风险信号")).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".status-metric strong").filter({
      hasText: /^accepted$/,
    }),
  ).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "暴露状态",
    }).locator("dd"),
  ).toHaveText("reduced");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "审计动作",
    }).locator("dd"),
  ).toContainText("exposure-reduced");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "审计动作",
    }).locator("dd"),
  ).toContainText("debug-disabled");

  await page.getByRole("button", { name: "管理状态" }).click();
  await page.getByRole("button", { name: "观察审计结果" }).click();

  await expect(
    fixedStatusPanel.locator(".status-metric strong").filter({
      hasText: /^管理入口已要求认证$/,
    }),
  ).toBeVisible();
  await expect(page.getByText("修复版要求管理入口认证")).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".status-metric strong").filter({
      hasText: /^blocked$/,
    }),
  ).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "暴露状态",
    }).locator("dd"),
  ).toHaveText("blocked");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "认证要求",
    }).locator("dd"),
  ).toHaveText("required");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "审计动作",
    }).locator("dd"),
  ).toContainText("admin-auth-required");

  await page.getByRole("button", { name: "CORS 策略" }).click();
  await page.getByRole("button", { name: "观察审计结果" }).click();

  await expect(
    fixedStatusPanel.locator(".status-metric strong").filter({
      hasText: /^CORS 策略已收敛$/,
    }),
  ).toBeVisible();
  await expect(page.getByText("修复版将 CORS 收敛到固定可信来源")).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".status-metric strong").filter({
      hasText: /^accepted$/,
    }),
  ).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "CORS 状态",
    }).locator("dd"),
  ).toHaveText("restricted");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "审计动作",
    }).locator("dd"),
  ).toContainText("cors-policy-restricted");

  await page.getByRole("button", { name: "错误信息" }).click();
  await page.getByRole("button", { name: "观察审计结果" }).click();

  await expect(
    fixedStatusPanel.locator(".status-metric strong").filter({
      hasText: /^错误信息已安全分层$/,
    }),
  ).toBeVisible();
  await expect(page.getByText("修复版将用户错误信息与内部日志分离")).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".status-metric strong").filter({
      hasText: /^accepted$/,
    }),
  ).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "错误信息状态",
    }).locator("dd"),
  ).toHaveText("safe");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "审计动作",
    }).locator("dd"),
  ).toContainText("safe-error-reporting");
});

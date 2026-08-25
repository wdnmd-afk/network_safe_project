import { expect, test } from "@playwright/test";

const dedicatedLabPageDifferences = [
  {
    id: "web.clickjacking",
    path: "/labs/web/clickjacking",
    vulnTitle: "点击劫持风险观察版",
    fixedTitle: "点击劫持防御复盘版",
    statusPanel: ".clickjacking-status-panel",
    riskSignal: "风险被接受（漏洞路径）",
    defenseSignal: "防御拦截被劫持动作",
    normalButton: "正常确认流程",
    normalSignal: "正常确认流程通过",
  },
  {
    id: "web.open-redirect",
    path: "/labs/web/open-redirect",
    vulnTitle: "开放重定向风险观察版",
    fixedTitle: "开放重定向防御复盘版",
    statusPanel: ".open-redirect-status-panel",
    riskSignal: "任意跳转被接受（漏洞路径）",
    defenseSignal: "防御拦截未受信任跳转",
    normalButton: "正常跳转流程",
    normalSignal: "站内正常跳转流程通过",
  },
  {
    id: "auth.credential-stuffing",
    path: "/labs/auth/credential-stuffing",
    vulnTitle: "凭据填充风险观察版",
    fixedTitle: "凭据填充防御复盘版",
    statusPanel: ".credential-stuffing-status-panel",
    riskSignal: "批量登录被接受（漏洞路径）",
    defenseSignal: "防御阻断高风险登录批次",
    normalButton: "正常登录流程",
    normalSignal: "自适应挑战通过后正常登录",
  },
  {
    id: "auth.session-hijacking",
    path: "/labs/auth/session-hijacking",
    vulnTitle: "会话劫持风险观察版",
    fixedTitle: "会话劫持防御复盘版",
    statusPanel: ".session-hijacking-status-panel",
    riskSignal: "被复用会话被接受（漏洞路径）",
    defenseSignal: "防御阻断被复用会话",
    normalButton: "正常会话流程",
    normalSignal: "再认证正常会话流程通过",
  },
  {
    id: "auth.oauth",
    path: "/labs/auth/oauth",
    vulnTitle: "OAuth 漏洞风险观察版",
    fixedTitle: "OAuth 漏洞防御复盘版",
    statusPanel: ".oauth-status-panel",
    riskSignal: "被篡改授权响应被接受（漏洞路径）",
    defenseSignal: "防御拦截被篡改授权响应",
    normalButton: "正常授权流程",
    normalSignal: "正常授权流程通过",
  },
  {
    id: "client.formjacking",
    path: "/labs/client/formjacking",
    vulnTitle: "Formjacking 风险观察版",
    fixedTitle: "Formjacking 防御复盘版",
    statusPanel: ".formjacking-status-panel",
    riskSignal: "被篡改提交被接受（漏洞路径）",
    defenseSignal: "防御拦截被篡改提交目标",
    normalButton: "正常提交流程",
    normalSignal: "正常结账提交通过",
  },
  {
    id: "malware.ransomware",
    path: "/labs/malware/ransomware",
    vulnTitle: "勒索软件风险观察版",
    fixedTitle: "勒索软件防御复盘版",
    statusPanel: ".ransomware-status-panel",
    riskSignal: "加密行为被放任（漏洞路径）",
    defenseSignal: "隔离阻断高风险主机",
    normalButton: "正常恢复流程",
    normalSignal: "离线备份恢复正常业务",
  },
];

const categoryRepresentativeLabDifferences = [
  {
    id: "api.functional-authorization",
    path: "/labs/api/functional-authorization",
    vulnTitle: "API 功能级授权风险观察版",
    fixedTitle: "API 功能级授权防御复盘版",
    statusPanel: ".bfla-status-panel",
    runButton: "运行固定评估",
    normalButton: "正常管理流程",
    riskSignal: "越权管理操作被接受（漏洞路径）",
    defenseSignal: "防御拦截越权管理操作",
    normalSignal: "正常管理操作流程通过",
  },
  {
    id: "business-logic.workflow-bypass",
    path: "/labs/business-logic/workflow-bypass",
    vulnTitle: "业务流程跳步风险观察版",
    fixedTitle: "业务流程跳步防御复盘版",
    statusPanel: ".workflow-bypass-status-panel",
    runButton: "运行固定评估",
    normalButton: "正常订单流程",
    riskSignal: "待支付订单直接进入发货（漏洞路径）",
    defenseSignal: "防御阻断乱序阶段迁移",
    normalSignal: "正常订单阶段迁移通过",
  },
  {
    id: "crypto.insecure-randomness",
    path: "/labs/crypto/insecure-randomness",
    vulnTitle: "不安全随机数风险观察版",
    fixedTitle: "不安全随机数防御复盘版",
    statusPanel: ".insecure-randomness-status-panel",
    runButton: "运行固定评估",
    normalButton: "正常随机源策略",
    riskSignal: "低熵 token 策略被接受",
    defenseSignal: "防御阻断弱随机来源",
    normalSignal: "固定 CSPRNG 策略通过",
  },
  {
    id: "detection.rule-alert-triage",
    path: "/labs/detection/rule-alert-triage",
    vulnTitle: "检测规则与告警研判风险观察版",
    fixedTitle: "检测规则与告警研判防御复盘版",
    statusPanel: ".triage-status-panel",
    runButton: "运行固定研判",
    normalButton: "正常维护路径",
    riskSignal: "关联告警被错误关闭",
    defenseSignal: "关联告警已升级研判",
    normalSignal: "维护事件已凭证据关闭",
  },
  {
    id: "host.service-permission-audit",
    path: "/labs/host/service-permission-audit",
    vulnTitle: "Windows 服务权限风险观察版",
    fixedTitle: "Windows 服务权限防御复盘版",
    statusPanel: ".audit-status-panel",
    runButton: "运行固定审计",
    normalButton: "正常服务基线",
    riskSignal: "服务替换风险被接受",
    defenseSignal: "未授权服务修改已阻断",
    normalSignal: "加固服务基线通过",
  },
  {
    id: "infrastructure.iam-policy-audit",
    path: "/labs/infrastructure/iam-policy-audit",
    vulnTitle: "云 IAM 策略风险观察版",
    fixedTitle: "云 IAM 策略防御复盘版",
    statusPanel: ".audit-status-panel",
    runButton: "运行固定审计",
    normalButton: "最小权限基线",
    riskSignal: "过宽授权被批准",
    defenseSignal: "过宽授权已阻断",
    normalSignal: "最小权限基线通过",
  },
  {
    id: "client.mitb",
    path: "/labs/client/mitb",
    vulnTitle: "浏览器 MITB 风险观察版",
    fixedTitle: "浏览器 MITB 防御复盘版",
    statusPanel: ".audit-status-panel",
    runButton: "运行固定对照",
    normalButton: "一致交易基线",
    riskSignal: "篡改交易被提交",
    defenseSignal: "不一致交易已阻断",
    normalSignal: "一致交易通过确认",
  },
  {
    id: "api.property-authorization",
    path: "/labs/api/property-authorization",
    vulnTitle: "API 属性级授权风险观察版",
    fixedTitle: "API 属性级授权防御复盘版",
    statusPanel: ".controlled-decision-status-panel",
    runButton: "运行固定评估",
    normalButton: "正常字段更新",
    riskSignal: "批量绑定风险",
    defenseSignal: "属性级授权防御",
    normalSignal: "正常字段更新",
  },
  {
    id: "business-logic.race-condition",
    path: "/labs/business-logic/race-condition",
    vulnTitle: "业务竞态与幂等风险观察版",
    fixedTitle: "业务竞态与幂等防御复盘版",
    statusPanel: ".controlled-decision-status-panel",
    runButton: "运行固定评估",
    normalButton: "正常唯一请求",
    riskSignal: "竞态风险",
    defenseSignal: "幂等防御",
    normalSignal: "正常扣减",
  },
  {
    id: "crypto.secret-lifecycle-audit",
    path: "/labs/crypto/secret-lifecycle-audit",
    vulnTitle: "秘密生命周期风险观察版",
    fixedTitle: "秘密生命周期防御复盘版",
    statusPanel: ".controlled-decision-status-panel",
    runButton: "运行固定审计",
    normalButton: "活动版本正常发布",
    riskSignal: "泄露风险",
    defenseSignal: "轮换防御",
    normalSignal: "正常发布",
  },
  {
    id: "host.event-log-triage",
    path: "/labs/host/event-log-triage",
    vulnTitle: "Windows 事件日志风险观察版",
    fixedTitle: "Windows 事件日志防御复盘版",
    statusPanel: ".controlled-decision-status-panel",
    runButton: "运行固定研判",
    normalButton: "正常维护路径",
    riskSignal: "时间线风险",
    defenseSignal: "研判升级",
    normalSignal: "维护关闭",
  },
];

async function loginDemoUser(page) {
  await page.goto("/login");
  await page.getByLabel("用户名").fill("demo_user");
  await page.getByLabel("密码").fill("Demo@123456");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page.getByRole("heading", { name: "账户中心" })).toBeVisible();
}

function learningSignal(page, statusPanel) {
  return page
    .locator(statusPanel)
    .locator(".status-metric, .status-strip > div")
    .filter({ hasText: "学习信号" })
    .locator("strong");
}

test.describe("专用实验页面差异", () => {
  for (const scenario of dedicatedLabPageDifferences) {
    test(`${scenario.id} 展示风险、防御和正常三向结果`, async ({ page }) => {
      await loginDemoUser(page);

      await page.goto(`${scenario.path}/vuln`);
      await expect(
        page.getByRole("heading", { name: scenario.vulnTitle }),
      ).toBeVisible();
      await expect(page.getByRole("textbox")).toHaveCount(0);
      await page.getByRole("button", { name: "载入推荐路径" }).click();
      await page.getByRole("button", { name: "运行固定评估" }).click();
      await expect(learningSignal(page, scenario.statusPanel)).toHaveText(
        scenario.riskSignal,
      );

      await page.goto(`${scenario.path}/fixed`);
      await expect(
        page.getByRole("heading", { name: scenario.fixedTitle }),
      ).toBeVisible();
      await expect(page.getByRole("textbox")).toHaveCount(0);
      await page.getByRole("button", { name: "载入推荐路径" }).click();
      await page.getByRole("button", { name: "运行固定评估" }).click();
      await expect(learningSignal(page, scenario.statusPanel)).toHaveText(
        scenario.defenseSignal,
      );

      await page.getByRole("button", { name: scenario.normalButton }).click();
      await page.getByRole("button", { name: "运行固定评估" }).click();
      await expect(learningSignal(page, scenario.statusPanel)).toHaveText(
        scenario.normalSignal,
      );
    });
  }
});

test.describe("分类代表性专用实验页面差异", () => {
  for (const scenario of categoryRepresentativeLabDifferences) {
    test(`${scenario.id} 展示风险、防御和正常三向结果`, async ({ page }) => {
      await loginDemoUser(page);

      await page.goto(`${scenario.path}/vuln`);
      await expect(
        page.getByRole("heading", { name: scenario.vulnTitle }),
      ).toBeVisible();
      await expect(page.getByRole("textbox")).toHaveCount(0);
      await page.getByRole("button", { name: "载入推荐路径" }).click();
      await page.getByRole("button", { name: scenario.runButton }).click();
      await expect(learningSignal(page, scenario.statusPanel)).toHaveText(
        scenario.riskSignal,
      );

      await page.goto(`${scenario.path}/fixed`);
      await expect(
        page.getByRole("heading", { name: scenario.fixedTitle }),
      ).toBeVisible();
      await expect(page.getByRole("textbox")).toHaveCount(0);
      await page.getByRole("button", { name: "载入推荐路径" }).click();
      await page.getByRole("button", { name: scenario.runButton }).click();
      await expect(learningSignal(page, scenario.statusPanel)).toHaveText(
        scenario.defenseSignal,
      );

      await page.getByRole("button", { name: scenario.normalButton }).click();
      await page.getByRole("button", { name: scenario.runButton }).click();
      await expect(learningSignal(page, scenario.statusPanel)).toHaveText(
        scenario.normalSignal,
      );
    });
  }
});

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

test("实验目录支持知识点搜索与深度筛选", async ({ page }) => {
  await page.goto("/labs");
  await page.getByLabel("搜索实验").fill("frame-ancestors");
  await expect(page.getByRole("heading", { name: "点击劫持" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "XSS" })).toHaveCount(0);

  await page.getByRole("button", { name: "清除筛选" }).click();
  await page.getByLabel("深度").selectOption("D2");
  await expect(page.getByRole("heading", { name: "DDoS" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "XSS" })).toHaveCount(0);
});

test("实验详情展示静态学习路径前置与后续关系", async ({ page }) => {
  await page.goto("/labs/web/csrf");
  await expect(page.getByRole("heading", { name: "学习路径" })).toBeVisible();
  await expect(page.getByRole("link", { name: "前置：XSS" })).toHaveAttribute(
    "href",
    "/labs/web/xss",
  );
  await expect(page.getByRole("link", { name: "后续：SQL 注入" })).toHaveAttribute(
    "href",
    "/labs/web/sql-injection",
  );
});

test("注销后旧 token 立即失效", async ({ page }) => {
  await loginDemoUser(page);
  const token = await page.evaluate(() =>
    sessionStorage.getItem("network-safe-session-token"),
  );
  expect(token).toBeTruthy();

  await page.getByRole("button", { name: "退出登录" }).click();
  await expect(page.getByRole("heading", { name: "登录 SafeMart" })).toBeVisible();

  const status = await page.evaluate(async (revokedToken) => {
    const response = await fetch("/api/auth/me", {
      headers: { authorization: `Bearer ${revokedToken}` },
    });
    return response.status;
  }, token);
  expect(status).toBe(401);
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

test("登录用户可以对比鱼叉式钓鱼漏洞版误判与修复版核验", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("用户名").fill("demo_user");
  await page.getByLabel("密码").fill("Demo@123456");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page.getByRole("heading", { name: "账户中心" })).toBeVisible();

  await page.goto("/labs/social/spear-phishing/vuln");
  await expect(
    page.getByRole("heading", { name: "鱼叉式钓鱼针对性误判观察版" }),
  ).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByRole("combobox")).toHaveCount(2);

  await page.getByRole("button", { name: "付款审批" }).click();
  await page.getByRole("button", { name: "观察核验结果" }).click();

  const vulnStatusPanel = page.locator(".spear-phishing-status-panel");

  await expect(page.getByText("漏洞版只看角色权威和业务熟悉感")).toBeVisible();
  await expect(
    vulnStatusPanel.locator(".status-metric strong").filter({
      hasText: /^accepted$/,
    }),
  ).toBeVisible();
  await expect(
    vulnStatusPanel.locator(".status-metric strong").filter({
      hasText: /^漏洞版审批链绕过风险可见$/,
    }),
  ).toBeVisible();
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "风险标签",
    }).locator("dd"),
  ).toContainText("authority-pressure");
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "风险标签",
    }).locator("dd"),
  ).toContainText("urgency-pressure");
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "风险标签",
    }).locator("dd"),
  ).toContainText("approval-chain-bypass");

  await page.goto("/labs/social/spear-phishing/fixed");
  await expect(
    page.getByRole("heading", { name: "鱼叉式钓鱼流程核验复盘版" }),
  ).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByRole("combobox")).toHaveCount(2);

  await page.getByRole("button", { name: "付款审批" }).click();
  await page.getByRole("button", { name: "审批链复核" }).click();
  await page.getByRole("button", { name: "观察核验结果" }).click();

  const fixedStatusPanel = page.locator(".spear-phishing-status-panel");

  await expect(page.getByText("修复版要求可信通道二次确认和正式流程复核")).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".status-metric strong").filter({
      hasText: /^blocked$/,
    }),
  ).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".status-metric strong").filter({
      hasText: /^修复版要求可信通道二次确认$/,
    }),
  ).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "核验策略",
    }).locator("dd"),
  ).toHaveText("已应用");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "审批链复核",
    }).locator("dd"),
  ).toHaveText("需要");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "可信通道",
    }).locator("dd"),
  ).toHaveText("需要");
});

test("登录用户可以对比捕鲸攻击漏洞版高权威误判与修复版流程核验", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("用户名").fill("demo_user");
  await page.getByLabel("密码").fill("Demo@123456");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page.getByRole("heading", { name: "账户中心" })).toBeVisible();

  await page.goto("/labs/social/whaling/vuln");
  await expect(
    page.getByRole("heading", { name: "捕鲸攻击高权威误判观察版" }),
  ).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByRole("combobox")).toHaveCount(2);

  await page.getByRole("button", { name: "高层付款" }).click();
  await page.getByRole("button", { name: "观察核验结果" }).click();

  const vulnStatusPanel = page.locator(".whaling-status-panel");

  await expect(
    page.getByText("漏洞版只看高层授权标签，忽略了可信通道、审批链和最小授权核验。"),
  ).toBeVisible();
  await expect(
    vulnStatusPanel.locator(".status-metric strong").filter({
      hasText: /^accepted$/,
    }),
  ).toBeVisible();
  await expect(
    vulnStatusPanel.locator(".status-metric strong").filter({
      hasText: /^漏洞版过度相信高权威上下文$/,
    }),
  ).toBeVisible();
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "风险标签",
    }).locator("dd"),
  ).toContainText("executive-authority-pressure");
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "风险标签",
    }).locator("dd"),
  ).toContainText("payment-urgency");
  await expect(
    vulnStatusPanel.locator(".inspection-grid div").filter({
      hasText: "风险标签",
    }).locator("dd"),
  ).toContainText("approval-chain-bypass");

  await page.goto("/labs/social/whaling/fixed");
  await expect(
    page.getByRole("heading", { name: "捕鲸攻击高风险流程核验复盘版" }),
  ).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByRole("combobox")).toHaveCount(2);

  await page.getByRole("button", { name: "高层付款" }).click();
  await page.getByRole("button", { name: "双人复核" }).click();
  await page.getByRole("button", { name: "观察核验结果" }).click();

  const fixedStatusPanel = page.locator(".whaling-status-panel");

  await expect(
    page.getByText("修复版要求冻结高风险动作并完成付款、法务或董事会固定通道复核，已阻断固定高风险请求。"),
  ).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".status-metric strong").filter({
      hasText: /^blocked$/,
    }),
  ).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".status-metric strong").filter({
      hasText: /^修复版要求冻结并复核高风险动作$/,
    }),
  ).toBeVisible();
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "核验策略",
    }).locator("dd"),
  ).toHaveText("已应用");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "可信通道",
    }).locator("dd"),
  ).toHaveText("需要");
  await expect(
    fixedStatusPanel.locator(".inspection-grid div").filter({
      hasText: "付款冻结",
    }).locator("dd"),
  ).toHaveText("需要");
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

test("登录用户可以跨分类对比仍在引导式目录中的漏洞与修复判定", async ({ page }) => {
  const representativeLabs = [
    ["network", "ddos", "DDoS"],
    ["social", "smishing", "短信钓鱼"],
    ["malware", "trojan", "木马"],
    ["supply-chain", "malicious-package", "恶意包注入"],
    ["ai", "deepfake", "Deepfake"],
    ["client", "malvertising", "恶意广告"],
    ["infrastructure", "zero-day", "零日漏洞利用"],
  ];

  await page.goto("/login");
  await page.getByLabel("用户名").fill("demo_user");
  await page.getByLabel("密码").fill("Demo@123456");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page.getByRole("heading", { name: "账户中心" })).toBeVisible();

  for (const [category, scene, title] of representativeLabs) {
    await page.goto(`/labs/${category}/${scene}/vuln`);
    await expect(
      page.getByRole("heading", { name: `${title}风险观察版` }),
    ).toBeVisible();
    await expect(page.getByRole("textbox")).toHaveCount(0);
    await expect(page.getByRole("combobox")).toHaveCount(2);
    await page.getByRole("button", { name: "运行固定评估" }).click();
    await expect(
      page
        .locator(".guided-scenario-status-panel .status-metric")
        .filter({ hasText: "后端决策" })
        .locator("strong"),
    ).toHaveText("accepted");

    await page.goto(`/labs/${category}/${scene}/fixed`);
    await expect(
      page.getByRole("heading", { name: `${title}防御复盘版` }),
    ).toBeVisible();
    await page.getByRole("button", { name: "运行固定评估" }).click();
    await expect(
      page
        .locator(".guided-scenario-status-panel .status-metric")
        .filter({ hasText: "后端决策" })
        .locator("strong"),
    ).toHaveText("blocked");

    await page.getByRole("button", { name: "选择已验证控制" }).click();
    await page.getByRole("button", { name: "运行固定评估" }).click();
    await expect(
      page
        .locator(".guided-scenario-status-panel .status-metric")
        .filter({ hasText: "后端决策" })
        .locator("strong"),
    ).toHaveText("accepted");
  }
});

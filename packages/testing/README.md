# testing

共享测试工具目录。

当前已包含自动化冒烟测试，用于验证本机前后端最小联通链路：

- Web 首页可访问
- Server 健康检查可访问
- Server 实验元数据列表接口可访问
- Web `/api/*` 代理可转发到 Server
- Playwright 浏览器端到端冒烟
- Playwright 验证 `/labs` 页面展示真实实验元数据列表
- Playwright 验证 `web/xss` 漏洞版与修复版对同一样例 payload 的差异
- Playwright 验证登录用户完成 `web/xss` 样例后，可在账户中心看到学习进度与最近验证记录

## 命令

```powershell
pnpm --filter @network-safe/testing test
pnpm --filter @network-safe/testing smoke
pnpm --filter @network-safe/testing e2e
```

根目录可直接运行：

```powershell
pnpm test:smoke
pnpm test:e2e
pnpm test:automation
```

## Playwright 数据准备

Playwright 全局 setup 会在启动本机服务前自动执行服务端 seed：

```powershell
pnpm --filter @network-safe/server seed:auth
pnpm --filter @network-safe/server seed:labs
```

`seed:auth` 准备演示账号 `demo_user / Demo@123456`，`seed:labs` 将 `labs/*/*/meta.json` 同步到数据库实验主表与实验变体表。闭环用例依赖这两类数据。

## 当前边界

Playwright 当前只运行 Chromium，并使用本机系统 Chrome 通道。当前闭环用例覆盖 `web/xss` 漏洞版 / 修复版差异与修复版记录链路，后续实验对照断言会继续放在统一测试体系中。

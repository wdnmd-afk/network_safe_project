# testing

共享测试工具目录。

当前已包含自动化冒烟测试，用于验证本机前后端最小联通链路：

- Web 首页可访问
- Server 健康检查可访问
- Server 实验元数据列表接口可访问
- Web `/api/*` 代理可转发到 Server
- Playwright 浏览器端到端冒烟
- Playwright 验证 `/labs` 页面展示真实实验元数据列表

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

## 当前边界

Playwright 当前只运行 Chromium，并使用本机系统 Chrome 通道。后续实验对照断言会继续放在统一测试体系中。

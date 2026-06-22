# Playwright 端到端测试说明

## 1. 目标

Playwright 测试用于验证真实浏览器中的平台基础流程。

当前覆盖：

- 首页品牌和主导航可见
- 商品页可按关键字搜索
- 前端页面可通过 `/api/health` 代理访问后端健康检查
- `/labs` 页面可展示后端 `/api/labs` 返回的真实实验元数据列表，包括 XSS 与 JWT
- `web/xss` 漏洞版与修复版对同一样例 payload 呈现不同结果
- 登录演示用户后访问 `web/xss` 修复版，提交样例并在账户中心看到学习进度与最近验证记录

## 2. 运行命令

```powershell
pnpm test:e2e
```

完整自动化入口：

```powershell
pnpm test:automation
```

Playwright 全局 setup 会在启动本机服务前自动执行以下 seed，保证演示账号与实验主数据存在：

```powershell
pnpm --filter @network-safe/server seed:auth
pnpm --filter @network-safe/server seed:labs
```

其中 `seed:auth` 用于准备 `demo_user / Demo@123456`，`seed:labs` 用于将 `labs/*/*/meta.json` 同步到数据库实验主表与变体表。若单独做人工联调，也需要先确保这两类数据已同步。

## 3. 浏览器策略

当前使用系统 Chrome 通道：

```text
channel: chrome
```

原因是本机 Playwright 浏览器下载可能受网络影响。使用系统 Chrome 可减少首次运行成本。

## 4. 端口说明

前端端口固定为 `6670`，后端端口固定为 `6667`。`6670` 不需要额外的 Chromium 受限端口放行参数。

## 5. 当前限制

- 当前只运行 Chromium。
- 当前只覆盖 `web/xss` 的漏洞版 / 修复版差异和修复版记录闭环，尚未覆盖所有实验场景。
- 当前不做真实脚本执行、Cookie 读取或外部网络访问断言。
- 当前不截图比对 UI。
- 当前不覆盖 build 后 nginx 托管场景。

## 6. 后续扩展

后续建议补充：

- 更多实验场景复用学习记录与验证记录端到端链路
- build 后 nginx 场景回归

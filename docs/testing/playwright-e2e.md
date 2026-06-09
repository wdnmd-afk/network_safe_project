# Playwright 端到端测试说明

## 1. 目标

Playwright 测试用于验证真实浏览器中的平台基础流程。

当前覆盖：

- 首页品牌和主导航可见
- 商品页可按关键字搜索
- 前端页面可通过 `/api/health` 代理访问后端健康检查
- `/labs` 页面可展示后端 `/api/labs` 返回的真实实验元数据列表，包括 XSS 与 JWT

## 2. 运行命令

```powershell
pnpm test:e2e
```

完整自动化入口：

```powershell
pnpm test:automation
```

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
- 当前不验证漏洞版 / 修复版差异。
- 当前不截图比对 UI。
- 当前不覆盖 build 后 nginx 托管场景。

## 6. 后续扩展

后续建议补充：

- `web/xss` 漏洞版 / 修复版对照测试
- 学习记录与验证记录端到端链路
- build 后 nginx 场景回归

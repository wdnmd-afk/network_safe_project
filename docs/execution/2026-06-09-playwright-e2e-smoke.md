# Playwright 端到端冒烟测试执行文档

## 1. 目标

在现有 HTTP 级冒烟测试基础上，补充 Playwright 浏览器级端到端冒烟测试，验证用户真实浏览器路径：

- 首页可以打开并展示 SafeMart 品牌
- 商品页可以搜索并筛选商品
- 前端页面可以通过 `/api/health` 代理访问后端健康检查

本阶段不实现漏洞版 / 修复版对照测试。

## 2. 范围

本次修改范围：

- `packages/testing`
  - Playwright 配置
  - Playwright E2E 用例
  - Playwright 配置测试
  - README 更新
- 根目录 `package.json`
  - 新增 Playwright 测试脚本
- `docs/testing/`
  - 新增 Playwright 测试说明
- `docs/TODO.md`
  - 同步测试进度

本次不修改：

- 前端业务页面
- 后端 API 行为
- 数据库 schema
- 实验场景漏洞逻辑

## 3. 操作步骤

1. 写 Playwright 配置测试，确认：
   - baseURL 使用 `http://127.0.0.1:6670`
   - Chromium 使用系统 Chrome 通道
   - E2E 只跑 Chromium 项目
2. 安装 `@playwright/test`。
3. 新增 `playwright.config.mjs`。
4. 新增 E2E 用例：
   - 首页品牌与导航
   - 商品搜索
   - 前端代理健康检查
5. 新增根脚本：
   - `test:e2e`
   - `test:playwright`
6. 同步文档。
7. 执行最小验证。

## 4. 关键约束

前端端口固定为 `6670`，后端端口固定为 `6667`。`6670` 不属于本次已知的浏览器受限端口，不需要额外的 Chromium 端口放行参数。

## 5. 潜在风险分析

- 若本机未安装 Playwright 浏览器，首次运行可能需要安装浏览器依赖。
- 若 `6670` 或 `6667` 被非本项目服务占用，测试应失败，而不是误判通过。
- 当前只运行 Chromium，后续再扩展 Firefox / WebKit。

## 6. 验证方式

```powershell
pnpm --filter @network-safe/testing test
pnpm test:e2e
```

必要时补充：

```powershell
pnpm exec playwright install chromium
```

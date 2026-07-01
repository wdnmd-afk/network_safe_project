# 端口扫描页面级 Playwright 验证执行文档

## 1. 目标

本轮目标是在端口扫描前端工作台基础上，补齐页面级 Playwright 差异验证。

验证只通过浏览器操作本项目页面，登录本机演示账号，选择固定虚拟目标和固定观察模式，对比漏洞版与修复版的页面信号、后端决策和虚拟端口统计差异。

## 2. 范围

本轮包含：

- 更新 `packages/testing/tests/e2e/platform.spec.mjs`。
- 为 `network/port-scan` 新增漏洞版 / 修复版页面差异验证。
- 更新 `labs/network/port-scan/meta.json`，登记 Playwright 验证证据。
- 更新共享元数据测试对端口扫描自动化证据的断言。
- 更新端口扫描 README、手动验证、规划文档、TODO 和主 goal 记录。

本轮不包含：

- 不新增 `exploit.py`。
- 不新增真实端口扫描脚本。
- 不新增只读 `verify.ts`。
- 不新增数据库迁移。
- 不执行真实网络探测。
- 不添加任意目标输入、端口范围输入、并发参数或超时参数。
- 不将 `network.port-scan` 标记为 `ready`。

## 3. 已确认上下文

- 端口扫描后端 API 已接入，并且只接受 `targetKey` 和 `scanProfile`。
- 端口扫描前端工作台已接入 `/labs/network/port-scan/vuln` 与 `/labs/network/port-scan/fixed`。
- 现有 Playwright 用例集中在 `packages/testing/tests/e2e/platform.spec.mjs`。
- Playwright 全局启动流程会复用或启动本机 web / server 服务，并通过演示账号登录。
- `labs/network/port-scan/meta.json` 当前为 `in-progress`，已有 API 测试证据，尚未登记 Playwright 证据。

## 4. 验证设计

新增页面级用例：

1. 登录 `demo_user`。
2. 打开 `/labs/network/port-scan/vuln`。
3. 确认页面标题为“端口扫描漏洞版”。
4. 点击“后台管理节点”和“观察暴露面”。
5. 断言：
   - 学习信号为“漏洞版管理面公开可见”。
   - 后端决策为 `accepted`。
   - 暴露面评分为 `155`。
   - 高风险端口为 `3`。
   - 页面显示虚拟数据库服务端口 `3306/tcp · 数据库服务`。
6. 打开 `/labs/network/port-scan/fixed`。
7. 点击“后台管理节点”和“观察暴露面”。
8. 断言：
   - 学习信号为“修复版暴露面已收敛”。
   - 后端决策为 `accepted`。
   - 公开端口数量为 `0`。
   - 高风险端口为 `0`。
   - 页面显示 `3306/tcp · 数据库服务` 已收敛为 `internal-only / medium`。
9. 断言两个页面都不存在文本输入框，防止任意目标输入被引入。

## 5. 安全边界

Playwright 用例不得：

- 输入真实 IP、域名、网段或主机名。
- 输入端口范围、并发、超时或代理参数。
- 调用浏览器外的系统命令进行探测。
- 调用真实 socket、`nmap`、`Test-NetConnection`、`ping`、`tracert` 或类似探测工具。
- 记录真实服务 banner、凭据、token 或 Cookie。

## 6. 潜在风险

- 如果只断言页面可打开，无法证明漏洞版 / 修复版差异。
- 如果断言过于宽泛，可能在页面文本变化后误判通过。
- 如果误把 Playwright 证据理解为攻击脚本自动化，可能导致元数据含义混乱。

## 7. 优化方案

- 后续可增加只读一致性验证脚本，校验元数据入口、API 测试证据和页面入口一致。
- 后续若要推进到 `ready`，需要完成完成标准审计，并继续保持不提供真实扫描脚本。

## 8. 验证方式

本轮最小必要验证：

- `pnpm --filter @network-safe/testing e2e -- --grep "端口扫描"`
- `pnpm --filter @network-safe/testing test`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/web exec vitest run tests/port-scan-api.test.ts tests/port-scan-lab.test.ts tests/router.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- 安全关键词扫描确认 Playwright 与端口扫描相关变更未新增真实网络探测、系统命令、网段扫描或通用扫描器实现。

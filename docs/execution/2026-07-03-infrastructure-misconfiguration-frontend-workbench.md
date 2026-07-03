# 配置错误前端固定审计工作台执行文档

## 1. 目标

本轮目标是在后端受控 `audit` API 已落地的基础上，为 `infrastructure/misconfiguration` 新增前端固定配置审计工作台。

页面只提供固定 `configCaseKey` 和固定 `auditPolicyKey` 选择器，帮助学习者观察配置风险观察版与配置审计复盘版的差异，并把关键观察结果记录到学习进度和验证记录中。

## 2. 范围

新增：

- `apps/web/src/api/misconfiguration-lab.ts`
- `apps/web/src/labs/misconfiguration.ts`
- `apps/web/src/views/MisconfigurationLabView.vue`
- `apps/web/tests/misconfiguration-api.test.ts`
- `apps/web/tests/misconfiguration-lab.test.ts`

修改：

- `apps/web/src/router/routes.ts`
- `apps/web/src/styles/main.css`
- `apps/web/tests/router.test.ts`
- `labs/infrastructure/misconfiguration/meta.json`
- `labs/infrastructure/misconfiguration/README.md`
- `labs/infrastructure/misconfiguration/vuln/README.md`
- `labs/infrastructure/misconfiguration/fixed/README.md`
- `labs/infrastructure/misconfiguration/docs/attack-steps.md`
- `labs/infrastructure/misconfiguration/docs/manual-verification.md`
- `packages/shared/tests/lab-metadata.test.mjs`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

本轮不新增：

- `exploit.py`
- `verify.ts`
- Playwright 页面差异验证
- 只读一致性验证脚本
- 真实配置读取、真实服务扫描、真实管理接口连接或配置修改能力

## 3. 前端设计

视觉策略：

- 采用现有实验工作台风格，保持密集但清晰的操作界面。
- 不做落地页或营销式 hero。
- 使用固定选择器、状态面板、审计结果列表和复盘清单，突出“可操作、可复盘、可对比”。

页面结构：

1. 视角说明：展示当前实验名称、攻击方观察 / 防御方复盘、变体切换和预期信号。
2. 固定选择器：选择固定配置样例和固定审计策略。
3. 固定按钮：一键选择调试入口、目录索引、CORS、管理状态页、错误信息和默认凭据提示等样例。
4. 审计结果面板：展示后端决策、学习信号、暴露面类别、暴露状态、认证要求、CORS 状态、错误信息状态、风险标签和审计动作。
5. 固定样例观察：列出每个固定配置样例在漏洞版 / 修复版的观察重点。
6. 复盘清单：强调固定 key、暴露面、审计动作、日志摘要和不连接真实基础设施。

## 4. 字段约束

前端请求体只允许提交：

- `configCaseKey`
- `auditPolicyKey`

前端不得提供：

- 任意配置文本输入框
- 主机、IP、域名、端口、URL、路径输入框
- 账号、密码、token、Cookie、证书输入框
- 真实配置文件上传、导入或保存入口
- 扫描、连接、登录、重载、部署或下载按钮

## 5. 日志与学习记录

页面提交成功后：

- 使用后端返回结果展示学习信号和审计状态。
- 记录学习进度到 `infrastructure/misconfiguration`。
- 对预期学习信号记录验证记录。
- 验证记录 details 只保存固定 key、暴露面类别、审计状态、风险标签、审计动作和推荐动作。

不记录原始请求体，不保存真实配置、真实主机、真实端口、真实路径或真实凭据。

## 6. 潜在风险分析

- 如果新增文本输入框，可能让页面变成真实配置审计器。
- 如果新增主机、端口、URL 或路径输入框，可能让页面变成扫描或枚举入口。
- 如果记录完整请求体，可能泄露真实配置或凭据。
- 如果新增脚本或命令说明，可能引导学习者误操作本机服务。

本轮通过固定选择器、固定按钮、API client 请求体白名单和测试反向断言控制风险。

## 7. 验证方式

最小必要验证：

- `pnpm --filter @network-safe/web exec vitest run tests/misconfiguration-api.test.ts tests/misconfiguration-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/misconfiguration-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- 配置错误前端安全关键词扫描，确认未新增任意配置输入、真实主机 / 端口 / 路径 / 凭据输入、扫描入口、连接入口、脚本入口或真实配置读取能力。

## 8. 本轮完成条件

- 前端 API client 只提交固定 `configCaseKey` 和 `auditPolicyKey`。
- 固定配置样例模型覆盖漏洞版和修复版默认路径、按钮路径和复盘清单。
- `/labs/infrastructure/misconfiguration/vuln` 与 `/labs/infrastructure/misconfiguration/fixed` 路由可加载工作台。
- 元数据登记 web 入口，仍不登记 scripts 入口。
- 文档同步前端工作台阶段状态。
- 前端 API / 模型 / 路由测试通过，服务端和共享元数据验证保持通过。

# 配置错误页面级 Playwright 验证执行文档

## 1. 目标

本轮目标是在 `infrastructure/misconfiguration` 已具备前端固定配置审计工作台和后端受控 `audit` API 的基础上，补齐页面级 Playwright 差异验证。

验证重点是确认学习者登录后可以在漏洞版页面观察固定配置暴露信号，并在修复版页面观察最小暴露面、管理入口认证阻断、CORS 收敛和安全错误信息等防御信号。

本轮不创建 `exploit.py`、`verify.ts` 或 scripts 入口，不读取真实配置，不修改真实 nginx、MySQL、Node、Windows 服务或云账号配置，不扫描本机端口、局域网、外部 IP、域名、云资源或服务指纹，不连接真实管理接口。

## 2. 范围

本轮新增或修改：

- `docs/execution/2026-07-03-infrastructure-misconfiguration-playwright-verification.md`
- `packages/testing/tests/e2e/platform.spec.mjs`
- `labs/infrastructure/misconfiguration/meta.json`
- `packages/shared/tests/lab-metadata.test.mjs`
- `labs/infrastructure/misconfiguration/README.md`
- `labs/infrastructure/misconfiguration/docs/manual-verification.md`
- `tools/lab-scripts/infrastructure/misconfiguration/README.md`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

本轮不包含：

- 不新增攻击脚本、只读验证脚本或脚本入口。
- 不新增数据库迁移。
- 不改变后端固定审计 API 字段。
- 不把实验标记为 `ready`。
- 不提供任意配置文本、主机、IP、域名、端口、URL、路径、账号、密码、token、Cookie、证书、上传、下载、扫描、连接、部署或重载入口。

## 3. 已确认上下文

- 前端页面入口为 `/labs/infrastructure/misconfiguration/vuln` 与 `/labs/infrastructure/misconfiguration/fixed`。
- 后端 API 为 `POST /api/labs/infrastructure/misconfiguration/:variant/audit`。
- 前端请求体只包含固定 `configCaseKey` 和固定 `auditPolicyKey`。
- 当前元数据为 `simulation` / `in-progress`，已登记 web、api 和 docs 入口，scripts 入口为空。
- Playwright 全局 setup 会准备演示账号 `demo_user / Demo@123456`，并同步本地实验元数据。

## 4. 操作步骤

1. 在 `packages/testing/tests/e2e/platform.spec.mjs` 新增配置错误页面差异验证。
2. 用例登录 `demo_user`，只访问本项目本机页面和本机 API 代理。
3. 漏洞版进入 `/labs/infrastructure/misconfiguration/vuln`。
4. 断言页面标题为“配置错误风险观察版”，且页面没有文本输入框。
5. 点击固定“调试入口”按钮和“观察审计结果”按钮。
6. 断言漏洞版出现“调试入口可见”、`accepted` 决策、`debug-surface` 暴露面类别、`visible` 暴露状态、`not-required` 认证要求和 `audit-missing` 审计动作。
7. 点击固定“CORS 策略”按钮和“观察审计结果”按钮。
8. 断言漏洞版出现“CORS 策略过宽”、`cross-origin-trust` 暴露面类别和 `too-broad` CORS 状态。
9. 修复版进入 `/labs/infrastructure/misconfiguration/fixed`。
10. 断言页面标题为“配置错误审计复盘版”，且页面没有文本输入框。
11. 点击固定“调试入口”按钮和“观察审计结果”按钮。
12. 断言修复版出现“暴露面已收敛”、`accepted` 决策、`reduced` 暴露状态、`exposure-reduced` 审计动作和 `debug-disabled` 审计动作。
13. 点击固定“管理状态”按钮和“观察审计结果”按钮。
14. 断言修复版出现“管理入口已要求认证”、`blocked` 决策、`blocked` 暴露状态、`required` 认证要求和 `admin-auth-required` 审计动作。
15. 点击固定“CORS 策略”按钮和“观察审计结果”按钮。
16. 断言修复版出现“CORS 策略已收敛”、`restricted` CORS 状态和 `cors-policy-restricted` 审计动作。
17. 点击固定“错误信息”按钮和“观察审计结果”按钮。
18. 断言修复版出现“错误信息已安全分层”、`safe` 错误信息状态和 `safe-error-reporting` 审计动作。
19. 更新元数据 Playwright 自动化证据，保持 scripts 入口为空，保持 `variants[].supportsAutomation` 为 `false`。
20. 更新共享元数据测试和相关文档。
21. 执行最小必要验证后提交。

## 5. 实施建议

- 复用现有 LDAP、端口扫描、DNS 劫持、Prompt 注入和依赖混淆页面级验证的登录与状态面板断言风格。
- 页面断言优先使用可见文案、固定按钮和 `.misconfiguration-status-panel` 内的指标值。
- 通过 `getByRole("textbox")` 数量为 0 辅助确认页面未提供任意配置文本、主机、端口、路径、凭据或真实配置输入。
- 元数据只登记 Playwright 页面证据，不登记 scripts 入口。
- 本轮仍保持 `in-progress`，后续如需 `ready` 收口，应另写 ready 审计执行文档。

## 6. 潜在风险

- 如果只断言页面可打开，无法证明漏洞版与修复版差异。
- 如果断言过宽，可能在状态面板未正确更新时误判通过。
- 如果在测试中引入任意配置文本、真实主机、真实端口、真实 URL、真实路径或凭据，会突破当前固定样例边界。
- 如果把 Playwright 页面验证误解为攻击脚本自动化，会导致元数据语义混乱。
- Playwright 依赖本机 Chrome channel、端口和种子数据，环境异常可能导致 e2e 失败。

## 7. 优化方案

- 本轮先补页面级验证，后续可补本机只读一致性验证脚本。
- 后续若要推进 `ready`，需要审计 API 差异、页面差异、文档边界和脚本边界是否满足完成标准。
- 若 `platform.spec.mjs` 继续膨胀，后续可按实验类别拆分 e2e spec，但本轮先保持现有集中入口。

## 8. 验证方式

本轮最小必要验证：

- `pnpm --filter @network-safe/testing e2e -- --grep "配置错误"`
- `pnpm --filter @network-safe/testing test`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/web exec vitest run tests/misconfiguration-api.test.ts tests/misconfiguration-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/server test -- tests/misconfiguration-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- 配置错误相关变更安全关键词扫描，确认未新增真实配置读取、真实配置修改、真实服务扫描、真实管理接口连接、弱口令测试、服务枚举、脚本入口或可复用利用流程。

## 9. 本轮完成条件

- Playwright 能覆盖漏洞版调试入口可见与过宽 CORS 两条固定风险路径。
- Playwright 能覆盖修复版调试入口收敛、管理状态认证阻断、CORS 收敛和安全错误信息四条固定防御路径。
- 页面级验证确认没有文本输入框。
- 元数据登记 Playwright 自动化证据，scripts 入口仍为空。
- 文档说明当前仍不提供攻击脚本、真实配置读取、真实配置修改、真实服务扫描、真实管理接口连接或配置修改能力。
- 最小必要验证通过后再提交。

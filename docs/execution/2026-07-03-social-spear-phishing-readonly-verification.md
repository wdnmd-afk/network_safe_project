# 鱼叉式钓鱼只读一致性验证执行文档

## 1. 目标

本轮目标是在 `social/spear-phishing` 已具备前端固定案例工作台、后端受控 `review` API、服务端 API 测试和 Playwright 页面差异验证的基础上，新增本机只读一致性验证脚本。

该脚本只读取仓库内元数据、文档、前端、后端和测试文件，输出 JSON 检查报告，用于确认实验入口、固定 key、安全边界和自动化证据一致。本轮不新增 `exploit.py`、真实画像采集、真实投递、凭据收集、模板生成、第三方平台调用、跟踪链接、附件诱导文案、群发脚本或攻击脚本能力。

## 2. 范围

本轮新增：

- `docs/execution/2026-07-03-social-spear-phishing-readonly-verification.md`
- `tools/lab-scripts/social/spear-phishing/verify.ts`

本轮修改：

- `labs/social/spear-phishing/meta.json`
- `packages/shared/tests/lab-metadata.test.mjs`
- `labs/social/spear-phishing/README.md`
- `labs/social/spear-phishing/docs/manual-verification.md`
- `tools/lab-scripts/social/spear-phishing/README.md`
- `docs/design/next-wave-security-labs.md`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`

## 3. 实施建议

- 新增 `tools/lab-scripts/social/spear-phishing/verify.ts`，沿用现有只读验证脚本结构。
- 脚本只读取仓库内文件，不发起 HTTP 请求，不连接网络，不读取 `.env`、Cookie、token、验证码、凭据或真实业务材料。
- 脚本校验 `labs/social/spear-phishing/meta.json`：
  - `id` 为 `social.spear-phishing`。
  - `mode` 为 `case-study`。
  - `status` 仍为 `in-progress`。
  - web 入口只包含漏洞版和修复版页面。
  - api 入口只包含漏洞版和修复版 `review` 接口。
  - scripts 入口只登记 `spear-phishing-verify`。
  - Playwright、API 测试和 scriptVerification 自动化证据均开启。
  - `variants[].supportsAutomation` 继续为 `false`。
- 脚本校验固定案例 key：
  - `executive-invoice-approval`
  - `vendor-payment-change`
  - `engineering-access-request`
  - `hr-benefit-personalized`
- 脚本校验固定核验策略 key：
  - `context-only`
  - `out-of-band-confirmation`
  - `approval-chain-review`
  - `least-privilege-review`
  - `report-and-isolate`
- 脚本校验固定学习信号：
  - `spear-phishing-context-trust-overweighted`
  - `spear-phishing-approval-chain-bypassed`
  - `spear-phishing-out-of-band-confirmation-required`
  - `spear-phishing-boundary-verified`
- 脚本校验前端 API client 只提交 `caseKey` 和 `verificationPolicyKey`。
- 脚本校验 Playwright 用例断言无文本输入框。
- 脚本校验服务端已挂载 `/api/labs/social/spear-phishing/:variant/review`，并通过统一事件日志记录安全摘要。
- 脚本校验不存在 `tools/lab-scripts/social/spear-phishing/exploit.py`。

## 4. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 只读脚本被误解为攻击自动化 | 可能突破 case-study 边界 | scripts 入口只登记 `verify.ts`，`variants[].supportsAutomation` 继续为 `false` |
| 脚本读取真实环境配置 | 可能泄露本机敏感信息 | 脚本只读取仓库内白名单文件，不读取 `.env` 或系统配置 |
| 固定 key 漏登记 | 可能导致页面、API、文档不一致 | 脚本校验元数据、文档和实现中的固定案例、核验策略和学习信号 |
| 文档误标 ready | 可能夸大完成状态 | 本轮仍保持 `in-progress`，ready 收口另行编写执行文档 |

## 5. 验证方式

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/social/spear-phishing/verify.ts`
- `pnpm --filter @network-safe/testing e2e -- --grep "鱼叉式钓鱼"`
- `pnpm --filter @network-safe/testing test`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/web exec vitest run tests/spear-phishing-api.test.ts tests/spear-phishing-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/server test -- tests/spear-phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- `Test-Path tools/lab-scripts/social/spear-phishing/exploit.py`

## 6. 完成条件

- 只读验证脚本存在并输出 `ok: true`。
- 元数据登记 `spear-phishing-verify` scripts 入口和 scriptVerification 自动化证据。
- `entrypoints.scripts` 只包含 `tools/lab-scripts/social/spear-phishing/verify.ts`。
- `variants[].supportsAutomation` 仍为 `false`。
- 文档明确说明只读脚本不是 `exploit.py`、投递器、画像采集器、模板生成器或攻击脚本。
- 最小必要验证通过。

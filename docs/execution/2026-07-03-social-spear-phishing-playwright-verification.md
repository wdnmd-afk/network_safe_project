# 鱼叉式钓鱼页面差异验证执行文档

## 1. 目标

本轮目标是在 `social/spear-phishing` 前端固定案例工作台和后端受控 `review` API 基础上，补齐 Playwright 页面级差异验证，确认学习者可以在本机页面中观察漏洞版针对性误判信号与修复版流程核验阻断信号。

本轮只新增 Playwright e2e 验证、更新元数据中的 Playwright 自动化证据、同步共享元数据测试和相关文档。不新增 `verify.ts`、`exploit.py`、真实画像采集、真实投递、凭据收集、模板生成、跟踪链接、附件诱导文案、第三方平台调用或攻击脚本能力。

## 2. 范围

本轮修改：

- `packages/testing/tests/e2e/platform.spec.mjs`
- `labs/social/spear-phishing/meta.json`
- `packages/shared/tests/lab-metadata.test.mjs`
- `labs/social/spear-phishing/README.md`
- `labs/social/spear-phishing/docs/manual-verification.md`
- `tools/lab-scripts/social/spear-phishing/README.md`
- `docs/design/next-wave-security-labs.md`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`

本轮新增：

- `docs/execution/2026-07-03-social-spear-phishing-playwright-verification.md`

## 3. 实施建议

- 在 `packages/testing/tests/e2e/platform.spec.mjs` 中追加鱼叉式钓鱼页面差异用例。
- 用例只登录本机演示账号，只访问：
  - `/labs/social/spear-phishing/vuln`
  - `/labs/social/spear-phishing/fixed`
- 用例只点击页面已有固定按钮：
  - `付款审批`
  - `审批链复核`
  - `观察核验结果`
- 漏洞版验证：
  - 页面标题为鱼叉式钓鱼针对性误判观察版。
  - 页面没有文本输入框。
  - 固定选择器数量为 2。
  - 提交默认高权威付款审批案例后，后端决策为 `accepted`。
  - 学习信号展示“漏洞版审批链绕过风险可见”。
  - 风险标签包含 `authority-pressure`、`urgency-pressure`、`approval-chain-bypass`。
- 修复版验证：
  - 页面标题为鱼叉式钓鱼流程核验复盘版。
  - 页面没有文本输入框。
  - 固定选择器数量为 2。
  - 选择审批链复核后提交，后端决策为 `blocked`。
  - 学习信号展示“修复版要求可信通道二次确认”。
  - 页面展示修复版阻断说明。
- `labs/social/spear-phishing/meta.json` 只开启 `verification.automation.playwright`，仍保持 `status: "in-progress"`，`entrypoints.scripts` 为空，`scriptVerification.enabled` 为 `false`。
- `variants[].supportsAutomation` 继续为 `false`，避免将页面测试误标为攻击脚本自动化。

## 4. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 页面测试误用任意输入框 | 可能突破固定案例边界 | Playwright 明确断言 `textbox` 数量为 0，只使用固定按钮和选择器 |
| 元数据误标 ready | 可能夸大完成状态 | 本轮只登记 Playwright 证据，状态仍为 `in-progress` |
| 自动化被误解为攻击脚本 | 可能突破 case-study 边界 | `variants[].supportsAutomation` 继续为 `false`，scripts 入口仍为空 |
| 测试保存真实材料 | 可能污染日志或记录 | 页面和 API 只提交固定 `caseKey` 与 `verificationPolicyKey` |

## 5. 验证方式

- `pnpm --filter @network-safe/testing e2e -- --grep "鱼叉式钓鱼"`
- `pnpm --filter @network-safe/testing test`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/web exec vitest run tests/spear-phishing-api.test.ts tests/spear-phishing-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/server test -- tests/spear-phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- `Test-Path tools/lab-scripts/social/spear-phishing/exploit.py`
- `Test-Path tools/lab-scripts/social/spear-phishing/verify.ts`

## 6. 完成条件

- Playwright 用例覆盖鱼叉式钓鱼漏洞版和修复版页面差异。
- 用例断言两个页面均无文本输入框。
- 漏洞版能观察 `accepted` 和审批链绕过风险信号。
- 修复版能观察 `blocked` 和可信通道二次确认信号。
- 元数据登记 Playwright 自动化证据，仍不登记 scripts 入口。
- 最小必要验证通过。

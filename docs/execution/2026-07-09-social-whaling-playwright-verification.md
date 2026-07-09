# 捕鲸攻击页面差异验证执行文档

## 1. 目标

本轮目标是在 `social/whaling` 前端固定案例工作台基础上，新增 Playwright 页面差异验证，确认登录用户可以通过固定路由、固定选择器和固定按钮观察漏洞版高权威误判与修复版高风险流程核验差异。

本轮只实现页面级端到端验证、元数据验证证据同步和文档进度同步。不实现 `verify.ts`、`exploit.py`、真实高管画像采集、真实组织结构收集、真实投递、凭据收集、模板生成、会议邀请、付款指令、第三方平台连接或攻击脚本能力。

## 2. 范围

本轮修改：

- `packages/testing/tests/e2e/platform.spec.mjs`
- `labs/social/whaling/meta.json`
- `packages/shared/tests/lab-metadata.test.mjs`
- `labs/social/whaling/README.md`
- `labs/social/whaling/docs/manual-verification.md`
- `docs/design/next-wave-security-labs.md`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/execution/2026-07-09-social-whaling-playwright-verification.md`

本轮不修改：

- `tools/lab-scripts/social/whaling/verify.ts`
- `tools/lab-scripts/social/whaling/exploit.py`
- 后端 API 逻辑
- 数据库结构
- 真实第三方平台连接

## 3. 操作步骤

1. 预读现有 `social/spear-phishing` Playwright 用例，沿用登录、固定路由、固定按钮和页面差异断言风格。
2. 在 `packages/testing/tests/e2e/platform.spec.mjs` 新增捕鲸攻击页面差异测试。
3. 漏洞版只访问 `/labs/social/whaling/vuln`，断言无文本框、存在两个固定选择器，点击固定按钮后观察 `accepted`、高权威误判学习信号和风险标签。
4. 修复版只访问 `/labs/social/whaling/fixed`，断言无文本框、存在两个固定选择器，点击固定按钮后观察 `blocked`、冻结复核学习信号和核验状态。
5. 更新 `labs/social/whaling/meta.json`，登记 Playwright 页面差异验证证据，状态仍保持 `in-progress`，scripts 入口仍为空。
6. 更新共享元数据测试，确认 Playwright 证据存在，且 `variants[].supportsAutomation` 仍为 `false`。
7. 同步场景文档、手动验证文档、下一波规划、TODO 和主目标文档。

## 4. 实施建议

- Playwright 用例只使用本项目固定 demo 登录账号和本机路由。
- 页面断言只检查固定可见文本、固定按钮、固定选择器、固定状态面板和固定学习信号。
- 不通过 Playwright 输入任意正文、真实人员、邮箱、链接、附件、付款信息、会议邀请、凭据或第三方平台参数。
- 不把 Playwright 页面验证登记为攻击脚本自动化；`variants[].supportsAutomation` 继续保持 `false`。
- `entrypoints.scripts` 继续保持空数组。

## 5. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 页面测试误用自由文本输入 | 可能偏离固定案例边界 | 明确断言 `textbox` 数量为 0，只点击固定按钮 |
| Playwright 证据被误解为攻击自动化 | 可能突破 `supportsAutomation` 边界 | 只登记 `verification.automation.playwright`，变体自动化仍为 `false` |
| 测试断言过宽 | 可能无法证明页面差异 | 同时断言路由、标题、控件数量、决策、学习信号和关键核验字段 |
| 元数据与页面能力不同步 | 平台入口和验证证据不一致 | 同步共享元数据测试和手动验证文档 |

## 6. 优化方案

- 后续可继续补充只读一致性验证脚本，但必须单独写执行文档，并且脚本只能读取仓库内文件。
- 后续 ready 收口前，至少应同时具备后端 API 测试、前端页面差异验证和只读一致性验证证据。

## 7. 验证方式

- `pnpm --filter @network-safe/testing e2e -- --grep "捕鲸攻击"`
- `pnpm --filter @network-safe/testing test`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/web exec vitest run tests/whaling-api.test.ts tests/whaling-lab.test.ts tests/router.test.ts`
- `git diff --check`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- `Test-Path tools/lab-scripts/social/whaling/exploit.py`
- `Test-Path tools/lab-scripts/social/whaling/verify.ts`
- 安全关键词扫描，确认真实投递、画像采集、凭据收集、模板生成、第三方平台调用、会议邀请、付款指令和攻击脚本相关命中均为禁止性说明、测试反向断言或安全边界说明。

## 8. 完成条件

- Playwright 能覆盖 `/labs/social/whaling/vuln` 与 `/labs/social/whaling/fixed`。
- 漏洞版断言 `accepted`、`whaling-executive-authority-overweighted` 对应中文学习信号和高权威相关风险标签。
- 修复版断言 `blocked`、`whaling-payment-freeze-required` 对应中文学习信号和核验策略状态。
- 页面测试确认无文本框，只有固定选择器和固定按钮交互。
- `meta.json` 登记 Playwright 证据，但 scripts 入口仍为空，变体 `supportsAutomation` 仍为 `false`。
- 最小必要验证通过。

## 9. 本轮执行结果

- 已在 `packages/testing/tests/e2e/platform.spec.mjs` 新增捕鲸攻击页面差异验证。
- 漏洞版覆盖 `/labs/social/whaling/vuln`，断言无文本框、两个固定选择器、`accepted` 决策、高权威误判学习信号和固定风险标签。
- 修复版覆盖 `/labs/social/whaling/fixed`，断言无文本框、两个固定选择器、`blocked` 决策、冻结复核学习信号、可信通道和付款冻结状态。
- 已在 `labs/social/whaling/meta.json` 登记 Playwright 页面差异验证证据，状态仍为 `in-progress`。
- `entrypoints.scripts` 仍为空，`variants[].supportsAutomation` 仍为 `false`，未创建 `verify.ts` 或 `exploit.py`。

## 10. 验证结果

- `pnpm --filter @network-safe/testing e2e -- --grep "捕鲸攻击"` 通过，1 项 Playwright 测试通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/shared test` 通过，35 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/whaling-api.test.ts tests/whaling-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `git diff --check` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- `Test-Path tools/lab-scripts/social/whaling/exploit.py` 与 `Test-Path tools/lab-scripts/social/whaling/verify.ts` 均返回 `False`。
- 安全关键词扫描命中均为禁止性说明、安全边界说明、历史文档或固定字段 / 文档路径，未发现真实投递、画像采集、凭据收集、模板生成、第三方平台调用、会议邀请、付款指令或攻击脚本实现。

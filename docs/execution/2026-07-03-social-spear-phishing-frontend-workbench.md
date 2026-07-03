# 鱼叉式钓鱼前端固定案例工作台执行文档

## 1. 目标

本轮目标是在 `social/spear-phishing` 后端受控 `review` API 基础上，新增前端固定案例工作台，让学习者通过页面选择固定虚构案例和固定核验策略，观察漏洞版的针对性误判信号与修复版的流程核验阻断信号。

本轮只实现前端 API client、前端实验模型、Vue 工作台页面、路由、前端单元测试、元数据与文档同步。不实现 Playwright 页面差异验证、只读一致性验证脚本、`verify.ts`、`exploit.py`、真实画像采集、真实投递、凭据收集、模板生成或第三方平台连接。

## 2. 范围

本轮新增：

- `apps/web/src/api/spear-phishing-lab.ts`
- `apps/web/src/labs/spear-phishing.ts`
- `apps/web/src/views/SpearPhishingLabView.vue`
- `apps/web/tests/spear-phishing-api.test.ts`
- `apps/web/tests/spear-phishing-lab.test.ts`

本轮修改：

- `apps/web/src/router/routes.ts`
- `apps/web/tests/router.test.ts`
- `apps/web/src/styles/main.css`
- `labs/social/spear-phishing/meta.json`
- `labs/social/spear-phishing/README.md`
- `labs/social/spear-phishing/vuln/README.md`
- `labs/social/spear-phishing/fixed/README.md`
- `labs/social/spear-phishing/docs/fixed-cases.md`
- `labs/social/spear-phishing/docs/attack-steps.md`
- `labs/social/spear-phishing/docs/fix-notes.md`
- `labs/social/spear-phishing/docs/manual-verification.md`
- `packages/shared/tests/lab-metadata.test.mjs`
- `docs/design/next-wave-security-labs.md`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`

## 3. 前端设计约束

视觉原则：

- visual thesis：克制的安全复盘工作台，使用深色操作面、清晰状态指标和固定线索清单突出“上下文不等于可信”。
- content plan：页面顶部说明当前视角；中部提供固定案例与核验策略选择；右侧展示后端判定、学习信号和安全摘要；下方列出固定线索卡与复盘清单。
- interaction thesis：变体切换、固定样例按钮和提交后的状态面板是主要交互，不引入装饰性动效或营销式 hero。

界面必须遵循现有 `PhishingLabView.vue` 和 `MisconfigurationLabView.vue` 样板：

- 使用固定选择器和固定按钮，不提供任意正文输入框。
- 漏洞版默认选择 `executive-invoice-approval` + `context-only`。
- 修复版默认选择 `executive-invoice-approval` + `approval-chain-review`。
- 页面只提交 `caseKey` 和 `verificationPolicyKey`。
- 页面可记录学习进度和验证记录，但验证记录 `details` 只能保存固定 key、风险标签、核验状态、建议动作、风险等级和学习信号。

## 4. 字段与接口

前端 API：

```text
POST /api/labs/social/spear-phishing/:variant/review
```

请求体只允许：

- `caseKey`
- `verificationPolicyKey`

固定案例 key：

- `executive-invoice-approval`
- `vendor-payment-change`
- `engineering-access-request`
- `hr-benefit-personalized`

固定核验策略 key：

- `context-only`
- `out-of-band-confirmation`
- `approval-chain-review`
- `least-privilege-review`
- `report-and-isolate`

前端结果字段必须与后端服务类型一致：

- `status`
- `variantKey`
- `caseKey`
- `verificationPolicyKey`
- `caseSummary`
- `assessment`
- `signal`
- `decision`
- `message`
- `nextStep`
- `blockedReason`

不得猜测字段名，不得增加多字段兜底。

## 5. 实施建议

- 复用 `apps/web/src/api/phishing-lab.ts` 的 API client 结构，403 阻断响应直接返回。
- 复用 `apps/web/src/labs/phishing.ts` 的前端模型组织方式，单独定义鱼叉式钓鱼固定案例、核验策略、默认值、学习进度和验证记录生成函数。
- 复用 `PhishingLabView.vue` 的工作台结构，但文案必须强调鱼叉式钓鱼的角色权威、业务熟悉感、审批链、可信通道和最小授权。
- 路由新增：
  - `/labs/social/spear-phishing/vuln`
  - `/labs/social/spear-phishing/fixed`
- 元数据只新增 web 入口，仍保持 `status: "in-progress"`，不启用 Playwright，不新增 scripts 入口。
- `variants[].supportsAutomation` 继续为 `false`。

## 6. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 页面出现任意正文、邮箱、人员或链接输入框 | 可能把工作台变成真实社工内容处理器 | 页面只提供固定选择器和固定按钮 |
| API client 发送额外字段 | 可能污染后端日志或突破安全边界 | 单元测试断言请求体只包含 `caseKey` 和 `verificationPolicyKey` |
| 验证记录保存真实材料 | 可能污染学习记录 | `details` 只保存固定 key、风险类别和学习信号 |
| 元数据误标 ready | 实验证据不足时造成状态失真 | 本轮只推进到前端工作台，状态保持 `in-progress` |
| 误把页面/API 测试标为攻击自动化 | 可能突破 case-study 边界 | `variants[].supportsAutomation` 保持 `false`，scripts 入口为空 |

## 7. 验证方式

- `pnpm --filter @network-safe/web exec vitest run tests/spear-phishing-api.test.ts tests/spear-phishing-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/spear-phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- `Test-Path tools/lab-scripts/social/spear-phishing/exploit.py`
- `Test-Path tools/lab-scripts/social/spear-phishing/verify.ts`
- 安全关键词扫描，确认真实投递、画像采集、凭据收集、模板生成、第三方平台调用和攻击脚本相关命中均为禁止性说明、测试反向断言、安全边界说明、固定测试数据或既有认证逻辑。

## 8. 完成条件

- 前端页面可通过两个路由访问漏洞版和修复版。
- 页面只提供固定案例选择器、固定核验策略选择器和固定样例按钮。
- 前端 API client 只发送 `caseKey` 和 `verificationPolicyKey`。
- 漏洞版能够观察 `spear-phishing-approval-chain-bypassed` 或 `spear-phishing-context-trust-overweighted`。
- 修复版能够观察 `spear-phishing-out-of-band-confirmation-required` 或 `spear-phishing-boundary-verified`。
- 学习进度与验证记录只保存固定 key、风险标签、核验状态、建议动作、风险等级和学习信号。
- 元数据登记 web 和 api 入口，scripts 入口为空，状态仍为 `in-progress`。
- 最小必要验证通过。

## 9. 本轮执行结果

- 已新增 `apps/web/src/api/spear-phishing-lab.ts`，API client 只提交固定 `caseKey` 和 `verificationPolicyKey`。
- 已新增 `apps/web/src/labs/spear-phishing.ts`，前端模型集中维护四个固定虚构案例、五个固定核验策略、默认策略、学习进度和验证记录安全摘要。
- 已新增 `apps/web/src/views/SpearPhishingLabView.vue`，提供漏洞版和修复版固定案例工作台。
- 已新增 `/labs/social/spear-phishing/vuln` 与 `/labs/social/spear-phishing/fixed` 路由。
- 已新增 `apps/web/tests/spear-phishing-api.test.ts` 与 `apps/web/tests/spear-phishing-lab.test.ts`，覆盖请求体边界、固定选项、默认策略、验证记录安全摘要和静态安全文案。
- 已更新 `labs/social/spear-phishing/meta.json`，登记 docs、web 和 api 入口，scripts 入口仍为空，状态仍为 `in-progress`。
- 已同步场景 README、漏洞版 / 修复版说明、固定案例、攻击步骤、修复说明、手动验证、脚本目录边界说明、共享元数据测试、`docs/design/next-wave-security-labs.md`、`docs/TODO.md` 和 `docs/execution/security-lab-master-goal.md`。
- 当前仍不提供 `verify.ts`、`exploit.py`、Playwright 页面差异验证、真实画像采集、真实投递、凭据收集、模板生成或第三方平台连接能力。

验证结果：

- `pnpm --filter @network-safe/web exec vitest run tests/spear-phishing-api.test.ts tests/spear-phishing-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/shared test` 通过，34 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/spear-phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，209 项通过。

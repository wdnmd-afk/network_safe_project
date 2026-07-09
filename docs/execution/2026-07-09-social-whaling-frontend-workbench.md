# 捕鲸攻击前端固定案例工作台执行文档

## 1. 目标

本轮目标是在 `social/whaling` 后端受控 review API 基础上，新增前端固定案例工作台，让学习者可以在页面中通过固定案例选择器和固定核验策略选择器观察漏洞版与修复版的差异。

本轮只实现前端 API client、前端实验模型、前端工作台页面、路由、前端单元测试、元数据和文档同步。不实现 `verify.ts`、`exploit.py`、Playwright 页面差异验证、真实高管画像采集、真实组织结构收集、真实投递、凭据收集、模板生成、会议邀请、付款指令、第三方平台连接或攻击脚本能力。

## 2. 范围

本轮新增：

- `apps/web/src/api/whaling-lab.ts`
- `apps/web/src/labs/whaling.ts`
- `apps/web/src/views/WhalingLabView.vue`
- `apps/web/tests/whaling-api.test.ts`
- `apps/web/tests/whaling-lab.test.ts`

本轮修改：

- `apps/web/src/router/routes.ts`
- `apps/web/src/styles/main.css`
- `apps/web/tests/router.test.ts`
- `labs/social/whaling/meta.json`
- `labs/social/whaling/README.md`
- `labs/social/whaling/vuln/README.md`
- `labs/social/whaling/fixed/README.md`
- `labs/social/whaling/docs/attack-steps.md`
- `labs/social/whaling/docs/fix-notes.md`
- `labs/social/whaling/docs/manual-verification.md`
- `tools/lab-scripts/social/whaling/README.md`
- `packages/shared/tests/lab-metadata.test.mjs`
- `docs/design/next-wave-security-labs.md`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`

## 3. 页面字段

页面只允许使用固定选择器：

- `caseKey`
- `verificationPolicyKey`

页面不得提供以下输入：

- 任意正文
- 真实姓名、邮箱、手机号、公司、部门、职位、汇报关系或组织结构
- 真实链接、附件、凭据、token、Cookie、验证码
- 付款账号、付款指令、法务材料、董事会材料、并购材料
- 会议邀请、投递目标、第三方平台参数

## 4. 实施建议

- 前端 API client 只提交 `caseKey` 和 `verificationPolicyKey`。
- 前端模型集中维护固定案例、固定核验策略、默认策略、学习进度和验证记录安全摘要。
- 页面复用现有工作台布局，只提供固定下拉、固定样例按钮、后端判定结果、风险标签、学习信号和下一步建议。
- 漏洞版默认选择 `executive-wire-approval` + `authority-context-only`。
- 修复版默认选择 `executive-wire-approval` + `payment-dual-approval`。
- `variants[].supportsAutomation` 继续保持 `false`，前端单元测试和 API client 测试不等同于攻击脚本自动化。

## 5. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 页面出现任意正文或人员输入 | 可能变成真实社工内容处理器 | 只使用固定选择器和固定样例按钮 |
| API client 提交敏感字段 | 可能污染后端日志或复盘记录 | 测试断言请求体仅包含固定 key |
| 元数据误登记 scripts | 平台误认为已提供脚本能力 | scripts 继续保持空数组 |
| 页面文案变成可投递模板 | 可能削弱 case-study 边界 | 文案只描述风险标签、流程节点和防御动作 |
| 前端测试被误标为攻击自动化 | 可能突破 supportsAutomation 边界 | `variants[].supportsAutomation` 继续保持 `false` |

## 6. 优化方案

- 后续可补 Playwright 页面差异验证，只访问固定路由并点击固定按钮。
- 后续可补只读一致性验证脚本，只读取仓库内文件，不发起网络请求。
- 后续 case-study ready 收口前，应至少覆盖页面差异、API 差异或只读一致性验证中的两类。

## 7. 验证方式

- `pnpm --filter @network-safe/web exec vitest run tests/whaling-api.test.ts tests/whaling-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/whaling-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- `Test-Path tools/lab-scripts/social/whaling/exploit.py`
- `Test-Path tools/lab-scripts/social/whaling/verify.ts`
- 安全关键词扫描，确认真实投递、画像采集、凭据收集、模板生成、第三方平台调用、会议邀请、付款指令和攻击脚本相关命中均为禁止性说明、测试反向断言或安全边界说明。

## 8. 完成条件

- `/labs/social/whaling/vuln` 与 `/labs/social/whaling/fixed` 路由可加载同一工作台组件。
- 页面只提供固定案例选择器、固定核验策略选择器和固定样例按钮。
- API client 只提交固定 `caseKey` 和 `verificationPolicyKey`。
- 前端模型测试覆盖固定案例、固定策略、默认策略、验证记录摘要和安全边界文案。
- `meta.json` 继续保持 `in-progress`，新增 web 入口，不新增 scripts 入口。
- 最小必要验证通过。

## 9. 本轮执行结果

- 已新增前端 API client：`apps/web/src/api/whaling-lab.ts`，请求体只包含固定 `caseKey` 与固定 `verificationPolicyKey`。
- 已新增前端实验模型：`apps/web/src/labs/whaling.ts`，维护固定案例、固定核验策略、默认策略、学习进度和验证记录安全摘要。
- 已新增前端工作台页面：`apps/web/src/views/WhalingLabView.vue`，并接入 `/labs/social/whaling/vuln` 与 `/labs/social/whaling/fixed`。
- 已同步路由、样式、前端测试、共享元数据测试、场景文档、脚本目录边界说明、TODO、下一波规划和主目标文档。
- `entrypoints.scripts` 仍为空，`variants[].supportsAutomation` 仍为 `false`，未创建 `verify.ts` 或 `exploit.py`。

## 10. 验证结果

- `pnpm --filter @network-safe/web exec vitest run tests/whaling-api.test.ts tests/whaling-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/shared test` 通过，35 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/whaling-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，215 项通过。
- `git diff --check` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- `Test-Path tools/lab-scripts/social/whaling/exploit.py` 与 `Test-Path tools/lab-scripts/social/whaling/verify.ts` 均返回 `False`。
- 安全关键词扫描命中均为禁止性说明、安全边界说明、测试反向断言或固定字段 / 文档路径，未发现真实投递、画像采集、凭据收集、模板生成、第三方平台调用、会议邀请、付款指令或攻击脚本实现。

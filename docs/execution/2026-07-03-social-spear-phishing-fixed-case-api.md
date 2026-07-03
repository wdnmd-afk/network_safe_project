# 鱼叉式钓鱼后端固定案例 API 执行文档

## 1. 目标

本轮目标是在 `social/spear-phishing` 固定案例文档基础上，新增后端固定案例 `review` API，将鱼叉式钓鱼从 docs-only fixed-cases 阶段推进到受控后端 API 阶段。

本轮只实现后端固定案例服务、受控 API、统一事件日志安全摘要、服务端 API 测试和元数据同步。不实现前端页面、数据库迁移、脚本、`verify.ts`、`exploit.py`、真实画像采集、真实投递、凭据收集、模板生成或第三方平台连接。

## 2. 范围

本轮新增：

- `apps/server/src/services/spear-phishing-lab.ts`
- `apps/server/tests/spear-phishing-lab.test.ts`

本轮修改：

- `apps/server/src/app.ts`
- `labs/social/spear-phishing/meta.json`
- `labs/social/spear-phishing/README.md`
- `labs/social/spear-phishing/docs/attack-steps.md`
- `labs/social/spear-phishing/docs/fix-notes.md`
- `labs/social/spear-phishing/docs/manual-verification.md`
- `packages/shared/tests/lab-metadata.test.mjs`
- `apps/server/tests/health.test.ts`
- `apps/server/tests/lab-registry.test.ts`
- `docs/design/next-wave-security-labs.md`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`

## 3. 接口字段

本轮定义后端 API 为：

```text
POST /api/labs/social/spear-phishing/:variant/review
```

其中：

- `variant` 只允许 `vuln` 或 `fixed`。
- 请求体只读取固定字段：
  - `caseKey`
  - `verificationPolicyKey`
- `caseKey` 只允许：
  - `executive-invoice-approval`
  - `vendor-payment-change`
  - `engineering-access-request`
  - `hr-benefit-personalized`
- `verificationPolicyKey` 只允许：
  - `context-only`
  - `out-of-band-confirmation`
  - `approval-chain-review`
  - `least-privilege-review`
  - `report-and-isolate`

未知 key 必须阻断，且不得回显原始输入。

## 4. 实施建议

- 服务层只使用内存固定案例定义，不读取真实邮箱、真实联系人、真实组织、真实链接、真实附件或外部服务。
- 漏洞版用于展示针对性上下文、角色权威、审批链绕过和业务熟悉感如何造成错误放行倾向。
- 修复版用于展示可信通道二次确认、审批链复核、最小授权、隔离举报和日志复盘如何改变决策。
- 统一事件日志只记录固定 `caseKey`、固定 `verificationPolicyKey`、风险标签、建议动作、后端决策和学习信号。
- 额外传入的 `emailBody`、`recipient`、`password`、`token`、`url` 等字段不得进入服务结果或日志摘要。
- `variants[].supportsAutomation` 继续保持 `false`，API 测试不等同于攻击脚本自动化。

## 5. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| API 接收任意正文或人员信息 | 可能变成真实社工内容处理器 | 只读取固定 `caseKey` 与 `verificationPolicyKey` |
| 未知 key 回显原始输入 | 可能把真实人员、邮箱或链接写回响应或日志 | 未知 key 返回 `blocked-case` / `blocked-verification-policy` |
| 日志摘要保存敏感字段 | 可能污染学习复盘记录 | 只写固定 key、风险标签、动作、决策和学习信号 |
| 元数据误登记 web 或 scripts | 平台会误认为页面或脚本已实现 | 本轮只登记 api，web/scripts 保持空数组 |
| API 测试被误标为攻击自动化 | 容易突破 case-study 边界 | `variants[].supportsAutomation` 保持 `false` |

## 6. 优化方案

- 后续前端工作台可复用当前 API，只提供固定案例选择器和固定策略选择器。
- 后续只读一致性验证脚本可校验服务、测试、元数据和文档边界，但仍不得发起外部请求。
- 后续 case-study ready 收口前，应至少补齐页面差异验证或只读一致性验证中的一类。

## 7. 验证方式

- `pnpm --filter @network-safe/server test -- tests/spear-phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- `Test-Path tools/lab-scripts/social/spear-phishing/exploit.py`
- `Test-Path tools/lab-scripts/social/spear-phishing/verify.ts`
- 安全关键词扫描，确认真实投递、画像采集、凭据收集、模板生成、第三方平台调用和攻击脚本相关命中均为禁止性说明、测试反向断言或安全边界说明。

## 8. 完成条件

- 后端固定案例服务只处理固定 `caseKey` 与 `verificationPolicyKey`。
- `POST /api/labs/social/spear-phishing/:variant/review` 已接入登录校验和统一事件日志安全摘要。
- 未知 key 被阻断且不回显原始输入。
- 服务端测试覆盖漏洞版误判观察、修复版阻断、未知 key 脱敏阻断、登录要求和日志摘要脱敏。
- `meta.json` 状态推进到 `in-progress`，仅新增 api 入口，不新增 web/scripts 入口。
- 最小必要验证通过。

## 9. 本轮执行结果

- 已新增 `apps/server/src/services/spear-phishing-lab.ts`，服务只使用固定虚构案例和固定核验策略。
- 已新增 `POST /api/labs/social/spear-phishing/:variant/review`，并接入登录校验、固定 key 校验和统一事件日志安全摘要。
- 已新增 `apps/server/tests/spear-phishing-lab.test.ts`，覆盖漏洞版误判观察、修复版阻断、未知 key 脱敏阻断、登录要求和日志摘要脱敏。
- 已将 `labs/social/spear-phishing/meta.json` 更新为 `in-progress`，仅登记 docs 和 api 入口，web/scripts 入口仍为空。
- 已同步场景 README、漏洞版 / 修复版说明、攻击步骤、修复说明、手动验证、脚本目录边界说明、共享元数据测试、服务端 health / registry 测试、`docs/design/next-wave-security-labs.md`、`docs/TODO.md` 和 `docs/execution/security-lab-master-goal.md`。
- 当前仍不提供前端页面、数据库迁移、`verify.ts`、`exploit.py`、真实画像采集、真实投递、凭据收集、模板生成或第三方平台连接能力。

验证结果：

- `pnpm --filter @network-safe/shared test` 通过，34 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/spear-phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，209 项通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- `git diff --check -- <本轮目标文件>` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- `Test-Path tools/lab-scripts/social/spear-phishing/exploit.py` 与 `Test-Path tools/lab-scripts/social/spear-phishing/verify.ts` 均返回 `False`。
- 鱼叉式钓鱼安全关键词扫描命中均为禁止性说明、安全边界说明、测试反向断言、文档路径或固定测试数据，未发现真实投递、画像采集、凭据收集、模板生成、第三方平台调用或攻击脚本实现。

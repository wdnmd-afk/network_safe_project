# 鱼叉式钓鱼 case-study ready 收口执行文档

## 1. 目标

本轮目标是在 `social/spear-phishing` 已完成固定案例文档、后端受控 `review` API、前端固定案例工作台、Playwright 页面差异验证和本机只读一致性验证之后，按主计划完成标准和 case-study ready 例外标准做收口审计。

若审计证据完整，则将 `labs/social/spear-phishing/meta.json` 从 `in-progress` 推进到 `ready`，并同步只读验证脚本、共享元数据测试、服务端索引测试、场景文档、主进度和下一波实验规划。

本轮仍不创建 `exploit.py`，不提供真实邮件、短信、消息或链接投递，不采集真实画像，不收集真实姓名、邮箱、手机号、公司、部门、职位、社交账号、组织关系、凭据、验证码、Cookie、token、付款信息、附件或业务材料，不连接第三方邮件、短信、社交平台、CRM、HR、IM、企业通讯录、投递服务或收件箱服务，不生成可投递标题库、正文模板库、IM 话术库、附件诱导文案、跟踪链接、群发脚本或攻击脚本。

## 2. 范围

本轮新增：

- `docs/execution/2026-07-03-social-spear-phishing-ready-closeout.md`

本轮可能同步：

- `labs/social/spear-phishing/meta.json`
- `tools/lab-scripts/social/spear-phishing/verify.ts`
- `packages/shared/tests/lab-metadata.test.mjs`
- `apps/server/tests/health.test.ts`
- `apps/server/tests/lab-registry.test.ts`
- `labs/social/spear-phishing/README.md`
- `labs/social/spear-phishing/vuln/README.md`
- `labs/social/spear-phishing/fixed/README.md`
- `labs/social/spear-phishing/docs/attack-steps.md`
- `labs/social/spear-phishing/docs/fixed-cases.md`
- `labs/social/spear-phishing/docs/fix-notes.md`
- `labs/social/spear-phishing/docs/manual-verification.md`
- `tools/lab-scripts/social/spear-phishing/README.md`
- `docs/design/next-wave-security-labs.md`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`

## 3. 操作步骤

1. 对照主计划完成标准审计鱼叉式钓鱼当前证据。
2. 确认漏洞版可运行：前端针对性误判观察版页面、后端 `vuln/review` 和服务端 API 测试覆盖固定高风险案例的错误放行倾向。
3. 确认修复版可运行：前端流程核验复盘版页面、后端 `fixed/review` 和服务端 API 测试覆盖可信通道二次确认、审批链复核、最小授权复核、隔离举报和阻断结果。
4. 确认攻击方观察路径清晰：文档和页面只展示固定虚构案例、固定线索卡、固定风险标签和固定学习信号，不提供可投递素材。
5. 确认防御方阻断路径清晰：文档和页面展示角色核验、可信通道二次确认、审批链、供应商主数据变更、最小授权、隔离举报和日志复盘。
6. 确认后端统一事件日志只记录固定 key、风险类别、建议动作、后端决策和学习信号，不保存真实人员、邮箱、手机号、组织、链接、附件、凭据、token 或正文。
7. 确认元数据入口、文档入口、web 入口、api 入口、scripts 入口和自动化证据一致。
8. 确认只读验证脚本能校验 `ready` 状态、case-study ready 边界、Playwright 页面差异验证、服务端 API 测试和只读脚本证据。
9. 确认 `variants[].supportsAutomation` 继续保持 `false`，避免把 Playwright、API 测试或只读脚本误标为攻击脚本自动化。
10. 若以上证据完整，则更新元数据状态为 `ready`，并补充 ready 状态边界说明。
11. 同步文档、共享测试、服务端索引测试、规划和主进度记录。
12. 运行最小必要验证并记录结果。

## 4. 实施建议

- 只把 `ready` 理解为本项目内固定案例学习闭环完成，不代表具备真实鱼叉式钓鱼投递、画像采集、凭据收集、模板生成、第三方平台连接或攻击自动化能力。
- `entrypoints.scripts` 继续只登记 `verify.ts`，该脚本只读仓库文件，不发起 HTTP 请求，不读取 `.env`，不连接邮件、短信、社交、CRM、HR、IM、企业通讯录、投递或收件箱服务。
- `verification.automation` 保留三类证据：Playwright 页面差异验证、服务端 API 测试和本机只读一致性验证。
- 共享元数据测试应断言 `status: "ready"`、只读脚本入口、三类自动化证据、安全边界和 `notes` 中的 ready 收口说明。
- 文档中需要把“下一步 ready 收口审计”改为“已完成 ready 收口审计”，同时保留禁止 `exploit.py`、真实画像采集、真实投递、凭据收集、模板生成和第三方平台连接的边界。

## 5. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 仅因局部测试通过就标记 ready | 可能漏掉文档、安全边界或入口一致性缺口 | 按主计划完成标准和 case-study ready 例外标准逐项审计 |
| 将只读验证误解为攻击脚本 | 可能破坏社会工程学 case-study 边界 | `variants[].supportsAutomation` 保持 `false`，脚本文档明确 `verify.ts` 不是投递器、画像采集器、模板生成器或攻击脚本 |
| 文档弱化固定案例边界 | 可能被误解为对外攻击指导 | 所有场景文档继续强调固定虚构案例、固定线索卡、固定 key 和禁止真实投递 |
| 事件日志保存真实业务材料 | 违反统一日志安全摘要规则 | 继续只记录固定 key、风险类别、建议动作、决策和学习信号 |
| ready 文案不解释安全边界 | 后续扩展可能错误加入攻击能力 | 在 `safeBoundaries`、`notes`、README、手动验证和脚本说明中同步 ready 边界 |

## 6. 优化方案

- 通过 ready 收口审计把完成标准逐项固化到元数据、只读脚本和文档中。
- 让只读验证脚本从 `in-progress` 断言切换为 `ready` 断言，防止后续状态和验证逻辑脱节。
- 在主进度、下一波规划和场景文档中同步 ready 证据，减少后续继续任务时的歧义。
- 保留后续扩展口径：若未来要加入更多社会工程学案例、跨案例复盘、持久化学习记录或新的验证方式，必须另写执行文档并重新评估安全边界。

## 7. 验证方式

本轮最小必要验证：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/social/spear-phishing/verify.ts`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/testing e2e -- --grep "鱼叉式钓鱼"`
- `pnpm --filter @network-safe/testing test`
- `pnpm --filter @network-safe/web exec vitest run tests/spear-phishing-api.test.ts tests/spear-phishing-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/server test -- tests/spear-phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- `Test-Path tools/lab-scripts/social/spear-phishing/exploit.py`
- 鱼叉式钓鱼安全关键词扫描，确认未新增真实邮件发送、短信 / 社交投递、画像采集、凭据收集、可投递模板生成、第三方平台调用、收件箱连接或攻击脚本实现。

本轮实际验证结果：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/social/spear-phishing/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，34 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/spear-phishing-api.test.ts tests/spear-phishing-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/spear-phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，209 项通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/testing e2e -- --grep "鱼叉式钓鱼"` 通过，1 项 Playwright 测试通过。
- `git diff --check` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `Test-Path tools/lab-scripts/social/spear-phishing/exploit.py` 返回 `False`。
- 鱼叉式钓鱼实现文件安全关键词窄扫描命中均为 `verify.ts` 内的禁止项检测片段和反向断言；脚本目录仅包含 `README.md` 与 `verify.ts`，未发现真实投递、画像采集、凭据收集、模板生成、第三方平台调用或攻击脚本实现。

## 8. 完成条件

- 主计划完成标准对 `social/spear-phishing` 均有明确证据。
- `labs/social/spear-phishing/meta.json` 状态更新为 `ready`，并说明 ready 只代表本项目内固定案例学习闭环完成。
- 只读验证脚本校验 ready 状态并输出 `ok: true`。
- 共享元数据测试、服务端索引测试、场景文档、脚本目录说明、主进度和下一波规划均同步 ready 状态。
- `variants[].supportsAutomation` 仍为 `false`。
- 最小必要验证通过后再汇报。

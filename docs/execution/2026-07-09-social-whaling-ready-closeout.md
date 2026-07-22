# 捕鲸攻击 case-study ready 收口执行文档

## 1. 目标

本轮目标是在 `social/whaling` 已完成固定案例文档、后端受控 `review` API、前端固定案例工作台、Playwright 页面差异验证和本机只读一致性验证之后，按主计划完成标准和 case-study ready 例外标准做收口审计。

若审计证据完整，则将 `labs/social/whaling/meta.json` 从 `in-progress` 推进到 `ready`，并同步只读验证脚本、共享元数据测试、服务端索引测试、场景文档、主进度和下一波实验规划。

本轮同时修复一处历史不同步：只读一致性验证切片此前已建立 `tools/lab-scripts/social/whaling/verify.ts` 并在元数据登记 `whaling-verify` 脚本入口和 `scriptVerification` 证据，但共享元数据测试仍断言 `entrypoints.scripts` 为空数组，导致该测试与实际元数据不一致。本轮一并补齐共享测试断言。

本轮仍不创建 `exploit.py`，不提供真实邮件、短信、消息、会议邀请或链接投递，不采集真实高管、董事会成员、外部顾问、供应商、客户、姓名、邮箱、手机号、公司、部门、职位、汇报关系、组织结构、社交账号或公开资料，不收集真实凭据、验证码、Cookie、token、付款信息、附件、法务材料、董事会材料、并购材料或业务材料，不连接第三方邮件、短信、社交平台、CRM、HR、IM、企业通讯录、会议系统、日程系统、投递服务、收件箱服务或支付系统，不生成可投递标题库、正文模板库、IM 话术库、会议邀请模板、附件诱导文案、付款指令、跟踪链接、群发脚本或攻击脚本。

## 2. 范围

本轮新增：

- `docs/execution/2026-07-09-social-whaling-ready-closeout.md`

本轮同步：

- `labs/social/whaling/meta.json`
- `tools/lab-scripts/social/whaling/verify.ts`
- `packages/shared/tests/lab-metadata.test.mjs`
- `apps/server/tests/health.test.ts`
- `apps/server/tests/lab-registry.test.ts`
- `labs/social/whaling/README.md`
- `labs/social/whaling/vuln/README.md`
- `labs/social/whaling/fixed/README.md`
- `labs/social/whaling/mock/README.md`
- `labs/social/whaling/docs/fixed-cases.md`
- `labs/social/whaling/docs/manual-verification.md`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`

## 3. 操作步骤

1. 对照主计划完成标准审计捕鲸攻击当前证据。
2. 确认漏洞版可运行：前端高权威误判观察版页面、后端 `vuln/review` 和服务端 API 测试覆盖固定高层决策案例的错误放行倾向。
3. 确认修复版可运行：前端高风险流程核验复盘版页面、后端 `fixed/review` 和服务端 API 测试覆盖可信通道回拨、大额付款双人复核、法务与董事会固定通道、资料室最小授权、例外冻结和阻断结果。
4. 确认攻击方观察路径清晰：文档和页面只展示固定虚构高层决策案例、固定线索卡、固定风险标签和固定学习信号，不提供可投递素材。
5. 确认防御方阻断路径清晰：文档和页面展示可信通道回拨、双人复核、法务核验、董事会固定通道、最小授权、例外冻结和日志复盘。
6. 确认后端统一事件日志只记录固定 key、风险类别、建议动作、后端决策和学习信号，不保存真实人员、邮箱、手机号、组织结构、链接、附件、凭据、token、付款信息、法务材料、董事会材料、并购材料或正文。
7. 确认元数据入口、文档入口、web 入口、api 入口、scripts 入口和自动化证据一致。
8. 确认只读验证脚本能校验 `ready` 状态、case-study ready 边界、Playwright 页面差异验证、服务端 API 测试和只读脚本证据。
9. 确认 `variants[].supportsAutomation` 继续保持 `false`，避免把 Playwright、API 测试或只读脚本误标为攻击脚本自动化。
10. 补齐共享元数据测试对 `whaling-verify` 脚本入口和 `scriptVerification` 证据的断言，修复历史不同步。
11. 更新元数据状态为 `ready`，并补充 ready 状态边界说明。
12. 同步文档、共享测试、服务端索引测试和主进度记录。
13. 运行最小必要验证并记录结果。

## 4. 实施建议

- 只把 `ready` 理解为本项目内固定案例学习闭环完成，不代表具备真实捕鲸攻击投递、高管画像采集、组织结构收集、凭据收集、模板生成、第三方平台连接、付款指令或攻击自动化能力。
- `entrypoints.scripts` 继续只登记 `verify.ts`，该脚本只读仓库文件，不发起 HTTP 请求，不读取 `.env`，不连接邮件、短信、社交、CRM、HR、IM、企业通讯录、会议、日程、支付、投递或收件箱服务。
- `verification.automation` 保留三类证据：Playwright 页面差异验证、服务端 API 测试和本机只读一致性验证。
- 共享元数据测试应断言 `status: "ready"`、只读脚本入口、三类自动化证据、安全边界和 `notes` 中的 ready 收口说明。
- 文档中把“后续若进入 ready 收口”改为“已完成 case-study ready 收口”，同时保留禁止 `exploit.py`、真实高管画像采集、真实投递、凭据收集、模板生成、第三方平台连接和付款指令的边界。

## 5. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 仅因局部测试通过就标记 ready | 可能漏掉文档、安全边界或入口一致性缺口 | 按主计划完成标准和 case-study ready 例外标准逐项审计 |
| 将只读验证误解为攻击脚本 | 可能破坏社会工程学 case-study 边界 | `variants[].supportsAutomation` 保持 `false`，脚本文档明确 `verify.ts` 不是投递器、画像采集器、模板生成器或攻击脚本 |
| 文档弱化固定案例边界 | 可能被误解为对外攻击指导 | 所有场景文档继续强调固定虚构高层决策案例、固定线索卡、固定 key 和禁止真实投递 |
| 事件日志保存真实业务材料 | 违反统一日志安全摘要规则 | 继续只记录固定 key、风险类别、建议动作、决策和学习信号 |
| 元数据与共享测试再次脱节 | CI 可能长期红或误判进度 | 本轮补齐共享测试断言，并让只读脚本从 `in-progress` 断言切换为 `ready` 断言 |

## 6. 优化方案

- 通过 ready 收口审计把完成标准逐项固化到元数据、只读脚本和文档中。
- 让只读验证脚本从 `in-progress` 断言切换为 `ready` 断言，防止后续状态和验证逻辑脱节。
- 修复共享元数据测试与实际 `entrypoints.scripts` / `scriptVerification` 的历史不同步。
- 在主进度和场景文档中同步 ready 证据，减少后续继续任务时的歧义。
- 保留后续扩展口径：若未来要加入更多社会工程学案例、跨案例复盘、持久化学习记录或新的验证方式，必须另写执行文档并重新评估安全边界。

## 7. 验证方式

本轮最小必要验证：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/social/whaling/verify.ts`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/testing e2e -- --grep "捕鲸攻击"`
- `pnpm --filter @network-safe/testing test`
- `pnpm --filter @network-safe/web exec vitest run tests/whaling-api.test.ts tests/whaling-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/server test -- tests/whaling-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check`
- `Test-Path tools/lab-scripts/social/whaling/exploit.py`
- 捕鲸攻击安全关键词扫描，确认未新增真实投递、高管画像采集、组织结构收集、凭据收集、可投递模板生成、第三方平台调用、会议邀请、付款指令或攻击脚本实现。

本轮实际验证结果见 `docs/execution/security-lab-master-goal.md` 顶部“捕鲸攻击 case-study ready 收口”条目的验证记录。

## 8. 完成条件

- 主计划完成标准对 `social/whaling` 均有明确证据。
- `labs/social/whaling/meta.json` 状态更新为 `ready`，并说明 ready 只代表本项目内固定案例学习闭环完成。
- 只读验证脚本校验 ready 状态并输出 `ok: true`。
- 共享元数据测试、服务端索引测试、场景文档和主进度均同步 ready 状态。
- `variants[].supportsAutomation` 仍为 `false`。
- 最小必要验证通过后再汇报。

# 网络钓鱼识别 case-study ready 收口执行文档

## 1. 目标

本轮目标是在 `social/phishing` 已完成后端固定案例 `review` API、前端仿真收件箱工作台和本机只读一致性验证脚本之后，按主计划完成标准和 case-study ready 例外标准做收口审计。

若审计证据完整，则将 `labs/social/phishing/meta.json` 从 `in-progress` 推进到 `ready`，并同步只读验证脚本、共享元数据测试、场景文档、主进度和下一波实验规划。

本轮仍不创建 `exploit.py`，不提供真实邮件、短信、消息或链接投递，不收集真实邮箱、凭据、验证码、Cookie 或 token，不连接第三方邮件、短信、社交、投递或收件箱服务，不生成可投递邮件模板包、标题库、正文模板库、群发脚本或攻击脚本。

## 2. 范围

本轮新增：

- `docs/execution/2026-07-02-social-phishing-ready-closeout.md`

本轮可能同步：

- `labs/social/phishing/meta.json`
- `tools/lab-scripts/social/phishing/verify.ts`
- `packages/shared/tests/lab-metadata.test.mjs`
- `labs/social/phishing/README.md`
- `labs/social/phishing/vuln/README.md`
- `labs/social/phishing/fixed/README.md`
- `labs/social/phishing/docs/attack-steps.md`
- `labs/social/phishing/docs/fix-notes.md`
- `labs/social/phishing/docs/manual-verification.md`
- `tools/lab-scripts/social/phishing/README.md`
- `docs/design/next-wave-security-labs.md`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`

## 3. 操作步骤

1. 对照主计划完成标准审计网络钓鱼识别当前证据。
2. 确认漏洞版可运行：前端误判观察版页面、后端 `vuln/review` 和服务端 API 测试均覆盖固定风险案例的错误放行倾向。
3. 确认修复版可运行：前端识别复盘版页面、后端 `fixed/review` 和服务端 API 测试均覆盖阻断、举报、隔离、二次确认和安全消息放行。
4. 确认攻击方观察路径清晰：文档和页面只展示固定线索卡、固定观察模式和固定学习信号，不提供可投递素材。
5. 确认防御方阻断路径清晰：文档和页面展示相似域名核验、凭据请求识别、附件隔离、举报流程和安全通道二次确认。
6. 确认后端统一事件日志只记录固定 key、风险标签、建议动作和学习信号，不保存完整邮件正文、真实邮箱、真实链接、真实附件、凭据、验证码、Cookie 或 token。
7. 确认元数据入口、文档入口、web 入口、api 入口、scripts 入口和自动化证据一致。
8. 确认只读验证脚本能校验 `ready` 状态和安全边界。
9. 明确本轮不补 Playwright 页面验证；ready 依据 case-study 例外标准中的两类自动化证据：服务端 API 差异测试和只读一致性验证脚本。
10. 若以上证据完整，则更新元数据状态为 `ready`，并补充 ready 状态边界说明。
11. 同步文档、共享测试、规划和主进度记录。
12. 运行最小必要验证并记录结果。

## 4. 实施建议

- 只把 `ready` 理解为本项目内固定案例学习闭环完成，不代表具备真实网络钓鱼投递、凭据收集或攻击自动化能力。
- `entrypoints.scripts` 继续只登记 `verify.ts`，该脚本只读仓库文件，不发起 HTTP 请求，不读取 `.env`，不连接邮件、短信、社交、投递或收件箱服务。
- `variants[].supportsAutomation` 必须继续保持 `false`，避免把 API 测试或只读脚本误标为攻击脚本自动化。
- 共享元数据测试应断言 `status: "ready"`、只读脚本入口、API 测试和只读脚本两类自动化证据、安全边界和 `notes` 中的 ready 收口说明。
- 文档中需要把“下一步 ready 收口审计”改为“已完成 ready 收口审计”，同时保留禁止 `exploit.py`、真实投递、凭据收集、模板生成和第三方平台连接的边界。

## 5. 潜在风险

- 如果只因测试通过就标记 `ready`，可能漏掉文档、安全边界或入口一致性缺口。
- 如果把只读脚本误写成请求脚本，会让网络钓鱼实验变成投递验证器或第三方服务探测器。
- 如果文档只强调攻击方视角而弱化固定案例边界，可能被误解为对外攻击指导。
- 如果日志保存完整邮件正文、真实邮箱、真实链接、凭据、验证码、Cookie 或 token，会违背平台日志安全摘要规则。
- 如果 `ready` 文案未解释安全边界，后续扩展时可能错误加入投递脚本、模板生成器或真实收件箱连接。

## 6. 优化方案

- 通过 ready 收口审计把完成标准逐项固化到文档和元数据中。
- 让只读验证脚本从 `in-progress` 断言切换为 `ready` 断言，防止后续状态和验证逻辑脱节。
- 在主进度、下一波规划和场景文档中同步 ready 证据，减少后续继续任务时的歧义。
- 保留后续扩展口径：若未来要加入页面级 Playwright、更多社会工程学案例或新的验证方式，必须另写执行文档并重新评估安全边界。

## 7. 验证方式

本轮最小必要验证：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/social/phishing/verify.ts`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/web exec vitest run tests/phishing-api.test.ts tests/phishing-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/server test -- tests/phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- 网络钓鱼安全关键词扫描，确认未新增真实邮件发送、短信 / 社交投递、凭据收集、可投递模板生成、第三方平台调用、收件箱连接或攻击脚本实现。

本轮实际验证结果：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/social/phishing/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，31 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/phishing-api.test.ts tests/phishing-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过，实际执行服务端测试 186 项通过。
- `git diff --check -- <本轮目标文件>` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 网络钓鱼实现文件窄扫描未发现邮件发送库、第三方投递平台、外部 URL、任意正文输入或凭据收集字段；宽扫描仅命中禁止性说明、测试反向断言、只读脚本检查片段和既有非 phishing 认证字段。

## 8. 本轮完成条件

- 主计划完成标准对 `social/phishing` 均有明确证据。
- `labs/social/phishing/meta.json` 状态更新为 `ready`，并说明 ready 只代表本项目内固定案例学习闭环完成。
- 只读验证脚本校验 ready 状态并输出 `ok: true`。
- 共享元数据测试、场景文档、脚本目录说明、主进度和下一波规划均同步 ready 状态。
- 最小必要验证通过后再提交。

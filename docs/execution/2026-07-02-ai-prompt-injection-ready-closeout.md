# Prompt 注入 ready 收口执行文档

## 1. 目标

本轮目标是在 `ai/prompt-injection` 已完成后端确定性路由 API、前端固定样例工作台、Playwright 页面级验证和本机只读一致性验证脚本之后，按主计划完成标准做 ready 收口审计。

若审计证据完整，则将 `labs/ai/prompt-injection/meta.json` 从 `in-progress` 推进到 `ready`，并同步只读验证脚本、共享元数据测试、场景文档、主进度和下一波实验规划。

本轮仍不创建 `exploit.py`，不提供任意提示词输入框，不调用外部 AI、云模型、本地大模型、第三方推理接口或真实工具，不生成可复用绕过模板，也不保存完整提示词、模型输出、Cookie、token 或凭据。

## 2. 范围

本轮新增：

- `docs/execution/2026-07-02-ai-prompt-injection-ready-closeout.md`

本轮可能同步：

- `labs/ai/prompt-injection/meta.json`
- `tools/lab-scripts/ai/prompt-injection/verify.ts`
- `packages/shared/tests/lab-metadata.test.mjs`
- `labs/ai/prompt-injection/README.md`
- `labs/ai/prompt-injection/vuln/README.md`
- `labs/ai/prompt-injection/fixed/README.md`
- `labs/ai/prompt-injection/docs/attack-steps.md`
- `labs/ai/prompt-injection/docs/fix-notes.md`
- `labs/ai/prompt-injection/docs/manual-verification.md`
- `tools/lab-scripts/ai/prompt-injection/README.md`
- `docs/design/next-wave-security-labs.md`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`

## 3. 操作步骤

1. 对照主计划完成标准审计 Prompt 注入当前证据。
2. 确认漏洞版可运行：前端漏洞版页面、后端 `vuln/evaluate`、服务端测试和 Playwright 均覆盖固定风险样例。
3. 确认修复版可运行：前端修复版页面、后端 `fixed/evaluate`、服务端测试和 Playwright 均覆盖阻断样例与安全问答样例。
4. 确认攻击方观察路径清晰：文档和页面展示固定外部内容、检索污染、工具请求越界等学习信号。
5. 确认防御方阻断路径清晰：文档和页面展示指令分层、检索隔离、工具允许列表和输出策略校验。
6. 确认后端统一事件日志只记录安全摘要，不保存完整提示词、完整检索片段、真实模型输出、Cookie、token 或凭据。
7. 确认元数据入口、文档入口、web 入口、api 入口、scripts 入口和自动化证据一致。
8. 确认只读验证脚本能校验 `ready` 状态和安全边界。
9. 若以上证据完整，则更新元数据状态为 `ready`，并补充 ready 状态边界说明。
10. 同步文档、共享测试、规划和主进度记录。
11. 运行最小必要验证并记录结果。

## 4. 实施建议

- 只把 `ready` 理解为本项目内固定样例学习闭环完成，不代表具备真实 AI 攻击能力。
- `entrypoints.scripts` 继续只登记 `verify.ts`，该脚本只读仓库文件，不发起 HTTP 请求，不读取 `.env`，不执行模型或工具。
- `variants[].supportsAutomation` 继续表示页面 / API / 只读验证覆盖，不表示攻击脚本自动化。
- 共享元数据测试应断言 `status: "ready"`、只读脚本入口、自动化证据、安全边界和 `notes` 中的 ready 收口说明。
- 文档中需要把“下一步 ready 收口审计”改为“已完成 ready 收口审计”，同时保留禁止 `exploit.py`、外部 AI 和任意提示词执行器的边界。

## 5. 潜在风险

- 如果只因测试通过就标记 `ready`，可能漏掉文档、安全边界或入口一致性缺口。
- 如果把只读脚本误写成请求脚本，会让 Prompt 注入实验变成执行器或测试器。
- 如果文档只强调攻击方视角而弱化固定样例边界，可能被误解为对外攻击指导。
- 如果日志保存完整提示词、模型输出、token 或凭据，会违背平台日志安全摘要规则。
- 如果 `ready` 文案未解释安全边界，后续扩展时可能错误加入外部 AI 或真实工具调用。

## 6. 优化方案

- 通过 ready 收口审计把完成标准逐项固化到文档和元数据中。
- 让只读验证脚本从 `in-progress` 断言切换为 `ready` 断言，防止后续状态和验证逻辑脱节。
- 在主进度、下一波规划和场景文档中同步 ready 证据，减少后续继续任务时的歧义。
- 保留后续扩展口径：若未来要加入新的 AI 安全实验或更复杂 Prompt 注入案例，必须另写执行文档并重新评估安全边界。

## 7. 验证方式

本轮最小必要验证：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/ai/prompt-injection/verify.ts`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/testing test`
- `pnpm --filter @network-safe/web exec vitest run tests/prompt-injection-api.test.ts tests/prompt-injection-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/server test -- tests/prompt-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `pnpm --filter @network-safe/testing e2e -- --grep "Prompt 注入"`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- Prompt 注入安全关键词扫描，确认未新增外部 AI 调用、任意提示词输入器、可复用绕过模板、真实工具执行或攻击脚本实现。

## 8. 本轮完成条件

- 主计划完成标准对 `ai/prompt-injection` 均有明确证据。
- `labs/ai/prompt-injection/meta.json` 状态更新为 `ready`，并说明 ready 只代表本项目内固定样例学习闭环完成。
- 只读验证脚本校验 ready 状态并输出 `ok: true`。
- 共享元数据测试、场景文档、脚本目录说明、主进度和下一波规划均同步 ready 状态。
- 最小必要验证通过后再提交。

# Prompt 注入只读一致性验证执行文档

## 1. 目标

本轮目标是在 `ai/prompt-injection` 已具备后端确定性路由 API、前端固定样例工作台和 Playwright 页面差异验证的基础上，补齐本机只读一致性验证脚本。

该脚本只读取仓库内元数据、文档和受控实现文件，用于确认 Prompt 注入实验的入口、自动化证据、固定 key 边界和禁止能力保持一致。本轮不创建 `exploit.py`，不调用外部 AI，不调用真实工具，不接收任意提示词正文，也不将实验标记为 `ready`。

## 2. 范围

本轮新增：

- `tools/lab-scripts/ai/prompt-injection/verify.ts`
- `docs/execution/2026-07-02-ai-prompt-injection-readonly-verification.md`

本轮同步：

- `tools/lab-scripts/ai/prompt-injection/README.md`
- `labs/ai/prompt-injection/meta.json`
- `labs/ai/prompt-injection/README.md`
- `labs/ai/prompt-injection/docs/manual-verification.md`
- `packages/shared/tests/lab-metadata.test.mjs`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

## 3. 操作步骤

1. 新增 `verify.ts`，读取 `labs/ai/prompt-injection/meta.json` 并调用共享元数据解析与校验函数。
2. 校验元数据保持 `ai.prompt-injection` / `interactive` / `in-progress`。
3. 校验 web 入口只包含漏洞版和修复版 Prompt 注入工作台。
4. 校验 API 入口只包含漏洞版和修复版 `evaluate` 接口。
5. 校验 scripts 入口只登记 `prompt-injection-verify` 这一只读一致性验证脚本。
6. 校验自动化证据包含 Playwright 页面验证、服务端 API 测试和只读脚本验证。
7. 校验标准文档和脚本说明存在，并持续声明固定样例、固定 key、无外部 AI、无真实工具、无任意提示词输入和无 `exploit.py` 边界。
8. 扫描 Prompt 注入相关实现文件，确认没有引入外部 AI SDK、模型 endpoint、API key、真实工具执行、命令执行、任意提示词输入框或脚本攻击入口。
9. 更新元数据、共享测试和场景文档。
10. 运行最小必要验证与安全扫描。

## 4. 实施建议

- 复用 `tools/lab-scripts/network/dns-hijack/verify.ts` 的报告结构和只读检查方式。
- 脚本输出 JSON 报告，失败时设置 `process.exitCode = 1`，便于后续人工和 CI 复用。
- 脚本只读取仓库内固定文件，不发起 HTTP 请求，不读取 `.env`，不调用模型服务，不执行真实工具。
- `entrypoints.scripts` 只登记 `verify.ts`，仍不得创建 `exploit.py` 或攻击脚本。
- `variants[].supportsAutomation` 继续表示页面 / API / 只读验证覆盖，不表示攻击脚本自动化。

## 5. 潜在风险

- 如果脚本发起 API 请求或模型请求，会被误解为 Prompt 注入执行器，突破当前固定样例边界。
- 如果脚本接收任意提示词、URL、模型名、API key、工具参数或外部目标，会把只读验证变成危险入口。
- 如果元数据提前标记 `ready`，会跳过最终完成标准审计。
- 如果只校验文档存在而不校验实现片段，无法发现后续误加外部 AI、真实工具或任意输入能力。
- 如果 scripts 入口登记多个脚本，后续自动化可能误认为存在攻击脚本或外部模型验证脚本。

## 6. 优化方案

- 本轮只补齐只读一致性验证，保持 `status: "in-progress"`。
- 脚本同时检查元数据、文档、前端、后端和 Playwright 文件，形成跨层一致性证据。
- 后续 ready 收口审计可以复用该脚本作为自动化证据之一，但不得仅因脚本存在就标记完成。

## 7. 验证方式

本轮最小必要验证：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/ai/prompt-injection/verify.ts`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/testing test`
- `pnpm --filter @network-safe/web exec vitest run tests/prompt-injection-api.test.ts tests/prompt-injection-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/server test -- tests/prompt-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- Prompt 注入安全关键词扫描，确认未新增外部 AI 调用、任意提示词输入器、危险提示词正文、可复用绕过模板、真实工具执行或攻击脚本实现。

## 8. 本轮完成条件

- 只读验证脚本能输出 `ok: true`。
- 元数据登记 `prompt-injection-verify` 只读脚本入口和 `scriptVerification` 自动化证据。
- 场景文档说明当前已有只读一致性验证脚本，但仍不提供 `exploit.py`、外部 AI、真实工具或任意提示词执行器。
- 共享元数据测试覆盖 Prompt 注入脚本入口和自动化证据。
- 主进度文档和下一波实验规划同步到只读验证状态。
- 最小必要验证通过后再提交。

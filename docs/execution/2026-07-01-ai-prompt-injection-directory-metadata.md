# Prompt 注入目录与 planned 元数据执行文档

## 1. 目标

本轮目标是在 `docs/execution/2026-07-01-ai-prompt-injection-lab.md` 的约束下，建立 `ai/prompt-injection` 的标准实验目录、`planned` 元数据和基础文档入口。

本轮只建立文档和元数据入口，不实现页面、API、数据库迁移、事件日志写入、模型调用、工具调用或 Prompt 注入攻击脚本。

## 2. 范围

本轮新增：

- `labs/ai/prompt-injection/meta.json`
- `labs/ai/prompt-injection/README.md`
- `labs/ai/prompt-injection/vuln/README.md`
- `labs/ai/prompt-injection/fixed/README.md`
- `labs/ai/prompt-injection/mock/README.md`
- `labs/ai/prompt-injection/docs/attack-steps.md`
- `labs/ai/prompt-injection/docs/fix-notes.md`
- `labs/ai/prompt-injection/docs/manual-verification.md`
- `tools/lab-scripts/ai/prompt-injection/README.md`

本轮同步：

- `packages/shared/tests/lab-metadata.test.mjs`
- `apps/server/tests/health.test.ts`
- `apps/server/tests/lab-registry.test.ts`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

## 3. 实施建议

- 元数据状态保持 `planned`。
- 模式使用 `interactive`，表示后续目标是引导式固定样例交互，而不是当前已有运行时入口。
- `entrypoints.docs` 登记真实文档入口。
- `entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 保持空数组。
- `verification.automation.supported` 保持 `false`。
- `variants[].supportsAutomation` 保持 `false`。
- 文档必须明确当前不调用外部 AI，不创建任意提示词执行器，不保存完整提示词，不提供 `exploit.py`。

## 4. 潜在风险

- 如果登记未实现页面或 API，平台会误以为 Prompt 注入实验已经可运行。
- 如果创建攻击脚本或任意提示词输入器，实验可能变成可复用提示词攻击测试器。
- 如果文档提供完整危险提示词、绕过模板、钓鱼文本、恶意代码或仿冒身份内容，会突破本项目学习边界。
- 如果保存完整系统提示词、用户提示词或检索片段，可能泄露真实业务信息。

## 5. 验证方式

- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check` 目标文件检查。
- 行尾空白检查。
- Prompt 注入安全关键词扫描，确认命中内容只属于禁止性说明、边界约束、历史进度或路径 / 信号名。

## 6. 本轮执行结果

本轮已完成目录与 planned 元数据切片：

- 新增 `labs/ai/prompt-injection/meta.json`，状态为 `planned`，模式为 `interactive`。
- 新增 README、漏洞版说明、修复版说明、mock 说明、攻击步骤、修复说明和手动验证文档。
- 新增 `tools/lab-scripts/ai/prompt-injection/README.md`，当前只说明脚本边界，不提供 `exploit.py` 或 `verify.ts`。
- 元数据当前只登记 docs 入口，`entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 均为空数组。
- `verification.automation.supported` 为 `false`，`variants[].supportsAutomation` 均为 `false`。
- 更新共享元数据测试，确认 Prompt 注入 planned/docs-only 元数据合法。
- 更新服务端 health / registry 测试，本地元数据总数从 21 增加到 22，并确认 `ai.prompt-injection` 为 planned 条目。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，30 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，169 项通过。
- `git diff --check -- <本轮目标文件>` 未发现空白错误，仅有既有 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 未发现目标文件行尾空白。
- Prompt 注入安全关键词扫描仅命中文档中的禁止性说明、历史进度、localhost 测试 URL 或路径 / 信号名，未发现外部 AI 调用、危险提示词正文、可复用绕过模板、真实工具执行或攻击脚本实现。

下一步建议进入 `ai/prompt-injection` 后端确定性路由 API 切片，仍只接受固定 `scenarioKey`、固定 `instructionSourceKey` 和固定 `defensePolicyKey`。

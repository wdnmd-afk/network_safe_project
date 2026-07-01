# Prompt 注入手动验证

## 1. 验证目标

当前验证确认 `in-progress` 阶段的目录、元数据、前端工作台、后端 API 和安全边界一致。

本阶段不验证脚本入口，因为该入口尚未创建。

## 2. 元数据检查

检查 `labs/ai/prompt-injection/meta.json`：

- `id` 为 `ai.prompt-injection`。
- `category` 为 `ai`。
- `subcategory` 为 `prompt-injection`。
- `mode` 为 `interactive`。
- `status` 为 `in-progress`。
- `entrypoints.docs` 登记真实文档入口。
- `entrypoints.web` 只登记：
  - `/labs/ai/prompt-injection/vuln`
  - `/labs/ai/prompt-injection/fixed`
- `entrypoints.api` 只登记：
  - `POST /api/labs/ai/prompt-injection/vuln/evaluate`
  - `POST /api/labs/ai/prompt-injection/fixed/evaluate`
- `entrypoints.scripts` 为空数组。
- `verification.automation.supported` 为 `true`。
- `verification.automation.apiTest.specPath` 为 `apps/server/tests/prompt-injection-lab.test.ts`。
- `variants[].supportsAutomation` 均为 `true`，表示 API 差异验证已覆盖，不表示存在攻击脚本自动化。

## 3. 文档检查

检查以下文档是否存在：

- `labs/ai/prompt-injection/README.md`
- `labs/ai/prompt-injection/vuln/README.md`
- `labs/ai/prompt-injection/fixed/README.md`
- `labs/ai/prompt-injection/mock/README.md`
- `labs/ai/prompt-injection/docs/attack-steps.md`
- `labs/ai/prompt-injection/docs/fix-notes.md`
- `labs/ai/prompt-injection/docs/manual-verification.md`
- `tools/lab-scripts/ai/prompt-injection/README.md`

## 4. 前端工作台检查

检查前端工作台是否只使用固定选择器：

- `apps/web/src/views/PromptInjectionLabView.vue`
- `apps/web/src/api/prompt-injection-lab.ts`
- `apps/web/src/labs/prompt-injection.ts`

页面不得提供任意提示词正文、真实系统提示词、模型配置、工具参数、URL、密钥或外部目标输入框。

## 5. 后端 API 检查

检查服务端实现是否只处理固定 key：

- `apps/server/src/services/prompt-injection-lab.ts`
- `apps/server/tests/prompt-injection-lab.test.ts`
- `apps/server/src/app.ts`

API 请求只允许读取：

- `scenarioKey`
- `instructionSourceKey`
- `defensePolicyKey`

API 不得读取、执行、保存或返回任意提示词正文、真实系统提示词、模型配置、工具参数、URL、密钥或外部目标。

## 6. 安全边界检查

确认文档明确：

- 不调用外部 AI、云模型、本地大模型或第三方推理接口。
- 不创建任意提示词执行器。
- 不提供 `exploit.py`、`verify.ts` 或 Prompt 注入攻击脚本。
- 不生成钓鱼文本、恶意代码、绕过策略、仿冒身份内容或可投递素材。
- 不保存完整用户提示词、完整系统提示词、完整检索片段、真实模型输出、Cookie、token 或凭据。

## 7. 当前预期信号

当前工作台和 API 允许观察以下受控学习信号：

- `prompt-injection-retrieval-poisoning-visible`
- `prompt-injection-tool-request-exposed`
- `prompt-injection-policy-guardrail-applied`
- `prompt-injection-tool-request-blocked`
- `prompt-injection-safe-answer-returned`
- `prompt-injection-sample-blocked`

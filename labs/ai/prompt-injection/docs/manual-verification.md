# Prompt 注入手动验证

## 1. 验证目标

当前验证只确认 `planned` 阶段的目录、元数据和安全边界一致。

本阶段不验证前端页面、后端 API、事件日志或自动化脚本，因为这些入口尚未创建。

## 2. 元数据检查

检查 `labs/ai/prompt-injection/meta.json`：

- `id` 为 `ai.prompt-injection`。
- `category` 为 `ai`。
- `subcategory` 为 `prompt-injection`。
- `mode` 为 `interactive`。
- `status` 为 `planned`。
- `entrypoints.docs` 登记真实文档入口。
- `entrypoints.web` 为空数组。
- `entrypoints.api` 为空数组。
- `entrypoints.scripts` 为空数组。
- `verification.automation.supported` 为 `false`。
- `variants[].supportsAutomation` 均为 `false`。

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

## 4. 安全边界检查

确认文档明确：

- 不调用外部 AI、云模型、本地大模型或第三方推理接口。
- 不创建任意提示词执行器。
- 不提供 `exploit.py` 或 Prompt 注入攻击脚本。
- 不生成钓鱼文本、恶意代码、绕过策略、仿冒身份内容或可投递素材。
- 不保存完整用户提示词、完整系统提示词、完整检索片段、真实模型输出、Cookie、token 或凭据。

## 5. 当前预期信号

当前 planned 阶段只允许文档级验证信号：

- `prompt-injection-planned-boundary-verified`
- `prompt-injection-fixed-samples-reviewed`
- `prompt-injection-no-external-ai-confirmed`

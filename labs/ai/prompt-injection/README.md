# Prompt 注入

## 1. 场景目标

本实验用于学习 Prompt 注入中的指令边界风险，不是真实 AI 攻击工具。

当前首版已使用前端固定样例工作台和后端确定性提示词路由模拟器，帮助学习者观察：

- 攻击方为什么关注系统指令、检索内容、用户意图和工具调用之间的优先级。
- 外部内容如果被错误当成高优先级指令，为什么会让业务目标偏离。
- 防御方如何通过指令分层、检索隔离、工具允许列表、输出策略校验和日志审计降低风险。

## 2. 当前状态

当前状态为 `in-progress`。

当前已包含：

- 元数据入口。
- 基础文档。
- 漏洞版 / 修复版后端 API 说明。
- mock 固定样例说明。
- 攻击方观察步骤。
- 修复说明。
- 手动验证说明。
- 脚本目录边界说明。
- 后端确定性提示词路由 API。
- 前端固定样例观察工作台。
- 前端固定 key 请求体测试。
- Playwright 页面差异验证。
- 服务端 API 差异测试。
- 统一事件日志安全摘要写入。

当前不包含：

- 数据库迁移。
- 只读验证脚本。
- `exploit.py`。
- 外部 AI、模型服务或真实工具调用。

## 3. 安全边界

本实验首版只允许固定场景样例和确定性路由结果。

禁止：

- 调用外部 AI、云模型、本地大模型、第三方推理接口或真实工具。
- 接收任意提示词正文、真实系统提示词、模型配置、工具参数、URL、密钥或外部目标。
- 生成钓鱼文本、恶意代码、绕过策略、仿冒身份内容、可投递攻击素材、完整危险提示词或危险样例库。
- 保存完整用户提示词、完整系统提示词、完整检索片段、真实模型输出、Cookie、token 或凭据。
- 提供 `exploit.py`、Prompt 注入攻击脚本、任意提示词执行器或可复用绕过模板。

## 4. 当前入口

当前登记文档入口：

- 总说明：`labs/ai/prompt-injection/README.md`
- 攻击步骤：`labs/ai/prompt-injection/docs/attack-steps.md`
- 修复说明：`labs/ai/prompt-injection/docs/fix-notes.md`
- 手动验证：`labs/ai/prompt-injection/docs/manual-verification.md`
- 实现执行文档：`docs/execution/2026-07-01-ai-prompt-injection-lab.md`
- 目录与 planned 元数据执行文档：`docs/execution/2026-07-01-ai-prompt-injection-directory-metadata.md`
- 后端 API 执行文档：`docs/execution/2026-07-01-ai-prompt-injection-virtual-router-api.md`
- 前端工作台执行文档：`docs/execution/2026-07-01-ai-prompt-injection-frontend-workbench.md`
- 页面级验证执行文档：`docs/execution/2026-07-02-ai-prompt-injection-playwright-verification.md`

当前登记 API 入口：

- 漏洞版：`POST /api/labs/ai/prompt-injection/vuln/evaluate`
- 修复版：`POST /api/labs/ai/prompt-injection/fixed/evaluate`

当前登记 web 入口：

- 漏洞版：`/labs/ai/prompt-injection/vuln`
- 修复版：`/labs/ai/prompt-injection/fixed`

当前没有 scripts 入口。

## 5. 当前学习信号

后端确定性路由模拟器可返回以下学习信号：

- `prompt-injection-instruction-overridden`
- `prompt-injection-retrieval-poisoning-visible`
- `prompt-injection-tool-request-exposed`
- `prompt-injection-tool-request-blocked`
- `prompt-injection-policy-guardrail-applied`
- `prompt-injection-safe-answer-returned`
- `prompt-injection-boundary-verified`
- `prompt-injection-sample-blocked`

## 6. 下一步

下一步建议补齐只读一致性验证脚本。当前页面只能提交固定 `scenarioKey`、固定 `instructionSourceKey` 和固定 `defensePolicyKey`，仍不得提供任意提示词输入框、外部 AI 调用或脚本入口。

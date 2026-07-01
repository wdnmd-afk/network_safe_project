# Prompt 注入攻击方观察步骤

## 1. 当前状态

当前 `ai/prompt-injection` 处于 `in-progress` 状态，已有后端确定性路由 API、文档和元数据入口。

本阶段不提供前端页面、攻击脚本、模型调用或任意提示词执行器。

## 2. 攻击方观察路径

当前可通过后端 API 观察：

1. 攻击者想让系统偏离原本业务目标。
2. 攻击者会关注外部内容是否被系统错误当成高优先级指令。
3. 漏洞版展示固定样例中指令来源混淆、检索内容未隔离或工具请求越界的学习信号。
4. 学习者只观察固定 `scenarioKey`、固定 `instructionSourceKey` 和固定 `defensePolicyKey` 的结果。
5. 后端日志只记录输入长度、风险类别、命中固定样例和学习信号。
6. 同一固定样例在修复版应被隔离、阻断或转成安全化教学回答。

当前 API 入口：

- `POST /api/labs/ai/prompt-injection/vuln/evaluate`
- `POST /api/labs/ai/prompt-injection/fixed/evaluate`

请求只读取固定 `scenarioKey`、`instructionSourceKey` 和 `defensePolicyKey`。

## 3. 禁止行为

攻击方观察步骤不得：

- 提供完整危险提示词。
- 提供可复制绕过模板。
- 生成钓鱼文本、恶意代码、仿冒身份内容或可投递素材。
- 调用外部 AI、模型服务或真实工具。
- 接收外部目标、真实系统提示词、真实业务文档、URL、密钥或模型配置。
- 保存完整用户提示词、完整系统提示词或完整检索片段。

## 4. 当前手动检查

当前可手动检查文档、元数据和后端 API：

- `meta.json` 是否为 `in-progress`。
- `entrypoints.api` 是否只登记漏洞版 / 修复版 `evaluate` 接口。
- `entrypoints.web`、`entrypoints.scripts` 是否为空数组。
- 文档是否明确不调用外部 AI。
- 文档是否没有完整危险提示词或攻击脚本。

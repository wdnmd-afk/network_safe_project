# Prompt 注入 mock 规划

## 1. mock 目标

后续 mock 数据只用于确定性提示词路由模拟，不用于调用真实 AI。

允许规划的 mock 内容：

- 固定 `scenarioKey`。
- 固定 `instructionSourceKey`。
- 固定 `defensePolicyKey`。
- 固定风险类别。
- 固定学习信号。
- 固定安全化教学回答摘要。

## 2. 禁止内容

mock 目录不得保存：

- 完整危险提示词。
- 真实系统提示词。
- 真实用户提示词。
- 真实业务文档。
- 真实模型输出。
- 钓鱼文本、恶意代码、绕过策略或仿冒身份内容。
- API Key、token、Cookie、密钥、凭据或外部目标。

## 3. 后续数据原则

后续若需要新增固定样例，应优先使用短标签和摘要字段，例如 `instruction-override`、`retrieval-contamination`、`tool-overreach`。不要把危险提示词正文写入仓库。

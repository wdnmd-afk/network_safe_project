<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 对抗性 AI风险观察版

## 目标

观察高风险决策只依赖单一模型输出且没有输入和置信度审查如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-model-evasion-sample`
- 默认 `controlKey`：`model-output-trusted`

## 预期结果

- 决策：`accepted`
- 学习信号：`ai-adversarial-ai-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

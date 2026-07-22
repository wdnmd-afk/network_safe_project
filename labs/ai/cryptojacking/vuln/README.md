<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 加密劫持风险观察版

## 目标

观察运行环境允许未知工作负载长期占用算力且缺少成本基线如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-compute-anomaly`
- 默认 `controlKey`：`resource-governance-missing`

## 预期结果

- 决策：`accepted`
- 学习信号：`ai-cryptojacking-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

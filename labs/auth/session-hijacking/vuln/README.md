<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 会话劫持风险观察版

## 目标

观察会话标识长期有效且没有轮换、设备上下文或高风险动作再验证如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`replayed-session-summary`
- 默认 `controlKey`：`context-binding-missing`

## 预期结果

- 决策：`accepted`
- 学习信号：`auth-session-hijacking-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# Formjacking风险观察版

## 目标

观察敏感页面信任未受约束的第三方脚本和提交目标如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-checkout-target-change`
- 默认 `controlKey`：`form-integrity-missing`

## 预期结果

- 决策：`accepted`
- 学习信号：`client-formjacking-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

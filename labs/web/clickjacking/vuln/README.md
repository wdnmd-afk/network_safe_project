<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 点击劫持风险观察版

## 目标

观察页面允许被任意来源嵌入且敏感动作缺少二次确认如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`embedded-approval-overlay`
- 默认 `controlKey`：`frame-policy-missing`

## 预期结果

- 决策：`accepted`
- 学习信号：`web-clickjacking-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

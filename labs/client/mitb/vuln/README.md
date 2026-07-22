<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 浏览器 MITB风险观察版

## 目标

观察高风险交易确认完全依赖可能被篡改的浏览器上下文如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-transaction-view-mismatch`
- 默认 `controlKey`：`browser-view-trusted`

## 预期结果

- 决策：`accepted`
- 学习信号：`client-mitb-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

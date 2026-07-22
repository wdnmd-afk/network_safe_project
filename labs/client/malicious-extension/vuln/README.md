<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 恶意浏览器插件风险观察版

## 目标

观察浏览器允许扩展自动获得过宽权限且缺少来源审查如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-extension-permission-change`
- 默认 `controlKey`：`extension-review-missing`

## 预期结果

- 决策：`accepted`
- 学习信号：`client-malicious-extension-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

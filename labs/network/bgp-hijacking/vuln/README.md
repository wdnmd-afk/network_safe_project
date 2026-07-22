<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# BGP 劫持风险观察版

## 目标

观察网络接受未经起源授权验证的路由公告如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-origin-change`
- 默认 `controlKey`：`route-origin-validation-missing`

## 预期结果

- 决策：`accepted`
- 学习信号：`network-bgp-hijacking-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

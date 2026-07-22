<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 云安全漏洞风险观察版

## 目标

观察云资源和身份策略默认公开或授予通配权限如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-cloud-policy-exposure`
- 默认 `controlKey`：`cloud-policy-review-missing`

## 预期结果

- 决策：`accepted`
- 学习信号：`infrastructure-cloud-security-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

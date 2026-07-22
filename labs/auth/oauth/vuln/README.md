<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# OAuth 漏洞风险观察版

## 目标

观察授权响应没有与原始客户端、回调地址和请求上下文严格绑定如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`tampered-authorization-response`
- 默认 `controlKey`：`authorization-binding-missing`

## 预期结果

- 决策：`accepted`
- 学习信号：`auth-oauth-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

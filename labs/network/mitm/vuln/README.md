<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 中间人攻击风险观察版

## 目标

观察客户端未验证证书链、主机名或协议降级如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-handshake-interception`
- 默认 `controlKey`：`peer-verification-disabled`

## 预期结果

- 决策：`accepted`
- 学习信号：`network-mitm-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

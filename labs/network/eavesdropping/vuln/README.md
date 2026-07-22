<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 窃听攻击风险观察版

## 目标

观察敏感通信使用明文协议或未验证的加密通道如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-cleartext-session`
- 默认 `controlKey`：`transport-encryption-missing`

## 预期结果

- 决策：`accepted`
- 学习信号：`network-eavesdropping-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 凭据填充风险观察版

## 目标

观察认证只判断单次口令结果且没有设备、速率和泄露凭据风险关联如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`reused-credential-batch`
- 默认 `controlKey`：`risk-correlation-missing`

## 预期结果

- 决策：`accepted`
- 学习信号：`auth-credential-stuffing-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

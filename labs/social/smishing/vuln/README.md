<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 短信钓鱼风险观察版

## 目标

观察接收者只依赖发送者标签和紧迫语境，没有通过可信渠道复核如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-delivery-alert`
- 默认 `controlKey`：`message-context-trusted`

## 预期结果

- 决策：`accepted`
- 学习信号：`social-smishing-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

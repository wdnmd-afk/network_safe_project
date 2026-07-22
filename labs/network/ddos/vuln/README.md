<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# DDoS风险观察版

## 目标

观察入口没有速率、连接和容量保护且缺少降级路径如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-traffic-surge`
- 默认 `controlKey`：`capacity-defense-missing`

## 预期结果

- 决策：`accepted`
- 学习信号：`network-ddos-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 零日漏洞利用风险观察版

## 目标

观察关键资产缺少分层防御、行为检测和快速隔离能力如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-unknown-exploit-signal`
- 默认 `controlKey`：`compensating-control-missing`

## 预期结果

- 决策：`accepted`
- 学习信号：`infrastructure-zero-day-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

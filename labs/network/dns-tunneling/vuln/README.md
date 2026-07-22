<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# DNS 隧道风险观察版

## 目标

观察终端可使用未受控解析出口且异常查询没有被关联分析如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-high-entropy-queries`
- 默认 `controlKey`：`dns-egress-monitoring-missing`

## 预期结果

- 决策：`accepted`
- 学习信号：`network-dns-tunneling-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

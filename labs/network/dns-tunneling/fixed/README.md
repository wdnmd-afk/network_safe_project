<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# DNS 隧道防御复盘版

## 目标

观察验证落实“固定解析器、查询长度与熵检测、出口控制和域名信誉审计”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-high-entropy-queries`
- 默认 `controlKey`：`dns-egress-monitoring-missing`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`network-dns-tunneling-defense-blocked`
- 正常受控信号：`network-dns-tunneling-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

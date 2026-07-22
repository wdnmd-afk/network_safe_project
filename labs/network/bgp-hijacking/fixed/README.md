<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# BGP 劫持防御复盘版

## 目标

观察验证落实“RPKI、ROA、前缀过滤、路由监控和多通道告警”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-origin-change`
- 默认 `controlKey`：`route-origin-validation-missing`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`network-bgp-hijacking-defense-blocked`
- 正常受控信号：`network-bgp-hijacking-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

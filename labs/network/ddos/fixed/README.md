<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# DDoS防御复盘版

## 目标

观察验证落实“分层限流、流量清洗、缓存、弹性容量和服务降级”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-traffic-surge`
- 默认 `controlKey`：`capacity-defense-missing`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`network-ddos-defense-blocked`
- 正常受控信号：`network-ddos-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

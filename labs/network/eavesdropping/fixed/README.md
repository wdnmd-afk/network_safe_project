<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 窃听攻击防御复盘版

## 目标

观察验证落实“端到端加密、证书验证、网络分段和敏感元数据最小化”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-cleartext-session`
- 默认 `controlKey`：`transport-encryption-missing`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`network-eavesdropping-defense-blocked`
- 正常受控信号：`network-eavesdropping-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

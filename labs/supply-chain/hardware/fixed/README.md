<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 硬件供应链防御复盘版

## 目标

观察验证落实“合格供应商、链路证明、固件签名、抽检和资产基线”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-hardware-provenance-gap`
- 默认 `controlKey`：`provenance-review-missing`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`supply-chain-hardware-defense-blocked`
- 正常受控信号：`supply-chain-hardware-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 硬件供应链风险观察版

## 目标

观察采购和上线流程缺少来源、批次和固件完整性验证如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-hardware-provenance-gap`
- 默认 `controlKey`：`provenance-review-missing`

## 预期结果

- 决策：`accepted`
- 学习信号：`supply-chain-hardware-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

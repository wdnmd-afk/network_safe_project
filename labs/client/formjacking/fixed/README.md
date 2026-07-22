<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# Formjacking防御复盘版

## 目标

观察验证落实“CSP、SRI、脚本清单、提交目标校验和敏感字段隔离”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-checkout-target-change`
- 默认 `controlKey`：`form-integrity-missing`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`client-formjacking-defense-blocked`
- 正常受控信号：`client-formjacking-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

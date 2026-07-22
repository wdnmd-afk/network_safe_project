<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 加密劫持防御复盘版

## 目标

观察验证落实“工作负载允许列表、资源配额、运行时检测和成本告警”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-compute-anomaly`
- 默认 `controlKey`：`resource-governance-missing`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`ai-cryptojacking-defense-blocked`
- 正常受控信号：`ai-cryptojacking-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

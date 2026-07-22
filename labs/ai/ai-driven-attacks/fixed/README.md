<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# AI 驱动攻击防御复盘版

## 目标

观察验证落实“工具允许列表、人工审批、速率限制、输出策略和完整审计”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-automated-attack-chain`
- 默认 `controlKey`：`agent-guardrail-missing`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`ai-ai-driven-attacks-defense-blocked`
- 正常受控信号：`ai-ai-driven-attacks-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

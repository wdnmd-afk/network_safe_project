<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 对抗性 AI防御复盘版

## 目标

观察验证落实“输入验证、鲁棒性测试、模型监控、阈值策略和人工复核”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-model-evasion-sample`
- 默认 `controlKey`：`model-output-trusted`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`ai-adversarial-ai-defense-blocked`
- 正常受控信号：`ai-adversarial-ai-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

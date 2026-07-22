<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# AI 驱动攻击风险观察版

## 目标

观察自动化系统拥有过宽工具权限且缺少人工确认和审计如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-automated-attack-chain`
- 默认 `controlKey`：`agent-guardrail-missing`

## 预期结果

- 决策：`accepted`
- 学习信号：`ai-ai-driven-attacks-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

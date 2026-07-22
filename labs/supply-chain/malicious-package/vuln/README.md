<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 恶意包注入风险观察版

## 目标

观察构建流程自动信任依赖更新且没有来源和行为审查如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-package-change`
- 默认 `controlKey`：`package-review-missing`

## 预期结果

- 决策：`accepted`
- 学习信号：`supply-chain-malicious-package-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

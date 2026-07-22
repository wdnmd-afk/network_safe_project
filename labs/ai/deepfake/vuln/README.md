<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# Deepfake风险观察版

## 目标

观察业务流程把声音或画面相似度当成身份认证如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-executive-media-claim`
- 默认 `controlKey`：`media-appearance-trusted`

## 预期结果

- 决策：`accepted`
- 学习信号：`ai-deepfake-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

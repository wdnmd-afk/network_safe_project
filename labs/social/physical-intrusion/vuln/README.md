<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 尾随 / 物理入侵风险观察版

## 目标

观察人员因权威、礼貌或紧急理由绕过逐人验证如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-tailgating-event`
- 默认 `controlKey`：`courtesy-overrides-policy`

## 预期结果

- 决策：`accepted`
- 学习信号：`social-physical-intrusion-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 容器逃逸风险观察版

## 目标

观察容器获得接近宿主的权限、挂载和内核能力如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-container-boundary-gap`
- 默认 `controlKey`：`runtime-policy-missing`

## 预期结果

- 决策：`accepted`
- 学习信号：`infrastructure-container-escape-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

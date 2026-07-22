<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 开放重定向风险观察版

## 目标

观察服务端直接信任跳转目标且没有规范化与允许列表如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`untrusted-return-target`
- 默认 `controlKey`：`target-allowlist-missing`

## 预期结果

- 决策：`accepted`
- 学习信号：`web-open-redirect-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

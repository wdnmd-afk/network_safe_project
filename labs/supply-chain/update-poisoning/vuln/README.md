<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 更新投毒风险观察版

## 目标

观察客户端只依据版本号或下载地址接受更新如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-update-manifest-change`
- 默认 `controlKey`：`update-trust-unverified`

## 预期结果

- 决策：`accepted`
- 学习信号：`supply-chain-update-poisoning-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

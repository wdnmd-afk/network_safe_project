<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 商业邮件诈骗风险观察版

## 目标

观察财务流程把邮件线程当成账户变更的唯一可信来源如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-vendor-bank-change`
- 默认 `controlKey`：`email-thread-trusted`

## 预期结果

- 决策：`accepted`
- 学习信号：`social-bec-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

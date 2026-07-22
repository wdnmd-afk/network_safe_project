<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 商业邮件诈骗防御复盘版

## 目标

观察验证落实“供应商主数据双人复核、可信电话回拨、付款冻结和异常告警”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-vendor-bank-change`
- 默认 `controlKey`：`email-thread-trusted`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`social-bec-defense-blocked`
- 正常受控信号：`social-bec-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

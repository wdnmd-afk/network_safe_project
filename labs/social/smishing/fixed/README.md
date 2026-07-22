<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 短信钓鱼防御复盘版

## 目标

观察验证落实“官方渠道回查、短链接隔离、设备侧过滤和举报流程”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-delivery-alert`
- 默认 `controlKey`：`message-context-trusted`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`social-smishing-defense-blocked`
- 正常受控信号：`social-smishing-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

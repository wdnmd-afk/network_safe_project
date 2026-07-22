<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 凭据填充防御复盘版

## 目标

观察验证落实“速率限制、泄露凭据检测、自适应验证和异常登录告警”后的正常受控流程。

## 固定输入

- `scenarioKey`：`reused-credential-batch`
- 默认 `controlKey`：`risk-correlation-missing`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`auth-credential-stuffing-defense-blocked`
- 正常受控信号：`auth-credential-stuffing-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

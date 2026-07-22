<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 会话劫持防御复盘版

## 目标

观察验证落实“安全 Cookie、会话轮换、上下文校验和高风险动作再认证”后的正常受控流程。

## 固定输入

- `scenarioKey`：`replayed-session-summary`
- 默认 `controlKey`：`context-binding-missing`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`auth-session-hijacking-defense-blocked`
- 正常受控信号：`auth-session-hijacking-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

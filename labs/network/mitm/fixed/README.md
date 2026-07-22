<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 中间人攻击防御复盘版

## 目标

观察验证落实“TLS 身份校验、安全协议基线、证书监控和敏感通道绑定”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-handshake-interception`
- 默认 `controlKey`：`peer-verification-disabled`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`network-mitm-defense-blocked`
- 正常受控信号：`network-mitm-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

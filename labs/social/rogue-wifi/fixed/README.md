<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 钓鱼 WiFi防御复盘版

## 目标

观察验证落实“受管无线配置、证书校验、自动连接限制和 VPN”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-evil-twin-network`
- 默认 `controlKey`：`ssid-name-trusted`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`social-rogue-wifi-defense-blocked`
- 正常受控信号：`social-rogue-wifi-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 钓鱼 WiFi风险观察版

## 目标

观察用户和设备仅依赖 SSID 名称判断网络身份如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-evil-twin-network`
- 默认 `controlKey`：`ssid-name-trusted`

## 预期结果

- 决策：`accepted`
- 学习信号：`social-rogue-wifi-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

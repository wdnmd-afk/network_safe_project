<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# ARP 欺骗风险观察版

## 目标

观察二层网络直接接受未经验证的地址映射更新如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`virtual-arp-binding-change`
- 默认 `controlKey`：`arp-trust-missing`

## 预期结果

- 决策：`accepted`
- 学习信号：`network-arp-spoofing-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# ARP 欺骗防御复盘版

## 目标

观察验证落实“DHCP Snooping、动态 ARP 检测、静态关键绑定和网络分段”后的正常受控流程。

## 固定输入

- `scenarioKey`：`virtual-arp-binding-change`
- 默认 `controlKey`：`arp-trust-missing`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`network-arp-spoofing-defense-blocked`
- 正常受控信号：`network-arp-spoofing-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。

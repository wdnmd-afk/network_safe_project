<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# ARP 欺骗手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `virtual-arp-binding-change` | `arp-trust-missing` | `accepted` | `network-arp-spoofing-risk-accepted` |
| 修复版高风险 | `virtual-arp-binding-change` | `arp-trust-missing` | `blocked` | `network-arp-spoofing-defense-blocked` |
| 修复版正常流程 | `virtual-arp-binding-change` | `dai-binding-verified` | `accepted` | `network-arp-spoofing-normal-verified` |
| 未知案例 | `unknown-scenario` | `arp-trust-missing` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。

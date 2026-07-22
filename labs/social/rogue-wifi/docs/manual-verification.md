<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 钓鱼 WiFi手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `synthetic-evil-twin-network` | `ssid-name-trusted` | `accepted` | `social-rogue-wifi-risk-accepted` |
| 修复版高风险 | `synthetic-evil-twin-network` | `ssid-name-trusted` | `blocked` | `social-rogue-wifi-defense-blocked` |
| 修复版正常流程 | `synthetic-evil-twin-network` | `managed-network-verified` | `accepted` | `social-rogue-wifi-normal-verified` |
| 未知案例 | `unknown-scenario` | `ssid-name-trusted` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。

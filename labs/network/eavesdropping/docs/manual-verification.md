<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 窃听攻击手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `synthetic-cleartext-session` | `transport-encryption-missing` | `accepted` | `network-eavesdropping-risk-accepted` |
| 修复版高风险 | `synthetic-cleartext-session` | `transport-encryption-missing` | `blocked` | `network-eavesdropping-defense-blocked` |
| 修复版正常流程 | `synthetic-cleartext-session` | `encrypted-channel-verified` | `accepted` | `network-eavesdropping-normal-verified` |
| 未知案例 | `unknown-scenario` | `transport-encryption-missing` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。

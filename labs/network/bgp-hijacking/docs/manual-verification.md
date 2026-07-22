<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# BGP 劫持手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `synthetic-origin-change` | `route-origin-validation-missing` | `accepted` | `network-bgp-hijacking-risk-accepted` |
| 修复版高风险 | `synthetic-origin-change` | `route-origin-validation-missing` | `blocked` | `network-bgp-hijacking-defense-blocked` |
| 修复版正常流程 | `synthetic-origin-change` | `rpki-policy-verified` | `accepted` | `network-bgp-hijacking-normal-verified` |
| 未知案例 | `unknown-scenario` | `route-origin-validation-missing` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。

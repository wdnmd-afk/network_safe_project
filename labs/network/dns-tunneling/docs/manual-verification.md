<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# DNS 隧道手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `synthetic-high-entropy-queries` | `dns-egress-monitoring-missing` | `accepted` | `network-dns-tunneling-risk-accepted` |
| 修复版高风险 | `synthetic-high-entropy-queries` | `dns-egress-monitoring-missing` | `blocked` | `network-dns-tunneling-defense-blocked` |
| 修复版正常流程 | `synthetic-high-entropy-queries` | `resolver-policy-verified` | `accepted` | `network-dns-tunneling-normal-verified` |
| 未知案例 | `unknown-scenario` | `dns-egress-monitoring-missing` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。

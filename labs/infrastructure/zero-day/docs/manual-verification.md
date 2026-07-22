<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 零日漏洞利用手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `synthetic-unknown-exploit-signal` | `compensating-control-missing` | `accepted` | `infrastructure-zero-day-risk-accepted` |
| 修复版高风险 | `synthetic-unknown-exploit-signal` | `compensating-control-missing` | `blocked` | `infrastructure-zero-day-defense-blocked` |
| 修复版正常流程 | `synthetic-unknown-exploit-signal` | `exposure-contained-and-monitored` | `accepted` | `infrastructure-zero-day-normal-verified` |
| 未知案例 | `unknown-scenario` | `compensating-control-missing` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。

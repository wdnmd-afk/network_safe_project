<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 浏览器 MITB手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `synthetic-transaction-view-mismatch` | `browser-view-trusted` | `accepted` | `client-mitb-risk-accepted` |
| 修复版高风险 | `synthetic-transaction-view-mismatch` | `browser-view-trusted` | `blocked` | `client-mitb-defense-blocked` |
| 修复版正常流程 | `synthetic-transaction-view-mismatch` | `transaction-signing-verified` | `accepted` | `client-mitb-normal-verified` |
| 未知案例 | `unknown-scenario` | `browser-view-trusted` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。

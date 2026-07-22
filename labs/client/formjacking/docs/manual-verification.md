<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# Formjacking手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `synthetic-checkout-target-change` | `form-integrity-missing` | `accepted` | `client-formjacking-risk-accepted` |
| 修复版高风险 | `synthetic-checkout-target-change` | `form-integrity-missing` | `blocked` | `client-formjacking-defense-blocked` |
| 修复版正常流程 | `synthetic-checkout-target-change` | `csp-sri-target-verified` | `accepted` | `client-formjacking-normal-verified` |
| 未知案例 | `unknown-scenario` | `form-integrity-missing` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。

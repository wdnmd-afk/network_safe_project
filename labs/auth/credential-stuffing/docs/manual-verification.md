<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 凭据填充手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `reused-credential-batch` | `risk-correlation-missing` | `accepted` | `auth-credential-stuffing-risk-accepted` |
| 修复版高风险 | `reused-credential-batch` | `risk-correlation-missing` | `blocked` | `auth-credential-stuffing-defense-blocked` |
| 修复版正常流程 | `reused-credential-batch` | `adaptive-challenge-enabled` | `accepted` | `auth-credential-stuffing-normal-verified` |
| 未知案例 | `unknown-scenario` | `risk-correlation-missing` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。

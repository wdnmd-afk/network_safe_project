<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 会话劫持手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `replayed-session-summary` | `context-binding-missing` | `accepted` | `auth-session-hijacking-risk-accepted` |
| 修复版高风险 | `replayed-session-summary` | `context-binding-missing` | `blocked` | `auth-session-hijacking-defense-blocked` |
| 修复版正常流程 | `replayed-session-summary` | `session-rotated-and-bound` | `accepted` | `auth-session-hijacking-normal-verified` |
| 未知案例 | `unknown-scenario` | `context-binding-missing` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。

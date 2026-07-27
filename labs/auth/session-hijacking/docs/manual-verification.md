# 会话劫持手工验证

本实验已在 LT-009 专用化为两步决策交互（上下文绑定策略 → 会话处置决策），评估请求只接受固定 `scenarioKey` 和有序 `decisions` 决策路径。

| 决策路径 | scenarioKey | decisions（有序 optionKey） | 预期决策 | 预期终止信号 |
|---|---|---|---|---|
| 风险路径 | `replayed-session-summary` | `trust-long-lived-session` → `accept-replayed-session` | `accepted` | `auth-session-hijacking-risk-accepted` |
| 防御拦截路径 | `replayed-session-summary` | `bind-session-context` → `defense-blocks-replayed-session` | `blocked` | `auth-session-hijacking-defense-blocked` |
| 正常再认证路径 | `replayed-session-summary` | `bind-session-context` → `allow-reauthenticated-session` | `accepted` | `auth-session-hijacking-normal-verified` |
| 未登记案例 | `unknown-scenario` | 任意 | `blocked` | `auth-session-hijacking-boundary-blocked` |
| 未登记决策 | `replayed-session-summary` | 含未登记 optionKey | `blocked` | `auth-session-hijacking-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。所有决策只能来自工作台返回的固定 optionKey。

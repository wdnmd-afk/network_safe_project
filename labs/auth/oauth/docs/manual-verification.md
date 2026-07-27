# OAuth 漏洞手工验证

本实验已在 LT-010 专用化为两步决策交互（授权绑定策略 → 授权响应决策），评估请求只接受固定 `scenarioKey` 和有序 `decisions` 决策路径。

| 决策路径 | scenarioKey | decisions | 预期决策 | 预期终止信号 |
|---|---|---|---|---|
| 风险路径 | `tampered-authorization-response` | `accept-unbound-authorization` → `accept-tampered-response` | `accepted` | `auth-oauth-risk-accepted` |
| 防御拦截 | `tampered-authorization-response` | `bind-authorization-request` → `defense-blocks-tampered-response` | `blocked` | `auth-oauth-defense-blocked` |
| 正常授权 | `tampered-authorization-response` | `bind-authorization-request` → `allow-verified-authorization` | `accepted` | `auth-oauth-normal-verified` |
| 未知输入 | 任意未登记 scenarioKey 或 optionKey | — | `blocked` | `auth-oauth-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。未知 key 会被脱敏阻断，不回显原始输入。

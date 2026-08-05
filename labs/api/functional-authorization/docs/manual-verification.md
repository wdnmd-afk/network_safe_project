# API 功能级授权手工验证

本实验为两步决策交互（身份角色校验策略 → 操作处置），评估请求只接受固定 `scenarioKey` 和有序 `decisions` 决策路径。

| 变体 | scenarioKey | 决策路径 | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `privileged-operation-request` | `frontend-only-hidden` → `execute-privileged-operation` | `accepted` | `api-functional-authorization-risk-accepted` |
| 修复版拦截 | `privileged-operation-request` | `enforce-server-side-authorization` → `defense-blocks-privileged-operation` | `blocked` | `api-functional-authorization-defense-blocked` |
| 修复版正常流程 | `privileged-operation-request` | `enforce-server-side-authorization` → `allow-verified-admin-operation` | `accepted` | `api-functional-authorization-normal-verified` |
| 未知案例 | `unknown-scenario` | 任意 | `blocked` | `api-functional-authorization-boundary-blocked` |
| 未知决策 | `privileged-operation-request` | 含未登记 optionKey | `blocked` | `api-functional-authorization-boundary-blocked` |

验证过程中不得输入或保存真实账户、角色、凭据、token、外部 URL 或真实业务材料。

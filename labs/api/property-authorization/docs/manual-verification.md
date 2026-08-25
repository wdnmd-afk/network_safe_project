# 手工验证矩阵

| 路径 | 决策 | 信号 |
|---|---|---|
| 全量绑定 → 持久化服务端字段 | accepted | `api-property-authorization-risk-accepted` |
| 允许列表 → 阻断服务端字段 | blocked | `api-property-authorization-defense-blocked` |
| 允许列表 → displayName 更新 | accepted | `api-property-authorization-normal-verified` |


# API 功能级授权 · 风险观察版

本变体从攻击方视角走两步固定决策：先只在前端隐藏管理入口、服务端不做功能级授权校验，再对普通用户发起的管理操作直接放行，观察越权操作如何被接受。

- 固定案例：`privileged-operation-request`（普通用户请求管理员专属操作）。
- 推荐决策路径：`frontend-only-hidden` → `execute-privileged-operation`。
- 预期学习信号：`api-functional-authorization-risk-accepted`。

本变体只使用固定虚构用户与管理操作枚举，不修改真实账户、角色或权限，不提供可迁移到外部目标的越权请求器。

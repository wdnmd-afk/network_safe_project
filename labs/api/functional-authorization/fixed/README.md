# API 功能级授权 · 防御复盘版

本变体从防御方视角复盘同一固定案例：服务端启用功能级授权校验后，既可阻断普通用户越权发起的管理操作，也能在管理员身份校验通过后放行正常管理流程。

- 固定案例：`privileged-operation-request`。
- 防御拦截路径：`enforce-server-side-authorization` → `defense-blocks-privileged-operation`（`api-functional-authorization-defense-blocked`）。
- 正常放行路径：`enforce-server-side-authorization` → `allow-verified-admin-operation`（`api-functional-authorization-normal-verified`）。

本变体强调服务端固定决策状态机、最小权限与审计，前端按钮只用于引导学习流程，不接受真实账户、角色或权限输入。

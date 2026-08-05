# API 功能级授权风险观察步骤

1. 登录本机学习平台。
2. 打开 `/labs/api/functional-authorization/vuln`。
3. 第一步选择“仅前端隐藏管理入口”（`frontend-only-hidden`）。
4. 第二步选择“直接执行管理操作”（`execute-privileged-operation`）。
5. 点击“运行固定评估”。
6. 观察决策 `accepted`、学习信号 `api-functional-authorization-risk-accepted` 和风险标签。
7. 切换到修复版，用同一固定案例对比服务端功能级授权如何阻断越权并放行正常管理流程。
8. 在统一事件日志中确认只记录固定 key、决策路径和安全摘要。

该流程只观察固定本机教学结果，不提供真实越权请求、真实账户或外部目标操作步骤。

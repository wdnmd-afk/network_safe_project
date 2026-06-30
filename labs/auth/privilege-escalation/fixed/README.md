# 权限提升修复版

## 修复策略

修复版忽略请求体中的 `requestedRole`，只使用登录态中的服务端角色作为权限判断依据。

核心约束：

```text
effectiveRole = currentUser.role
```

普通用户请求管理操作时，即使客户端声明 `admin`，后端也返回 `403`。

## 防御信号

同样提交：

```json
{
  "operationKey": "approve-refund",
  "requestedRole": "admin"
}
```

修复版会阻断请求，学习信号为：

```text
privilege-client-role-admin-blocked
```

## 真实生产补充

真实生产环境还需要：

- 统一服务端 RBAC / ABAC 权限策略。
- 敏感操作二次确认和审计。
- 权限变更审批与最小权限原则。
- 不把前端隐藏按钮、路由守卫或客户端角色当作最终防线。

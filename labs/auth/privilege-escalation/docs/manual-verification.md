# 权限提升手动验证

## 页面验证

1. 登录平台演示账号。
2. 打开 `/labs/auth/privilege-escalation/vuln`。
3. 点击“普通操作”，再点击“执行操作”。
4. 确认页面显示 `privilege-normal-operation-accepted`。
5. 点击“客户端 admin 声明”，再点击“执行操作”。
6. 确认漏洞版显示 `privilege-client-role-admin-accepted`，并展示虚拟管理操作结果。
7. 打开 `/labs/auth/privilege-escalation/fixed`。
8. 点击“客户端 admin 声明”，再点击“执行操作”。
9. 确认修复版显示 `privilege-client-role-admin-blocked`，不执行管理操作。

## API 验证

漏洞版请求：

```http
POST /api/labs/auth/privilege-escalation/vuln/execute
Content-Type: application/json

{
  "operationKey": "approve-refund",
  "requestedRole": "admin"
}
```

预期：

- HTTP 200
- `status`: `ok`
- `signal`: `privilege-client-role-admin-accepted`

修复版请求：

```http
POST /api/labs/auth/privilege-escalation/fixed/execute
Content-Type: application/json

{
  "operationKey": "approve-refund",
  "requestedRole": "admin"
}
```

预期：

- HTTP 403
- `status`: `blocked`
- `signal`: `privilege-client-role-admin-blocked`

## 日志验证

检查后端控制台和 `lab_event_logs`，确认日志包含：

- `labKey`: `auth.privilege-escalation`
- `variantKey`: `vuln` 或 `fixed`
- `inputSummary.requestedRole`
- `inputSummary.currentUserRole`
- `inputSummary.trustedClientRole`
- `decision`
- `signal`

日志不应保存真实敏感业务数据，也不应修改真实用户角色。

# 权限提升漏洞版

## 漏洞点

漏洞版接口信任请求体中的 `requestedRole`，把客户端传来的角色声明当作授权依据。

## 攻击方视角

攻击者先观察普通操作请求：

```json
{
  "operationKey": "view-profile-summary",
  "requestedRole": "member"
}
```

随后把操作替换为管理操作，并把客户端声明角色改为 `admin`：

```json
{
  "operationKey": "approve-refund",
  "requestedRole": "admin"
}
```

漏洞版会执行虚拟管理操作，学习信号为：

```text
privilege-client-role-admin-accepted
```

## 日志观察

事件日志会记录：

- `labKey`: `auth.privilege-escalation`
- `variantKey`: `vuln`
- `phase`: `attack`
- `actorPerspective`: `attacker`
- `decision`: `accepted`
- `signal`: `privilege-client-role-admin-accepted`

日志只保存角色和操作摘要，不保存真实业务敏感数据。

# 会话固定修复版

## 行为说明

修复版模拟登录完成后强制轮换教学会话 ID。

当请求仍然携带：

```json
{
  "preLoginSessionId": "attacker-fixed-session-9001",
  "sessionSource": "external-link"
}
```

后端不会把这个 ID 作为登录后的教学会话，而是生成新的服务端教学会话 ID，并返回：

```text
session-fixed-id-rotated
```

## 学习重点

- 修复会话固定通常不是拒绝登录，而是登录成功后更换会话 ID。
- 服务端不能把客户端预登录 ID 当作认证后会话 ID。
- 修复版日志会显示 `acceptedClientSessionId=false`、`rotatedSessionId=true`。

## 生产补充

真实系统还应结合：

- 登录后 session rotation
- 旧 session 失效
- `HttpOnly`、`Secure`、`SameSite` Cookie
- 会话过期策略
- 异常登录与会话审计

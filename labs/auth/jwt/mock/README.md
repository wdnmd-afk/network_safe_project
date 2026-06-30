# JWT 教学样例

本实验使用独立教学 JWT，不复用平台真实登录 token。

## 正常签名 token

payload：

```json
{
  "sub": "learner-1001",
  "role": "user",
  "scope": "orders:read",
  "lab": "auth.jwt"
}
```

用于观察 HS256 签名 token 在漏洞版和修复版中都可通过。

## alg=none 攻击 token

payload：

```json
{
  "sub": "learner-1001",
  "role": "admin",
  "scope": "admin:read",
  "lab": "auth.jwt"
}
```

用于观察漏洞版跳过签名校验后如何接受管理员声明。

## 日志约束

事件日志只记录 token 长度、段数、算法、角色声明、是否请求管理员权限和学习信号，不保存完整 token。

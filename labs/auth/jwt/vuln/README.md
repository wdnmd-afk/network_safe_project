# JWT 攻击漏洞版

## 漏洞点

漏洞版 JWT 验证器信任 token header 中的 `alg`。当攻击方提交 `alg=none` 的 token 时，后端跳过签名校验，并直接信任 payload 中的管理员声明。

受控攻击样例的 payload：

```json
{
  "sub": "learner-1001",
  "role": "admin",
  "scope": "admin:read",
  "lab": "auth.jwt"
}
```

## 观察重点

- 后端决策为 `accepted`。
- 学习信号为 `jwt-none-alg-admin-accepted`。
- 页面显示算法为 `none`，签名不存在。
- 授权结果显示访问 `admin-analytics`。
- 统一事件日志记录 token 摘要，但不保存完整 token。

## 风险理解

真实系统中，JWT payload 只是声明，不是可信事实。服务端必须先验证算法、签名、过期时间、issuer、audience 等约束，再根据服务端权限模型做授权判断。

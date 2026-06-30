# JWT 攻击手动验证

## 验证矩阵

| 场景 | 页面 | 输入 | 预期结果 |
|---|---|---|---|
| 正常签名 token | `/labs/auth/jwt/vuln` | 签名 token 样例 | 返回普通用户授权结果，信号为 `jwt-valid-user-token-accepted` |
| 漏洞版 alg=none | `/labs/auth/jwt/vuln` | 攻击样例 | 接受管理员声明，信号为 `jwt-none-alg-admin-accepted` |
| 修复版签名 token | `/labs/auth/jwt/fixed` | 签名 token 样例 | 返回普通用户授权结果，信号为 `jwt-valid-user-token-accepted` |
| 修复版 alg=none | `/labs/auth/jwt/fixed` | 攻击样例 | 返回阻断结果，信号为 `jwt-none-alg-blocked` |

## API 验证

漏洞版：

```http
POST /api/labs/auth/jwt/vuln/verify
Content-Type: application/json
Authorization: Bearer <local-demo-token>

{
  "token": "<teaching-jwt>"
}
```

修复版：

```http
POST /api/labs/auth/jwt/fixed/verify
Content-Type: application/json
Authorization: Bearer <local-demo-token>

{
  "token": "<teaching-jwt>"
}
```

## 日志验证

统一事件日志应记录：

- `labKey`: `auth.jwt`
- `variantKey`: `vuln` 或 `fixed`
- `phase`: `attack` 或 `defense`
- `decision`: `accepted` 或 `blocked`
- `signal`: 对应学习信号

日志不应保存完整 token。

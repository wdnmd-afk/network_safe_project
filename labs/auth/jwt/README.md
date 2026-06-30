# JWT 攻击

## 实验目标

本实验通过一个受控的“JWT 管理区令牌验证”业务，展示 JWT 校验错误如何导致角色声明被篡改，以及修复版如何通过算法白名单和签名校验阻断。

学习顺序：

1. 先提交正常 HS256 教学 token，观察普通用户声明被接受。
2. 再在漏洞版提交 `alg=none` 管理员声明 token，观察未签名 token 如何被接受。
3. 最后在修复版提交同样 token，观察算法白名单如何阻断。

## 安全边界

- 本实验使用独立教学 JWT，不复用真实登录 token。
- 教学密钥只用于本机实验，不代表生产密钥管理方式。
- 不爆破密钥，不扫描接口，不访问外部目标。
- 统一事件日志只记录 token 长度、段数、算法、角色声明和学习信号，不保存完整 token。

## 入口

- 漏洞版页面：`/labs/auth/jwt/vuln`
- 修复版页面：`/labs/auth/jwt/fixed`
- 漏洞版 API：`POST /api/labs/auth/jwt/vuln/verify`
- 修复版 API：`POST /api/labs/auth/jwt/fixed/verify`

请求字段固定为：

```json
{
  "token": "<teaching-jwt>"
}
```

## 预期信号

- 正常签名 token：`jwt-valid-user-token-accepted`
- 漏洞版未签名管理员声明：`jwt-none-alg-admin-accepted`
- 修复版阻断未签名 token：`jwt-none-alg-blocked`

## 配套文件

- `vuln/README.md`：漏洞版说明
- `fixed/README.md`：修复版说明
- `mock/README.md`：教学 token 说明
- `docs/attack-steps.md`：攻击步骤
- `docs/fix-notes.md`：修复说明
- `docs/manual-verification.md`：手动验证说明

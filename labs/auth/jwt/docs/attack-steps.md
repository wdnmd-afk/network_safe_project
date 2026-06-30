# JWT 攻击步骤

## 前置条件

- 已登录平台演示账号。
- 后端服务已启动。
- 当前页面为 `/labs/auth/jwt/vuln`。

## 步骤

1. 点击“填入签名 token”，提交正常 HS256 教学 token。
2. 观察普通用户声明被接受，信号为 `jwt-valid-user-token-accepted`。
3. 点击“填入攻击样例”，提交 `alg=none` 管理员声明 token。
4. 观察漏洞版返回的授权结果，确认资源变成 `admin-analytics`。
5. 查看后端控制台或数据库事件日志，确认本次请求记录为攻击阶段。

## 攻击方视角

攻击方的目标不是破解密钥，而是让后端相信一个未签名 token。关键观察点：

- header 中的 `alg` 是否被服务端信任。
- payload 中的 `role` 是否被服务端直接用于授权。
- 没有 signature 时服务端是否仍继续处理。

## 成功信号

```text
jwt-none-alg-admin-accepted
```

## 安全边界

本实验 token 全部是教学样例，不适用于外部系统，也不包含真实凭据。

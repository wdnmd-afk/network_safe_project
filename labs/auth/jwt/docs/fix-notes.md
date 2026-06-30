# JWT 攻击修复说明

## 根因

漏洞版把 token header 中的 `alg` 当作可信输入，并在 `alg=none` 时跳过签名校验。随后又直接信任 payload 中的角色声明，导致普通用户可伪造管理员声明。

## 本实验修复点

- 只允许 HS256 教学 token。
- 拒绝 `alg=none`。
- 校验 header、payload、signature 三段结构。
- 签名失败时不读取授权结果。
- 事件日志只记录 token 摘要。

## 防御信号

```text
jwt-none-alg-blocked
```

## 真实生产建议

真实生产中还应补充：

- 固定算法白名单，不从用户输入推断算法。
- 使用可靠 JWT 库并显式配置 allowed algorithms。
- 校验 `iss`、`aud`、`exp`、`nbf`。
- 建立 key id、密钥轮换和撤销策略。
- 角色权限从服务端权限系统确认，不只依赖 token claim。
- 对异常算法、无签名 token、签名失败事件做审计告警。

## 不在本实验中实现的内容

- 密钥爆破。
- 外部 token 利用。
- 真实账号权限提升。
- 真实登录 token 改造。

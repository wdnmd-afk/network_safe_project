# 会话固定漏洞版

## 行为说明

漏洞版模拟后端在教学登录完成后继续信任客户端传入的 `preLoginSessionId`。

当请求为：

```json
{
  "preLoginSessionId": "attacker-fixed-session-9001",
  "sessionSource": "external-link"
}
```

后端会把这个教学会话 ID 绑定到当前用户，并返回：

```text
session-fixed-id-bound
```

## 学习重点

- 攻击者控制的是登录前会话 ID。
- 风险点不是用户能否登录，而是登录后是否继续使用攻击者已知的 ID。
- 漏洞版日志会显示 `acceptedClientSessionId=true`、`rotatedSessionId=false`。

## 安全边界

本目录只描述本项目内受控教学场景，不涉及真实 Cookie、真实 token 或第三方目标。

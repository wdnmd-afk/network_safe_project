# 会话固定 Mock 数据

本实验使用固定教学样例，不读取真实会话存储。

## 样例

普通浏览器预登录会话：

```json
{
  "preLoginSessionId": "browser-prelogin-session-1024",
  "sessionSource": "browser"
}
```

外部链接固定会话：

```json
{
  "preLoginSessionId": "attacker-fixed-session-9001",
  "sessionSource": "external-link"
}
```

## 约束

- 这些 ID 只用于教学观察。
- 不代表真实 Cookie、真实 token 或真实服务端 session。
- 后端日志只记录摘要，不保存完整真实敏感值。

# 会话固定

## 实验目标

本实验演示会话固定的核心风险：攻击者提前准备一个自己知道的会话 ID，并诱导用户带着该 ID 完成登录。如果后端登录后继续使用这个预登录 ID，攻击者就能在受控教学模型中观察到“固定 ID 被绑定给当前用户”的结果。

本项目只使用独立教学会话字段，不修改真实登录 token、不读取真实 Cookie、不访问外部目标。

## 实验入口

- 漏洞版页面：`/labs/auth/session-fixation/vuln`
- 修复版页面：`/labs/auth/session-fixation/fixed`
- 漏洞版 API：`POST /api/labs/auth/session-fixation/vuln/login`
- 修复版 API：`POST /api/labs/auth/session-fixation/fixed/login`

## 请求字段

```json
{
  "preLoginSessionId": "attacker-fixed-session-9001",
  "sessionSource": "external-link"
}
```

- `preLoginSessionId`：登录前已经存在的教学会话 ID。
- `sessionSource`：教学会话来源，当前使用 `browser` 或 `external-link`。

## 漏洞版观察点

漏洞版在教学登录完成后继续使用 `preLoginSessionId`。

当提交外部链接固定会话样例时，预期信号为：

```text
session-fixed-id-bound
```

这代表系统把攻击者已知的固定教学会话 ID 绑定到了当前用户。

## 修复版观察点

修复版在教学登录完成后忽略客户端传入的 `preLoginSessionId`，由服务端生成新的教学会话 ID。

同样的外部链接固定会话样例在修复版中预期信号为：

```text
session-fixed-id-rotated
```

这代表攻击者提前知道的 ID 没有成为登录后的会话 ID。

## 日志说明

接口会写入统一实验事件日志，日志只保存：

- 会话 ID 长度和脱敏摘要
- 会话来源
- 是否攻击者可控
- 是否接受客户端会话 ID
- 是否登录后轮换
- 当前用户 ID
- 学习信号

日志不会保存真实密码、真实 token、真实 Cookie 或外部目标信息。

## 文档

- `docs/attack-steps.md`：攻击步骤
- `docs/fix-notes.md`：修复说明
- `docs/manual-verification.md`：手动验证说明

# 会话固定攻击步骤

## 1. 攻击目标

攻击者希望用户登录后继续使用攻击者提前知道的会话 ID。

在本实验中，攻击者控制的输入是：

```json
{
  "preLoginSessionId": "attacker-fixed-session-9001",
  "sessionSource": "external-link"
}
```

## 2. 前置条件

- 用户已登录本项目演示账号。
- 后端服务运行在本机。
- 使用漏洞版入口：`/labs/auth/session-fixation/vuln`。

## 3. 操作步骤

1. 打开漏洞版页面。
2. 点击“外部链接固定 ID”。
3. 确认 `preLoginSessionId` 为 `attacker-fixed-session-9001`。
4. 确认 `sessionSource` 为 `external-link`。
5. 点击“提交教学登录”。
6. 观察学习信号是否为 `session-fixed-id-bound`。

## 4. 预期结果

漏洞版会继续使用客户端传入的教学会话 ID。

应观察到：

- `attackerControlled=true`
- `acceptedClientSessionId=true`
- `rotatedSessionId=false`
- `sessionIdChanged=false`
- `session-fixed-id-bound`

## 5. 日志观察

统一事件日志中应记录：

- `labKey=auth.session-fixation`
- `variantKey=vuln`
- `phase=attack`
- `actorPerspective=attacker`
- `decision=accepted`
- `signal=session-fixed-id-bound`

日志只保存教学会话 ID 摘要，不保存真实 token 或 Cookie。

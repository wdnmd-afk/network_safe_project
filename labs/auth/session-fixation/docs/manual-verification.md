# 会话固定手动验证

## 验证前准备

1. 启动后端服务。
2. 启动前端服务。
3. 登录平台演示账号。

## 漏洞版验证

1. 打开 `/labs/auth/session-fixation/vuln`。
2. 点击“外部链接固定 ID”。
3. 点击“提交教学登录”。
4. 确认页面显示：
   - 学习信号：`漏洞版绑定了攻击者已知会话 ID`
   - 绑定来源：`client`
   - 攻击者可控：`是`
   - 接受客户端 ID：`是`
   - 登录后轮换：`否`

API 预期信号：

```text
session-fixed-id-bound
```

## 修复版验证

1. 打开 `/labs/auth/session-fixation/fixed`。
2. 点击“外部链接固定 ID”。
3. 点击“提交教学登录”。
4. 确认页面显示：
   - 学习信号：`修复版轮换了攻击者已知会话 ID`
   - 绑定来源：`server`
   - 攻击者可控：`是`
   - 接受客户端 ID：`否`
   - 登录后轮换：`是`

API 预期信号：

```text
session-fixed-id-rotated
```

## 最小脚本验证

```powershell
python tools/lab-scripts/auth/session-fixation/exploit.py --token $env:NETWORK_SAFE_SESSION_TOKEN --variant vuln --sample attack
```

```powershell
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/auth/session-fixation/verify.ts
```

## 日志验证

后端控制台和数据库事件日志应能观察到：

- `lab=auth.session-fixation`
- `signal=session-fixed-id-bound` 或 `session-fixed-id-rotated`
- `preLoginSessionIdPreview=controlled-session-fixation-sample`
- 不包含真实 token、真实 Cookie 或真实密码。

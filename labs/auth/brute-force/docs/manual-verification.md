# 暴力破解手动验证

## 验证目标

确认漏洞版会在连续候选口令中命中虚拟教学账号，修复版会在连续失败达到阈值后阻断后续检查。

## 页面验证

1. 登录平台演示账号。
2. 打开 `/labs/auth/brute-force/vuln`。
3. 点击“正常单次登录”，提交。
4. 确认信号为 `brute-force-normal-login-accepted`。
5. 点击“连续猜测样例”，提交。
6. 确认信号为 `brute-force-password-guessed`。
7. 打开 `/labs/auth/brute-force/fixed`。
8. 点击“连续猜测样例”，提交。
9. 确认信号为 `brute-force-rate-limit-blocked`，并且 `rateLimitApplied` 为 `true`。

## API 验证

请求体固定为：

```json
{
  "targetUsername": "training-user",
  "passwordCandidates": [
    "summer2024",
    "password123",
    "letmein",
    "training-login-weak"
  ]
}
```

预期：

- `POST /api/labs/auth/brute-force/vuln/attempt` 返回 200。
- `POST /api/labs/auth/brute-force/fixed/attempt` 返回 429。
- 未登录访问返回 401。
- 超过 5 个候选口令返回 400。

## 自动化验证

```bash
pnpm --filter @network-safe/server test
pnpm --filter @network-safe/web exec vitest run
pnpm --filter @network-safe/shared test
python tools/lab-scripts/auth/brute-force/exploit.py --help
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/auth/brute-force/verify.ts
```

## 日志核对

事件日志应出现 `auth.brute-force`，但 `inputSummary` 只允许包含候选数量、失败次数、阈值判断、脱敏用户名预览和信号，不应包含任何候选口令明文。

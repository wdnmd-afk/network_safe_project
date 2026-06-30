# 会话固定脚本目录

本目录只服务于 `auth.session-fixation` 本机受控实验。

## 文件

- `exploit.py`：提交固定教学会话样例，模拟漏洞版与修复版差异。
- `verify.ts`：输出平台验证配置和预期信号。

## 安全边界

- 默认目标为 `http://127.0.0.1:6667`。
- 只允许 `localhost`、`127.0.0.1`、`::1`。
- 不枚举会话 ID。
- 不读取真实 Cookie。
- 不扫描接口。
- 不访问外部目标。
- 不修改真实登录 token。

## 示例

```powershell
python tools/lab-scripts/auth/session-fixation/exploit.py --token $env:NETWORK_SAFE_SESSION_TOKEN --variant vuln --sample attack
```

```powershell
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/auth/session-fixation/verify.ts
```

# 权限提升脚本目录

本目录只服务于 `auth.privilege-escalation` 本机受控实验。

## 文件

- `exploit.py`：提交固定操作样例，模拟漏洞版与修复版差异。
- `verify.ts`：输出平台验证配置和预期信号。

## 安全边界

- 默认目标为 `http://127.0.0.1:6667`。
- 只允许 `localhost`、`127.0.0.1`、`::1`。
- 不枚举权限。
- 不扫描接口。
- 不访问外部目标。
- 不修改真实用户角色、订单、退款或配置。

## 示例

```powershell
python tools/lab-scripts/auth/privilege-escalation/exploit.py --token $env:NETWORK_SAFE_SESSION_TOKEN --variant vuln --sample attack
```

```powershell
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/auth/privilege-escalation/verify.ts
```

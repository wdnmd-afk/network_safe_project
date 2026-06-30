# IDOR 脚本目录

本目录只服务于 `auth.idor` 本机受控实验。

## 文件

- `exploit.py`：提交固定订单 ID 样例，模拟漏洞版与修复版差异。
- `verify.ts`：输出平台验证配置和预期信号。

## 安全边界

- 默认目标为 `http://127.0.0.1:6667`。
- 只允许 `localhost`、`127.0.0.1`、`::1`。
- 不扫描对象 ID。
- 不爆破、枚举或访问外部目标。
- 不保存真实 token、真实订单或真实隐私数据。

## 示例

```powershell
python tools/lab-scripts/auth/idor/exploit.py --token $env:NETWORK_SAFE_SESSION_TOKEN --variant vuln --sample attack
```

```powershell
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/auth/idor/verify.ts
```

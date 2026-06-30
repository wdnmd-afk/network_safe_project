# 暴力破解实验脚本

本目录只服务 `auth.brute-force` 本机受控实验。

## 文件

- `exploit.py`：提交固定连续候选口令样例的本机请求脚本。
- `verify.ts`：输出漏洞版与修复版的验证配置。

## 安全边界

- 只允许 `localhost`、`127.0.0.1` 或 `::1`。
- 不支持自定义字典。
- 不支持多目标。
- 不支持并发。
- 不访问外部系统。
- 不调用真实平台登录接口。

## 示例

```bash
python tools/lab-scripts/auth/brute-force/exploit.py --help
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/auth/brute-force/verify.ts
```

真实请求需要先通过本机平台登录获得演示账号 token：

```bash
python tools/lab-scripts/auth/brute-force/exploit.py --token <local-token> --variant vuln --sample attack
```

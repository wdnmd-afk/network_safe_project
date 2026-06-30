# SSRF 脚本目录

本目录只服务 `web.ssrf` 本机受控实验。

## 文件

- `exploit.py`：攻击方视角的本机受控 URL 抓取样例请求脚本。
- `verify.ts`：平台验证配置与预期信号。

## 安全边界

- 默认只访问 `http://127.0.0.1:6667`。
- 只允许 `localhost`、`127.0.0.1`、`::1`。
- 不扫描网络，不访问外部目标。
- 不发起真实 SSRF 探测，只调用本项目后端虚拟资源接口。
- 不保存真实凭据或真实外部目标信息。

## 使用示例

```powershell
python tools/lab-scripts/web/ssrf/exploit.py --token <local-token> --variant vuln
python tools/lab-scripts/web/ssrf/exploit.py --token <local-token> --variant fixed
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ssrf/verify.ts
```

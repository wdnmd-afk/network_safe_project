# 目录遍历脚本目录

本目录只服务 `web.path-traversal` 本机受控实验。

## 文件

- `exploit.py`：攻击方视角的本机受控路径读取样例请求脚本。
- `verify.ts`：平台验证配置与预期信号。

## 安全边界

- 默认只访问 `http://127.0.0.1:6667`。
- 只允许 `localhost`、`127.0.0.1`、`::1`。
- 不扫描网络，不访问外部目标。
- 不读取真实文件系统，不提交真实系统敏感路径。
- 请求只访问本项目后端的虚拟文档索引。

## 使用示例

```powershell
python tools/lab-scripts/web/path-traversal/exploit.py --token <local-token> --variant vuln
python tools/lab-scripts/web/path-traversal/exploit.py --token <local-token> --variant fixed
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/path-traversal/verify.ts
```

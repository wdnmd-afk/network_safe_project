# 信息泄露实验脚本

本目录只服务于 `web.info-disclosure` 本机受控实验。

## 文件

- `exploit.py`：本机受控调试报告读取模拟脚本。
- `verify.ts`：漏洞版 / 修复版预期行为验证计划。

## 安全边界

- 默认目标为 `http://127.0.0.1:6667`。
- 脚本拒绝非 localhost / 127.0.0.1 / ::1 的 base URL。
- 不读取真实环境变量、真实 token、真实日志、真实文件或真实配置。
- 不访问外部目标，不扫描网段，不生成通用信息收集工具。

## 示例

```powershell
python tools/lab-scripts/web/info-disclosure/exploit.py --help
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/info-disclosure/verify.ts
```

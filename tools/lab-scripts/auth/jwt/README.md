# JWT 攻击实验脚本

本目录只服务于 `auth.jwt` 本机受控实验。

## 文件

- `exploit.py`：本机受控 `alg=none` JWT 攻击样例脚本。
- `verify.ts`：漏洞版 / 修复版预期行为验证计划。

## 安全边界

- 默认目标为 `http://127.0.0.1:6667`。
- 脚本拒绝非 localhost / 127.0.0.1 / ::1 的 base URL。
- 使用独立教学 JWT，不复用真实登录 token。
- 不爆破密钥，不访问外部目标，不生成通用 JWT 利用工具。

## 示例

```powershell
python tools/lab-scripts/auth/jwt/exploit.py --help
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/auth/jwt/verify.ts
```

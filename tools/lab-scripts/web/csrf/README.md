# CSRF 脚本目录

本目录仅服务于 `web/csrf` 本机受控实验。

## 当前文件

- `exploit.py`：仅限 localhost 的受控请求模拟脚本。
- `verify.ts`：导出 CSRF 漏洞版 / 修复版验证配置、样例请求和预期信号。

## 使用边界

- 只描述本项目本机接口。
- 不访问外部目标。
- 不生成跨站投递页面。
- 不保存凭据或 token。

## 本机示例

```powershell
python tools/lab-scripts/web/csrf/exploit.py --variant vuln --token <local-session-token>
python tools/lab-scripts/web/csrf/exploit.py --variant fixed --token <local-session-token>
python tools/lab-scripts/web/csrf/exploit.py --variant fixed --with-token --token <local-session-token>
```

## 验证重点

- 漏洞版缺少 CSRF token 时仍接受请求。
- 修复版缺少 CSRF token 时阻断请求。
- 修复版携带后端颁发 token 时允许正常提交。

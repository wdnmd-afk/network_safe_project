# XSS 脚本目录

本目录只服务于 `web/xss` 本机受控实验，不作为通用攻击工具目录。

## 当前脚本

- `verify.ts`：输出 XSS 漏洞版 / 修复版的本机验证配置、样例 payload 与预期信号。

运行示例：

```powershell
pnpm exec tsx tools/lab-scripts/web/xss/verify.ts
```

## 验证边界

- 只验证本项目本机页面：`/labs/web/xss/vuln` 与 `/labs/web/xss/fixed`。
- 样例 payload 使用惰性 HTML 标记，不执行 JavaScript。
- 不读取 Cookie，不发送网络请求，不连接外部目标。
- 浏览器级验证以 Playwright 用例为准，脚本只提供结构化验证说明。

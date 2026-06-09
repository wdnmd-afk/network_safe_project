# XSS 手动验证步骤

## 前置条件

启动前端与后端本机服务：

```powershell
pnpm dev:server
pnpm dev:web
```

访问前端：

```text
http://localhost:6666/labs
```

## 漏洞版验证

1. 进入 `/labs/web/xss/vuln`。
2. 点击“填入样例”。
3. 点击“提交留言”。
4. 观察页面留言预览区域。

预期信号：

- 页面出现黄色 `XSS 模拟信号`。
- 该信号来自 `data-xss-lab-signal="xss"` 标记被解释为 HTML。

## 修复版验证

1. 进入 `/labs/web/xss/fixed`。
2. 点击“填入样例”。
3. 点击“提交留言”。
4. 观察页面留言预览区域。

预期信号：

- 页面原样显示 `<mark data-xss-lab-signal="xss">XSS 模拟信号</mark>`。
- 页面不会生成黄色模拟信号。

## 安全边界

本验证只使用本机受控页面和惰性 HTML 标记，不执行脚本，不连接外部目标。

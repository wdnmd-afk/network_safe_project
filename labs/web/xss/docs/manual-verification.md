# XSS 手动验证步骤

## 前置条件

启动前端与后端本机服务：

```powershell
pnpm dev:server
pnpm dev:web
```

访问前端：

```text
http://localhost:6670/labs
```

如需验证平台记录链路，先使用以下演示账号登录：

```text
demo_user / Demo@123456
```

记录链路还要求数据库中已同步 `web.xss` 对应的实验主数据；新环境先运行：

```powershell
pnpm --filter @network-safe/server seed:labs
```

如果尚未同步，不影响页面实验效果，但学习进度与验证记录不会成功落库。

## 漏洞版验证

1. 进入 `/labs/web/xss/vuln`。
2. 点击“填入样例”。
3. 点击“提交留言”。
4. 观察页面留言预览区域。

预期信号：

- 页面出现黄色 `XSS 模拟信号`。
- 该信号来自 `data-xss-lab-signal="xss"` 标记被解释为 HTML。
- 登录且数据库实验主数据存在时，页面会尝试写入 `vuln` 变体的学习进度与手动验证记录。

## 修复版验证

1. 进入 `/labs/web/xss/fixed`。
2. 点击“填入样例”。
3. 点击“提交留言”。
4. 观察页面留言预览区域。

预期信号：

- 页面原样显示 `<mark data-xss-lab-signal="xss">XSS 模拟信号</mark>`。
- 页面不会生成黄色模拟信号。
- 登录且数据库实验主数据存在时，页面会尝试写入 `fixed` 变体的学习进度与手动验证记录。

## 差异对照

| 验证项 | 漏洞版 | 修复版 |
|---|---|---|
| 输入内容 | 同一样例 payload | 同一样例 payload |
| 渲染方式 | HTML 渲染 | 文本渲染 |
| DOM 信号 | 生成 `data-xss-lab-signal="xss"` | 不生成该 DOM 标记 |
| 页面表现 | 出现黄色 `XSS 模拟信号` | 原样显示 HTML 字符串 |
| 记录结果 | `vuln / completed` | `fixed / completed` |

## 账户中心记录验证

1. 使用 `demo_user / Demo@123456` 登录。
2. 分别完成漏洞版或修复版样例提交。
3. 进入 `/account`。
4. 查看“学习进度”和“最近验证”。

预期信号：

- 学习进度中可看到 `web.xss` 对应的当前变体和 `completed` 状态。
- 最近验证中可看到“漏洞版出现 XSS 模拟信号”或“修复版原样显示 HTML 字符串”。

## 自动化验证

浏览器级自动化位于：

```text
packages/testing/tests/e2e/platform.spec.mjs
```

脚本验证配置位于：

```text
tools/lab-scripts/web/xss/verify.ts
```

## 安全边界

本验证只使用本机受控页面和惰性 HTML 标记，不执行脚本，不连接外部目标。

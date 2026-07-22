# XSS

## 当前状态

当前目录为一期纵向样板实验，已接入 SafeMart 客服留言业务页面、学习进度、验证记录、统一事件日志、手动验证、Playwright 差异验证和本机脚本验证入口。

## 实验目标

- 理解未转义输出如何让用户输入改变页面结构。
- 对比漏洞版与修复版对同一输入的处理差异。
- 建立后续 Web 漏洞实验的目录、页面、文档和验证样板。
- 明确 XSS 实验的安全边界：只使用惰性 HTML 标记，不执行真实脚本 payload。

## 学习路径

建议按以下顺序学习：

1. 阅读本页，理解业务背景与安全边界。
2. 进入漏洞版，提交样例 payload，观察页面结构被改变。
3. 进入修复版，提交同一 payload，观察内容只作为文本展示。
4. 阅读 `docs/attack-steps.md` 和 `docs/fix-notes.md`，理解漏洞原因和修复原则。
5. 登录演示账号后重复验证，在账户中心查看学习进度和最近验证记录。

## 入口

- 漏洞版：`/labs/web/xss/vuln`
- 修复版：`/labs/web/xss/fixed`

## 安全边界

本实验只在本机受控页面中使用惰性 HTML 标记模拟风险信号，不执行脚本，不访问外部目标，不收集任何真实凭据或浏览器数据。

## 验证矩阵

| 方式 | 入口 | 验证内容 |
|---|---|---|
| 手动验证 | `labs/web/xss/docs/manual-verification.md` | 漏洞版出现模拟信号，修复版原样显示 HTML 字符串 |
| Playwright | `packages/testing/tests/e2e/platform.spec.mjs` | 浏览器中验证漏洞版 / 修复版差异，以及登录后的记录闭环 |
| 脚本说明 | `tools/lab-scripts/web/xss/verify.ts` | 输出本机受控验证配置、样例 payload 和预期信号 |

## 平台记录

登录后进入漏洞版或修复版页面时，前端会尝试写入学习进度；提交样例 payload 后，会写入对应变体的手动验证记录和统一事件日志。事件日志只记录变体、验证结果、固定学习信号和摘要长度，不保存原始摘要或 `details` 内容。

当前记录链路依赖数据库中已存在 `web.xss` 实验主数据。新环境可先运行：

```powershell
pnpm --filter @network-safe/server seed:labs
```

如果本机数据库尚未同步实验元数据，页面仍可正常展示漏洞版 / 修复版差异，但记录接口会跳过或失败。

## 相关文档

- `labs/web/xss/vuln/README.md`
- `labs/web/xss/fixed/README.md`
- `labs/web/xss/docs/attack-steps.md`
- `labs/web/xss/docs/fix-notes.md`
- `labs/web/xss/docs/manual-verification.md`

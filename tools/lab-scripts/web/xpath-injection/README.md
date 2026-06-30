# XPath 注入脚本目录规划

## 当前状态

当前目录提供 XPath 注入实验的本机受控脚本入口。

当前已提供：

- `exploit.py`
- `verify.ts`

`labs/web/xpath-injection/meta.json` 已登记脚本入口。

## 后续脚本计划

脚本用途：

- `exploit.py`：从攻击方视角调用本机受控漏洞版接口，触发固定学习样例。
- `verify.ts`：验证漏洞版和修复版的学习信号差异。

## 安全边界

- 默认只允许访问 `http://127.0.0.1:6667`。
- 只允许 localhost / 127.0.0.1 / ::1。
- 不访问外部目标。
- 不读取真实 XML 文件。
- 不执行任意 XPath 表达式。
- 不生成通用 payload 库。
- 不保存真实 token、Cookie、凭据或外部目标信息。

## 后续验证信号

- 漏洞版受控样例：`xpath-injection-result-scope-expanded`
- 修复版受控样例：`xpath-injection-controlled-sample-blocked`
- 正常查询：`xpath-injection-safe-query-completed`

# XPath 注入手动验证规划

## 当前状态

当前实验处于 `ready` 状态，已提供后端受控 API、漏洞版 / 修复版页面和本机受控脚本入口。

本文件用于记录页面化手动验证目标。

## 后续验证步骤

后端和前端实现完成后，按以下步骤验证：

1. 登录平台演示账号。
2. 进入 `/labs/web/xpath-injection/vuln`。
3. 使用正常关键词提交查询。
4. 确认出现 `xpath-injection-safe-query-completed`。
5. 点击受控样例按钮或填入 `LAB_CONTROLLED_XPATH:expand-product-catalog`。
6. 确认漏洞版出现 `xpath-injection-result-scope-expanded`。
7. 切换到 `/labs/web/xpath-injection/fixed`。
8. 提交同样受控样例。
9. 确认修复版出现 `xpath-injection-controlled-sample-blocked`。
10. 查看事件日志复盘，确认页面不展示原始输入摘要 JSON。

## 预期信号

- `xpath-injection-safe-query-completed`
- `xpath-injection-controlled-sample-detected`
- `xpath-injection-result-scope-expanded`
- `xpath-injection-controlled-sample-blocked`
- `xpath-injection-template-not-found`

## 验证边界

- 只验证本机受控接口。
- 不访问外部目标。
- 不执行任意 XPath 表达式。
- 不读取真实 XML 文件。
- 不保存真实凭据、token、Cookie 或外部目标信息。

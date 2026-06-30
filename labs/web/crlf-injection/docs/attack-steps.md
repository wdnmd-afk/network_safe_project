# CRLF 注入攻击步骤

## 攻击方目标

攻击者希望确认业务中的文件名是否会进入响应头构造流程，并尝试把换行控制字符带入该流程，让虚拟响应头预览出现额外教学头部。

## 前置条件

- 漏洞版页面已实现。
- 攻击者只能访问本机实验页面。
- 攻击者能控制下载文件名文本。
- 后端漏洞版使用虚拟响应头预览器，不写真实响应头。

## 操作步骤

1. 打开 `/labs/web/crlf-injection/vuln`。
2. 选择 `download-filename` 模板。
3. 选择 `attachment` 下载方式。
4. 点击“填入正常文件名”。
5. 提交预览，观察只生成正常 `Content-Disposition` 虚拟头部。
6. 点击“填入受控样例”。
7. 提交预览，观察后端识别到 CR / LF 控制字符。
8. 观察漏洞版返回 `crlf-injection-virtual-header-injected`。
9. 查看请求摘要，只应看到模板、下载方式、文件名长度、脱敏预览、控制字符类别和学习信号。
10. 查看账户中心或实验详情页中的最近事件复盘。

## 成功信号

- 页面显示虚拟响应头结构被教学样例污染。
- 后端返回 `crlf-injection-virtual-header-injected`。
- 事件日志中 `phase = attack`、`decision = accepted`、`risk_level = high`。

## 刻意限制

本实验不会演示：

- 真实 HTTP 响应拆分。
- 真实缓存投毒。
- 真实 Cookie 注入。
- 浏览器、代理或网关链路影响。
- 外部目标访问。
- 通用 payload 库。

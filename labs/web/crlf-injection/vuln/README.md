# CRLF 注入漏洞版

## 目标

漏洞版展示用户输入中的 CR / LF 控制字符进入虚拟响应头构造流程后，为什么可能让头部预览出现额外教学头部。

## 当前后端行为

- 使用内存中的虚拟响应头预览器。
- 正常文件名只生成一个 `Content-Disposition` 虚拟头部。
- 固定受控样例触发控制字符检测信号。
- 虚拟预览中可出现 `X-Lab-Debug` 教学头部，但必须标记为 `virtual-injected`。
- 事件日志只记录控制字符类别、文件名长度、脱敏预览、虚拟头部数量和学习信号。

## 固定受控样例

```text
invoice.pdf\r\nX-Lab-Debug: exposed
```

该样例只能用于本项目虚拟预览，不得写入真实响应头。

## 禁止行为

- 不拼接真实 HTTP 原始响应。
- 不设置真实注入头。
- 不提供可对外部目标复用的 payload 库。
- 不执行网络请求或代理请求。
- 不保存完整危险文件名或完整 header 文本。

## 入口

页面待后续实现：

```text
/labs/web/crlf-injection/vuln
```

当前 API：

```text
POST /api/labs/web/crlf-injection/vuln/preview
```

# CRLF 注入修复版

## 目标

修复版展示服务端模板化响应头构造、下载方式允许列表和控制字符阻断如何防止 CRLF 风险进入虚拟响应头预览器。

## 当前后端行为

- 只接受固定 `headerTemplate`。
- 只接受固定 `dispositionType`。
- `fileName` 只作为普通文本值处理。
- 发现 CR、LF 或其他控制字符时直接阻断。
- 正常文件名仍可生成虚拟响应头预览。
- 日志只记录脱敏摘要和学习信号。

## 修复重点

- 修复点在服务端，不依赖前端隐藏输入或按钮。
- 响应头结构由服务端模板维护。
- 用户输入必须做控制字符检查和上下文编码。
- 未知模板和未知下载方式必须走允许列表阻断。

## 入口

页面待后续实现：

```text
/labs/web/crlf-injection/fixed
```

当前 API：

```text
POST /api/labs/web/crlf-injection/fixed/preview
```

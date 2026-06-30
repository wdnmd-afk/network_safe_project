# CRLF 注入

## 实验目标

本实验计划通过“下载响应头预览”业务展示 CRLF 注入风险：

1. 攻击者如何从响应头构造边界寻找可控输入。
2. 漏洞版为什么会在虚拟预览中出现头部结构被污染的学习信号。
3. 修复版为什么需要服务端模板、字段允许列表和控制字符阻断。
4. 统一事件日志如何记录风险摘要，而不是保存完整危险输入或完整 header 文本。

## 当前状态

当前实验已进入 `ready` 状态：

- 已建立实验目录、元数据和文档骨架。
- 已锁定业务包装、接口计划和安全边界。
- 已实现后端虚拟响应头预览 service 和受控 API。
- 已实现漏洞版 / 修复版前端页面。
- 已补充本机受控 `exploit.py` 与 `verify.ts`。
- 已补充前端、后端和共享元数据测试入口。
- 已接入 `lab_event_logs` 统一事件日志。

## 当前后端接口

```text
POST /api/labs/web/crlf-injection/:variant/preview
```

请求字段计划：

- `headerTemplate`：固定模板，初期只允许 `download-filename`。
- `fileName`：普通业务文件名文本。
- `dispositionType`：固定下载方式，初期只允许 `attachment` / `inline`。

## 入口

- 漏洞版接口：`POST /api/labs/web/crlf-injection/vuln/preview`
- 修复版接口：`POST /api/labs/web/crlf-injection/fixed/preview`
- 漏洞版页面：`/labs/web/crlf-injection/vuln`
- 修复版页面：`/labs/web/crlf-injection/fixed`
- 本机脚本目录：`tools/lab-scripts/web/crlf-injection/`

## 安全边界

- 不构造真实 HTTP 响应拆分。
- 不设置真实危险响应头。
- 不演示真实缓存投毒、Cookie 注入、代理链路、浏览器缓存或网关影响。
- 不访问外部目标。
- 不读取真实本机文件。
- 不保存完整危险输入、完整 header 文本、真实 token、真实 Cookie 或外部目标信息。
- 不提供通用 payload 库。

## 预期信号

- `crlf-injection-safe-header-previewed`：正常虚拟响应头预览完成。
- `crlf-injection-control-chars-detected`：漏洞版识别到控制字符风险。
- `crlf-injection-virtual-header-injected`：漏洞版虚拟头部结构被教学样例污染。
- `crlf-injection-control-chars-blocked`：修复版阻断控制字符。
- `crlf-injection-template-not-found`：修复版或服务端模板允许列表阻断未知模板。

## 相关文档

- [攻击步骤](docs/attack-steps.md)
- [修复说明](docs/fix-notes.md)
- [手动验证](docs/manual-verification.md)
- [实现执行文档](../../../docs/execution/2026-06-30-web-crlf-injection-lab.md)

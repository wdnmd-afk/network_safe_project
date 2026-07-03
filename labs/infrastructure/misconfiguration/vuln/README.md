# 配置风险观察版

## 定位

配置风险观察版用于从攻击方观察角度理解配置错误会暴露哪些风险信号。

当前处于 `in-progress` 阶段，后端受控 `audit` API 已可返回漏洞版固定配置风险信号。本目录仍不包含页面、真实配置样例、扫描器或攻击脚本。

## 后续观察目标

漏洞版只允许使用固定静态配置摘要展示：

- 调试入口可见。
- 目录索引可见。
- CORS 策略过宽。
- 管理状态页公开。
- 详细错误信息外显。
- 默认凭据提示可见，但不展示任何真实账号或密码。

## 预期学习信号

后续可观察信号包括：

- `misconfiguration-debug-surface-visible`
- `misconfiguration-directory-index-visible`
- `misconfiguration-cors-too-broad`
- `misconfiguration-admin-status-public`
- `misconfiguration-error-detail-exposed`
- `misconfiguration-default-credential-hint-visible`

## 当前 API 入口

```text
POST /api/labs/infrastructure/misconfiguration/vuln/audit
```

请求体只读取固定字段：

- `configCaseKey`
- `auditPolicyKey`

事件日志只记录固定 key、暴露面类别、风险标签、审计动作和学习信号。

## 禁止内容

- 不读取真实配置文件。
- 不展示真实服务路径、端口、账号、密码、token 或 Cookie。
- 不扫描端口、网段、域名、云资源或服务指纹。
- 不连接真实管理接口。
- 不提供弱口令测试、绕过认证、服务枚举或可复用利用流程。

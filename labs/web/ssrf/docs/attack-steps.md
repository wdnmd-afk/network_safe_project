# SSRF 攻击步骤

## 前置条件

1. 启动后端服务。
2. 启动前端服务。
3. 使用平台演示账号登录。
4. 进入 `/labs/web/ssrf/vuln`。

## 页面路径

1. 点击“填入攻击样例”。
2. 确认页面填入 URL：`http://169.254.169.254/latest/meta-data/iam/security-credentials/demo`。
3. 点击“抓取资源”。
4. 观察后端决策为 `accepted`。
5. 观察学习信号为 `ssrf-internal-metadata-exposed`。
6. 观察页面展示内部模拟资源。

## API 路径

请求仅允许发往本机实验服务：

```http
POST /api/labs/web/ssrf/vuln/fetch
Authorization: Bearer <local-session-token>
Content-Type: application/json
```

```json
{
  "targetUrl": "http://169.254.169.254/latest/meta-data/iam/security-credentials/demo"
}
```

预期结果：

- HTTP 状态码：`200`
- `result.signal`：`ssrf-internal-metadata-exposed`
- `result.decision`：`accepted`
- `result.inspection.privateTarget`：`true`
- `result.resource.resourceType`：`internal`

## 日志观察

后台应打印 `LAB_EVENT` 日志，数据库 `lab_event_logs` 中应记录：

- `labKey`: `web.ssrf`
- `variantKey`: `vuln`
- `phase`: `attack`
- `decision`: `accepted`
- `signal`: `ssrf-internal-metadata-exposed`
- `riskLevel`: `high`

日志中的 `inputSummaryJson` 只应包含 URL 长度、协议、主机、路径、是否白名单、是否内部目标和学习信号，不应包含真实凭据或真实外部目标信息。

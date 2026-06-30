# 目录遍历攻击步骤

## 前置条件

1. 启动后端服务。
2. 启动前端服务。
3. 使用平台演示账号登录。
4. 进入 `/labs/web/path-traversal/vuln`。

## 页面路径

1. 点击“填入攻击样例”。
2. 确认页面填入路径：`../internal/admin-note.txt`。
3. 点击“读取文档”。
4. 观察后端决策为 `accepted`。
5. 观察学习信号为 `path-traversal-sensitive-file-exposed`。
6. 观察页面展示内部模拟文档。

## API 路径

请求仅允许发往本机实验服务：

```http
POST /api/labs/web/path-traversal/vuln/read
Authorization: Bearer <local-session-token>
Content-Type: application/json
```

```json
{
  "requestedPath": "../internal/admin-note.txt"
}
```

预期结果：

- HTTP 状态码：`200`
- `result.signal`：`path-traversal-sensitive-file-exposed`
- `result.decision`：`accepted`
- `result.inspection.escapedAllowedRoot`：`true`
- `result.document.classification`：`internal`

## 日志观察

后台应打印 `LAB_EVENT` 日志，数据库 `lab_event_logs` 中应记录：

- `labKey`: `web.path-traversal`
- `variantKey`: `vuln`
- `phase`: `attack`
- `decision`: `accepted`
- `signal`: `path-traversal-sensitive-file-exposed`
- `riskLevel`: `high`

日志中的 `inputSummaryJson` 只应包含路径长度、规范化路径、是否包含遍历段、是否逃逸根目录和学习信号，不应包含真实系统路径。

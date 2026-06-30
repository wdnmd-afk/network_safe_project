# 文件上传攻击步骤

## 前置条件

1. 启动后端服务。
2. 启动前端服务。
3. 使用平台演示账号登录。
4. 进入 `/labs/web/file-upload/vuln`。

## 页面路径

1. 点击“填入攻击样例”。
2. 确认页面填入以下内容：
   - 文件名：`shell.php`
   - MIME：`application/x-php`
   - 模拟内容：`<?php echo 'local controlled sample'; ?>`
3. 点击“提交上传”。
4. 观察后端决策为 `accepted`。
5. 观察学习信号为 `file-upload-executable-stored`。
6. 观察页面出现 `/simulated-uploads/vuln/...` 的模拟存储路径。

## API 路径

请求仅允许发往本机实验服务：

```http
POST /api/labs/web/file-upload/vuln/upload
Authorization: Bearer <local-session-token>
Content-Type: application/json
```

```json
{
  "fileName": "shell.php",
  "contentType": "application/x-php",
  "contentText": "<?php echo 'local controlled sample'; ?>"
}
```

预期结果：

- HTTP 状态码：`200`
- `result.signal`：`file-upload-executable-stored`
- `result.decision`：`accepted`
- `result.storedAsset.storagePath`：存在模拟存储路径

## 日志观察

后台应打印 `LAB_EVENT` 日志，数据库 `lab_event_logs` 中应记录：

- `labKey`: `web.file-upload`
- `variantKey`: `vuln`
- `phase`: `attack`
- `decision`: `accepted`
- `signal`: `file-upload-executable-stored`
- `riskLevel`: `high`

日志中的 `inputSummaryJson` 只应包含扩展名、MIME、内容长度和检测布尔值，不应保存完整 `contentText`。

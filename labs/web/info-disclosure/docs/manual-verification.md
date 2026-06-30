# 信息泄露手动验证

## 验证矩阵

| 场景 | 页面 | 输入 | 预期结果 |
|---|---|---|---|
| 正常公开报告 | `/labs/web/info-disclosure/vuln` | `public-status` | 返回公开报告，信号为 `info-disclosure-public-report-returned` |
| 漏洞版调试报告 | `/labs/web/info-disclosure/vuln` | `debug-diagnostics` | 返回调试报告教学占位内容，信号为 `info-disclosure-debug-data-exposed` |
| 修复版公开报告 | `/labs/web/info-disclosure/fixed` | `public-status` | 返回公开报告，信号为 `info-disclosure-public-report-returned` |
| 修复版调试报告 | `/labs/web/info-disclosure/fixed` | `debug-diagnostics` | 返回阻断结果，信号为 `info-disclosure-debug-data-blocked` |

## API 验证

漏洞版：

```http
POST /api/labs/web/info-disclosure/vuln/report
Content-Type: application/json
Authorization: Bearer <local-demo-token>

{
  "reportKey": "debug-diagnostics"
}
```

修复版：

```http
POST /api/labs/web/info-disclosure/fixed/report
Content-Type: application/json
Authorization: Bearer <local-demo-token>

{
  "reportKey": "debug-diagnostics"
}
```

## 日志验证

统一事件日志应记录：

- `labKey`: `web.info-disclosure`
- `variantKey`: `vuln` 或 `fixed`
- `phase`: `attack` 或 `defense`
- `decision`: `accepted` 或 `blocked`
- `signal`: 对应学习信号

日志不应保存完整调试报告内容。

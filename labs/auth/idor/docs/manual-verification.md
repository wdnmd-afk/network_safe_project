# IDOR 手动验证

## 页面验证

1. 登录平台演示账号。
2. 打开 `/labs/auth/idor/vuln`。
3. 点击“读取自己订单”，再点击“读取订单”。
4. 确认页面显示 `idor-own-order-accepted`。
5. 点击“替换为他人订单”，再点击“读取订单”。
6. 确认漏洞版显示 `idor-cross-user-order-exposed`，并展示他人订单摘要。
7. 打开 `/labs/auth/idor/fixed`。
8. 点击“替换为他人订单”，再点击“读取订单”。
9. 确认修复版显示 `idor-cross-user-order-blocked`，不展示订单详情。

## API 验证

漏洞版请求：

```http
POST /api/labs/auth/idor/vuln/read
Content-Type: application/json

{
  "orderId": "order-2001"
}
```

预期：

- HTTP 200
- `status`: `ok`
- `signal`: `idor-cross-user-order-exposed`

修复版请求：

```http
POST /api/labs/auth/idor/fixed/read
Content-Type: application/json

{
  "orderId": "order-2001"
}
```

预期：

- HTTP 403
- `status`: `blocked`
- `signal`: `idor-cross-user-order-blocked`

## 日志验证

检查后端控制台和 `lab_event_logs`，确认日志包含：

- `labKey`: `auth.idor`
- `variantKey`: `vuln` 或 `fixed`
- `inputSummary.crossUserRequested`
- `decision`
- `signal`

日志不应保存真实订单隐私或完整敏感明细。

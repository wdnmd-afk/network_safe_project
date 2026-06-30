# CSRF 手动验证

## 验证矩阵

| 变体 | 操作 | 预期结果 |
|---|---|---|
| 漏洞版 | 点击 `模拟第三方请求` | 请求成功，余额减少，信号为 `csrf-transfer-accepted` |
| 修复版 | 点击 `模拟第三方请求` | 请求被阻断，余额不减少，信号为 `csrf-token-required` |
| 修复版 | 点击 `提交正常转账` | 请求成功，余额减少，信号为 `csrf-token-accepted` |

## 账户中心验证

1. 登录演示账号。
2. 在漏洞版或修复版完成对应验证动作。
3. 打开 `/account`。
4. 确认最近验证记录中出现 `CSRF` 与对应变体。

## 接口验证

漏洞版接口：

```text
POST /api/labs/web/csrf/vuln/transfer
```

修复版接口：

```text
POST /api/labs/web/csrf/fixed/token
POST /api/labs/web/csrf/fixed/transfer
```

所有接口都只面向本机受控学习环境。

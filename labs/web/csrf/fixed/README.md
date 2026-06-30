# CSRF 修复版

## 场景说明

修复版模拟后端颁发并校验一次性 CSRF token：

```text
POST /api/labs/web/csrf/fixed/token
POST /api/labs/web/csrf/fixed/transfer
```

页面加载修复版时先领取 token。正常提交转账会携带 token；模拟第三方请求故意不携带 token。

## 观察点

- 点击 `模拟第三方请求` 后，转账被阻断。
- 账户余额不因缺少 token 的请求减少。
- 页面显示 `csrf-token-required` 对应的说明。
- 点击 `提交正常转账` 时，携带 token 的请求可以成功。

## 修复原则

- 敏感写操作不能只依赖登录态。
- 后端应为可信页面颁发难以预测的 token。
- 后端必须在写操作时校验 token 与当前用户会话是否匹配。
- token 不应通过跨站页面可直接构造的方式固定化。

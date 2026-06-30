# CSRF 修复说明

## 修复思路

修复版通过一次性 CSRF token 绑定当前登录用户和可信页面：

1. 页面进入修复版时调用 `/api/labs/web/csrf/fixed/token`。
2. 后端为当前用户生成不可预测 token。
3. 正常转账请求携带 token。
4. 后端校验 token 匹配后才执行转账。
5. 模拟第三方请求不携带 token，因此被阻断。

## 当前实现边界

- token 存放在 Node 进程内存中，只服务于本机教学演示。
- 本实验不扩展数据库 schema。
- 当前 token 是一次性使用；正常提交成功后会重新领取。

## 后续可扩展方向

- 将 token 与真实 session 存储绑定。
- 增加 SameSite Cookie 对比实验。
- 增加 Origin / Referer 校验说明，但不把它作为唯一防护手段。

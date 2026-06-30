# CSRF

## 实验目标

本实验通过 SafeMart 账户转账业务演示 CSRF 风险：

- 漏洞版只校验登录态，不校验请求来源或 CSRF token。
- 修复版要求后端颁发的一次性 CSRF token。
- 用户可以在同一业务输入下观察漏洞版与修复版的行为差异。

## 前置条件

- 后端服务运行在 `http://localhost:6667`。
- 前端服务运行在 `http://localhost:6670`。
- 已准备演示账号，例如 `demo_user / Demo@123456`。
- 如需记录学习进度和验证结果，需要先执行实验元数据同步。

## 页面入口

- 漏洞版：`/labs/web/csrf/vuln`
- 修复版：`/labs/web/csrf/fixed`
- 实验详情：`/labs/web/csrf`

## 业务说明

页面模拟账户转账：

- `提交正常转账` 表示用户在当前页面主动发起业务请求。
- `模拟第三方请求` 表示本机受控模拟一个缺少 CSRF token 的跨站请求。
- 漏洞版会接受缺少 token 的请求，信号为 `csrf-transfer-accepted`。
- 修复版会阻断缺少 token 的请求，信号为 `csrf-token-required`。
- 修复版正常提交携带 token 时，信号为 `csrf-token-accepted`。

## 验证方式

手动验证见：

- `labs/web/csrf/docs/manual-verification.md`

脚本验证入口见：

- `tools/lab-scripts/web/csrf/verify.ts`

## 安全边界

本实验只服务于本机受控学习场景。脚本和文档仅描述本项目内的页面、接口和预期信号，不提供针对外部真实目标的利用能力。

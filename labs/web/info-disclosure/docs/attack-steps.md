# 信息泄露攻击步骤

## 前置条件

- 已登录平台演示账号。
- 后端服务已启动。
- 当前页面为 `/labs/web/info-disclosure/vuln`。

## 步骤

1. 点击“填入公开报告”，提交 `public-status`。
2. 观察正常业务响应，确认信号为 `info-disclosure-public-report-returned`。
3. 点击“填入攻击样例”，提交 `debug-diagnostics`。
4. 观察漏洞版返回的调试报告字段。
5. 查看后端控制台或数据库事件日志，确认本次请求记录为攻击阶段。

## 攻击方视角

攻击方并不需要真实凭据，只需要发现可控的 `reportKey` 能访问调试报告。调试信息本身可能帮助攻击方判断：

- 系统内部模块命名
- 配置键名习惯
- token 或 session 形态
- 错误处理路径

## 成功信号

```text
info-disclosure-debug-data-exposed
```

## 安全边界

本实验返回的调试内容全部是教学占位文本，不包含真实 token、真实环境变量、真实路径或真实日志。

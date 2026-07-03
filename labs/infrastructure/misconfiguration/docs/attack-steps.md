# 配置错误攻击方观察步骤

## 1. 观察目标

本文件只用于帮助学习者理解攻击方会关注哪些配置错误风险信号，不提供真实扫描、弱口令测试、服务枚举、配置修改或管理接口连接流程。

攻击方视角的核心问题是：哪些配置会让本应内部可见的服务状态、调试入口、目录列表、跨域策略或错误细节变成可观察风险。

## 2. 固定观察步骤

当前已完成 simulation ready 收口审计，学习者只应在前端固定配置审计工作台和后端受控 API 的固定样例范围内观察：

1. 打开 `/labs/infrastructure/misconfiguration/vuln`。
2. 选择固定配置样例，例如 `debug-console-exposed` 或 `wildcard-cors-with-credentials`。
3. 观察样例中是否存在调试入口、目录索引、公开管理状态页、过宽 CORS 或详细错误信息。
4. 选择固定审计策略，例如 `exposure-review`。
5. 观察漏洞版为什么会把这些信号保留为外部可见风险。
6. 记录学习信号，例如 `misconfiguration-debug-surface-visible` 或 `misconfiguration-cors-too-broad`。
7. 切换到配置审计复盘版，观察最小暴露面、认证要求、CORS 收敛和错误信息分层如何降低风险。

## 3. 当前入口状态

当前已建立文档、目录、元数据入口、前端固定工作台、后端受控 API、Playwright 页面级差异验证和本机只读一致性验证：

- `labs/infrastructure/misconfiguration/meta.json`
- `labs/infrastructure/misconfiguration/README.md`
- `tools/lab-scripts/infrastructure/misconfiguration/README.md`
- `/labs/infrastructure/misconfiguration/vuln`
- `/labs/infrastructure/misconfiguration/fixed`
- `POST /api/labs/infrastructure/misconfiguration/vuln/audit`
- `POST /api/labs/infrastructure/misconfiguration/fixed/audit`
- `tools/lab-scripts/infrastructure/misconfiguration/verify.ts`

当前未实现：

- `exploit.py`。
- 真实配置读取、真实服务扫描或真实管理接口连接。

## 4. 成功观察信号

当前 ready 阶段，学习者应能说明：

- 为什么调试入口和管理状态页不应默认公开。
- 为什么目录索引和详细错误信息可能泄露内部结构。
- 为什么过宽 CORS 会扩大浏览器信任边界。
- 为什么默认凭据提示即使不包含真实密码，也属于需要移除的风险信号。
- 为什么日志只能记录固定 key、风险标签和学习信号，不能保存真实配置、路径、端口或凭据。

## 5. 明确禁止

- 不扫描端口、网段、服务、域名或云资源。
- 不连接真实管理接口。
- 不读取真实配置文件、`.env`、服务配置或云凭据。
- 不提供弱口令测试、服务枚举、绕过认证或配置修改流程。
- 不输出可复用利用流程或攻击脚本。

# 端口扫描暴露面

## 1. 场景目标

本实验用于学习端口暴露面观察，不是端口扫描工具。

当前前端工作台和后端受控 API 会通过固定虚拟资产表展示：

- 攻击方如何从开放端口推断资产暴露面。
- 管理端口、调试端口和多余服务暴露为什么危险。
- 防御方如何通过最小暴露面、访问控制和资产清单审计降低风险。

## 2. 当前状态

当前状态为 `in-progress`。

本阶段只包含：

- 元数据入口。
- 基础文档。
- 漏洞版 / 修复版说明。
- mock 虚拟资产说明。
- 手动验证说明。
- 前端固定目标观察工作台。
- 后端受控虚拟资产观察 API。
- 前端 API client 与实验模型测试。
- 服务端 API 测试。
- Playwright 页面级差异验证。
- 本机只读一致性验证脚本。

当前不包含：

- 数据库迁移。
- `exploit.py`。
- 真实端口扫描脚本。

当前不提供 exploit.py 或真实扫描脚本。

## 3. 安全边界

本实验首版只允许使用固定虚拟资产表和虚拟端口状态。

只读验证要求持续成立：不扫描局域网、网段、外部 IP、域名或用户输入主机；不调用真实 socket、系统命令或扫描工具；事件日志不保存真实 IP、真实主机名、真实服务 banner、凭据、token 或 Cookie。

禁止：

- 扫描局域网、网段、外部 IP、域名或用户输入主机。
- 调用真实 socket、系统命令、PowerShell、`nmap`、`Test-NetConnection`、`ping`、`tracert` 或类似探测工具。
- 接收任意 IP、域名、端口范围、超时、并发或代理参数。
- 做并发扫描、压力探测、服务漏洞识别、认证绕过或利用。
- 保存真实 IP、真实主机名、真实服务 banner、凭据、token 或 Cookie。

## 4. 当前入口

当前已实现入口：

- 漏洞版页面：`/labs/network/port-scan/vuln`
- 修复版页面：`/labs/network/port-scan/fixed`
- 漏洞版 API：`POST /api/labs/network/port-scan/vuln/scan`
- 修复版 API：`POST /api/labs/network/port-scan/fixed/scan`
- 只读验证脚本：`tools/lab-scripts/network/port-scan/verify.ts`

请求体只允许使用：

```json
{
  "targetKey": "admin-node",
  "scanProfile": "surface-review"
}
```

页面只提供固定虚拟目标和固定观察模式选择器，不提供任意目标输入框。

## 5. 学习信号规划

当前页面和 API 使用以下学习信号：

- `port-scan-exposure-expanded`
- `port-scan-management-surface-visible`
- `port-scan-surface-reduced`
- `port-scan-target-blocked`
- `port-scan-normal-inventory-returned`

## 6. 下一步

下一步可在执行文档约束下进行 ready 收口审计，仍不创建真实扫描脚本。

# 攻击方观察步骤

## 1. 当前阶段

当前实验处于 `ready` 阶段，已提供前端固定样例观察工作台、后端受控内存解析 API、页面级验证和本机只读一致性验证脚本。

本文件只描述受控学习路径，不提供真实 DNS 修改、真实解析请求或网络劫持步骤。

## 2. 页面观察步骤

当前可通过本项目前端页面观察固定域名样例：

1. 登录本项目演示账号。
2. 进入 `/labs/network/dns-hijack/vuln` 漏洞版 DNS 劫持 / 污染工作台。
3. 选择一个固定域名样例，例如 `customer-portal`。
4. 选择固定解析视角，例如 `public-cache`。
5. 点击“观察解析结果”。
6. 查看期望虚拟地址类别、实际虚拟地址类别、证书状态和异常审计信号。
7. 切换到 `/labs/network/dns-hijack/fixed` 修复版，使用同一域名样例观察可信解析和证书校验后的差异。

## 3. API 观察步骤

当前 API 只能通过本项目后端受控接口观察固定样例：

1. 登录本项目演示账号，获取本机 session。
2. 选择固定 `domainKey` 和固定 `resolverProfile`。
3. 提交到 `POST /api/labs/network/dns-hijack/vuln/resolve` 或 `POST /api/labs/network/dns-hijack/fixed/resolve`。
4. 只检查返回的虚拟解析类别、证书状态、审计摘要和学习信号。
5. 对比漏洞版 `public-cache` 的异常信号和修复版 `public-cache` 的审计阻断信号。

## 4. 攻击方视角

本实验中的攻击方视角只用于理解解析链路风险：

- 错误解析结果可能把用户带到错误虚拟服务入口。
- 相似入口会增加误信风险。
- 证书不匹配、可信来源缺失和审计异常是关键观察信号。

## 5. 明确禁止

本实验不提供：

- 真实 DNS 投毒步骤。
- 真实 DNS 劫持步骤。
- DNS 隧道通信。
- 修改 hosts、DNS、代理、路由或防火墙的步骤。
- 任意域名、DNS 服务器、IP、代理、网络接口或端口输入。
- 可对外复用的 DNS 攻击脚本。

当前唯一脚本入口是 `tools/lab-scripts/network/dns-hijack/verify.ts`，只读取仓库文件，不执行真实 DNS 查询。

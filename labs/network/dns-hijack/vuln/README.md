# DNS 劫持 / 污染漏洞版说明

## 1. 当前状态

当前为 `ready` 阶段，已实现漏洞版页面 `/labs/network/dns-hijack/vuln`、漏洞版 `POST /api/labs/network/dns-hijack/vuln/resolve`、页面级验证和本机只读一致性验证。

## 2. 漏洞版目标

漏洞版用于展示固定域名样例被解析到错误虚拟地址后的风险。

建议观察点：

- `domainKey` 对应的期望虚拟地址类别。
- 漏洞版返回的错误虚拟地址类别。
- 证书状态是否变为 `mismatch`。
- 后端学习信号是否为 `dns-hijack-resolution-misdirected` 或 `dns-hijack-certificate-mismatch-visible`。
- 统一事件日志是否只记录固定样例摘要，不保存真实域名、真实 IP 或真实 DNS 响应。
- 前端页面是否只提交固定 `domainKey` 和固定 `resolverProfile`。

## 3. 攻击方视角

攻击方视角只用于理解风险：

- 错误解析结果会让用户访问错误的虚拟服务入口。
- 相似入口可能让用户忽略地址变化。
- 证书不匹配是防御方和用户都应观察的异常信号。

## 4. 明确禁止

当前和后续首版都不提供：

- 真实 DNS 投毒。
- 真实 DNS 劫持。
- DNS 隧道。
- 修改本机 DNS、hosts、代理、路由或防火墙的步骤。
- 可对外复用的攻击脚本。

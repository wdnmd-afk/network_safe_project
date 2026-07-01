# DNS 劫持 / 污染

## 1. 场景目标

本实验用于学习 DNS 解析链路中的错误解析和信任校验风险，不是真实 DNS 工具。

后续首版会通过固定内存解析表展示：

- 攻击方如何从错误解析结果观察用户被引向错误虚拟地址的风险。
- 证书状态不匹配为什么是重要的异常信号。
- 防御方如何通过可信解析源、证书校验和异常解析审计降低风险。

## 2. 当前状态

当前状态为 `planned`。

当前只包含：

- 元数据入口。
- 基础文档。
- 漏洞版 / 修复版说明。
- mock 内存解析表说明。
- 手动验证说明。
- 脚本目录边界说明。

当前不包含：

- 前端页面。
- 后端 API。
- 数据库迁移。
- 事件日志写入实现。
- `exploit.py`。
- `verify.ts`。
- 真实 DNS 查询脚本。

## 3. 安全边界

本实验首版只允许使用固定内存解析表和固定域名样例。

禁止：

- 修改本机 DNS、hosts、代理、路由、防火墙或系统网络配置。
- 请求真实外部 DNS、DoH、DoT 或公共解析服务。
- 实现真实 DNS 投毒、DNS 劫持、DNS 隧道、流量转发或中间人代理。
- 接收任意域名、DNS 服务器、IP、代理、网络接口或端口参数。
- 保存真实域名访问记录、真实 IP、真实证书、Cookie、token 或凭据。

## 4. 当前入口

当前只登记文档入口：

- 总说明：`labs/network/dns-hijack/README.md`
- 攻击步骤：`labs/network/dns-hijack/docs/attack-steps.md`
- 修复说明：`labs/network/dns-hijack/docs/fix-notes.md`
- 手动验证：`labs/network/dns-hijack/docs/manual-verification.md`

当前没有页面、API 或脚本入口。

## 5. 后续学习信号规划

后续页面和 API 可使用以下学习信号：

- `dns-hijack-resolution-misdirected`
- `dns-hijack-certificate-mismatch-visible`
- `dns-hijack-trusted-resolution-restored`
- `dns-hijack-anomaly-blocked`
- `dns-hijack-domain-blocked`
- `dns-hijack-normal-resolution-returned`

## 6. 下一步

下一步建议进入后端受控内存解析 API 切片，仍只允许固定 `domainKey` 和固定 `resolverProfile`，不请求真实 DNS，不创建 DNS 脚本。

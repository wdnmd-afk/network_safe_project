# 手动验证

## 1. 当前可验证内容

当前 `planned` 阶段可验证：

- `labs/network/dns-hijack/meta.json` 存在。
- `README.md`、`vuln/README.md`、`fixed/README.md`、`mock/README.md` 存在。
- 攻击步骤、修复说明和手动验证文档存在。
- `tools/lab-scripts/network/dns-hijack/README.md` 存在。
- 元数据只登记 docs 入口。
- 元数据未登记 web、api 或 scripts 入口。
- `verification.automation.supported` 为 `false`。
- 文档明确禁止真实 DNS 查询、系统配置修改、DNS 投毒、DNS 劫持和 DNS 隧道能力。

## 2. 预期信号

当前文档阶段只确认规划信号：

- `dns-hijack-planned-docs-reviewed`
- `dns-hijack-no-real-dns-confirmed`

后续实现阶段可再验证：

- `dns-hijack-resolution-misdirected`
- `dns-hijack-certificate-mismatch-visible`
- `dns-hijack-trusted-resolution-restored`
- `dns-hijack-anomaly-blocked`
- `dns-hijack-domain-blocked`
- `dns-hijack-normal-resolution-returned`

## 3. 不应出现的内容

当前阶段不应出现：

- `exploit.py`。
- `verify.ts`。
- 真实 DNS 查询脚本。
- 后端 DNS API。
- 前端 DNS 工作台页面。
- 修改 hosts、DNS、代理、路由或防火墙的命令。

## 4. 后续验证建议

后续进入实现阶段后，再补齐：

- 服务端 API 差异测试。
- 前端 API client 和实验模型测试。
- Playwright 页面差异验证。
- 本机只读一致性验证脚本。

在这些入口实现前，不能将本实验标记为 `ready`。

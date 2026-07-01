# 手动验证

## 1. 当前可验证内容

当前 `ready` 阶段可验证：

- `labs/network/dns-hijack/meta.json` 存在。
- `README.md`、`vuln/README.md`、`fixed/README.md`、`mock/README.md` 存在。
- 攻击步骤、修复说明和手动验证文档存在。
- `tools/lab-scripts/network/dns-hijack/README.md` 存在。
- 元数据已登记漏洞版 / 修复版 web 页面入口。
- 元数据已登记漏洞版 / 修复版 `resolve` API 入口。
- 元数据已登记 `dns-hijack-verify` 只读一致性验证脚本入口。
- `verification.automation.supported` 为 `true`，且当前登记 API 测试、Playwright 页面差异验证和只读脚本验证证据。
- Playwright 页面验证已覆盖漏洞版错误虚拟解析、修复版异常阻断和修复版可信解析恢复。
- `tools/lab-scripts/network/dns-hijack/verify.ts` 只读取仓库文件，不发起 HTTP 请求，不执行真实 DNS 查询。
- `/labs/network/dns-hijack/vuln` 页面只通过固定 `domainKey` 和固定 `resolverProfile` 观察漏洞版信号。
- `/labs/network/dns-hijack/fixed` 页面只通过固定 `domainKey` 和固定 `resolverProfile` 观察修复版信号。
- `POST /api/labs/network/dns-hijack/vuln/resolve` 可返回漏洞版错误虚拟解析和证书不匹配信号。
- `POST /api/labs/network/dns-hijack/fixed/resolve` 可返回可信解析恢复或异常解析阻断信号。
- 文档明确禁止真实 DNS 查询、系统配置修改、DNS 投毒、DNS 劫持和 DNS 隧道能力。

## 2. 预期信号

当前页面和 API 阶段可确认：

- `dns-hijack-resolution-misdirected`
- `dns-hijack-certificate-mismatch-visible`
- `dns-hijack-trusted-resolution-restored`
- `dns-hijack-anomaly-blocked`
- `dns-hijack-domain-blocked`
- `dns-hijack-normal-resolution-returned`
- `dns-hijack-readonly-boundary-verified`
- `dns-hijack-ready-boundary-verified`
- `dns-hijack-no-real-dns-confirmed`

## 3. 不应出现的内容

当前阶段不应出现：

- `exploit.py`。
- 真实 DNS 查询脚本。
- 修改 hosts、DNS、代理、路由或防火墙的命令。

## 4. 后续验证建议

当前可运行：

```text
pnpm --filter @network-safe/server test -- tests/dns-hijack-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts
pnpm --filter @network-safe/web exec vitest run tests/dns-hijack-api.test.ts tests/dns-hijack-lab.test.ts tests/router.test.ts
pnpm --filter @network-safe/testing e2e -- --grep "DNS 劫持"
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/network/dns-hijack/verify.ts
```

## 5. 只读脚本验证

可运行以下命令验证 DNS 劫持实验的本地文档、元数据、入口和安全边界一致：

```bash
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/network/dns-hijack/verify.ts
```

该脚本只读取仓库文件，不发起 HTTP 请求，不执行真实 DNS 查询，不读取或修改系统网络配置。

ready 状态仅表示本项目内固定内存解析表学习闭环完成，不表示提供真实 DNS 查询、真实 DNS 劫持或系统网络配置修改能力。

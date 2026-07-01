# DNS 劫持只读一致性验证执行文档

## 1. 目标

本轮目标是在 `network/dns-hijack` 已具备后端受控 API、前端固定样例工作台和 Playwright 页面差异验证的基础上，补齐本机只读一致性验证脚本。

该脚本只读取仓库内元数据、文档和实现文件，用于确认 DNS 劫持实验的入口、自动化证据和安全边界一致。本轮不创建 `exploit.py`，不执行真实 DNS 查询，不修改本机网络配置，也不将实验标记为 `ready`。

## 2. 范围

本轮新增：

- `tools/lab-scripts/network/dns-hijack/verify.ts`
- `docs/execution/2026-07-01-network-dns-hijack-readonly-verification.md`

本轮同步：

- `tools/lab-scripts/network/dns-hijack/README.md`
- `labs/network/dns-hijack/meta.json`
- `labs/network/dns-hijack/README.md`
- `labs/network/dns-hijack/docs/manual-verification.md`
- `packages/shared/tests/lab-metadata.test.mjs`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

## 3. 操作步骤

1. 新增 `verify.ts`，读取 `labs/network/dns-hijack/meta.json` 并调用共享元数据解析与校验函数。
2. 校验元数据保持 `network.dns-hijack` / `simulation` / `in-progress`。
3. 校验 web 入口只包含漏洞版和修复版 DNS 劫持工作台。
4. 校验 API 入口只包含漏洞版和修复版 `resolve` 接口。
5. 校验 scripts 入口只登记 `dns-hijack-verify` 这一只读验证脚本。
6. 校验自动化证据包含 Playwright 页面验证、服务端 API 测试和只读脚本验证。
7. 校验标准文档和脚本说明存在，并持续声明固定内存解析表、无真实 DNS 查询、无系统网络配置修改和无 `exploit.py` 边界。
8. 扫描 DNS 劫持相关实现文件，确认没有引入真实 DNS 模块、系统命令、公共解析服务、任意目标文本输入或脚本入口。
9. 更新元数据、共享测试和场景文档。
10. 运行最小必要验证与安全扫描。

## 4. 实施建议

- 复用 `tools/lab-scripts/network/port-scan/verify.ts` 的报告结构和只读检查方式。
- 脚本输出 JSON 报告，失败时设置 `process.exitCode = 1`，便于后续 CI 或人工复用。
- 禁止在脚本中发起 HTTP 请求、DNS 查询、系统命令或网络配置读取。
- 禁止登记 `exploit.py` 或任何真实 DNS 查询脚本。

## 5. 潜在风险

- 如果脚本读取真实 DNS 或系统配置，会突破本实验的内存解析表边界。
- 如果元数据提前标记 `ready`，会绕过最终完成标准审计。
- 如果 scripts 入口登记多个脚本，后续自动化可能误认为存在攻击脚本或真实验证脚本。
- 如果只校验文档存在而不校验实现片段，无法证明边界没有被代码突破。

## 6. 优化方案

- 脚本同时检查元数据、文档、前端、后端和 Playwright 文件，形成跨层一致性证据。
- 后续 ready 收口审计可以复用该脚本作为自动化证据之一。
- 本轮仍保持 `status: "in-progress"`，等只读脚本和完成标准审计都通过后再单独推进 ready。

## 7. 验证方式

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/network/dns-hijack/verify.ts`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/testing test`
- `pnpm --filter @network-safe/web exec vitest run tests/dns-hijack-api.test.ts tests/dns-hijack-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/server test -- tests/dns-hijack-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- 安全关键词扫描，确认未新增真实 DNS 查询、系统网络配置命令、真实投毒链路、真实隧道通信或 `exploit.py`。

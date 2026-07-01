# DNS 劫持目录与 planned 元数据执行文档

## 1. 目标

本轮目标是在 `docs/execution/2026-07-01-network-dns-hijack-lab.md` 的约束下，建立 `network/dns-hijack` 的标准实验目录、`planned` 元数据和基础文档入口。

本轮只建立文档和元数据入口，不实现页面、API、数据库迁移、事件日志写入、DNS 查询脚本或攻击脚本。

## 2. 范围

本轮新增：

- `labs/network/dns-hijack/meta.json`
- `labs/network/dns-hijack/README.md`
- `labs/network/dns-hijack/vuln/README.md`
- `labs/network/dns-hijack/fixed/README.md`
- `labs/network/dns-hijack/mock/README.md`
- `labs/network/dns-hijack/docs/attack-steps.md`
- `labs/network/dns-hijack/docs/fix-notes.md`
- `labs/network/dns-hijack/docs/manual-verification.md`
- `tools/lab-scripts/network/dns-hijack/README.md`

本轮同步：

- `packages/shared/tests/lab-metadata.test.mjs`
- `apps/server/tests/health.test.ts`
- `apps/server/tests/lab-registry.test.ts`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

## 3. 实施建议

- 元数据状态保持 `planned`。
- 模式使用 `simulation`。
- `entrypoints.docs` 登记真实文档入口。
- `entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 保持空数组。
- `verification.automation.supported` 保持 `false`。
- `variants[].supportsAutomation` 保持 `false`。
- 文档必须明确当前不提供真实 DNS 查询、系统配置修改、DNS 劫持脚本或通用网络篡改能力。

## 4. 潜在风险

- 如果登记未实现页面或 API，前端和测试会误以为实验可运行。
- 如果创建 `exploit.py`，容易被误解为可对外执行 DNS 攻击脚本。
- 如果文档提供 hosts、DNS、代理、路由或防火墙修改命令，可能影响学习者本机网络。
- 如果文档出现真实外部 DNS 查询示例，可能突破当前 planned 阶段边界。

## 5. 验证方式

- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check` 目标文件检查。
- 行尾空白检查。
- DNS 劫持安全关键词扫描，确认命中内容只属于禁止性说明、边界约束或文档状态记录。

# 端口扫描目录与 planned 元数据执行文档

## 1. 目标

本轮目标是在 `docs/execution/2026-06-30-network-port-scan-lab.md` 的约束下，建立 `network/port-scan` 的标准实验目录、`planned` 元数据和基础文档。

本轮只建立文档和元数据入口，不实现页面、API、数据库迁移、事件日志写入或扫描脚本。

## 2. 范围

本轮新增：

- `labs/network/port-scan/meta.json`
- `labs/network/port-scan/README.md`
- `labs/network/port-scan/vuln/README.md`
- `labs/network/port-scan/fixed/README.md`
- `labs/network/port-scan/mock/README.md`
- `labs/network/port-scan/docs/attack-steps.md`
- `labs/network/port-scan/docs/fix-notes.md`
- `labs/network/port-scan/docs/manual-verification.md`
- `tools/lab-scripts/network/port-scan/README.md`

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
- 文档必须明确当前不提供真实扫描脚本或通用扫描器能力。

## 4. 潜在风险

- 如果登记未实现页面或 API，前端和测试会误以为实验可运行。
- 如果创建 `exploit.py`，容易被误解为可对外扫描脚本。
- 如果文档出现真实命令示例，可能突破当前 planned 阶段边界。

## 5. 验证方式

- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check` 目标文件检查。
- 行尾空白检查。
- 端口扫描安全关键词扫描。


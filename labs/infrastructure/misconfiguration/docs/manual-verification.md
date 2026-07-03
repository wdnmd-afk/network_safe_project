# 手动验证

## 1. 当前可验证内容

当前 `ready` 阶段可验证：

- `labs/infrastructure/misconfiguration/meta.json` 存在。
- `README.md`、`vuln/README.md`、`fixed/README.md`、`mock/README.md` 存在。
- 攻击步骤、修复说明和手动验证文档存在。
- `tools/lab-scripts/infrastructure/misconfiguration/README.md` 存在。
- 元数据登记 docs、web、api 和 scripts 入口。
- `entrypoints.web` 包含：
  - `/labs/infrastructure/misconfiguration/vuln`
  - `/labs/infrastructure/misconfiguration/fixed`
- `entrypoints.api` 包含：
  - `POST /api/labs/infrastructure/misconfiguration/vuln/audit`
  - `POST /api/labs/infrastructure/misconfiguration/fixed/audit`
- `entrypoints.scripts` 只包含：
  - `tools/lab-scripts/infrastructure/misconfiguration/verify.ts`
- `verification.automation.supported` 为 `true`，已启用 API 测试证据、Playwright 页面级差异验证和本机只读一致性验证。
- `verification.automation.playwright.enabled` 为 `true`，`specPath` 为 `packages/testing/tests/e2e/platform.spec.mjs`。
- `verification.automation.scriptVerification.enabled` 为 `true`，`scriptKeys` 只包含 `misconfiguration-verify`。
- `variants[].supportsAutomation` 均为 `false`。
- 文档明确禁止真实配置读取、真实配置修改、真实服务扫描、真实管理接口连接和攻击脚本能力。

## 2. 预期信号

当前页面与 API 阶段可围绕以下学习信号验证：

- `misconfiguration-debug-surface-visible`
- `misconfiguration-directory-index-visible`
- `misconfiguration-cors-too-broad`
- `misconfiguration-admin-status-public`
- `misconfiguration-error-detail-exposed`
- `misconfiguration-default-credential-hint-visible`
- `misconfiguration-exposure-reduced`
- `misconfiguration-auth-required`
- `misconfiguration-cors-policy-restricted`
- `misconfiguration-safe-error-reporting`
- `misconfiguration-boundary-verified`

当前前端固定工作台、后端受控 `audit` 接口、Playwright 页面验证和本机只读脚本可观察或校验这些信号；仍不代表真实配置审计、真实扫描或真实连接能力已可运行。

## 3. 不应出现的内容

当前 ready 阶段不应出现：

- `exploit.py`。
- 真实配置文件。
- 扫描器、弱口令测试、服务枚举或配置修改脚本。

## 4. 最小验证建议

当前可运行：

```text
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/infrastructure/misconfiguration/verify.ts
pnpm --filter @network-safe/testing e2e -- --grep "配置错误"
pnpm --filter @network-safe/testing test
pnpm --filter @network-safe/shared test
pnpm --filter @network-safe/web exec vitest run tests/misconfiguration-api.test.ts tests/misconfiguration-lab.test.ts tests/router.test.ts
pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit
pnpm --filter @network-safe/server test -- tests/misconfiguration-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts
pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit
```

配套检查：

```text
git diff --check -- <本轮目标文件>
rg -n "[ \t]+$" -- <本轮目标文件>
rg --files labs/infrastructure/misconfiguration tools/lab-scripts/infrastructure/misconfiguration
```

ready 状态仅表示本项目内标准目录、元数据、基础文档入口、前端固定工作台、后端受控 API、Playwright 页面级差异验证和本机只读一致性验证形成固定配置样例学习闭环，不表示提供真实配置审计、真实扫描、真实连接或攻击脚本能力。

# 手动验证

## 1. 当前可验证内容

当前 `planned` 阶段可验证：

- `labs/infrastructure/misconfiguration/meta.json` 存在。
- `README.md`、`vuln/README.md`、`fixed/README.md`、`mock/README.md` 存在。
- 攻击步骤、修复说明和手动验证文档存在。
- `tools/lab-scripts/infrastructure/misconfiguration/README.md` 存在。
- 元数据只登记 docs 入口。
- `entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 为空数组。
- `verification.automation.supported` 为 `false`。
- `variants[].supportsAutomation` 均为 `false`。
- 文档明确禁止真实配置读取、真实配置修改、真实服务扫描、真实管理接口连接和攻击脚本能力。

## 2. 预期信号

后续实现阶段可围绕以下学习信号验证：

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

当前 planned 阶段只验证这些信号已写入元数据和文档，不代表页面或 API 已可运行。

## 3. 不应出现的内容

当前阶段不应出现：

- `exploit.py`。
- `verify.ts`。
- 前端页面入口。
- 后端 API 入口。
- 真实配置文件。
- 扫描器、弱口令测试、服务枚举或配置修改脚本。

## 4. 最小验证建议

当前可运行：

```text
pnpm --filter @network-safe/shared test
pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts
```

配套检查：

```text
git diff --check -- <本轮目标文件>
rg -n "[ \t]+$" -- <本轮目标文件>
rg --files labs/infrastructure/misconfiguration tools/lab-scripts/infrastructure/misconfiguration
```

planned 状态仅表示本项目内标准目录、元数据和基础文档入口建立完成，不表示提供真实配置审计、真实扫描、真实连接或攻击脚本能力。

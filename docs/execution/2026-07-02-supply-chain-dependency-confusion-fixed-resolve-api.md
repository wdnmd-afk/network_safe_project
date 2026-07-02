# 依赖混淆后端固定解析 API 执行文档

## 1. 目标

本轮目标是在 `supply-chain/dependency-confusion` 已完成 planned 元数据的基础上，新增后端固定解析服务和受控 API：

```text
POST /api/labs/supply-chain/dependency-confusion/:variant/resolve
```

API 只接受固定 `manifestKey`、固定 `registryScenarioKey` 和固定 `resolutionPolicyKey`，用于观察依赖解析风险和防御审计结果。

本轮不实现前端页面、不新增脚本、不访问真实 registry、不读取真实依赖配置、不运行安装 / 发布 / 登录 / 下载 / 打包命令。

## 2. 范围

本轮新增：

- `apps/server/src/services/dependency-confusion-lab.ts`
- `apps/server/tests/dependency-confusion-lab.test.ts`
- `docs/execution/2026-07-02-supply-chain-dependency-confusion-fixed-resolve-api.md`

本轮同步：

- `apps/server/src/app.ts`
- `labs/supply-chain/dependency-confusion/meta.json`
- `labs/supply-chain/dependency-confusion/README.md`
- `labs/supply-chain/dependency-confusion/vuln/README.md`
- `labs/supply-chain/dependency-confusion/fixed/README.md`
- `labs/supply-chain/dependency-confusion/mock/README.md`
- `labs/supply-chain/dependency-confusion/docs/attack-steps.md`
- `labs/supply-chain/dependency-confusion/docs/fix-notes.md`
- `labs/supply-chain/dependency-confusion/docs/manual-verification.md`
- `packages/shared/tests/lab-metadata.test.mjs`
- `apps/server/tests/health.test.ts`
- `apps/server/tests/lab-registry.test.ts`
- `docs/TODO.md`
- `docs/design/next-wave-security-labs.md`
- `docs/execution/security-lab-master-goal.md`

## 3. 实施步骤

1. 新增依赖混淆后端服务，内置固定 manifest、伪 registry 场景和固定解析策略。
2. 新增 `resolveDependency` 方法，只返回确定性学习结果。
3. 在 `app.ts` 中新增服务依赖、变体读取、输入摘要整理函数和 API 路由。
4. API 请求体只读取 `manifestKey`、`registryScenarioKey` 和 `resolutionPolicyKey`。
5. 接入 `recordLabEventSafely`，日志摘要只记录固定 key、来源类别、风险标签数量、审计动作、是否命中固定样例和学习信号。
6. 更新元数据状态为 `in-progress`，登记漏洞版 / 修复版 API 入口和 API 测试证据。
7. 更新场景文档，说明当前已具备后端 API，但仍无页面、脚本或真实依赖生态连接。
8. 补齐服务端测试，覆盖漏洞版错误来源选择、修复版私有来源固定、lockfile 完整性阻断、正常公开依赖可接受、未知 key 脱敏阻断和日志摘要脱敏。
9. 更新进度文档。
10. 运行最小必要验证。

## 4. 固定字段

本轮确认并使用以下请求字段：

- `manifestKey`
- `registryScenarioKey`
- `resolutionPolicyKey`

固定 manifest：

- `unscoped-internal-name`
- `scoped-private-package`
- `mixed-source-review`

固定伪 registry 场景：

- `public-name-collision`
- `private-scope-pinned`
- `lockfile-integrity-mismatch`

固定解析策略：

- `prefer-public-latest`
- `scope-pinned-private`
- `lockfile-integrity-audit`

## 5. 实施建议

- 服务层只使用内存固定数据，不读取 `package.json`、lockfile、`.npmrc`、环境变量或真实依赖缓存。
- 未知 key 必须返回安全占位值，例如 `blocked-manifest`、`blocked-registry-scenario`、`blocked-policy`，不得回显原始输入。
- 漏洞版重点展示 `prefer-public-latest` 在未绑定 scope 时产生的错误来源选择。
- 修复版重点展示私有 scope 固定、来源审计和 lockfile 完整性阻断。
- 正常公开依赖路径必须保持可接受，避免把修复版做成“全部阻断”。
- 事件日志风险摘要只记录固定 key 和统计信息，不记录真实包名、真实 registry 地址、token、Cookie、凭据、内部组织名或本机路径。

## 6. 潜在风险

- 如果 API 接受任意包名或 manifest 正文，可能诱导学习者把真实项目依赖信息传入服务。
- 如果服务读取本机 `.npmrc`、环境变量 token 或依赖缓存，会引入真实敏感信息风险。
- 如果实现安装、发布、登录、下载或打包动作，会突破本项目供应链安全边界。
- 如果日志保存完整 manifest、真实包名清单或 registry 地址，可能泄露组织命名习惯和私有源信息。
- 如果未知 key 被原样写入响应或日志，可能间接保存真实包名、路径或凭据。

## 7. 优化方案

- 使用固定 key 和来源类别替代包名与 registry 地址。
- 使用风险标签数量、审计动作和学习信号替代完整解析过程。
- 将真实生产中的复杂防护拆解为 scope 固定、私有 registry 绑定、lockfile 完整性校验和来源审计四个可观察点。
- 后续前端工作台只复用这些固定 key，不新增任意输入框。
- 后续只读脚本只校验仓库内元数据、文档、服务和测试入口，不执行依赖生态命令。

## 8. 验证方式

- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/dependency-confusion-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- 依赖混淆危险实现标记扫描，确认未新增真实安装、发布、登录、registry 网络请求、动态执行、子进程调用、生命周期脚本或凭据读取实现。

## 9. 本轮完成条件

- 后端服务只处理固定 `manifestKey`、`registryScenarioKey` 和 `resolutionPolicyKey`。
- API 已接入统一事件日志安全摘要。
- 元数据从 `planned` 更新为 `in-progress`，并只登记 API 和 docs 入口，不登记 web 或 scripts 入口。
- 服务端测试覆盖漏洞版、修复版、正常公开依赖、未知 key 脱敏和日志摘要。
- 场景文档和进度文档同步当前 API 阶段。
- 最小必要验证通过后再提交。

## 10. 本轮执行结果

本轮已完成后端固定解析 API 切片：

- 新增 `apps/server/src/services/dependency-confusion-lab.ts`，只使用内存固定 manifest、伪 registry 场景和解析策略。
- 新增 `POST /api/labs/supply-chain/dependency-confusion/:variant/resolve`。
- API 请求体只读取 `manifestKey`、`registryScenarioKey` 和 `resolutionPolicyKey`。
- 漏洞版可观察 `dependency-confusion-public-source-selected` 和 `dependency-confusion-private-scope-missing`。
- 修复版可观察 `dependency-confusion-private-scope-pinned`、`dependency-confusion-lockfile-integrity-blocked` 和 `dependency-confusion-safe-public-package-accepted`。
- API 已接入统一事件日志，日志摘要只记录固定 key、来源类别、风险标签数量、审计动作、是否命中固定样例和学习信号。
- 新增 `apps/server/tests/dependency-confusion-lab.test.ts`，覆盖漏洞版公共来源选择、修复版私有 scope 固定、lockfile 完整性阻断、正常公开依赖可接受、未知 key 不回显和日志摘要脱敏。
- `labs/supply-chain/dependency-confusion/meta.json` 已更新为 `in-progress`，只登记 docs 和 api 入口，不登记 web 或 scripts 入口。
- 场景 README、漏洞版 / 修复版说明、固定模拟数据说明、攻击步骤、修复说明、手动验证和脚本目录说明已同步 API 阶段。
- 当前仍不提供前端页面、`exploit.py`、`verify.ts`、真实安装、真实发布、registry 连接、凭据读取、生命周期脚本或攻击脚本。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，32 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/dependency-confusion-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，195 项通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- `git diff --check` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 依赖混淆服务实现窄危险能力扫描无命中；目标范围危险关键词扫描仅命中测试中的反向脱敏断言和禁止性说明。

# 依赖混淆目录与 planned 元数据执行文档

## 1. 目标

本轮目标是在 `docs/execution/2026-07-02-supply-chain-dependency-confusion-lab.md` 的约束下，建立 `supply-chain/dependency-confusion` 的标准实验目录、`planned` 元数据和基础文档入口。

本轮只建立文档和元数据入口，不实现页面、API、数据库写入、事件日志写入、真实依赖安装、真实 registry 连接、包发布、生命周期脚本或攻击脚本。

## 2. 范围

本轮新增：

- `labs/supply-chain/dependency-confusion/meta.json`
- `labs/supply-chain/dependency-confusion/README.md`
- `labs/supply-chain/dependency-confusion/vuln/README.md`
- `labs/supply-chain/dependency-confusion/fixed/README.md`
- `labs/supply-chain/dependency-confusion/mock/README.md`
- `labs/supply-chain/dependency-confusion/docs/attack-steps.md`
- `labs/supply-chain/dependency-confusion/docs/fix-notes.md`
- `labs/supply-chain/dependency-confusion/docs/manual-verification.md`
- `tools/lab-scripts/supply-chain/dependency-confusion/README.md`

本轮同步：

- `packages/shared/tests/lab-metadata.test.mjs`
- `apps/server/tests/health.test.ts`
- `apps/server/tests/lab-registry.test.ts`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

## 3. 实施建议

- 元数据状态保持 `planned`。
- 模式使用 `simulation`，表示首版只做固定 manifest 和伪 registry 元数据解析风险观察。
- `entrypoints.docs` 只登记真实存在的文档入口。
- `entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 保持空数组。
- `verification.automation.supported` 保持 `false`。
- `variants[].supportsAutomation` 保持 `false`。
- 文档必须明确当前不运行安装命令、不访问真实 registry、不发布真实包、不读取真实凭据、不创建生命周期脚本、不提供 `exploit.py`。

## 4. 潜在风险

- 如果登记未实现页面或 API，平台会误以为依赖混淆实验已经可运行。
- 如果提供安装、发布、登录、下载或打包命令，可能误触真实包生态。
- 如果读取 `.npmrc`、环境变量 token 或 CI 凭据，会引入真实敏感信息风险。
- 如果创建包归档、生命周期脚本或 `exploit.py`，容易让学习场景变成可复用投毒入口。
- 如果文档记录完整内部包名清单或真实 registry 地址，可能泄露组织命名习惯和私有源信息。

## 5. 优化方案

- 使用固定 `manifestKey`、`registryScenarioKey` 和 `resolutionPolicyKey` 描述后续学习样例，但实现前仍需再次按共享类型和服务设计确认字段。
- 使用伪 registry 元数据、来源类别和风险标签替代真实 registry 请求。
- 使用文档说明攻击方观察路径，避免提供真实包发布或安装流程。
- 后续 API 只接受固定 key，并将日志摘要限制为来源类别、风险标签、审计动作和学习信号。
- 后续只读验证脚本只检查仓库内元数据、文档和边界，不读取真实凭据或连接外部服务。

## 6. 验证方式

- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check` 目标文件检查。
- 行尾空白检查。
- 依赖混淆安全关键词扫描，确认命中内容只属于禁止性说明、边界约束、历史进度或字段 / 路径名。
- `rg --files tools/lab-scripts/supply-chain/dependency-confusion labs/supply-chain/dependency-confusion` 确认当前脚本目录只包含 README，场景目录只包含元数据和文档。

## 7. 本轮完成条件

- `supply-chain/dependency-confusion` 标准目录和 planned 元数据存在。
- 元数据只登记 docs 入口，不登记 web、api 或 scripts 入口。
- README、漏洞版说明、修复版说明、mock 说明、攻击方观察步骤、修复说明和手动验证文档存在。
- 脚本目录只提供 README，不提供 `exploit.py` 或 `verify.ts`。
- 共享元数据测试和服务端索引测试同步新增场景总数与 planned 条目。
- 进度文档同步 `supply-chain/dependency-confusion` 已进入 planned 元数据阶段。

## 8. 本轮执行结果

本轮已完成目录与 planned 元数据切片：

- 新增 `labs/supply-chain/dependency-confusion/meta.json`，状态为 `planned`，模式为 `simulation`。
- 新增 README、解析风险观察版说明、来源审计复盘版说明、固定模拟数据说明、攻击方观察步骤、修复说明和手动验证文档。
- 新增 `tools/lab-scripts/supply-chain/dependency-confusion/README.md`，当前只说明脚本边界，不提供 `exploit.py` 或 `verify.ts`。
- 元数据当前只登记 docs 入口，`entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 均为空数组。
- `verification.automation.supported` 为 `false`，`variants[].supportsAutomation` 均为 `false`。
- 更新共享元数据测试，确认依赖混淆 planned/docs-only 元数据合法。
- 更新服务端 health / registry 测试，本地元数据总数从 23 增加到 24，并确认 `supply-chain.dependency-confusion` 为 planned 条目。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，32 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，186 项通过。
- `git diff --check -- <本轮目标文件>` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- `rg --files tools/lab-scripts/supply-chain/dependency-confusion labs/supply-chain/dependency-confusion` 确认当前脚本目录只包含 README，场景目录只包含元数据和文档。
- 依赖混淆供应链危险实现标记扫描未发现真实发布、登录、registry 网络请求、动态执行、子进程调用或生命周期脚本实现。

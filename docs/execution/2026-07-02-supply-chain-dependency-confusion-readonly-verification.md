# 依赖混淆只读一致性验证执行文档

## 1. 目标

本轮目标是在 `supply-chain/dependency-confusion` 已具备文档、元数据、前端固定选择器工作台、后端受控 `resolve` API、服务端 API 测试和 Playwright 页面级差异验证的基础上，补齐本机只读一致性验证脚本。

脚本只读取仓库内元数据、文档、前端、后端和测试文件，验证入口、固定 key、安全边界和自动化证据是否一致。脚本不发起 HTTP 请求，不安装依赖，不访问真实 registry，不读取真实凭据，不创建包归档，不执行生命周期脚本，也不提供攻击脚本。

## 2. 范围

本轮新增或修改：

- `tools/lab-scripts/supply-chain/dependency-confusion/verify.ts`
- `tools/lab-scripts/supply-chain/dependency-confusion/README.md`
- `labs/supply-chain/dependency-confusion/meta.json`
- `packages/shared/tests/lab-metadata.test.mjs`
- `labs/supply-chain/dependency-confusion/README.md`
- `labs/supply-chain/dependency-confusion/docs/manual-verification.md`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

本轮不包含：

- 不新增 `exploit.py`。
- 不新增 Python 攻击脚本。
- 不新增安装、发布、登录、下载、打包、registry 连接或生命周期脚本。
- 不访问真实 npm、pnpm、PyPI、Maven、私有 registry 或镜像源。
- 不读取 `.npmrc`、`.yarnrc`、`.pypirc`、环境变量 token、registry 凭据、CI 凭据或真实依赖缓存。
- 不把实验标记为 `ready`。

## 3. 已确认上下文

- 元数据 ID 为 `supply-chain.dependency-confusion`。
- 当前状态为 `simulation` / `in-progress`。
- 页面入口为 `/labs/supply-chain/dependency-confusion/vuln` 与 `/labs/supply-chain/dependency-confusion/fixed`。
- API 入口为 `/api/labs/supply-chain/dependency-confusion/vuln/resolve` 与 `/api/labs/supply-chain/dependency-confusion/fixed/resolve`。
- 前端请求体只包含 `manifestKey`、`registryScenarioKey` 和 `resolutionPolicyKey`。
- Playwright 已覆盖漏洞版公共来源选择、修复版私有 scope 固定、修复版完整性阻断和修复版正常公开依赖审计放行。
- `variants[].supportsAutomation` 当前均为 `false`，避免把只读验证或页面验证误标为攻击脚本自动化。

## 4. 操作步骤

1. 新增 `tools/lab-scripts/supply-chain/dependency-confusion/verify.ts`。
2. 脚本读取并校验 `labs/supply-chain/dependency-confusion/meta.json`。
3. 脚本调用共享 `parseLabMetadataJson` 和 `validateLabMetadata`，避免自定义猜测字段。
4. 脚本校验 web / api / docs / scripts 入口与当前文件结构一致。
5. 脚本校验自动化证据包含 Playwright、服务端 API 测试和只读脚本验证。
6. 脚本校验 `entrypoints.scripts` 只登记自身，不登记 `exploit.py`。
7. 脚本校验 `variants[].supportsAutomation` 仍为 `false`。
8. 脚本读取依赖混淆 README、漏洞版 / 修复版 / mock / attack / fix / manual 文档和脚本 README，确认固定 key、安全边界、禁止真实 registry 和禁止 `exploit.py` 的说明持续存在。
9. 脚本读取前端 API client，确认请求体只提交 `manifestKey`、`registryScenarioKey` 和 `resolutionPolicyKey`。
10. 脚本读取后端服务、后端路由、前端模型、前端页面和 Playwright 用例，确认没有新增真实安装、发布、registry 连接、命令执行、外部 URL、任意包名输入或真实凭据读取实现。
11. 更新元数据 scripts 入口和 `verification.automation.scriptVerification`。
12. 更新共享元数据测试和相关文档。
13. 运行最小必要验证并提交。

## 5. 实施建议

- 复用 Prompt 注入、DNS 劫持、端口扫描和网络钓鱼只读验证脚本的结构。
- 脚本只使用 `readFileSync` / `existsSync` 读取仓库文件，不发起网络请求。
- 通过字符串拼接规避在脚本自身出现危险关键词导致误报。
- 检查实现文件时只扫描与依赖混淆相关的前端、后端和 Playwright 文件，避免历史文档中的安全边界说明造成噪音。
- 保持脚本输出 JSON 报告，失败时设置 `process.exitCode = 1`。

## 6. 潜在风险

- 如果脚本只校验元数据存在，无法证明页面、API、文档和测试之间的一致性。
- 如果脚本扫描范围过宽，会把历史实验文档中的 `exploit.py`、token 或命令注入说明误报为本轮问题。
- 如果把只读验证登记为攻击脚本自动化，会破坏依赖混淆供应链场景的安全边界。
- 如果脚本读取 `.npmrc` 或真实 manifest，会突破当前只读边界；本轮只允许读取仓库内实验文件和实现文件。

## 7. 优化方案

- 本轮先补只读一致性验证，后续再单独执行 ready 收口审计。
- 后续 ready 审计应继续检查 `exploit.py` 缺失是否属于显式安全边界，而不是遗漏。
- 若更多供应链实验落地，可抽取通用只读边界检查辅助函数；本轮保持局部实现，避免提前抽象。

## 8. 验证方式

本轮最小必要验证：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/supply-chain/dependency-confusion/verify.ts`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/web exec vitest run tests/dependency-confusion-api.test.ts tests/dependency-confusion-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/server test -- tests/dependency-confusion-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `pnpm --filter @network-safe/testing test`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- 依赖混淆相关变更安全关键词扫描，确认未新增真实安装、真实发布、registry 连接、凭据读取、生命周期脚本、包归档、命令执行或攻击脚本实现。

## 9. 本轮完成条件

- 只读验证脚本能输出 `ok: true`。
- 元数据登记 `dependency-confusion-verify` scripts 入口和脚本验证证据。
- scripts 入口只包含 `verify.ts`，仍不包含 `exploit.py`。
- `variants[].supportsAutomation` 仍为 `false`。
- 场景文档明确只读脚本不是攻击脚本，不连接真实包生态。
- 最小必要验证通过后提交。

## 10. 实际验证记录

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/supply-chain/dependency-confusion/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，32 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/dependency-confusion-api.test.ts tests/dependency-confusion-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/dependency-confusion-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，195 项通过。
- `git diff --check` 通过，仅提示工作区 LF 后续会按 Git 设置转换为 CRLF，无格式错误。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中，目标文件未发现尾随空白。
- `rg --files tools/lab-scripts/supply-chain/dependency-confusion` 输出仅包含 `README.md` 和 `verify.ts`，未发现 `exploit.py`。
- 依赖混淆实现文件安全关键词扫描无命中，未发现真实安装、真实发布、registry URL、任意包名输入、命令执行、文本输入框或生命周期脚本能力。

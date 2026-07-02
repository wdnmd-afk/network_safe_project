# 依赖混淆页面级 Playwright 验证执行文档

## 1. 目标

本轮目标是在 `supply-chain/dependency-confusion` 已具备前端固定选择器工作台和后端受控固定解析 API 的基础上，补齐页面级 Playwright 差异验证。

验证重点是确认学习者登录后可以在漏洞版页面观察未绑定 scope 与伪公共来源同名碰撞带来的错误解析信号，在修复版页面观察私有 scope 固定、lockfile 完整性阻断和正常公开依赖审计放行三条路径。

本轮不创建 `exploit.py`、`verify.ts` 或 scripts 入口，不运行真实依赖安装、登录、下载、打包或发布命令，不连接真实 registry，不读取 `.npmrc`、token、Cookie、凭据、真实 manifest、内部组织名或本机路径。

## 2. 范围

本轮新增或修改：

- `packages/testing/tests/e2e/platform.spec.mjs`
- `labs/supply-chain/dependency-confusion/meta.json`
- `packages/shared/tests/lab-metadata.test.mjs`
- `labs/supply-chain/dependency-confusion/README.md`
- `labs/supply-chain/dependency-confusion/docs/manual-verification.md`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

本轮不包含：

- 不新增攻击脚本、验证脚本或脚本入口。
- 不新增数据库迁移。
- 不改变后端固定解析 API 字段。
- 不把实验标记为 `ready`。
- 不提供任意包名、registry URL、安装参数、发布参数、包归档或生命周期脚本输入。

## 3. 已确认上下文

- 前端页面入口为 `/labs/supply-chain/dependency-confusion/vuln` 与 `/labs/supply-chain/dependency-confusion/fixed`。
- 后端 API 为 `POST /api/labs/supply-chain/dependency-confusion/:variant/resolve`。
- 前端请求体只包含固定 `manifestKey`、`registryScenarioKey` 和 `resolutionPolicyKey`。
- 当前元数据为 `simulation` / `in-progress`，已登记 web 和 api 入口，scripts 入口为空。
- Playwright 全局 setup 会准备演示账号 `demo_user / Demo@123456`，并同步本地实验元数据。

## 4. 操作步骤

1. 在 `packages/testing/tests/e2e/platform.spec.mjs` 新增依赖混淆页面差异验证。
2. 用例登录 `demo_user`，只访问本项目本机页面和本机 API 代理。
3. 漏洞版进入 `/labs/supply-chain/dependency-confusion/vuln`。
4. 断言页面标题为“依赖混淆解析风险观察版”，且页面没有文本输入框。
5. 点击固定“未绑定 scope”按钮和“观察解析结果”按钮。
6. 断言漏洞版出现“漏洞版选择了伪公共来源”、`accepted` 决策、`public-registry` 解析来源、`untrusted` 来源信任、`missing` scope 状态和 `missing` lockfile 状态。
7. 修复版进入 `/labs/supply-chain/dependency-confusion/fixed`。
8. 断言页面标题为“依赖混淆来源审计复盘版”，且页面没有文本输入框。
9. 点击固定“私有 scope”按钮和“观察解析结果”按钮。
10. 断言修复版出现“修复版私有 scope 已固定”、`accepted` 决策、`private-registry` 解析来源、`trusted` 来源信任、`pinned` scope 状态和 `verified` lockfile 状态。
11. 点击固定“完整性审计”按钮和“观察解析结果”按钮。
12. 断言修复版出现“修复版完整性审计已阻断”、`blocked` 决策、`blocked-audit` 解析来源、`blocked` 来源信任和 `mismatch` lockfile 状态。
13. 点击固定“混合来源”按钮和“观察解析结果”按钮。
14. 断言修复版出现“正常公开依赖已审计放行”、`accepted` 决策、`mixed-audited` 解析来源和 `audited` 来源信任。
15. 更新元数据 Playwright 自动化证据，保持 scripts 入口为空，保持 `variants[].supportsAutomation` 为 `false`。
16. 更新共享元数据测试和相关文档。
17. 执行最小必要验证后提交。

## 5. 实施建议

- 复用现有 LDAP、端口扫描、DNS 劫持和 Prompt 注入页面级验证的登录与状态面板断言风格。
- 页面断言优先使用可见文案、固定按钮和 `.dependency-confusion-status-panel` 内的指标值。
- 通过 `getByRole("textbox")` 数量为 0 辅助确认页面未提供任意包名、registry URL、凭据或 manifest 输入。
- 元数据只登记 Playwright 页面证据，不登记 scripts 入口。
- 本轮仍保持 `in-progress`，后续如需 `ready` 收口，应另写 ready 审计执行文档。

## 6. 潜在风险

- 如果只断言页面可打开，无法证明漏洞版与修复版差异。
- 如果断言过宽，可能在状态面板未正确更新时误判通过。
- 如果在测试中引入任意包名、registry URL 或真实依赖参数，会突破当前固定样例边界。
- 如果把 Playwright 页面验证误解为攻击脚本自动化，会导致元数据语义混乱。
- Playwright 依赖本机 Chrome channel、端口和种子数据，环境异常可能导致 e2e 失败。

## 7. 优化方案

- 本轮先补页面级验证，后续可补只读一致性验证脚本。
- 后续若要推进 `ready`，需要审计 API 差异、页面差异、文档边界和脚本边界是否满足完成标准。
- 若 `platform.spec.mjs` 继续膨胀，后续可按实验类别拆分 e2e spec，但本轮先保持现有集中入口。

## 8. 验证方式

本轮最小必要验证：

- `pnpm --filter @network-safe/testing e2e -- --grep "依赖混淆"`
- `pnpm --filter @network-safe/testing test`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/web exec vitest run tests/dependency-confusion-api.test.ts tests/dependency-confusion-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/server test -- tests/dependency-confusion-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- 依赖混淆相关变更安全关键词扫描，确认未新增真实安装、真实发布、registry 连接、凭据读取、生命周期脚本、包归档或攻击脚本实现。

## 9. 本轮完成条件

- Playwright 能覆盖漏洞版错误公共来源选择、修复版私有 scope 固定、修复版完整性阻断和修复版正常公开依赖审计放行。
- 页面级验证确认没有文本输入框。
- 元数据登记 Playwright 自动化证据，scripts 入口仍为空。
- 文档说明当前仍不提供攻击脚本、真实 registry、真实安装 / 发布流程、任意包名输入或凭据读取。
- 最小必要验证通过后再提交。

## 10. 本轮验证记录

- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/testing e2e -- --grep "依赖混淆"` 通过，1 项 Playwright 测试通过。
- `pnpm --filter @network-safe/shared test` 通过，32 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/dependency-confusion-api.test.ts tests/dependency-confusion-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/dependency-confusion-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，195 项通过。
- `git diff --check` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- `rg --files tools/lab-scripts/supply-chain/dependency-confusion` 确认脚本目录当前仍只包含 README。
- 依赖混淆页面验证安全关键词扫描仅命中禁止性说明、元数据安全边界、历史共享元数据断言和既有 CSRF token 页面文案，未发现本轮新增真实安装、真实发布、registry 连接、凭据读取、生命周期脚本、命令执行或攻击脚本实现。

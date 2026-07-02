# 依赖混淆前端解析观察工作台执行文档

## 1. 目标

本轮目标是在 `supply-chain/dependency-confusion` 后端固定 `resolve` API 基础上，新增前端依赖解析观察工作台。

工作台用于引导学习者从攻击方和防御方视角观察固定 `manifestKey`、固定 `registryScenarioKey` 和固定 `resolutionPolicyKey` 组合在解析风险观察版 / 来源审计复盘版中的差异。

本轮不创建攻击脚本、只读验证脚本、Playwright 用例、数据库迁移、真实依赖安装、真实 registry 连接、真实包发布、包归档、生命周期脚本、`.npmrc` 读取或凭据读取能力。

## 2. 范围

本轮新增：

- `apps/web/src/api/dependency-confusion-lab.ts`
- `apps/web/src/labs/dependency-confusion.ts`
- `apps/web/src/views/DependencyConfusionLabView.vue`
- `apps/web/tests/dependency-confusion-api.test.ts`
- `apps/web/tests/dependency-confusion-lab.test.ts`

本轮同步：

- `apps/web/src/router/routes.ts`
- `apps/web/src/styles/main.css`
- `apps/web/tests/router.test.ts`
- `labs/supply-chain/dependency-confusion/meta.json`
- `labs/supply-chain/dependency-confusion/README.md`
- `labs/supply-chain/dependency-confusion/vuln/README.md`
- `labs/supply-chain/dependency-confusion/fixed/README.md`
- `labs/supply-chain/dependency-confusion/docs/attack-steps.md`
- `labs/supply-chain/dependency-confusion/docs/fix-notes.md`
- `labs/supply-chain/dependency-confusion/docs/manual-verification.md`
- `packages/shared/tests/lab-metadata.test.mjs`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

## 3. 前端体验约束

视觉策略：作为平台内供应链学习工作台，界面保持克制、密集但可读，复用现有深色工具面板、固定选择器、状态摘要和复盘清单，不做营销式 hero。

内容策略：首屏直接展示固定 manifest、伪 registry 场景、解析策略和后端判定结果；支撑区展示固定样例、风险标签、审计动作、推荐动作和安全边界清单。

交互策略：

- 使用固定下拉选择器和固定快捷按钮。
- 解析风险观察版默认观察未使用 scope 的内部依赖、伪公共同名碰撞和偏向公共更高版本策略。
- 来源审计复盘版默认观察已绑定 scope 的私有依赖、私有 scope 固定来源和来源审计策略。
- 提供固定“未绑定 scope”“私有 scope”“完整性审计”“混合来源”和“公共碰撞”快捷切换。

## 4. 接口约束

前端只调用：

```text
POST /api/labs/supply-chain/dependency-confusion/:variant/resolve
```

请求体只允许：

| 字段 | 来源 |
|---|---|
| `manifestKey` | 前端固定选项 |
| `registryScenarioKey` | 前端固定选项 |
| `resolutionPolicyKey` | 前端固定选项 |

前端不得提供以下输入框或请求字段：

- `packageName`
- `registryUrl`
- `npmrc`
- `token`
- `lockfile`
- `installCommand`
- `publishCommand`
- 任意包名
- 真实 registry 地址
- `.npmrc` 或其他包管理器配置
- 真实 token、Cookie、CI 凭据或 registry 凭据
- 真实 manifest 或 lockfile 内容
- 安装、登录、下载、打包、发布或生命周期脚本参数

## 5. 实施步骤

1. 新增前端 API client，类型与服务端 `DependencyConfusionResult` 对齐。
2. 新增前端实验模型，定义固定 manifest、固定 registry 场景、固定解析策略、变体配置、学习信号文案、学习进度和验证记录载荷。
3. 新增 Vue 工作台页面，复用现有 `page-section two-column`、`form-panel`、`inspection-grid` 和状态面板样式。
4. 页面只展示固定选择器、快捷按钮、manifest 摘要、后端判定、安全教学提示、学习信号、风险标签、审计动作和复盘清单。
5. 页面进入时记录学习进度；提交后对预期漏洞版 / 修复版信号写入验证记录。
6. 新增 `/labs/supply-chain/dependency-confusion/vuln` 与 `/labs/supply-chain/dependency-confusion/fixed` 路由。
7. 更新元数据登记 web 入口，仍保持 scripts 入口为空。
8. 更新场景文档和共享元数据测试。

## 6. 风险分析

- 如果页面出现任意包名、registry URL 或 `.npmrc` 输入，会把实验变成可复用供应链攻击测试器。
- 如果页面触发真实安装、登录、下载、打包或发布命令，会突破本项目本机受控学习边界。
- 如果请求体携带真实 token、Cookie、registry 凭据、manifest 或 lockfile 内容，会产生敏感信息保存和误用风险。
- 如果元数据登记 scripts 入口，会误导学习者认为存在攻击脚本能力。
- 如果页面只展示“被阻断”，学习者难以理解解析链路；页面必须展示解析来源、信任状态、scope 状态、lockfile 状态、风险标签和审计动作。

## 7. 优化方案

- 首版前端只做固定样例观察和 API 差异验证，不做 Playwright 和只读验证脚本。
- 使用现有全局样式，减少额外视觉抽象。
- 用固定 manifest 摘要和来源类别替代真实包名、真实 registry 地址和完整依赖文件。
- 使用学习记录和验证记录接口延续现有复盘闭环。

## 8. 验证方式

本轮最小必要验证：

- `pnpm --filter @network-safe/web exec vitest run tests/dependency-confusion-api.test.ts tests/dependency-confusion-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/dependency-confusion-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- 依赖混淆安全关键词扫描，确认命中仅属于禁止性说明、字段名、测试反向断言、历史进度或学习信号名。

本轮实际验证结果：

- `pnpm --filter @network-safe/web exec vitest run tests/dependency-confusion-api.test.ts tests/dependency-confusion-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/shared test` 通过，32 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/dependency-confusion-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过，实际执行服务端测试 195 项通过。
- `git diff --check` 通过。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 依赖混淆前端和文档安全关键词扫描仅命中禁止性说明、固定字段名、测试反向断言、API client `token` 参数和学习信号名，未发现真实安装、真实发布、registry 连接、凭据读取、生命周期脚本或攻击脚本实现。

## 9. 本轮完成条件

- 前端页面可从解析风险观察版 / 来源审计复盘版路由访问。
- 前端请求体只包含三个固定 key。
- 页面能展示漏洞版公共来源选择信号、修复版私有 scope 固定信号、lockfile 完整性阻断信号和正常公开依赖可接受信号。
- 元数据与实际 web / api 入口一致，scripts 仍为空。
- 文档说明当前仍不提供攻击脚本、任意包名输入、真实 registry 连接、真实安装、真实发布、凭据读取或生命周期脚本。
- 最小必要验证通过后再提交。

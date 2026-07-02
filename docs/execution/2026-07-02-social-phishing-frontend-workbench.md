# 网络钓鱼识别前端仿真收件箱工作台执行文档

## 1. 目标

本轮目标是在 `social/phishing` 后端固定案例 `review` API 基础上，新增前端仿真收件箱识别工作台。

工作台用于引导学习者从攻击方和防御方视角观察固定 `caseKey`、固定 `reviewModeKey` 和固定 `defenseChecklistKey` 组合在误判观察版 / 识别复盘版中的差异。

本轮不创建攻击脚本、只读验证脚本、Playwright 用例、数据库迁移、真实邮件发送、真实凭据收集、邮件模板生成或第三方平台连接。

## 2. 范围

本轮新增：

- `apps/web/src/api/phishing-lab.ts`
- `apps/web/src/labs/phishing.ts`
- `apps/web/src/views/PhishingLabView.vue`
- `apps/web/tests/phishing-api.test.ts`
- `apps/web/tests/phishing-lab.test.ts`

本轮同步：

- `apps/web/src/router/routes.ts`
- `apps/web/src/styles/main.css`
- `apps/web/tests/router.test.ts`
- `labs/social/phishing/meta.json`
- `labs/social/phishing/README.md`
- `labs/social/phishing/vuln/README.md`
- `labs/social/phishing/fixed/README.md`
- `labs/social/phishing/docs/attack-steps.md`
- `labs/social/phishing/docs/fix-notes.md`
- `labs/social/phishing/docs/manual-verification.md`
- `packages/shared/tests/lab-metadata.test.mjs`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

## 3. 前端体验约束

视觉策略：作为平台内学习工作台，界面应克制、密集但可读，使用现有深色工具面板、固定选择器、状态摘要和复盘清单，不做营销式 hero。

内容策略：首屏直接展示固定案例选择器、观察模式、检查清单和后端判定结果；支撑区展示固定线索卡、风险标签、建议动作和复盘清单。

交互策略：

- 使用固定下拉选择器和固定快捷按钮。
- 误判观察版默认观察账号安全提醒、只看表面信息和无检查清单。
- 识别复盘版默认观察同一固定案例、举报与隔离流程和举报隔离确认清单。
- 提供固定“发票复核”“账号安全”“人事福利”“安全周报”和“举报隔离”快捷切换。

## 4. 接口约束

前端只调用：

```text
POST /api/labs/social/phishing/:variant/review
```

请求体只允许：

| 字段 | 来源 |
|---|---|
| `caseKey` | 前端固定选项 |
| `reviewModeKey` | 前端固定选项 |
| `defenseChecklistKey` | 前端固定选项 |

前端不得提供以下输入框或请求字段：

- `emailBody`
- `subject`
- `sender`
- `recipient`
- `url`
- `attachment`
- `password`
- `token`
- 任意邮件正文
- 真实邮箱
- 真实链接
- 真实附件
- 可投递邮件模板
- 第三方平台参数

## 5. 实施步骤

1. 新增前端 API client，类型与服务端 `PhishingResult` 对齐。
2. 新增前端实验模型，定义固定案例、固定观察模式、固定检查清单、变体配置、学习信号文案、学习进度和验证记录载荷。
3. 新增 Vue 工作台页面，复用现有 `page-section two-column`、`form-panel`、`inspection-grid` 和状态面板样式。
4. 页面只展示固定选择器、快捷按钮、线索卡摘要、后端判定、安全教学提示、学习信号和复盘清单。
5. 页面进入时记录学习进度；提交后对预期漏洞版 / 修复版信号写入验证记录。
6. 新增 `/labs/social/phishing/vuln` 与 `/labs/social/phishing/fixed` 路由。
7. 更新元数据登记 web 入口，仍保持 scripts 入口为空。
8. 更新场景文档和共享元数据测试。

## 6. 风险分析

- 如果页面出现任意邮件正文输入框，会把实验变成可投递内容测试器。
- 如果页面展示完整邮件标题库、正文模板库或登录页素材，可能被误用为钓鱼素材。
- 如果请求体携带真实邮箱、真实 URL、附件名、凭据或第三方平台参数，会突破当前 case-study 边界。
- 如果元数据登记 scripts 入口，会误导学习者认为存在攻击脚本能力。
- 如果页面只展示“被阻断”，学习者难以理解识别链路；页面必须展示风险标签、表面误判、检查清单和建议动作。

## 7. 优化方案

- 首版前端只做固定案例观察和 API 差异验证，不做 Playwright 和只读验证脚本。
- 使用现有全局样式，减少额外视觉抽象。
- 用风险标签和检查清单状态替代完整邮件正文，避免生成可投递素材。
- 使用学习记录和验证记录接口延续现有复盘闭环。

## 8. 验证方式

本轮最小必要验证：

- `pnpm --filter @network-safe/web exec vitest run tests/phishing-api.test.ts tests/phishing-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- 网络钓鱼安全关键词扫描，确认命中仅属于禁止性说明、字段名、测试反向断言、历史进度或学习信号名。

本轮实际验证结果：

- `pnpm --filter @network-safe/web exec vitest run tests/phishing-api.test.ts tests/phishing-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/shared test` 通过，31 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过，实际执行服务端测试 186 项通过。
- `git diff --check` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 网络钓鱼安全关键词扫描仅命中禁止性说明、测试反向断言、`local-session-token`、API client `token` 参数、学习信号 `credential-request` 和历史记录，未发现真实投递、凭据收集、模板生成或第三方平台调用实现。

## 9. 本轮完成条件

- 前端页面可从误判观察版 / 识别复盘版路由访问。
- 前端请求体只包含三个固定 key。
- 页面能展示误判观察版风险信号、识别复盘版阻断信号和安全周报放行信号。
- 元数据与实际 web / api 入口一致，scripts 仍为空。
- 文档说明当前仍不提供攻击脚本、任意邮件正文输入、真实邮件发送、真实凭据收集或可投递模板生成。
- 最小必要验证通过后再提交。

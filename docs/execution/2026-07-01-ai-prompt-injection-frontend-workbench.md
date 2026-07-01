# Prompt 注入前端固定样例观察工作台执行文档

## 1. 目标

本轮目标是在 `ai/prompt-injection` 后端确定性路由 API 基础上，接入前端固定样例观察工作台。

工作台用于引导学习者从攻击方和防御方视角观察固定 `scenarioKey`、固定 `instructionSourceKey` 和固定 `defensePolicyKey` 组合在漏洞版 / 修复版中的差异。

本轮不创建攻击脚本、只读验证脚本、Playwright 用例、数据库迁移、外部 AI 调用或真实工具调用。

## 2. 范围

本轮新增：

- `apps/web/src/api/prompt-injection-lab.ts`
- `apps/web/src/labs/prompt-injection.ts`
- `apps/web/src/views/PromptInjectionLabView.vue`
- `apps/web/tests/prompt-injection-api.test.ts`
- `apps/web/tests/prompt-injection-lab.test.ts`

本轮同步：

- `apps/web/src/router/routes.ts`
- `apps/web/src/styles/main.css`
- `apps/web/tests/router.test.ts`
- `labs/ai/prompt-injection/meta.json`
- `labs/ai/prompt-injection/README.md`
- `labs/ai/prompt-injection/vuln/README.md`
- `labs/ai/prompt-injection/fixed/README.md`
- `labs/ai/prompt-injection/docs/attack-steps.md`
- `labs/ai/prompt-injection/docs/fix-notes.md`
- `labs/ai/prompt-injection/docs/manual-verification.md`
- `packages/shared/tests/lab-metadata.test.mjs`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

## 3. 前端体验约束

视觉策略：作为平台内学习工作台，界面应克制、密集但可读，使用现有深色工具面板、固定选择器、状态摘要和复盘清单，不做营销式 hero。

内容策略：首屏直接展示实验选择器和后端决策结果，支撑区展示固定场景、固定来源、防御策略和复盘清单。

交互策略：

- 使用固定下拉选择器和固定快捷按钮。
- 漏洞版默认观察客服知识库与固定检索资料摘要。
- 修复版默认观察同一固定样例经检索隔离后的阻断结果。
- 提供固定“工具请求”和“安全文档问答”快捷切换，用于观察工具允许列表和正常业务路径。

## 4. 接口约束

前端只调用：

```text
POST /api/labs/ai/prompt-injection/:variant/evaluate
```

请求体只允许：

| 字段 | 来源 |
|---|---|
| `scenarioKey` | 前端固定选项 |
| `instructionSourceKey` | 前端固定选项 |
| `defensePolicyKey` | 前端固定选项 |

前端不得提供以下输入框或请求字段：

- `prompt`
- `systemPrompt`
- `developerPrompt`
- `model`
- `apiKey`
- `toolSchema`
- `url`
- `target`
- 任意提示词正文
- 真实系统提示词
- 真实工具参数
- 外部目标

## 5. 实施步骤

1. 新增前端 API client，类型与服务端 `PromptInjectionResult` 对齐。
2. 新增前端实验模型，定义固定场景、固定来源、防御策略、变体配置、学习信号文案、学习进度和验证记录载荷。
3. 新增 Vue 工作台页面，复用现有 `page-section two-column`、`form-panel`、`inspection-grid` 和状态面板样式。
4. 页面只展示固定选择器、快捷按钮、策略审计摘要、安全教学回答、学习信号和复盘清单。
5. 页面进入时记录学习进度；提交后对预期漏洞版 / 修复版信号写入验证记录。
6. 新增 `/labs/ai/prompt-injection/vuln` 与 `/labs/ai/prompt-injection/fixed` 路由。
7. 更新元数据登记 web 入口，仍保持 scripts 入口为空。
8. 更新场景文档和共享元数据测试。

## 6. 风险分析

- 如果页面出现任意提示词输入框，会把实验变成提示词攻击测试器。
- 如果页面展示完整危险提示词、绕过模板或可复制攻击素材，会突破学习边界。
- 如果请求体携带模型名、密钥、工具 schema、URL 或外部目标，会误导为真实 AI / 工具测试。
- 如果元数据登记 scripts 入口，会误导学习者认为存在脚本能力。
- 如果只展示“被阻断”，学习者难以理解防御链路；页面必须展示指令分层、检索隔离、工具允许列表和输出策略状态。

## 7. 优化方案

- 首版前端只做固定样例观察和 API 差异验证，不做 Playwright 和只读验证脚本。
- 使用现有全局样式，减少额外视觉抽象。
- 用策略审计布尔项替代长提示词展示，避免泄露或生成危险内容。
- 使用学习记录和验证记录接口延续现有复盘闭环。

## 8. 验证方式

本轮最小必要验证：

- `pnpm --filter @network-safe/web exec vitest run tests/prompt-injection-api.test.ts tests/prompt-injection-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- Prompt 注入安全关键词扫描，确认命中仅属于边界说明、字段名、测试反向断言、历史进度或学习信号名。

## 9. 本轮完成条件

- 前端页面可从漏洞版 / 修复版路由访问。
- 前端请求体只包含三个固定 key。
- 页面能展示漏洞版风险信号、修复版阻断信号和安全问答信号。
- 元数据与实际 web / api 入口一致，scripts 仍为空。
- 文档说明当前仍不提供攻击脚本、任意提示词输入、外部 AI 调用或真实工具调用。
- 最小必要验证通过后再提交。

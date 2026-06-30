# 后续实验复用详情页模式规划执行文档

## 1. 目标

沉淀后续实验复用单个实验详情页的统一模式，避免新增实验时临时猜字段、猜路由或重复实现详情页展示逻辑。

本轮目标是文档规划，不新增实验、不修改接口、不调整数据库结构。

## 2. 范围

本轮覆盖：

- 明确 `LabDetailView.vue` 的通用职责边界。
- 明确后续实验接入详情页时必须满足的元数据字段。
- 明确变体入口、学习记录、事件日志和复盘问题完成状态的关联方式。
- 明确后续扩展实验的接入检查清单。
- 同步 TODO 和总纲中的阶段 D 进度。

本轮不覆盖：

- 不新增命令注入、SSTI、XXE 等下一批实验实现。
- 不新增后端 API、数据库表或迁移。
- 不改动已有 Vue 页面、服务端 service 或测试代码。
- 不改变现有详情页视觉和交互。

## 3. 已确认上下文

本轮实施前已确认以下来源：

- `apps/web/src/views/LabDetailView.vue`
  - 通过 `fetchLab(category, scene)` 读取实验元数据。
  - 使用 `lab.id` 作为当前实验 `labKey`。
  - 展示变体、知识点、验证方式、文档脚本入口、当前实验记录和最近事件复盘。
  - 登录后按当前实验加载 `GET /api/lab-event-logs/me?labKey=...`。
  - 登录后按当前事件 `traceId` 加载复盘问题完成状态。
- `apps/web/src/labs/lab-detail.ts`
  - `findVariantWebEntrypoint` 只按 `variant.entryKey` 精确匹配 `entrypoints.web[].key`。
  - `filterLabRecordsForLab` 和 `filterLabEventLogsForLab` 只按 `labKey` 过滤。
  - `createLabEventRecapQuestions` 按事件 `phase` 和 `decision` 生成固定复盘问题。
- `apps/web/src/api/labs.ts`
  - `LabMetadata` 已定义详情页使用的元数据字段。
- `apps/web/src/api/lab-records.ts`
  - 当前用户学习记录、事件日志和复盘问题完成状态已有类型定义。
- `docs/design/lab-metadata-structure.md`
  - 已约束详情页直接依赖 `variants`、`entrypoints`、`prerequisites`、`knowledgePoints`、`verification`。

## 4. 操作步骤

1. 预读详情页实现、详情页 helper、API 类型和元数据设计文档。
2. 新增详情页复用模式设计文档，记录后续实验接入规则。
3. 更新 `docs/TODO.md`，将“后续实验复用详情页模式规划”标记为完成。
4. 更新 `docs/execution/security-lab-master-goal.md`，同步阶段 D 最新进展和下一步建议。
5. 执行文档级最小验证。

## 5. 实施建议

- 后续新增实验时，优先复用通用详情页展示元数据、记录和复盘，不为单个实验单独复制详情页。
- 交互式攻击 / 防御流程放在实验工作台页面中，详情页只负责导航、索引和复盘。
- 所有入口必须来自 `meta.json` 和类型定义，禁止根据目录名或变体名拼接路由。
- 事件日志只展示学习复盘所需字段，不展示 `inputSummaryJson`、真实密码、真实 token、真实 Cookie、完整 payload 或外部目标信息。
- 复盘问题完成状态以 `traceId + questionIndex` 为准，不依赖问题文案。

## 6. 潜在风险分析

- 字段猜测风险：如果后续实验新增了非标准字段并让详情页直接读取，会破坏通用页面的稳定性。
- 路由猜测风险：如果绕过 `variant.entryKey` 与 `entrypoints.web[].key` 的匹配规则，容易出现变体按钮指向错误页面。
- 日志泄露风险：如果把攻击输入摘要或敏感材料直接放进详情页，会偏离本项目的受控学习边界。
- 复盘状态错位风险：如果频繁调整固定问题顺序，历史 `questionIndex` 完成记录的语义可能变化。
- 职责膨胀风险：如果详情页承载实验专属表单，会让后续实验难以复用。

## 7. 优化方案

- 后续可增加元数据一致性测试，检查每个 `variant.entryKey` 都能匹配到一个 `entrypoints.web[].key`。
- 后续可为新增实验建立接入模板，把详情页复用检查清单放入实验 README。
- 若某类实验需要专属复盘问题，应先设计可配置问题来源，再评估历史完成记录兼容性。
- 若详情页展示内容继续增加，应优先抽取通用展示组件，而不是在页面中写实验专属分支。

## 8. 验证方式

本轮为文档规划切片，最小验证为：

- 使用 `rg` 核对现有详情页、helper、API 类型和文档中的字段来源。
- 执行 `git diff --check`，确认新增文档和同步修改没有空白错误。

若后续进入代码实现，应补充：

- `pnpm --filter @network-safe/web exec vitest run tests/lab-detail.test.ts`
- 受影响实验的前端 helper / API 测试。
- 必要时补充 Playwright 入口验证，但不默认执行全量构建。


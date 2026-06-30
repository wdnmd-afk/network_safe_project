# 阶段 D 统一复盘卡片组件执行文档

## 目标

抽出统一的事件复盘卡片组件，减少账户中心和实验详情页中重复的事件摘要、展开按钮、详情区域与复盘问题展示逻辑。

本次目标不是新增复盘数据能力，而是让已有阶段 D 复盘 UI 更稳定、更容易复用，便于后续继续做持久化学习问题完成记录或更复杂的复盘筛选。

## 范围

本次只处理前端展示层：

- `apps/web/src/components/EventRecapCard.vue`
- `apps/web/src/views/AccountView.vue`
- `apps/web/src/views/LabDetailView.vue`
- `apps/web/src/labs/event-recap.ts`
- `apps/web/tests/event-recap.test.ts`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`

不修改：

- 后端接口
- 数据库结构
- 事件日志写入逻辑
- `inputSummaryJson` 展示策略
- 学习问题完成状态的持久化设计

## 操作步骤

1. 在 `apps/web/src/components/` 新增 `EventRecapCard.vue`。
2. 组件接收事件摘要字段、展开状态、可选复盘问题与问题完成状态。
3. 组件通过事件回调通知父页面切换展开状态和问题完成状态，不在组件内部持久化状态。
4. 账户中心改用统一组件，只展示标题、变体 / 阶段 / 决策 / 风险、学习信号、说明、时间和状态码。
5. 实验详情页改用统一组件，并传入固定复盘问题与问题完成状态。
6. 在 `event-recap.ts` 中补充纯函数，整理组件所需的摘要文本与详情文本，便于单元测试覆盖。
7. 补充前端 helper 测试，覆盖账户中心与实验详情页展示数据整理。
8. 更新阶段 D 进度文档。
9. 运行最小必要验证。

## 实施建议

- 组件只负责展示和发出事件，不直接调用 API、store 或路由。
- 父页面继续负责筛选、加载、展开状态和问题完成状态。
- 继续以 `traceId` 作为事件唯一标识。
- 不展示 `inputSummaryJson`，只使用当前 `CurrentUserLabEventLogSummary` 已确认字段。
- 不引入新依赖。

## 潜在风险分析

- 抽组件时可能改变账户中心和实验详情页的展示顺序；需要保持原有可见信息不减少。
- 实验详情页的问题完成状态依赖父页面传入问题序号；组件必须保持问题数组顺序。
- 组件化后如果 props 设计过宽，后续会难维护；本次只暴露当前两个页面实际需要的字段。

## 优化方案

- 后续可以在组件基础上增加“全部展开 / 全部收起”。
- 后续可以单独设计持久化学习问题完成记录。
- 后续可以让账户中心也展示复盘问题，但需要先明确跨实验问题展示密度。

## 验证方式

最小必要验证：

- `pnpm --filter @network-safe/web exec vitest run`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `git diff --check`

## 执行记录

- 已新增 `apps/web/src/components/EventRecapCard.vue`，统一展示复盘卡片摘要、展开详情与可选复盘问题。
- 已新增账户中心版与实验详情页版复盘卡片内容整理 helper。
- 已将账户中心“最近事件复盘”接入统一组件。
- 已将实验详情页“最近事件复盘”接入统一组件，并保留问题完成状态。
- 已补充复盘卡片内容整理单元测试。
- 已更新 `docs/TODO.md` 与 `docs/execution/security-lab-master-goal.md`。

## 验证记录

- `pnpm --filter @network-safe/web exec vitest run`：通过，33 个测试文件、107 个测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`：通过。
- `git diff --check`：通过；仅输出 LF/CRLF 换行提示，无空白错误。

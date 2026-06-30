# 阶段 D 复盘问题完成状态执行文档

## 目标

在实验详情页已有“最近事件复盘”卡片和引导式复盘问题基础上，增加问题完成状态。

学习者展开单条事件后，可以逐项勾选已经思考过的问题，并看到当前事件的问题完成数量。这样复盘不只是展示问题，也能帮助学习者按步骤走完一次攻击 / 防御观察。

## 范围

本次只处理前端本地交互状态：

- `apps/web/src/views/LabDetailView.vue`
- `apps/web/src/labs/event-recap.ts`
- `apps/web/tests/event-recap.test.ts`
- `apps/web/src/styles/main.css`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`

不新增数据库字段、不新增后端接口、不修改事件日志结构、不展示 `inputSummaryJson`。

## 操作步骤

1. 在 `event-recap.ts` 中新增复盘问题完成状态 helper。
2. 使用 `traceId + 问题序号` 标识单个事件下的单个问题，不依赖问题文案做状态键。
3. 在实验详情页展开态的复盘问题列表中加入 checkbox。
4. 在每个事件展开区展示问题完成进度，例如 `问题完成 2 / 4`。
5. 在重新加载实验详情或事件日志时重置本地问题完成状态，避免旧事件状态污染新列表。
6. 补充单元测试，覆盖问题勾选、取消、跨事件隔离、单事件统计和重置。
7. 补充必要样式，保证 checkbox 与长问题文案在移动端不重叠。
8. 更新阶段 D 进度文档。
9. 运行最小必要验证。

## 实施建议

- 当前完成状态只保存在页面内存中，刷新页面后清空。
- 不把问题完成状态写入 `lab_event_logs`，因为事件日志应记录实验行为事实，不应混入前端学习 UI 状态。
- 如果后续需要跨页面或跨会话保留完成状态，应另写设计文档，明确表结构、接口权限、字段含义和隐私边界。
- 不新增依赖，不改已有事件摘要字段。

## 潜在风险分析

- 页面刷新后完成状态会丢失：这是本次有意限制，避免未设计清楚前过早引入持久化字段。
- 同一个事件的问题顺序如果未来变化，已有本地状态会对应到不同序号：当前状态不持久化，影响只存在于当前页面会话内。
- 如果问题文案很长，checkbox 可能挤压布局：通过专门样式让文本换行并避免溢出。

## 优化方案

- 后续可以新增持久化学习问题完成记录表。
- 后续可以把复盘卡片抽成统一组件，同时服务账户中心与实验详情页。
- 后续可以按实验统计复盘问题完成率，显示在账户中心学习时间线中。

## 验证方式

最小必要验证：

- `pnpm --filter @network-safe/web exec vitest run`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `git diff --check`

## 执行记录

- 已新增复盘问题完成状态 helper，支持问题状态键生成、完成判断、切换、统计和重置。
- 已在实验详情页复盘卡片展开区接入 checkbox 和问题完成进度。
- 已在重新加载实验详情或事件日志时重置问题完成状态。
- 已补充 checkbox 和长问题文案的展示样式。
- 已更新 `docs/TODO.md` 与 `docs/execution/security-lab-master-goal.md`。

## 验证记录

- `pnpm --filter @network-safe/web exec vitest run`：通过，33 个测试文件、105 个测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`：通过。
- `git diff --check`：通过；仅输出 LF/CRLF 换行提示，无空白错误。

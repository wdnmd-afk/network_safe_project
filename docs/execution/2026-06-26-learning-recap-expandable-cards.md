# 阶段 D 复盘卡片展开状态执行文档

## 目标

在已有“最近事件复盘”能力基础上，为账户中心和实验详情页的事件复盘卡片增加展开 / 收起状态。

默认只展示学习复盘所需的核心摘要，让列表更易扫描；用户需要深入复盘时，可以展开单条事件查看时间、状态码、详细说明和引导式问题。

## 范围

本次只处理前端展示层：

- `apps/web/src/views/AccountView.vue`
- `apps/web/src/views/LabDetailView.vue`
- `apps/web/src/labs/` 下的复盘辅助逻辑
- `apps/web/tests/` 下的前端单元测试
- `apps/web/src/styles/main.css`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`

不修改后端日志写入、数据库结构、接口字段和实验脚本。

## 操作步骤

1. 新增轻量复盘展开状态 helper，使用事件 `traceId` 精确判断单条卡片是否展开。
2. 在账户中心最近事件复盘列表中接入展开 / 收起：
   - 默认展示实验标题、变体、阶段、后端决策、风险等级、学习信号。
   - 展开后展示事件说明、创建时间和 HTTP 状态码。
3. 在实验详情页最近事件复盘列表中接入展开 / 收起：
   - 默认展示学习信号、变体、阶段、后端决策、风险等级和事件说明。
   - 展开后展示创建时间、HTTP 状态码和固定引导式复盘问题。
4. 补充 helper 单元测试，覆盖展开、收起、独立事件状态和批量重置。
5. 补充必要样式，保证按钮、摘要和展开区在移动端不挤压、不重叠。
6. 更新阶段 D 进度文档。
7. 运行最小必要验证。

## 实施建议

- 展开状态只保存在当前页面内存中，不写入后端和浏览器存储。
- 以 `traceId` 作为唯一标识，不猜测其他字段。
- 不展示 `inputSummaryJson` 或任何请求输入摘要。
- 不新增依赖。
- 页面按钮使用明确的 `button type="button"`，避免触发表单行为。

## 潜在风险分析

- 如果同一批事件中出现重复 `traceId`，展开状态会同步影响重复项；当前后端事件日志以 `traceId` 作为单次动作追踪 ID，前端可按现有契约使用。
- 如果列表刷新后旧事件消失，展开状态可能残留在内存中；本次 helper 提供 `reset`，页面可在需要时清理。当前残留不会影响新列表渲染，除非后续复用相同 `traceId`。
- 如果展开内容过多，移动端可能出现信息密度过高；本次通过默认折叠和独立展开区降低影响。

## 优化方案

- 后续可以增加“全部展开 / 全部收起”。
- 后续可以增加学习问题完成状态，但需要先设计字段、存储位置和隐私边界。
- 后续可以抽出复盘卡片组件，统一账户中心和实验详情页的 UI。

## 验证方式

最小必要验证：

- `pnpm --filter @network-safe/web exec vitest run`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `git diff --check`

如本机前端服务仍在运行，可补充访问 `/account` 和某个实验详情页做 HTTP 冒烟检查。

## 执行记录

- 已新增 `useEventRecapExpansionState`，以 `traceId` 控制单条事件展开 / 收起。
- 已接入账户中心“最近事件复盘”，默认展示摘要，展开后展示事件说明、时间和状态码。
- 已接入实验详情页“最近事件复盘”，默认展示摘要，展开后展示时间、状态码和引导式复盘问题。
- 已补充复盘展开状态单元测试。
- 已更新 `docs/TODO.md` 与 `docs/execution/security-lab-master-goal.md`。

## 验证记录

- `pnpm --filter @network-safe/web exec vitest run`：通过，33 个测试文件、100 个测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`：通过。
- `git diff --check`：通过；仅输出 LF/CRLF 换行提示，无空白错误。

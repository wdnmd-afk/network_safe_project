# 学习复盘问题完成记录持久化执行文档

## 目标

将实验详情页“最近事件复盘”中的引导式问题勾选状态从前端本地临时状态升级为当前用户维度的持久化记录，支持刷新页面或重新进入实验详情页后继续查看已完成的问题。

本轮只持久化问题完成状态，不改变复盘问题生成规则，不展示 `inputSummaryJson`，不新增攻击输入明细展示。

## 范围

- 新增数据库表 `lab_recap_question_completions`。
- 补充 Prisma schema 与 SQL 迁移文件。
- 新增服务端复盘问题完成记录 service。
- 新增当前用户 API：
  - `GET /api/lab-recap-question-completions/me`
  - `PUT /api/lab-recap-question-completions/me`
- 扩展前端 API client。
- 调整实验详情页复盘问题勾选状态：
  - 加载事件日志后拉取对应 trace 的完成记录。
  - 勾选 / 取消勾选时乐观更新并写回后端。
  - 写回失败时回滚本地状态并显示错误。
- 补充服务端与前端最小必要测试。
- 更新项目 TODO 与总目标文档的阶段 D 进度。

## 不在本轮范围

- 不做账号中心复盘统计图。
- 不新增 AI 生成问题。
- 不改变 `lab_event_logs` 表结构。
- 不把 `inputSummaryJson` 暴露给前端。
- 不记录真实密码、真实 token、真实 Cookie、完整 payload 或外部目标信息。

## 数据库设计

新增表：`lab_recap_question_completions`

字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `bigint unsigned` | 主键 |
| `user_id` | `bigint unsigned` | 当前用户 |
| `trace_id` | `varchar(64)` | 事件 trace id |
| `lab_key` | `varchar(128)` | 实验 key，例如 `web.csrf` |
| `question_key` | `varchar(100)` | 服务端根据问题序号生成，例如 `question-0` |
| `question_index` | `int` | 问题序号，从 0 开始 |
| `is_completed` | `boolean` | 是否已完成 |
| `completed_at` | `datetime null` | 最近一次标记完成时间 |
| `created_at` | `datetime` | 创建时间 |
| `updated_at` | `datetime` | 更新时间 |

约束与索引：

- 唯一索引：`(user_id, trace_id, question_key)`。
- 普通索引：`(user_id, lab_key, updated_at)`。
- 外键：`user_id` 关联 `users.id`，用户删除时级联删除复盘问题记录。

说明：

- 不对 `trace_id` 建立外键到 `lab_event_logs`，因为 `trace_id` 在事件日志中不是唯一字段，且历史日志可能因为降级策略不存在。
- 使用 `is_completed` 布尔值而不是删除记录，便于后续统计“曾经取消完成”的更新时间与状态。

## 后端实现步骤

1. 在 Prisma schema 中新增 `LabRecapQuestionCompletion` 模型，并在 `User` 上新增关系字段。
2. 新增 SQL 迁移文件。
3. 新增 `apps/server/src/services/lab-recap-question-completions.ts`：
   - `listUserQuestionCompletions`
   - `setQuestionCompletion`
   - 服务端统一生成 `questionKey = question-${questionIndex}`。
4. 在 `createApp` 中注入该 service，沿用现有可测试的依赖注入模式。
5. 新增 API：
   - `GET /api/lab-recap-question-completions/me?labKey=...&traceIds=...`
   - `PUT /api/lab-recap-question-completions/me`
6. 参数校验：
   - 必须登录。
   - `traceId` 非空且最大 64。
   - `labKey` 非空且最大 128。
   - `questionIndex` 必须是 0 到 20 的整数。
   - `completed` 必须是布尔值。

## 前端实现步骤

1. 在 `apps/web/src/api/lab-records.ts` 中新增 completion 类型与 API client。
2. 在 `apps/web/src/labs/event-recap.ts` 中补充持久化记录到本地 key 的整理 helper。
3. 调整 `LabDetailView.vue`：
   - 加载当前实验事件日志后，按事件 trace id 拉取完成记录。
   - 使用持久化记录初始化当前问题完成状态。
   - 勾选时先更新本地状态，再调用 PUT API。
   - 调用失败时回滚本地状态，并显示明确错误。
4. 未登录时仍清空事件、展开状态和问题完成状态。

## 风险分析

- 问题文案未来变化时，如果用文案作为 key 会导致历史记录失效；因此本轮只使用 `traceId + questionIndex`。
- `traceId` 不唯一，因此记录必须同时保留 `userId` 与 `labKey`，并使用用户维度查询。
- 完成状态写回失败时，前端需要回滚，否则页面会显示与数据库不一致的状态。
- 不允许将事件输入摘要展示给用户，避免把攻击 payload、token 或敏感路径引入复盘 UI。

## 优化方案

- 后续账号中心可以基于该表统计每个实验的复盘完成度。
- 后续若复盘问题改为版本化生成，可增加 `question_version` 字段。
- 后续若需要审计取消完成操作，可增加操作日志表；本轮先用 `is_completed` 与 `updated_at` 保留最终状态。

## 验证方式

最小必要验证：

- 服务端：
  - completion service 单元测试。
  - 当前用户 completion API 鉴权、查询参数和写入参数测试。
- 前端：
  - API client 请求形态测试。
  - completion helper 测试。
  - 实验详情页类型检查。
- 命令：
  - `pnpm --filter @network-safe/server test`
  - `pnpm --filter @network-safe/web exec vitest run`
  - `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
  - `git diff --check`


# 账号中心复盘完成度统计执行文档

## 目标

在账号中心“最近事件复盘”区域新增复盘问题完成度统计，让学习者能看到当前筛选条件下最近事件的复盘问题完成情况。

本轮统计只基于账号中心已经加载的最近事件日志与对应的 `lab_recap_question_completions` 记录，不宣称是全量历史学习完成度。

## 范围

- 复用已有当前用户事件日志接口 `GET /api/lab-event-logs/me`。
- 复用已有当前用户复盘问题完成记录接口 `GET /api/lab-recap-question-completions/me`。
- 新增前端账号中心统计 helper：
  - 按 `labKey` 聚合当前事件列表。
  - 统计事件数、问题总数、已完成问题数和完成百分比。
- 调整 `AccountView.vue`：
  - 加载事件日志后，按事件 `traceId` 拉取完成记录。
  - 在最近事件复盘区域展示“复盘完成度”。
  - 切换实验 / 阶段 / 风险筛选时同步刷新事件和完成度。
- 补充前端 helper 单元测试。
- 更新 TODO 与总目标文档。

## 不在本轮范围

- 不新增后端接口。
- 不新增数据库表或字段。
- 不做全量历史复盘统计。
- 不展示 `inputSummaryJson`。
- 不保存或展示真实密码、真实 token、真实 Cookie、完整 payload 或外部目标信息。
- 不把账号中心复盘统计做成排行榜、评分或对外攻击能力指标。

## 实施步骤

1. 在 `apps/web/src/labs/account-recap.ts` 中新增统计整理函数。
2. 在 `AccountView.vue` 中新增完成记录加载状态：
   - `recapQuestionCompletions`
   - `isLoadingRecapQuestionCompletions`
   - `recapQuestionCompletionErrorMessage`
3. 将账号中心事件刷新流程收敛为一个异步函数：
   - 先调用 `session.loadLabEventLogs(filters)`。
   - 根据返回事件提取去重后的 `traceId`。
   - 调用 `fetchCurrentUserRecapQuestionCompletions(token, { labKey?, traceIds })`。
4. 根据事件日志和完成记录计算当前筛选范围内的统计结果。
5. 在“最近事件复盘”区域展示统计列表：
   - 实验名称
   - 最近事件数
   - 已完成问题数 / 问题总数
   - 完成百分比
6. 为统计 helper 补充测试。

## 风险分析

- 当前事件日志接口只返回最近事件，因此统计口径必须写清楚是“当前列表 / 当前筛选范围”，不能称为全量历史完成度。
- 如果事件列表为空，不应请求完成记录，也不应显示误导性的 0% 完成率。
- 完成记录以 `traceId + questionIndex` 为键，统计时必须按问题总数范围截断，避免旧的越界记录污染当前问题数量。
- 账号中心仍不展示复盘问题正文，避免页面过载；详情页负责逐项勾选。

## 验证方式

- `apps/web/tests/account-recap.test.ts`：
  - 多实验聚合统计。
  - 只统计 `completed: true` 的记录。
  - 越界 questionIndex 不计入完成数。
  - 空事件返回空统计。
- `pnpm --filter @network-safe/web exec vitest run apps/web/tests/account-recap.test.ts apps/web/tests/lab-records-api.test.ts`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `git diff --check`


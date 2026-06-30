# 阶段 D 复盘统计说明文档执行文档

## 1. 目标

补充阶段 D 复盘统计说明文档，明确账号中心“复盘完成度”的数据来源、统计口径、展示边界和后续扩展约束。

本轮只补文档，不修改前端、后端、数据库或测试代码。

## 2. 范围

本轮覆盖：

- 说明账号中心复盘完成度统计代表什么。
- 说明统计不代表什么，避免误用为全量学习完成率、评分或排行榜。
- 固化当前实现中的数据来源与计算规则。
- 明确筛选条件变化时统计如何变化。
- 明确敏感信息展示边界。
- 同步 `docs/TODO.md` 与 `docs/execution/security-lab-master-goal.md`。

本轮不覆盖：

- 不新增新的统计接口。
- 不新增数据库字段。
- 不调整 `createLabRecapCompletionSummaries` 算法。
- 不调整账号中心页面样式。
- 不做下一批扩展实验实现。

## 3. 已确认上下文

本轮实施前已确认以下实现：

- `apps/web/src/views/AccountView.vue`
  - 账号中心加载 `session.loadLabEventLogs(filters)` 后，再按当前事件 `traceId` 拉取复盘问题完成记录。
  - 筛选条件包含实验、阶段和风险等级。
  - “复盘完成度”只在当前事件列表非空时展示。
- `apps/web/src/labs/account-recap.ts`
  - `createLabRecapCompletionSummaries` 按 `labKey` 聚合当前事件。
  - 每条事件的问题数来自 `createLabEventRecapQuestions(event)`。
  - 只统计当前问题范围内的 `completed: true` 记录。
  - 完成百分比使用 `Math.round(completedQuestions / totalQuestions * 100)`。
- `apps/web/tests/account-recap.test.ts`
  - 已覆盖多实验聚合、越界问题序号不计入、空事件返回空统计。
- `docs/execution/2026-06-29-account-recap-completion-stats.md`
  - 已记录实现过程和最小验证。

## 4. 操作步骤

1. 预读账号中心复盘统计执行文档、实现和测试。
2. 新增复盘统计说明设计文档。
3. 更新 TODO 顶部最新进展和文档设计待办。
4. 更新主目标文档顶部最新进展和末尾下一步建议。
5. 执行文档级最小验证。

## 5. 实施建议

- 后续所有复盘统计文案都应使用“当前筛选范围”“最近事件”这类限定词。
- 不应把当前统计展示为“总学习进度”“掌握度”“安全能力分”或“攻击成功率”。
- 如果未来需要全量历史统计，应另行设计后端聚合接口、分页策略和统计周期。
- 如果未来复盘问题生成规则变化，应先评估 `questionIndex` 历史记录语义。

## 6. 潜在风险分析

- **口径误读风险**：当前统计只基于账号中心当前事件列表，必须避免被理解为全量历史完成度。
- **筛选联动风险**：切换实验、阶段或风险后，分子和分母都会变化，文档必须说明这一点。
- **问题数量变化风险**：问题生成规则变化会影响分母，也可能影响历史完成状态解释。
- **敏感信息风险**：统计说明不能鼓励展示 `inputSummaryJson` 或攻击输入明细。

## 7. 优化方案

- 后续可在统计说明文档中追加“全量历史统计方案”，但需要先设计后端聚合接口。
- 后续可增加文档链接，让账号中心说明与详情页复盘问题规则保持一致。
- 后续可补一个元数据或 UI 文案检查，确保页面不把当前统计描述成全量完成率。

## 8. 验证方式

本轮为文档切片，最小验证为：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-learning-recap-statistics-guide.md docs/design/learning-recap-statistics.md`
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-learning-recap-statistics-guide.md docs/design/learning-recap-statistics.md`

代码未修改，因此不运行前端测试或全量构建。


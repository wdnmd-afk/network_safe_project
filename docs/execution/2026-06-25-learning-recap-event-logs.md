# 阶段 D：最近实验事件日志复盘执行文档

## 1. 目标

在阶段 A 到阶段 C 已经建立统一事件日志和首批实验的基础上，开始落地阶段 D 的学习复盘能力。

本次先做最小闭环：让已登录用户能在账户中心和单个实验详情页看到最近实验事件日志，用于复盘攻击 / 防御动作、后端决策、学习信号和风险等级。

## 2. 范围

本次包含：

- 后端新增当前用户事件日志查询能力。
- 新增接口：
  - `GET /api/lab-event-logs/me`
  - 支持可选查询参数 `labKey`，用于单个实验详情页过滤。
- 前端 API client 新增事件日志读取方法。
- Pinia session store 维护最近事件日志状态。
- 账户中心展示最近实验事件时间线。
- 单个实验详情页展示当前实验最近事件日志复盘卡片。
- 补充服务端、前端 API、前端数据整理测试。
- 更新 `docs/TODO.md` 和主目标文档阶段 D 进度。

本次不包含：

- 新增数据库表或修改 `lab_event_logs` schema。
- 做复杂筛选器、分页器或全文搜索。
- 展示敏感输入明文。
- 展示候选口令、token、Cookie、真实密码或完整攻击载荷。

## 3. 数据设计

复用现有 `lab_event_logs` 表，仅返回摘要字段：

- `traceId`
- `labKey`
- `title`
- `variantKey`
- `phase`
- `eventType`
- `actorPerspective`
- `decision`
- `signal`
- `statusCode`
- `riskLevel`
- `message`
- `createdAt`

`inputSummaryJson` 本轮不直接展示，避免复盘页面扩大敏感字段暴露面。后续如需展示，必须先做白名单字段设计。

## 4. 操作步骤

1. 扩展 `lab-event-logs` 服务，新增最近事件日志查询方法。
2. 默认 repository 基于 `userId`、可选 `labKey` 查询 `labEventLog.findMany`，按 `createdAt desc` 排序，限制返回数量。
3. 在 `createApp` 新增 `GET /api/lab-event-logs/me`。
4. 前端 `lab-records` API client 增加 `fetchCurrentUserLabEventLogs`。
5. session store 增加 `labEventLogs`、加载状态和错误信息。
6. 单个实验详情页加载当前实验事件日志，并展示最近事件复盘卡片。
7. 账户中心展示最近事件时间线。
8. 补充后端接口测试、服务测试、前端 API 测试和详情页数据整理测试。
9. 运行最小必要验证。
10. 更新进度文档。

## 5. 实施建议

- 后端必须从登录态读取当前用户 ID，不能从 query 或 body 接受用户 ID。
- `labKey` 只能作为过滤条件，不影响登录鉴权。
- 默认返回最近 10 条，避免一次读取过多日志。
- 前端只展示学习复盘字段，不展示 `inputSummaryJson`。
- 单个实验详情页只展示当前实验的日志。
- 账户中心展示跨实验最近事件，用于学习时间线。

## 6. 潜在风险分析

- **敏感摘要误展示风险**：本轮不展示 `inputSummaryJson`，只展示信号、决策、风险等级和说明。
- **越权读取风险**：接口只查询当前登录用户的日志，不接受用户 ID 参数。
- **数据量风险**：限制返回条数，后续再做分页。
- **旧日志缺少 lab 关联风险**：使用 `labKey` 和可选 `lab.title` 映射；没有标题时回退到 `labKey`。

## 7. 验证方式

最小必要验证：

- `pnpm --filter @network-safe/server test`
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/web exec vitest run`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `git diff --check`

可选验证：

- 未登录访问 `GET /api/lab-event-logs/me` 返回 401。
- 登录后账户中心可看到最近事件日志。
- 单个实验详情页只显示当前实验事件。

## 8. 完成记录

- 已扩展 `apps/server/src/services/lab-event-logs.ts`，新增当前用户最近事件日志查询方法。
- 已新增 `GET /api/lab-event-logs/me`，支持可选 `labKey` 过滤。
- 已新增前端 `fetchCurrentUserLabEventLogs` API client。
- 已扩展 session store，支持账户中心加载最近事件日志。
- 已在账户中心新增“最近事件复盘”时间线。
- 已在实验详情页新增当前实验“最近事件复盘”卡片。
- 本轮未展示 `inputSummaryJson`，避免扩大敏感摘要展示面。
- 已补齐服务端查询 / 接口测试、前端 API / 数据整理 / store 测试。
- 已完成最小必要验证：
  - `pnpm --filter @network-safe/server test`：94 项通过。
  - `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`：通过。
  - `pnpm --filter @network-safe/web exec vitest run`：31 个测试文件、92 项通过。
  - `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`：通过。
  - `git diff --check`：无空白错误，仅有 Windows 换行提示。
  - 前端运行态冒烟：`/account` 与 `/labs/auth/brute-force` 均返回 200。

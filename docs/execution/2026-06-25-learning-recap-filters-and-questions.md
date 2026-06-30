# 阶段 D：事件日志筛选与引导式复盘问题执行文档

## 1. 目标

在已完成“最近实验事件日志复盘”基础上，继续增强学习复盘能力：

- 支持按阶段和风险等级筛选当前用户最近事件日志。
- 在复盘卡片中展示针对当前事件的引导式问题，帮助学习者从攻击方和防御方视角理解日志。

本次仍只展示安全摘要字段，不展示 `inputSummaryJson`。

## 2. 范围

本次包含：

- 扩展 `GET /api/lab-event-logs/me` 查询参数：
  - `phase`
  - `riskLevel`
  - 保留已有 `labKey`
- 后端只接受明确枚举值，非法值按“不启用该筛选”处理。
- 前端 API client 支持筛选参数。
- 账户中心提供阶段 / 风险筛选控件，并按筛选重新读取事件日志。
- 实验详情页复盘卡片展示引导式问题。
- 抽出前端复盘问题生成 helper，补充测试。
- 更新进度文档。

本次不包含：

- 展示输入摘要 JSON。
- 新增数据库字段。
- 后端分页和复杂组合搜索。
- 将问题生成接入外部 AI 服务。

## 3. 筛选字段

允许筛选字段：

- `phase`: `attack` / `defense` / `normal`
- `riskLevel`: `low` / `medium` / `high` / `critical`

筛选依据来自 `lab_event_logs` 已有字段。

## 4. 复盘问题规则

前端根据事件摘要生成固定问题，不调用外部服务。

基础问题：

- 这条事件的后端决策是什么，为什么是这个决策？
- 同样动作切换到另一个变体时，预期信号会如何变化？

按阶段补充：

- `attack`：攻击者控制了哪个输入或动作？
- `defense`：修复版依靠哪个校验或边界阻断？
- `normal`：正常业务路径需要保留哪些条件？

按决策补充：

- `accepted`：系统为什么接受了请求？这是正常接受还是漏洞接受？
- `blocked`：阻断发生在哪个边界？是否影响正常业务？
- `failed`：失败原因是输入无效、目标不存在，还是校验不通过？

## 5. 操作步骤

1. 扩展 `lab-event-logs` 服务查询输入类型和默认 repository 查询条件。
2. 在 `GET /api/lab-event-logs/me` 读取并校验 `phase`、`riskLevel`。
3. 前端 API client 增加筛选参数。
4. session store 的 `loadLabEventLogs` 支持筛选参数。
5. 账户中心增加阶段 / 风险筛选控件和刷新动作。
6. `lab-detail` helper 增加 `createLabEventRecapQuestions`。
7. 实验详情页复盘卡片展示问题列表。
8. 补充服务端、前端 API、store 和 helper 测试。
9. 运行最小必要验证。
10. 更新 `docs/TODO.md` 和主目标文档。

## 6. 风险分析

- **非法筛选值风险**：后端只接受枚举值，非法值不参与查询。
- **敏感信息展示风险**：本轮不展示 `inputSummaryJson`。
- **问题误导风险**：问题只做学习引导，不生成事实结论；事实仍以事件字段为准。
- **页面复杂度风险**：账户中心只放两个筛选维度，避免变成日志检索系统。

## 7. 验证方式

最小必要验证：

- `pnpm --filter @network-safe/server test`
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/web exec vitest run`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `git diff --check`

可选验证：

- 账户中心切换阶段 / 风险筛选后仍能正常请求事件日志。
- 实验详情页最近事件卡片出现引导式复盘问题。

## 8. 完成记录

- 已扩展 `GET /api/lab-event-logs/me`，支持 `phase` 与 `riskLevel` 筛选。
- 已在后端按枚举白名单读取筛选参数，非法值不会进入查询条件。
- 已扩展 `lab-event-logs` 查询服务，支持按当前用户、实验 key、阶段和风险等级查询最近事件。
- 已扩展前端 `fetchCurrentUserLabEventLogs` 与 session store，支持筛选参数。
- 已在账户中心“最近事件复盘”中增加阶段 / 风险筛选控件。
- 已新增 `createLabEventRecapQuestions`，基于事件阶段和后端决策生成固定引导式复盘问题。
- 已在实验详情页事件复盘卡片中展示引导式问题。
- 本轮仍不展示 `inputSummaryJson`。
- 已补齐服务端查询 / 接口测试、前端 API / store / helper 测试。
- 已完成最小必要验证：
  - `pnpm --filter @network-safe/server test`：94 项通过。
  - `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`：通过。
  - `pnpm --filter @network-safe/web exec vitest run`：31 个测试文件、94 项通过。
  - `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`：通过。
  - `git diff --check`：无空白错误，仅有 Windows 换行提示。
  - 前端运行态冒烟：`/account` 与 `/labs/auth/brute-force` 均返回 200。

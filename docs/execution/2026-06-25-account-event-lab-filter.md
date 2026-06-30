# 阶段 D：账户中心按实验筛选事件复盘执行文档

## 1. 目标

在账户中心已有“最近事件复盘”的基础上，补充按实验筛选能力，让学习者可以聚焦某一个实验查看最近攻击 / 防御 / 正常事件。

本次继续复用 `GET /api/lab-event-logs/me` 已支持的 `labKey` 查询参数，不新增数据库字段，不展示输入摘要 JSON。

## 2. 范围

本次包含：

- 账户中心新增“实验”筛选控件。
- 前端根据学习进度、验证记录、当前事件日志生成实验筛选选项。
- session store 的事件日志加载结果返回事件数组，便于页面合并筛选选项。
- 账户中心刷新事件日志时同时传递 `labKey`、`phase`、`riskLevel`。
- 补充前端模型和 store 测试。
- 更新阶段 D 进度文档。

本次不包含：

- 后端新增接口或修改数据库结构。
- 展示 `inputSummaryJson`。
- 做分页、全文搜索或复杂日志查询器。

## 3. 数据来源

实验筛选选项只来自已确认结构：

- `labRecords.progress`
- `labRecords.verifications`
- `labEventLogs`

选项字段固定为：

- `labKey`
- `title`

不从未确认字段推断实验名称。

## 4. 操作步骤

1. 新增账户复盘 helper，合并学习进度、验证记录和事件日志中的实验选项。
2. 扩展 `loadLabEventLogs` 返回事件数组。
3. 账户中心新增 `eventLabFilter` 状态。
4. `eventLogFilters` 同时包含 `labKey`、`phase`、`riskLevel`。
5. 页面增加“实验”下拉框。
6. 切换实验 / 阶段 / 风险时重新读取事件日志。
7. 补充 helper 和 store 测试。
8. 运行最小必要验证。
9. 更新 `docs/TODO.md` 与主目标文档。

## 5. 风险分析

- **选项来源不全**：本轮只从当前用户已有记录和最近日志生成选项，后续可接入实验列表接口做全量选项。
- **敏感信息风险**：筛选只传递 `labKey`，不展示输入摘要。
- **筛选组合为空**：页面已有空状态“暂无事件日志”，不额外报错。
- **状态丢失风险**：切换筛选后保留当前筛选值，列表为空时仍可重新切回“全部”。

## 6. 验证方式

最小必要验证：

- `pnpm --filter @network-safe/web exec vitest run`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `git diff --check`

如涉及服务端类型或接口变更，则补充：

- `pnpm --filter @network-safe/server test`
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`

## 7. 完成记录

- 已新增 `apps/web/src/labs/account-recap.ts`，从学习进度、验证记录和事件日志合并实验筛选选项。
- 已扩展 `loadLabEventLogs`，返回本次加载的事件数组，便于页面保留筛选上下文。
- 已在账户中心“最近事件复盘”中新增“实验”筛选控件。
- 切换实验 / 阶段 / 风险时，会以 `labKey`、`phase`、`riskLevel` 重新读取事件日志。
- 已补充 `apps/web/tests/account-recap.test.ts` 和 session store 筛选测试。
- 已完成最小必要验证：
  - `pnpm --filter @network-safe/web exec vitest run`：32 个测试文件、96 项通过。
  - `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`：通过。
  - `git diff --check`：无空白错误，仅有 Windows 换行提示。
  - 前端运行态冒烟：`/account` 返回 200。

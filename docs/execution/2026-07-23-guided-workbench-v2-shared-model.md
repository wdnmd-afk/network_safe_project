# LT-005 引导式工作台第二版共享模型执行文档

## 1. 目标

按照 `SECURITY-COVERAGE-LONG-TERM-GOAL.md` 第 8 节和任务队列 `LT-005`，设计引导式工作台第二版共享模型。第二版在不增加真实攻击能力的前提下，把第一版的单步评估升级为多固定案例、多步骤状态机、证据/时间线/资产卡、固定分支决策、三类结果（risk/fix/normal）、每步风险信号和统一复盘。

本轮交付边界（经确认）：

- 设计文档：`docs/design/guided-workbench-v2-model.md`。
- 共享类型与 schema：`packages/shared/src/guided-scenarios-v2.d.ts` 和 `guided-scenarios-v2.js`。
- 确定性状态机骨架与共享测试。

本轮不接入运行时后端服务和前端页面，不修改现有 38 个第一版引导式场景的运行行为，不修改现有 65 个实验元数据。运行时接入、逐主题专用化属于 `LT-006` 及后续任务。

## 2. 范围

### 2.1 本轮实施

- 新增 `packages/shared/src/guided-scenarios-v2.d.ts`：第二版共享类型。
- 新增 `packages/shared/src/guided-scenarios-v2.js`：schema 校验器、确定性状态机骨架、第一版兼容适配器。
- 新增 `packages/shared/tests/guided-scenarios-v2.test.mjs`：校验器、状态机和第一版提升测试。
- 在 `packages/shared/package.json` 增加 `./guided-scenarios-v2` 导出。
- 新增设计文档，记录第二版数据模型、状态机语义、安全边界和分批接入计划。

### 2.2 明确不做

- 不修改 `guided-scenarios.js` 第一版目录和其运行语义。
- 不修改后端 `guided-scenario-lab.ts` 服务和现有评估 API。
- 不修改前端 `GuidedScenarioLabView.vue` 和路由。
- 不修改任何 `labs/**/meta.json` 或实验文档。
- 不新增自由正文、真实目标、凭据、系统路径或外部连接字段。

## 3. 设计要点

### 3.1 数据模型

- `GuidedScenarioV2Definition`：`version: 2`、复用第一版的 id/slug/category/subcategory/mode/severity/difficulty/tags/knowledgePoints/safeBoundaries/notes 语义。
- 一个主题支持多个固定案例（`cases[]`），每个案例可携带 `assets` / `timeline` / `evidence` 卡片。
- 每个案例是一个步骤图（`steps[]`），步骤之间通过 option 的 `nextStepKey` 转移，`null` 表示终止。
- 每个 option 声明 `outcome`（risk/fix/normal）、`decision`（accepted/blocked）、`signal`（kebab-case 固定信号）、`explanation` 和可选 `scoreDeltas`。
- `scoringDimensions[]` 是固定评分维度，option 的 `scoreDeltas` 只能引用已登记维度。

### 3.2 状态机语义

- `createGuidedScenarioMachine(definition, caseKey)` 先做完整 schema 校验，非法定义直接抛错。
- `choose(optionKey)` 只在当前步骤已登记的 option 之间转移；未知 option 返回脱敏阻断，不推进状态、不回显原始输入。
- 完成后再次 `choose` 返回 `machine-completed` 阻断。
- `back()` 支持回退一步并回滚分数，`reset()` 回到初始步骤。
- `recap()` 只输出固定 key、步骤、决策、信号、结果计数和分数，作为事件日志安全摘要来源。

### 3.3 第一版兼容

- `liftV1Scenario(v1Definition)` 把任意第一版场景提升为单案例三选项（接受风险 / 弱控制阻断 / 强控制正常）的第二版定义。
- 用于证明第二版模型能够无损表达现有全部 38 个引导式场景，为 `LT-006` 分批迁移提供确定性基线。

## 4. 安全边界

- 所有数据为固定虚构内容，状态机只在已登记 key 之间转移。
- 未知 caseKey、未知 stepKey、未知 optionKey 一律阻断，不回显原始输入。
- signal 与 riskSignal 强制 kebab-case 且限制长度，杜绝把自由文本借字段写入日志。
- recap 只包含计算后的安全摘要，不含正文、目标、凭据或原始未知输入。
- 校验器强制步骤图可达、无环且每条路径可终止，避免死循环或不可达设计。

## 5. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 第二版模型与第一版语义漂移 | 迁移后行为回归 | 提供 `liftV1Scenario` 并测试其保留固定信号 |
| 步骤图存在环或不可达 | 状态机死循环或无法完成 | 校验器做可达性、无环和终止性检查 |
| 分支选项引用未知维度或步骤 | 运行时错误 | 校验器交叉校验 scoreDeltas 维度和 nextStepKey |
| 未知输入写入日志 | 敏感数据风险 | 状态机脱敏阻断且 recap 只输出固定 key |
| 一次性接入运行时 | 破坏 65 个现有实验 | 本轮只交付共享层，运行时接入拆到 LT-006+ |

## 6. 验证方式

- `pnpm test:shared`（含 13 项第二版新测试）。
- 用工作区 TypeScript 对 `guided-scenarios-v2.d.ts` 做 `--strict --noEmit` 类型检查。
- `git diff --check` 和目标文件行尾空白检查。
- 安全关键词扫描，确认没有外部连接、真实凭据读取、命令执行或攻击 payload。

## 7. 完成条件

- 第二版共享类型、schema 校验器和状态机骨架落地并通过测试。
- `liftV1Scenario` 能把 38 个第一版场景全部提升为合法第二版定义。
- 现有第一版目录、后端服务、前端页面和实验元数据行为不变。
- 设计文档记录数据模型、状态机语义、安全边界和分批接入计划。
- 文档、类型和测试入口一致。

## 8. 验证结果

- `pnpm test:shared`：51 项通过（38 项既有 + 13 项第二版），失败 0。
- `guided-scenarios-v2.d.ts` 在 `--strict --noEmit` 下类型检查通过。
- 第二版校验器覆盖：合法定义、错误 version/id、未知 nextStepKey、环、未知维度 scoreDeltas。
- 状态机覆盖：多步固定路径、未知 option 脱敏阻断、back/reset、完成后阻断。
- `liftV1Scenario`：38/38 第一版场景提升为合法第二版定义，且正常路径固定信号保持一致。

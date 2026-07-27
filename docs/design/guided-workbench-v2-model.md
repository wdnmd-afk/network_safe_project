# 引导式工作台第二版共享模型

> 文档状态：持续维护
>
> 首次建立：2026-07-23
>
> 对应任务：`LT-005`
>
> 前置基线：38 个第一版引导式场景（`packages/shared/src/guided-scenarios.js`）

## 1. 文档定位

本文档定义引导式工作台第二版（v2）的共享数据模型、状态机语义、安全边界和分批接入计划，用于回答长期目标第 8 节提出的深化要求。

第二版的目标是在**不增加任何真实攻击能力**的前提下提升学习深度：把第一版的单步评估升级为多固定案例、多步骤状态机、证据分析和固定分支决策。

本文档不替代：

- `SECURITY-COVERAGE-LONG-TERM-GOAL.md` 第 8 节的整体要求。
- `docs/design/security-coverage-matrix.md` 的深度等级定义。
- 各主题独立执行文档。

## 2. 第一版回顾与局限

第一版模型（`guided-scenarios.js`）为每个主题提供：

- 一个固定 `scenarioKey`（单一固定案例）。
- 两个 `controlKey`（弱控制 blocked、强控制 accepted）。
- 一个 `vulnerableOutcome`（漏洞视角 accepted）。
- 单次评估：`(variantKey, scenarioKey, controlKey)` → 一个决策、一个信号、一段说明。

局限：

- 每个主题只有一个案例，无法呈现同一主题的不同情境。
- 只有单步判定，没有多步骤决策、时间线或证据推进。
- 结果只有 accepted/blocked，缺少"正常业务流程继续"的第三类语义显式建模。
- 没有分支、评分维度和统一复盘。

## 3. 第二版数据模型

类型定义见 `packages/shared/src/guided-scenarios-v2.d.ts`，运行时实现见 `guided-scenarios-v2.js`。

### 3.1 顶层定义

`GuidedScenarioV2Definition`：

| 字段 | 说明 |
|---|---|
| `version` | 固定为数字 `2` |
| `id` / `slug` / `category` / `subcategory` | 与第一版一致；`id === \`${category}.${subcategory}\``，`slug === subcategory` |
| `title` / `summary` / `phase` / `notes` | 主题文案与边界说明 |
| `mode` / `severity` / `difficulty` | 与第一版同枚举 |
| `tags` / `knowledgePoints` / `safeBoundaries` | 非空数组 |
| `scoringDimensions[]` | 固定评分维度，含 key/title/description/max |
| `defaultCaseKey` | 默认固定案例 key |
| `cases[]` | 一个或多个固定案例 |

### 3.2 固定案例

`GuidedScenarioV2Case`：

- `key` / `title` / `description`：固定案例标识与文案。
- `assets` / `timeline` / `evidence`：可选卡片数组，`kind` 为 `asset|timeline|evidence|policy`，只含固定 title/detail。
- `initialStepKey`：入口步骤。
- `steps[]`：步骤图。

### 3.3 步骤与选项

`GuidedScenarioV2Step`：`key` / `order` / `title` / `prompt` / `riskSignal` / `options[]`。

`GuidedScenarioV2Option`：

| 字段 | 说明 |
|---|---|
| `key` | kebab-case 固定选项 key |
| `label` | 展示文案 |
| `outcome` | `risk`（漏洞视角）/ `fix`（修复视角）/ `normal`（正常业务） |
| `decision` | `accepted` / `blocked` |
| `signal` | kebab-case 固定学习信号 |
| `explanation` | "为什么危险 / 为什么修复有效"的固定说明 |
| `nextStepKey` | 下一步 step key，`null` 表示终止 |
| `scoreDeltas` | 可选，只能引用已登记的评分维度 |

## 4. 状态机语义

`createGuidedScenarioMachine(definition, caseKey?)`：

1. 先对定义做完整 schema 校验，非法定义直接抛错。
2. 选定 `caseKey`（缺省用 `defaultCaseKey`），未知 caseKey 抛错。
3. 从 `initialStepKey` 开始，维护当前步骤、历史、分数和完成标记。

方法：

- `availableOptions()`：返回当前步骤可选项（仅 key/label/outcome）。
- `choose(optionKey)`：只在已登记选项间转移；未知选项返回 `option-not-allowed` 脱敏阻断，不推进、不回显；完成后再选返回 `machine-completed`。
- `back()`：回退一步并回滚分数。
- `reset()`：回到初始步骤。
- `recap()`：输出事件日志安全摘要（见第 5 节）。

### 4.1 校验器保证

`validateGuidedScenarioV2` 除字段类型外，还强制步骤图：

- 所有 `nextStepKey` 可解析到已登记步骤。
- 无环（DFS 检测回边）。
- 存在终止选项（至少一条路径 `nextStepKey === null`）。
- `scoreDeltas` 只引用已登记评分维度。
- case key、step key、option key 在各自作用域内唯一。

## 5. 安全边界

第二版继续遵守第一版和长期目标第 8.3 节的边界：

- 所有数据为固定虚构内容。
- 状态机只在已登记 key 之间转移；未知 caseKey / stepKey / optionKey 一律阻断。
- `signal` 与 `riskSignal` 强制 kebab-case 且限制长度，防止自由文本借字段写入日志。
- `recap()` 只包含固定 caseKey、path（stepKey/optionKey/outcome/decision/signal）、outcomeCounts、scores 和 terminalOutcome，不含正文、真实目标、凭据或原始未知输入。
- 不新增自由正文、真实目标、凭据、系统路径或外部连接字段。

事件日志安全摘要示例（`recap()` 结构）：

```
{
  caseKey, completed, currentStepKey,
  path: [{ stepKey, optionKey, outcome, decision, signal }],
  outcomeCounts: { risk, fix, normal },
  scores: { <dimensionKey>: number },
  terminalOutcome
}
```

## 6. 第一版兼容与迁移

`liftV1Scenario(v1Definition)` 把第一版场景提升为第二版单案例、单步骤、三选项定义：

- `accept-risk` → outcome `risk`，复用 `vulnerableOutcome`。
- 弱控制 key → outcome `fix`，复用 `controls[0]`。
- 强控制 key → outcome `normal`，复用 `controls[1]`。

作用：

- 证明第二版模型能无损表达现有全部 38 个引导式场景。
- 为 `LT-006` 起的逐主题专用化提供确定性基线：先用提升后的等价定义替换运行时读取，再按主题扩展多案例和多步骤。

## 7. 分批接入计划

本轮（`LT-005`）只交付共享层。后续按主题逐个接入，每个仍需独立执行文档：

1. `LT-006` `web.clickjacking`：设计运行时读取第二版定义的后端服务与前端组件，并率先迁移一个主题。
2. `LT-007`~`LT-010`：`web.open-redirect`、`auth.credential-stuffing`、`auth.session-hijacking`、`auth.oauth` 逐个专用化。
3. 每个主题接入时：保持现有专用实验路由优先级，逐主题灰度，不做一次性大重构。

运行时接入设计要点（留待 LT-006 细化）：

- API 继续只接受已登记 key（caseKey / stepKey / optionKey），未知阻断且不回显。
- 事件日志只写入 `recap()` 的安全摘要。
- 每个主题保留独立 `verify.ts` 与代表性页面级验证。

## 8. 验证

本轮验证：

- `pnpm test:shared`：51 项通过（38 项既有 + 13 项第二版）。
- `guided-scenarios-v2.d.ts` 在 `--strict --noEmit` 下类型检查通过。
- `liftV1Scenario`：38/38 第一版场景提升为合法第二版定义，正常路径固定信号保持一致。

后续接入验证在各主题执行文档中另行定义。

# 知识点级复盘模型设计

> 文档状态：已定稿（`LT-054`）
>
> 建立时间：2026-09-10
>
> 关联任务：`LT-054`（A 组起点，为 `LT-055`～`LT-060` 提供口径）

## 1. 本文档解决什么

第五轮主题是「验证学习是否真的发生」。要判断学习是否发生，必须先有**可判对错的作答语义**——现有复盘题不具备这个语义。

本文档定下五件事，作为 `LT-055`（迁移）、`LT-056`（判定服务）、`LT-057`／`LT-059`（题库内容）、`LT-060`（门禁）的共同口径：

1. 知识点标识形式
2. 选项与正确答案的表示
3. 题目与知识点的绑定结构
4. 掌握度三态判定口径
5. 提示字段及「不得指向答案所在字段」判据

本文档**不含实现代码**，也不改数据库。迁移由 `LT-055` 执行。

## 2. 现状取证

以下全部实测自当前工作树，非推测。

### 2.1 现有题目没有可判对错的语义

`apps/web/src/labs/lab-detail.ts:32` 的 `createLabEventRecapQuestions(event)` 返回 `string[]`：两道写死，两道分别按 `event.phase` 与 `event.decision` 分支。

结构事实：

| 项 | 现状 |
|---|---|
| 题目类型 | 纯字符串数组，无对象结构 |
| 选项 | 不存在 |
| 正确答案 | 不存在 |
| 提示字段 | 不存在 |
| 知识点绑定 | 不存在 |
| 入参 | 只有 `event`，与实验主题无关 |

因此 78 个实验的四道题完全相同。**本项是从零建模，不是改进题库质量。**

### 2.2 `question_key` 当前只编码位置，不编码题目身份

`apps/server/src/services/lab-recap-question-completions.ts:67`：

```ts
export function createRecapQuestionKey(questionIndex: number) {
  return `question-${questionIndex}`;
}
```

服务端**忽略前端传入的任何 key**，只用 `questionIndex` 重新生成（同文件 `:183`）。前端另有一个 `createEventRecapQuestionKey(traceId, questionIndex)` 产出 `${traceId}::question-${index}`（`apps/web/src/labs/event-recap.ts:75`），仅用于前端内存态，**从不落库**。

这带来一处队列未写明、但会直接破坏掌握度判定的结构冲突，见第 6 节。

### 2.3 `knowledgePoints` 是稳定的中文原文数组

`packages/shared/src/lab-metadata.d.ts:43` 声明为 `string[]`。`LT-057` 首批 7 个实验实测各有**恰好 3 个**知识点：

| 实验 | 知识点原文 |
|---|---|
| `web.clickjacking` | 框架嵌入边界／用户意图确认／CSP frame-ancestors |
| `web.open-redirect` | 重定向信任边界／URL 规范化／允许列表 |
| `auth.credential-stuffing` | 凭据复用风险／自适应认证／异常登录关联 |
| `auth.session-hijacking` | 会话生命周期／Cookie 安全属性／上下文绑定 |
| `auth.oauth` | 授权码流程／回调地址校验／PKCE 与 state |
| `api.functional-authorization` | 功能级授权／服务端策略校验／越权操作审计 |
| `business-logic.workflow-bypass` | 流程跳步／服务端状态机／阶段顺序约束 |

### 2.4 现有表与统计口径

`lab_recap_question_completions` 现有列：`user_id`、`trace_id`、`lab_key`、`question_key`、`question_index`、`is_completed`、`completed_at`。唯一键 `(user_id, trace_id, question_key)`。

`docs/design/learning-recap-statistics.md` 第 6 节的现有统计按 `traceId + questionIndex` 逐项检查 `completed === true`，**按事件计数，不按知识点聚合**。该文档明确「不是全量历史学习完成率」。掌握度统计是新维度，不替换它。

## 3. 决策一：知识点标识直接复用 `meta.json` 原文

`knowledgePoint` 取 `meta.json` 中 `knowledgePoints[]` 的**完整原文字符串**，不另编 slug、不做拼音化、不建映射表。

理由：任何 slug 体系都会产生「原文 ↔ slug」两份需双向同步的副本。`LT-042` 的缺陷正是此类漂移（前端固定 key 与后端不一致）。复用原文使 `LT-060` 的门禁退化为一次字符串包含判断，无需维护映射。

代价与接受理由：

| 代价 | 处理 |
|---|---|
| 改 `meta.json` 里的知识点文字会使历史作答记录失去归属 | 接受。知识点原文是学习语义的一部分，改文字等于改知识点。`LT-055` 迁移时 `knowledge_point` 列对既有行写 `NULL`，历史归属本就未知 |
| 中文字符串作为库列值 | 库已是 `utf8mb4_unicode_ci`，现有 `lab_key`、`title` 等列同样存中文 |
| 长度 | 实测最长为 `CSP frame-ancestors`（19 字符）。列宽定 `VARCHAR(120)`，留足余量，由 `LT-055` 落实 |

**判定口径**：`knowledgePoint` 必须与该实验 `meta.json` 的 `knowledgePoints[]` 某一元素**完全相等**（严格 `===`，不做 trim、不做模糊匹配、不区分大小写地放宽）。不相等即为门禁失败。

## 4. 决策二：题目结构（带选项与唯一正确答案的固定单选）

题目从 `string` 升级为固定结构对象。类型定义（`LT-055` 落地到 `packages/shared/src/`，此处为口径）：

```ts
type RecapQuestionOption = {
  key: string;        // 选项稳定标识，同题内唯一，形如 "a"/"b"/"c"/"d"
  text: string;       // 选项文案（固定内容，不接受自由输入）
  correct: boolean;   // 是否正确答案
};

type RecapQuestion = {
  key: string;                  // 题目稳定标识，见决策三
  labKey: string;               // 所属实验，须与 meta.json 的 id 一致
  knowledgePoint: string;       // 决策一：meta.json knowledgePoints 原文
  prompt: string;               // 题干
  options: RecapQuestionOption[];  // 固定选项集，长度 >= 2
  explanation: string;          // 防御性解释（LT-058），说明为何危险/为何修复有效
  hint?: string;                // 决策五：可选提示，不得指向答案所在字段
};
```

硬性约束（`LT-060` 门禁逐条机械校验）：

| 约束 | 判据 |
|---|---|
| 恰好一个正确选项 | `options.filter(o => o.correct).length === 1`。0 个或 ≥2 个均失败 |
| 选项数 ≥ 2 | 单选项无判别力 |
| 选项 key 同题内唯一 | 去重后长度不变 |
| 固定内容 | 全部为预置字符串，前端不提供自由输入框（沿用第 7 节安全边界） |
| 知识点存在 | 决策一的完全相等判据 |
| 题干含主题概念 | 见决策三判据，防止退化为通用题 |

**为何是单选而非多选**：单选的「恰好一个正确答案」是可机械判定的最简语义，`is_correct` 是干净的布尔。多选需要定义「部分正确」口径，会把 `LT-056` 的「答错判未掌握」复杂化。本轮固定单选，不留多选口子。

## 5. 决策三：题目与知识点的绑定，及题目稳定标识

### 5.1 绑定关系

一个知识点对应**一个或多个**题目；一道题**恰好绑定一个**知识点（`knowledgePoint` 是单值而非数组）。

理由：掌握度判定的单元是「知识点」。若一题绑定多个知识点，答错时无法判定是哪个知识点未掌握，`LT-056` 的三态归属会失去确定性。一题一知识点使「答错 → 该知识点未掌握」成为无歧义映射。

### 5.2 题目稳定标识 `question.key`

格式：`<labKey>::<knowledgePoint 序号>::<题内序号>`，例如 `web.clickjacking::kp0::q0`。

- `kp{n}`：该知识点在 `meta.json knowledgePoints[]` 中的下标。用下标而非原文，避免中文进入 key；下标与原文的对应由 `knowledgePoint` 列自身保证，不构成第二份需同步的映射（原文仍以列值形式落库）。
- `q{n}`：该知识点下题目的序号。

**这是本模型与现有 `question-{index}` 的关键区别**：新 key 编码「题目身份」（哪个实验、哪个知识点、第几题），而非「事件内位置」。同一道题在任意 `traceId` 下 key 都相同，这是决策四跨 trace 聚合的前提。

**判据（题干含主题概念，`LT-060` 第三项检查）**：题目的 `prompt` 或某个 `option.text` 必须包含其 `knowledgePoint` 原文，或包含该实验 `tags`／`title` 中的主题词。纯 `phase`／`decision` 通用句式（如「后端决策是什么」）不含任何主题概念，会被此判据拦下——这正是防止退化回 `createLabEventRecapQuestions` 的机械闸门。

## 6. 决策四：掌握度三态口径与一处必须处理的结构冲突

### 6.1 三态定义

按**知识点**聚合（跨该用户对该实验该知识点的全部作答记录，跨 `traceId`）：

| 状态 | 判据 |
|---|---|
| `mastered` | 该知识点下**每一道**已作答题目的**最新一次**作答 `is_correct = true` |
| `attempted` | 该知识点至少有一道题被作答过，但未达 `mastered`（存在最新作答为错，或有题从未答） |
| `untouched` | 该知识点下没有任何作答记录 |

「先答错后答对」口径：**取最新一次作答**（按 `updated_at` 最大者）。先错后对判为该题已掌握；先对后错判为未掌握。理由：掌握度反映当前状态，不是历史最好成绩；用最新值才能让「后来答错」如实拉低掌握度。

`LT-056` 的验收硬性要求由此落地：构造「答错」记录后，该知识点必须**不是** `mastered`。只验证接口返回 200 不算通过。

### 6.2 结构冲突：唯一键与「跨 trace 聚合」相互矛盾（队列未写明）

实测发现的问题：现有唯一键是 `(user_id, trace_id, question_key)`，而决策四要求「同一道题跨多个 trace 聚合」。若 `question_key` 改为决策三的题目身份 key（不含 trace），则**同一用户在不同 trace 答同一道题**会产生多行——这正是聚合所需，唯一键 `(user_id, trace_id, question_key)` 恰好允许这种多行，不冲突。

真正的冲突在另一处：**现有 `question_key` = `question-{index}`（位置绑定）**。若不改这个生成逻辑，新旧两种 key 语义会混存于同一列，`LT-056` 聚合时无法区分某行是「位置态旧记录」还是「题目身份态新记录」。

处理决策：

- `LT-055` 迁移时**不删除、不改写**既有行的 `question_key`（保持 `question-{index}`），但新增 `knowledge_point` 列，既有行该列写 `NULL`。
- `LT-056` 聚合时**只纳入 `knowledge_point IS NOT NULL` 的行**。`NULL` 行是旧位置态记录，其正确性未知（决策一已述），排除出掌握度计算，不污染三态。
- 服务端写入路径需区分：旧的「点过/没点过」接口（`/api/lab-recap-question-completions/me`）保持原样服务旧组件；掌握度作答走 `LT-056` 新增的写入口径，落 `knowledge_point` 与 `is_correct`。两条路径共表不共列语义，由 `knowledge_point` 是否为 `NULL` 区分。

**这条必须在 `LT-055` 执行文档中显式承接**，否则 `LT-056` 会在混存数据上给出错误的掌握度。

## 7. 决策五：提示字段及「不得指向答案所在字段」判据

`hint` 为**可选**字段（决策二结构中的 `hint?`）。它此前不存在，属新增而非修复——规划文档第 9.2 节已纠正「修 hint」的虚构表述。

引入它就必须同时定下防滥用判据，否则提示会变相泄题。判据（`LT-060` 条件性第四项，仅当题目含 `hint` 时触发）：

| 判据 | 说明 |
|---|---|
| `hint` 不得包含任一 `option.text` 的完整文案 | 提示逐字复述某个选项等于点名答案 |
| `hint` 不得包含正确选项的 `key` | 如 `hint` 写「选 b」 |
| `hint` 应指向**分析方法**而非结论 | 例：`session-hijacking` 的提示应是「关注 Cookie 的 Secure 与 SameSite 属性」，而非「修复版设置了 Secure」 |

前两条可机械判定（字符串包含）。第三条是内容质量约束，由出题时人工保证，门禁不强判——但前两条足以挡住最直接的泄题。

## 8. 安全边界（本轮不变）

- 复盘题与全部选项均为**固定预置内容**，前端不提供自由输入框。
- `explanation` 与 `hint` 只说明「为何危险」与「为何修复有效」，不输出可迁移的危险 payload（对齐 `LT-058`）。
- 掌握度是本机个人学习数据，不外传、不做云端同步。
- 不引入排名、分数或竞争机制，只呈现 `mastered`／`attempted`／`untouched` 三态分布（对齐 `LT-078`）。

## 9. 对下游任务的约束交付

| 任务 | 本文档交付的口径 |
|---|---|
| `LT-055` | 新增 `knowledge_point`(VARCHAR 120)、`selected_option_key`、`is_correct`(既有行 NULL) 三列；承接第 6.2 节新旧 key 混存处理；`RecapQuestion`／`RecapQuestionOption` 类型落 `packages/shared/src/` |
| `LT-056` | 三态判据（第 6.1 节）；跨 trace 取最新作答；只纳入 `knowledge_point IS NOT NULL`；验收须证「答错判未掌握」 |
| `LT-057` | 每题恰好一个正确选项、恰好一个知识点、知识点取 `meta.json` 原文、题干含主题概念 |
| `LT-058` | `explanation` 字段的防御性解释边界 |
| `LT-060` | 门禁三项 + 条件性第四项，判据见决策一/二/三/五 |

## 10. 完成标准

- [x] 现状四项结构事实均实测取证（第 2 节）。
- [x] 知识点标识形式已定（决策一：复用原文，附完全相等判据）。
- [x] 选项与正确答案表示已定（决策二：固定单选，恰好一个正确选项）。
- [x] 题目与知识点绑定结构已定（决策三：一题一知识点，附题目身份 key 与主题概念判据）。
- [x] 掌握度三态口径已定（决策四：按知识点跨 trace 取最新作答）。
- [x] 提示字段判据已定（决策五：不得指向答案所在字段）。
- [x] 识别并给出第 6.2 节新旧 `question_key` 混存冲突的处理决策（队列原未写明）。
- [x] 下游各任务约束已交付（第 9 节）。

## 11. 验收证据

### 11.1 脚本实测

| 核对项 | 实测值 | 来源 |
|---|---|---|
| 现有题目类型 | `string[]`，无选项无答案 | `apps/web/src/labs/lab-detail.ts:35-56` |
| 现有 `question_key` 生成 | `question-${index}`，服务端忽略前端 key | `apps/server/src/services/lab-recap-question-completions.ts:67,183` |
| 表现有列与唯一键 | 无 `knowledge_point`/`selected_option_key`/`is_correct`；唯一键 `(user_id,trace_id,question_key)` | `database/migrations/20260629_add_lab_recap_question_completions.sql:2-17` |
| `knowledgePoints` 类型 | `string[]` | `packages/shared/src/lab-metadata.d.ts:43` |
| 首批 7 实验知识点 | 各恰好 3 个，已列名 | 7 个 `meta.json` 的 `knowledgePoints` 段 |
| 现有统计维度 | 按 `labKey` 事件计数，非知识点聚合 | `docs/design/learning-recap-statistics.md:49,64-69` |

### 11.2 未执行的验证

本切片仅新增一个 Markdown 设计文档，无代码、无数据库、无接口变更，因此**未执行 lint、类型检查、单元测试、E2E 与 build**。上表全部为只读实测，未修改任何被核对的源文件。实现与其验证由 `LT-055` 起各自承接。

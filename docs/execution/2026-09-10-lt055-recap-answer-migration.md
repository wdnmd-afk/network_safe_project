# LT-055 复盘作答字段迁移执行文档

> 文档状态：实施中
>
> 建立时间：2026-09-10
>
> 关联任务：`LT-055`
>
> 上游设计：`docs/design/knowledge-point-recap-model.md`

## 1. 目标

扩展 `lab_recap_question_completions`，使记录能够表达「这次选择了什么、是否答对、绑定哪个知识点」，为 `LT-056` 按知识点跨 trace 判定掌握度提供可信数据。

新增三列：

| 列 | 类型 | 既有行 | 语义 |
|---|---|---|---|
| `knowledge_point` | `VARCHAR(120) NULL` | `NULL` | `meta.json knowledgePoints[]` 的完整原文 |
| `selected_option_key` | `VARCHAR(100) NULL` | `NULL` | 固定单选中用户所选选项的稳定 key |
| `is_correct` | `BOOLEAN NULL` | `NULL` | 本次作答是否正确 |

三列均不设置非空默认值。`NULL` 明确表示「旧记录没有该语义」，不能伪造成答对、答错或某个知识点。

## 2. 范围

本项修改：

1. 新增顺序迁移 SQL，以 `ALTER TABLE` 增加三列。
2. 同步 Prisma 模型。
3. 同步 `schema:ensure`：新建表时包含新列；表已存在时逐列幂等补齐。
4. 在 `@network-safe/shared` 落地 `LT-054` 定义的复盘题与三态类型。
5. 回填长期目标与 TODO 证据。

本项不修改：

- 现有复盘完成接口及其「点过／没点过」行为。
- 掌握度服务、作答 API 与跨 trace 聚合（属于 `LT-056`）。
- 具体题库内容（属于 `LT-057`／`LT-059`）。
- 既有行的 `question_key`、`question_index`、`is_completed` 或时间字段。

## 3. 真实结构与影响链

权威 DDL：`database/migrations/20260629_add_lab_recap_question_completions.sql`。

当前唯一键：`(user_id, trace_id, question_key)`。新增列不改变唯一键，也不改写现有 `question-{index}` key。

同一结构存在三处，必须同步：

1. `database/migrations/*.sql`：权威迁移。
2. `database/schema/platform/schema.prisma`：服务端 Prisma 客户端模型。
3. `apps/server/scripts/ensure-local-schema.mjs`：旧本机环境的缺表／缺列补齐入口。

`tools/database/verify-schema-consistency.ts` 会解析迁移中的 `ALTER TABLE ... ADD COLUMN` 并与 Prisma 列集合比对；其当前只检查 `schema:ensure` 的建表对象是否已知，不检查 ensure 的列类型，因此仍须人工核对三处列名、空值与长度。

## 4. 操作步骤

1. 新增 `20260910_add_recap_answer_fields.sql`，只执行三列追加，不回填旧数据。
2. Prisma `LabRecapQuestionCompletion` 增加三个可空字段，并保持现有映射与索引不变。
3. `schema:ensure` 的建表 DDL加入三列；对已存在表读取 `information_schema.columns`，仅补缺失列。
4. 新增共享复盘模型类型与 `recapMasteryStatuses` 运行时常量，并登记包导出。
5. 静态核对迁移、Prisma、ensure 三处列定义和新旧数据语义。
6. 更新长期目标、TODO 与执行文档状态。

## 5. 实施建议

- 迁移文件只追加，不修改历史迁移，确保已经应用过旧迁移的数据库可顺序升级。
- 三列使用 `NULL` 作为旧记录边界；禁止用空字符串、`false` 或占位知识点回填。
- `selected_option_key` 宽度与现有 `question_key` 同为 100，足以容纳固定选项 key，并保持接口边界一致。
- `knowledge_point` 使用 120，承接 `LT-054` 设计，不另建 slug 映射。
- `schema:ensure` 仅执行固定列名与固定 DDL，不拼接用户输入。

## 6. 潜在风险

| 风险 | 影响 | 控制 |
|---|---|---|
| 只改 Prisma、漏迁移 | 运行时报 Unknown column | 三方同步并由 schema 一致性门禁检查 |
| 只改迁移、漏 ensure | 旧 Playwright 本机库无法补列 | 表存在时逐列检查并补齐 |
| 给 `is_correct` 默认 `false` | 所有旧完成记录被误判为答错 | 列可空且无默认，旧行保持 `NULL` |
| 给旧记录猜知识点 | 污染掌握度 | 禁止回填；`LT-056` 只聚合非空知识点 |
| 重写历史 `question_key` | 破坏现有前端完成态关联 | 本项不更新任何既有行 |
| DDL 执行中断 | 三列可能部分追加 | `schema:ensure` 可逐列补齐；迁移应用前后均应核对列集合 |

## 7. 优化方案

本项保持最小改动，不新增答案历史表。现有唯一键允许同一题在不同 trace 保留多行，可支持 `LT-056` 跨 trace 取最新作答。

若未来需要保存同一 trace 内每次尝试的完整历史，应新增独立 append-only 表，而不是继续扩展当前 upsert 记录；该扩展不属于第五轮当前范围。

## 8. 验证方式

按全局规则，本项默认只做静态必要验证，不主动运行测试、类型检查、构建或连接本机数据库。

静态验证：

- 迁移、Prisma、ensure 三处均出现三列，命名完全一致。
- 三处 `knowledge_point`/`selected_option_key`/`is_correct` 均为可空语义。
- 历史迁移未被改写。
- `schema:ensure` 只补缺失列。
- `git diff --check` 通过。

建议但本次不默认执行的命令验证：

- `pnpm test:db-schema`：运行仓库内三方结构一致性验证。
- `pnpm --filter @network-safe/server schema:ensure`：连接本机数据库执行旧库幂等补列。
- `pnpm db:migrate`：正式应用待执行迁移。
- `pnpm typecheck`：验证 Prisma 客户端与 TypeScript 类型（需先确认客户端已生成）。

以上命令须用户明确同意后执行；若未执行，将在最终汇报中如实记录。

## 9. 完成标准

- [x] 执行文档先于实现建立。
- [x] 顺序迁移新增三列且不猜测旧记录。
- [x] Prisma 模型同步。
- [x] `schema:ensure` 同时覆盖新建表与既有表缺列。
- [x] 共享复盘模型类型落地并导出。
- [x] 静态核对及 `git diff --check` 通过。
- [x] 长期目标与 TODO 证据回填。

## 10. 实施结果与证据

### 10.1 改动清单

| 文件 | 结果 |
|---|---|
| `database/migrations/20260910_add_recap_answer_fields.sql` | 通过 `information_schema` 守卫幂等追加三列及掌握度聚合索引；不更新任何既有行 |
| `database/schema/platform/schema.prisma` | 三个字段均为可空；增加 `(userId, labKey, knowledgePoint)` 索引映射 |
| `apps/server/scripts/ensure-local-schema.mjs` | 新建表 DDL 含新列与索引；既有表逐列、逐索引判存补齐 |
| `packages/shared/src/recap-questions.js/.d.ts` | 落地固定单选题、三态、稳定题目 key 与结构校验 API |
| `packages/shared/package.json` | 新增 `./recap-questions` 导出 |

### 10.2 静态核对

- 三方列名完全一致：`knowledge_point`、`selected_option_key`、`is_correct`。
- `knowledge_point` 三方均为 120 字符可空；`selected_option_key` 三方均为 100 字符可空；`is_correct` 三方均可空。
- 掌握度索引名及列顺序三方一致：`(user_id, lab_key, knowledge_point)`。
- 旧迁移 `20260629_add_lab_recap_question_completions.sql` 未改写。
- 新迁移不包含 `UPDATE`，不猜测既有行的知识点、选项或正确性。
- `schema:ensure` 的外部输入只用于参数化查询；执行的列名、列定义、索引名和 DDL 均来自脚本内固定字面量。
- 共享校验器落实了选项不少于两个、key 唯一、恰好一个正确选项、提示不复述选项且不包含正确选项 key；知识点存在性留给需读取元数据的 `LT-060` 门禁。
- `git diff --check` 通过。

### 10.3 未执行的验证

遵循全局规则，未经用户明确要求，本项**未执行** `pnpm test:db-schema`、`schema:ensure`、`db:migrate`、`typecheck`、单元测试、E2E 与 build。因此：

- 迁移尚未实际连接本机 MySQL 应用；
- `schema:ensure` 的旧库补列路径尚未在真实数据库执行；
- 共享校验器尚未运行自动化测试（测试建设由后续门禁任务承接）。

当前完成结论仅限：实现、文档和静态一致性核对已完成。数据库实跑仍属于待用户授权的命令验证。
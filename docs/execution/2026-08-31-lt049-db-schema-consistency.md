# LT-049 数据库 schema 与迁移一致性检查执行文档

> 文档状态：已完成
>
> 建立时间：2026-08-31
>
> 关联任务：`LT-049`（覆盖长期目标第 10.2 与第 11 节相关条目）

## 1. 目标

建立数据库 schema、迁移与 Prisma 模型的一致性检查，并纳入根级门禁。

## 2. 实施前确认的现状

仓库中有三处描述同一套表结构的来源，此前**无任何机械校验**：

| 来源 | 路径 | 角色 |
|---|---|---|
| 迁移 DDL | `database/migrations/*.sql`（4 个文件） | 真正建表，权威来源 |
| Prisma 模型 | `database/schema/platform/schema.prisma`（11 个模型） | Prisma 客户端读取 |
| 补齐脚本 | `apps/server/scripts/ensure-local-schema.mjs` | 为已有库补缺失表 |

实测计数：4 个迁移文件创建 **12 张表**，Prisma 有 **11 个模型**。

差异来源为 `sql_injection_lab_products`：它由 `20260625_add_sql_injection_lab_products.sql` 创建，被 `apps/server/src/services/sql-injection-lab.ts` 使用，但不在 Prisma schema 中。

核实后确认这是**有意设计而非缺陷**：该服务通过 `$queryRawUnsafe` 与 `$queryRaw` 直连该表（第 134、147 行），因为 `web.sql-injection` 实验必须用原生 SQL 才能演示不安全字符串拼接与参数化查询的差异。原生查询不需要 Prisma 模型。

该判断的处理方式是在检查器中显式登记为例外并写明理由，而不是放宽规则或忽略这张表。

## 3. 未校验前的实际风险

新增 Prisma 模型却漏写迁移，或修改模型字段却没有对应 DDL，都不会让任何门禁失败——问题只在运行期暴露为「表不存在」或「字段不存在」。这与 `LT-045` 审计中发现的契约盲区同类：存在多处副本却无相等性断言。

## 4. 交付内容

新增 `tools/database/verify-schema-consistency.ts`，四类检查：

| 检查 | 断言内容 |
|---|---|
| `prisma-models-have-migration` | 每个 Prisma 模型的 `@@map` 表名都由迁移真实创建 |
| `migration-tables-have-model` | 每张迁移表都有 Prisma 模型，或已在例外表中登记理由 |
| `columns-exist:<table>` | 每个模型声明的列（含 `@map` 重命名后的真实列名）都在迁移中存在 |
| `ensure-script-tables-known` | `schema:ensure` 涉及的表都在迁移中定义，不会建出与迁移不一致的结构 |

实现要点：

- 迁移 DDL 视为权威来源，Prisma 与 `schema:ensure` 与之比对。
- 解析时先剥离 SQL 注释，避免注释中的示例 DDL 被误认为真实语句。
- 用括号配平取 `CREATE TABLE` 定义体，再按顶层逗号切分定义项；只有以反引号列名开头的项算列，`PRIMARY KEY` / `UNIQUE` / `INDEX` / `CONSTRAINT` 等自然被跳过。
- 合并同一张表在后续迁移中通过 `ALTER TABLE ... ADD COLUMN` 增加的列。
- Prisma 侧跳过关系字段（带 `@relation` 或类型为模型数组），它们不是数据库列。
- 只解析仓库内文本，不连接数据库，因此可在无 MySQL 的环境与 CI 中运行。

## 5. 有效性验证（注入测试）

「全绿」本身不构成有效性证据——这是 `LT-046` 首版信号检查漏判后确立的做法。本切片对两类真实漂移做注入测试。

### 5.1 注入一：模型增列但迁移无该列

在 `User` 模型加入 `lastLoginIp String? @map("last_login_ip")`：

```
ok False failed 1
  columns-exist:users | users: 模型声明但迁移中不存在的列 —— last_login_ip
```

### 5.2 注入二：新增模型但无建表迁移

追加 `model UserNote { ... @@map("user_notes") }`：

```
ok False failed 1
  prisma-models-have-migration | 以下 Prisma 模型无对应建表迁移：UserNote(user_notes)
```

两次注入均被精确捕获并指明具体表名与列名。每次注入后立即从备份恢复，恢复后检查器回到 `ok: true`、15 项检查、0 失败。

## 6. 门禁接入

新增 `pnpm test:db-schema`，并插入 `pnpm verify` 链的 `test:contracts` 之后、`test:entrypoints` 之前。

## 7. 安全边界

- 只读取仓库内 `.sql`、`.prisma`、`.mjs` 文本并在内存中解析。
- 不连接数据库、不发起网络请求、不执行系统命令、不读取任何凭据。
- 不修改任何迁移、schema 或数据。
- 注入测试只在本机临时改写 schema 文件，立即从备份恢复且不提交。

## 8. 完成标准

- [x] 核实三处结构来源与其真实计数。
- [x] 核实 12 表 vs 11 模型的差异性质，确认为有意设计并登记例外。
- [x] 实现四类一致性检查。
- [x] 两类注入测试均证明检查有效。
- [x] 注入后完整恢复，工作区无残留。
- [x] 纳入根级 `pnpm verify` 门禁。
- [x] 长期目标、TODO 同步。
- [x] `git diff --check` 通过并提交。

## 9. 验收证据

- `pnpm test:db-schema`：`ok: true`，4 个迁移、12 张迁移表、11 个 Prisma 模型、**15 项检查**、0 失败。
- 注入测试：两类漂移各自被对应检查项精确捕获（见第 5 节），恢复后全绿。
- 门禁：`test:db-schema` 已在 `verify` 链中。

## 9.1 第二部分：迁移状态检查与失败回滚说明

队列条目 `LT-049` 除一致性检查外还含「补迁移状态检查与失败回滚说明」。该部分单独交付如下。

### 9.1.1 实施前现状

- 迁移状态**已有记录机制**：`network_safe_schema_migrations` 表，由 `apply-migrations.mjs` 维护。
- `database/README.md` 第 45、47 行已覆盖「成功才写记录」与「失败不写记录」的行为。
- **缺失的是只读查询入口**：`apply-migrations.mjs` 只有应用模式，会创建数据库、建记录表并执行迁移。想知道当前状态就必须先改变状态，这在排障与发布前核对时不可接受。

### 9.1.2 新增 `pnpm db:status`

在 `apply-migrations.mjs` 中新增 `reportMigrationStatus()` 与 `--status` CLI 模式，复用既有配置加载与 mysql 调用，不复制那部分逻辑。

只读保证：不执行 `CREATE DATABASE`、不执行 `CREATE TABLE`、不应用迁移、不写任何记录。库或记录表不存在时报告为对应状态而非报错——那正是全新环境的正常状态。

除 `pending` 外，该命令还识别两类此前无法发现的异常：

- `inconsistent`：已记录为已应用但关键表实际缺失。**比 `pending` 更危险**，因为 `db:migrate` 会跳过这些迁移，不会重建缺失的表。
- `orphan-records`：记录存在但仓库已无对应迁移文件，通常因文件被改名或删除。

两者均使命令返回非零退出码。

### 9.1.3 实测验证

| 场景 | 结果 |
|---|---|
| 真实本机库 | `state: up-to-date`、`applied: 4/4`、exit=0 |
| 真实凭据 + 不存在的库名 | `reachable: true`、`databaseExists: false`、`pending: 4`、无错误 |
| 只读性验证 | 查询不存在的库后，该库**仍不存在**，确认未创建任何对象 |

过程中一次误判值得记录：首次用假密码构造探针 URL，得到 `reachable: false`，我一度以为是分支缺陷。核对错误信息为 `ERROR 1045 Access denied` 后确认是探针凭据问题，代码行为正确。改用真实凭据仅替换库名后分支符合预期。

### 9.1.4 `database/README.md` 新增两节

- **迁移状态查询**：`state` 五种取值的含义与处置表，以及 `needs-attention` 下三类明细的区别与应对。
- **迁移失败与回滚**：明确说明本项目**不提供自动回滚**及其理由（MySQL DDL 多数不支持事务回滚，自动回滚会给出虚假安全感）；给出单迁移失败的四步处置、本机环境的最简重建路径及其代价、以及两条明确禁止事项（不要手工插记录跳过失败迁移、不要修改已应用的迁移文件）。

## 10. 遗留与后续建议

- 本检查器**只校验表与列的存在性，不校验列类型、长度、可空性与索引**。类型漂移（如 `VarChar(64)` 改成 `VarChar(32)`）仍需人工复核。若要覆盖，需解析 MySQL 类型语法并与 Prisma 的 `@db.*` 属性建立映射表，工作量显著大于本切片，建议单独评估。
- 第 11 节数据治理的其余条目（本机备份恢复流程、演示数据与个人学习数据边界、日志保留策略）不属本切片范围，仍未完成。

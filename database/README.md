# database

本目录维护平台数据库 schema、迁移和长期可复现的本机初始化入口。

## 目录结构

- `schema/platform/`：Prisma 平台 schema，当前服务端运行时使用。
- `schema/labs/`：实验专用 schema 预留目录。
- `seeds/platform/`：平台种子预留目录。
- `seeds/labs/`：实验种子预留目录。
- `migrations/`：按文件名顺序执行的 MySQL SQL 迁移。
- `scripts/apply-migrations.mjs`：Windows 本机迁移执行器和迁移状态记录器。

## 本机初始化

先准备 `apps/server/.env`（可从 `apps/server/.env.example` 复制），确认 `DATABASE_URL` 指向本机 MySQL 数据库。

在仓库根目录执行：

```powershell
pnpm db:prepare
```

该命令按以下顺序执行：

1. 创建不存在的数据库。
2. 按文件名顺序应用 `database/migrations/*.sql`。
3. 在数据库中写入 `network_safe_schema_migrations` 迁移记录。
4. 幂等补齐 `lab_recap_question_completions`。
5. 写入本机演示账号。
6. 同步 14 个分类、75 个实验和 150 个变体（当前 75 个 `ready`）。

也可以分步执行：

```powershell
pnpm db:migrate
pnpm --filter @network-safe/server schema:ensure
pnpm --filter @network-safe/server seed:auth
pnpm --filter @network-safe/server seed:labs
```

## 迁移规则

- 迁移文件使用 `YYYYMMDD_description.sql` 命名，并按字典序执行。
- 成功执行后才写入 `network_safe_schema_migrations`。
- 已记录的迁移会跳过，并检查其关键表是否仍然存在。
- DDL 迁移失败后不会写入成功记录；应先查看 MySQL 错误，再修复或恢复数据库后重试。
- 对已有但没有迁移记录的数据库，只有在确认结构完整后才允许显式执行：

```powershell
pnpm db:migrate -- --baseline-existing
```

`--baseline-existing` 只登记已存在的关键表，不会自动修复未知 schema，不能替代备份和迁移审计。

## 迁移状态查询

```powershell
pnpm db:status
```

只读命令：不创建数据库、不建迁移记录表、不应用任何迁移，仅报告当前状态。可安全用于排障与发布前核对。

可能的 `state` 取值与含义：

| state | 含义 | 处置 |
|---|---|---|
| `up-to-date` | 全部迁移已应用，无异常 | 无需处理 |
| `database-not-created` | 数据库尚不存在 | 全新环境的正常状态，执行 `pnpm db:prepare` |
| `migration-table-missing` | 库存在但无迁移记录表 | 既有库需确认结构完整后执行 `--baseline-existing` |
| `needs-attention` | 有待应用迁移或存在异常记录 | 见下方三类明细 |
| `unreachable` | 无法连接 MySQL | 检查 `DATABASE_URL`、MySQL 是否运行、或设置 `MYSQL_CLI_PATH` |

`needs-attention` 下会进一步列出三类明细：

- `pending`：仓库中存在但尚未应用的迁移。执行 `pnpm db:migrate` 即可。
- `inconsistent`：**已记录为已应用，但其关键表实际缺失**。这比 `pending` 更危险，因为 `pnpm db:migrate` 会直接跳过这些迁移，不会重新创建缺失的表。通常源于手工删表或从不完整备份恢复。需先核对库结构，确认后再决定是否删除对应记录并重跑迁移。
- `orphan-records`：迁移记录表中存在、但仓库已无对应 `.sql` 文件。通常因迁移文件被改名或删除。

`inconsistent` 与 `orphan-records` 会使命令返回非零退出码，便于在脚本中检测。

## 迁移失败与回滚

本项目的迁移器不提供自动回滚：MySQL 的 DDL 多数不支持事务回滚，自动回滚会给出虚假的安全感。实际处置顺序如下。

**失败时的既有保护：**

- 迁移执行失败时不会写入成功记录，因此该迁移下次仍会被尝试，不会被误判为已完成。
- 已记录的迁移在每次执行时都会复核其关键表是否仍存在，缺失会被报出。

**单个迁移执行失败：**

1. 先读 MySQL 原始错误。迁移器只截断并脱敏密码，不改写错误内容。
2. 用 `pnpm db:status` 确认哪些已应用、哪些待应用。
3. 若失败发生在多语句迁移中途，该文件的部分语句可能已生效。**不要直接重跑**，先核对该迁移涉及的表与列的实际状态。
4. 修正迁移文件或手工补齐缺失结构后重跑 `pnpm db:migrate`。

**本机学习环境的最简恢复路径：**

本机数据库只承载学习记录与固定演示数据，不含业务数据。结构损坏时重建通常比逐步修复更可靠：

```powershell
# 确认库名后手工 DROP，再重新初始化
pnpm db:prepare
```

代价是丢失本机学习进度、事件日志与复盘记录。若需保留，先自行备份再重建。

**不要做的事：**

- 不要手工往 `network_safe_schema_migrations` 插入记录来"跳过"失败的迁移。这会让 `inconsistent` 状态永久化，后续迁移可能建立在不存在的表上。
- 不要修改已应用过的迁移文件内容。已应用的迁移不会重跑，改动只会让仓库与实际库结构脱节。需要变更结构时新增迁移文件。

## MySQL 客户端

迁移器默认调用 Windows PATH 中的 `mysql.exe`。如果 MySQL 客户端不在 PATH，可通过本机环境变量指定完整路径：

```powershell
$env:MYSQL_CLI_PATH = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
pnpm db:migrate
```

密码从 `DATABASE_URL` 解析后通过子进程环境传递，不写入命令行参数、日志或 Git 文件。不要提交 `.env` 或真实凭据。

## 验证

- `pnpm --filter @network-safe/testing test -- tests/database-migrations.test.mjs`
- `pnpm --filter @network-safe/server prisma:validate`
- `pnpm --filter @network-safe/server schema:ensure`
- `pnpm --filter @network-safe/server seed:labs`
- `GET /api/health/db`

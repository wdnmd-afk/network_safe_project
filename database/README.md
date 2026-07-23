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
6. 同步 9 个分类、65 个实验和 130 个变体。

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

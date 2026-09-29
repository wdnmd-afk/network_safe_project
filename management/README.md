# Network Safe 管理端

本机网络安全学习平台 `network_safe_project` 的管理端。代码位于主仓库的 `management/` 子目录，是一个**嵌套的独立 pnpm workspace**，运行独立进程、独立端口，与主站前后端互不影响。用于**配置实验启停**与**查看攻防学习过程**。

## 与主项目的关系

| 维度 | 说明 |
|---|---|
| 代码位置 | 主仓库的 `management/` 子目录，自带 `pnpm-workspace.yaml`，与主仓库的 workspace 互不包含 |
| 数据库 | 直连主项目同一个 MySQL 库。主项目后端**不新增任何 `/admin` 接口** |
| 表读写 | 对主项目业务表**只读**；唯一写入例外是 `labs.is_enabled` 与 `lab_variants.is_enabled` |
| 自有表 | `admin_audit_logs`，由本仓库的迁移创建 |
| 迁移记录 | 本仓库用 `nsm_schema_migrations`，主项目用 `network_safe_schema_migrations`，互不干扰 |
| 账号 | 复用主项目 `users` 表，只认 `role = 'admin'` 且 `status = 'active'`。账号由主项目 `seed:auth` 维护 |
| 令牌 | 同一套 HMAC 格式，但密钥取 `ADMIN_TOKEN_SECRET`，与主站 `AUTH_TOKEN_SECRET` 不同，两边令牌互不通用 |

schema 一致性由 `pnpm test:schema-drift` 强制：逐列比对两侧 `schema.prisma`，并内置变异自检，确认门禁真的会失败。

## 前置条件

1. 主项目已就绪：执行过 `pnpm db:prepare`（建库、迁移、种子账号、实验元数据入库）。
2. 本机 MySQL 可连接。
3. `apps/admin-server/.env` 已配置（见下）。

## 配置

```powershell
Copy-Item .env.example apps/admin-server/.env
```

`.env` 关键项：

- `DATABASE_URL`：必须与主项目 `apps/server/.env` 指向同一个库。
- `ADMIN_TOKEN_SECRET`：必须与主项目的 `AUTH_TOKEN_SECRET` **不同**，否则主站令牌可直接用于管理端。
- `ADMIN_SERVER_HOST`：只允许 `127.0.0.1` / `localhost` / `::1`。写成其它值服务会**拒绝启动**——该账号可读取全部用户的事件日志，不允许对外监听。
- `MAIN_SITE_ORIGIN`：主站地址，用于在总览页提示主站是否可达。

## 安装与启动

```powershell
pnpm install
pnpm prisma:generate
pnpm db:migrate      # 创建 admin_audit_logs 表（库必须已由主项目创建）

pnpm dev:server      # 管理端后端，127.0.0.1:6681
pnpm dev:web         # 管理端前端，127.0.0.1:6680
```

访问 `http://127.0.0.1:6680`，用主项目的管理员账号登录（默认 `admin / 123456`）。

## 功能

| 页面 | 能力 | 读写 |
|---|---|---|
| 总览 | 实验与变体数量、事件总量与阻断率、近 7 日事件量、风险分布、主站可达性与启停状态来源 | 只读 |
| 事件审计 | 跨用户事件日志，支持按实验、变体、阶段、风险、结果、用户、日期筛选与分页；按 `traceId` 查看完整攻防链路 | 只读 |
| 实验目录 | 启停实验与变体，停用需二次确认，每次变更写审计 | 写 |
| 学习过程 | 账号列表与单个账号的进度、验证记录、复盘完成情况 | 只读 |
| 操作审计 | 管理端写操作记录（谁、何时、对什么对象、前后值） | 只读 |

停用会**三层同时生效**：主站实验目录不再给出入口、前台直访被重定向回详情页、实验接口返回 403。

## 字段与脱敏边界

- 事件响应使用主项目 `UserLabEventLogSummary` 的字段集，另加 `id`、`userId`、`username`。
- **不返回** `inputSummaryJson`、`method`、`path`、`passwordHash`。前三列在库中存在但不得外传，`passwordHash` 是凭据列。
- 审计只保存 `{"isEnabled": boolean}` 前后值，不保存请求体，登录失败也不记录密码。

## 验证

```powershell
pnpm verify          # typecheck + 共享契约 + 服务端测试 + 前端测试 + schema 漂移门禁
pnpm test:e2e        # Playwright：会自动拉起主站与管理端四个进程
```

测试分三层：单元（纯逻辑）、API（未登录 401 / 非管理员 403 / 管理员 200，并断言响应不含禁止字段）、E2E（停用后在主站三层同时生效，恢复后回退）。

## 安全边界

- 仅用于本机受控学习环境，不得对外部署。
- 管理员密码为弱口令，安全依赖来自「只监听回环地址」这一硬约束，不要绕过。
- 不要对本仓库执行 `prisma migrate dev` 或 `prisma db push`：两侧共库，Prisma 会试图按本仓库的子集 schema 改动主项目结构。

## 目录

```text
apps/admin-server    Express + Prisma 后端
apps/admin-web       Vue 3 + Pinia + Vue Router 前端
packages/shared      前后端共用契约类型与枚举
packages/testing     Playwright E2E
database             admin_audit_logs 迁移与迁移脚本
tools/schema-drift   与主项目的 schema 一致性门禁
docs/execution       执行与收口文档
```

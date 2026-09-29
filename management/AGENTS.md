# 项目级协作规则

本文件约束主仓库 `management/` 子目录（管理端）内的开发、文档、脚本与测试。与仓库根目录的 `AGENTS.md`、用户全局规则同时生效；本文件更严的地方以本文件为准。

## 1. 项目定位

主项目 `network_safe_project` 的**管理端**，运行于 Windows 本机，用于配置实验启停与查看攻防学习过程。不是通用后台，不承载学习功能——学习者界面仍在主项目。

## 2. 与主项目的硬约束

- 本仓库与主项目**共用一个 MySQL 库**。
- 对主项目业务表（`users`、`labs`、`lab_variants`、`learning_progress`、`verification_records`、`lab_event_logs`、`lab_recap_question_completions`）**只读**。
- 唯一写入例外：`labs.is_enabled`、`lab_variants.is_enabled`。新增任何对主项目表的写入都必须先补执行文档并说明理由。
- 自有表仅 `admin_audit_logs`。
- 迁移记录表固定为 `nsm_schema_migrations`，不得使用主项目的 `network_safe_schema_migrations`。
- **禁止**对本仓库执行 `prisma migrate dev`、`prisma db push`、`prisma migrate deploy`：Prisma 会按本仓库的子集 schema 试图改动主项目结构。建表一律通过 `database/migrations/*.sql` 加 `database/scripts/apply-migrations.mjs`。

## 3. 字段与契约规则

- 禁止猜测字段名。
- 禁止多字段兜底式写法。
- 跨仓库字段来源优先级：主项目 `schema.prisma` → 主项目服务层实现 → 主项目共享类型 → 本文档。
- 事件、审计、分页等跨前后端契约统一放 `packages/shared`，前后端各自不得重复定义。
- 枚举取值必须与主项目 `apps/server/src/services/lab-event-logs.ts` 一致，由 `packages/shared/tests/contract.test.ts` 读取主项目源码断言。
- 主项目新增列而本仓库 schema 未跟上时，`pnpm test:schema-drift` 必须失败。修改该门禁后要确认自检仍然有效。

## 4. 安全规则

- `ADMIN_SERVER_HOST` 只允许回环地址，启动时校验，不满足即拒绝启动。不得为方便调试放开。
- 令牌密钥 `ADMIN_TOKEN_SECRET` 必须与主项目 `AUTH_TOKEN_SECRET` 不同。
- 响应**不得**包含 `inputSummaryJson`、`method`、`path`、`passwordHash`，以及任何 `DATABASE_URL`、密钥、本机绝对路径。
- 审计中不得出现密码；登录失败只记录截断后的用户名。
- 所有查询参数只接受固定字段与枚举，不接受自由文本或原始查询。

## 5. 代码规则

- 注释用中文，解释「为什么」与关键约束，不重复代码表面含义。
- 纯逻辑（参数解析、映射、聚合、判定）与副作用（Prisma、HTTP、进程）分离，前者放可单测的模块。
- 组件内禁止写死颜色值，一律使用 `src/styles/tokens.css` 的 token。
- 非必要不引入新依赖；不引入 UI 组件库与图标库。

## 6. 测试规则

- 三层：单元（纯逻辑）、API（权限三态 + 脱敏断言）、E2E（跨仓库全链路）。
- 新增受保护路由必须同步登记到 API 测试的 `protectedRoutes` 清单，否则权限门禁会漏测。
- 未完成验证前不得声称已完成。
- 未经用户明确要求，不执行全量构建与发布命令；测试与类型检查按阶段执行并在汇报中如实列出。

## 7. 文档规则

- 关键文档用中文，放 `docs/execution/`。
- 偏离执行文档必须先说明原因、影响范围与调整方案。

## 8. Git 提交规范

采用 Conventional Commits：`<type>(<scope>): <subject>`，`subject` 用中文、不以句号结尾。

- `scope` 取：`root`、`admin-web`、`admin-server`、`shared`、`testing`、`database`、`tools`、`docs`
- 禁止提交 `.env`、真实密钥、构建缓存与无关产物。

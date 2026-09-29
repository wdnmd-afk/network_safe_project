# 独立管理端落地收口

> 建立时间：2026-09-16
>
> 上游文档：主项目 `docs/execution/2026-09-16-admin-management-rebuild.md`（规划与主项目侧改动）
>
> 结论：P0～P6 全部完成，三层测试与跨仓库 E2E 均已实跑通过

## 1. 交付内容

代码位于主仓库 `network_safe_project/management/`，是一个嵌套的独立 pnpm workspace（自带 `pnpm-workspace.yaml` 与 lock 文件，与主仓库的 workspace 互不包含）：

| 组成 | 说明 |
|---|---|
| `apps/admin-server` | Express 5 + Prisma，监听 `127.0.0.1:6681`，非回环地址拒绝启动 |
| `apps/admin-web` | Vue 3 + Pinia + Vue Router，端口 6680，深色设计 token 独立成层 |
| `packages/shared` | 前后端共用契约类型与枚举，含读取主项目源码的一致性契约测试 |
| `packages/testing` | Playwright E2E，自动拉起两侧共四个进程 |
| `database` | `admin_audit_logs` 迁移，迁移记录表 `nsm_schema_migrations` |
| `tools/schema-drift` | 与主项目 `schema.prisma` 的逐列一致性门禁，内置变异自检 |

功能：总览、跨用户事件审计（分页 + trace 链路）、实验与变体启停（写审计）、学习过程只读、操作审计。账号复用主项目 `users` 表，只认 `role = 'admin'` 且 `status = 'active'`。

## 2. 实跑证据

### 2.1 新仓库 `pnpm verify`（退出码 0）

| 步骤 | 结果 |
|---|---|
| `typecheck`（tsc + vue-tsc） | 通过 |
| `test:shared` | 3/3 |
| `test:server` | 36/36 |
| `test:web:run` | 24/24 |
| `test:schema-drift` | `ok: true`，`selfTest: 变异检测有效`，`drift: []` |

### 2.2 跨仓库 E2E（退出码 0）

`pnpm test:e2e` → 4 passed。核心用例按顺序验证：

1. 管理员登录后进入总览。
2. 在实验目录停用 `web.sql-injection` 的 `vuln` 变体，出现二次确认对话框，确认后提示生效。
3. 主站目录该变体不再给出入口，改为「（已停用）」文本。
4. 直访 `/labs/web/sql-injection/vuln` 被守卫重定向到 `/labs/web/sql-injection?disabled=vuln`，并显示停用提示。
5. 直调 `POST /api/labs/web/sql-injection/vuln/search` 返回 403 —— 拦截发生在请求层，不只是藏了入口。
6. 管理端操作审计页按 `variant.disable` 筛选，出现目标为 `web.sql-injection:vuln` 的记录。
7. 重新启用后，目录入口、前台页面与接口三层同时恢复。

另外三个用例覆盖：未登录访问被重定向到登录页、普通账号登录被拒（403 且提示 administrator role required）、事件审计页可查询。

用 `afterEach` 兜底把变体恢复为启用，避免用例失败留下停用状态。

### 2.3 主项目侧

见主项目 `docs/execution/2026-09-16-admin-management-rebuild.md` 第 10.6 节。要点：`pnpm verify` 退出码 0；`db:migrate` 后 `db:status` 为 `up-to-date`（5/5）；主项目自身 Playwright 43/43 通过。

## 3. 实施中发现并修复的问题

### 3.1 主项目 LT-055 索引名超长（阻断级）

`lab_recap_question_completions_user_id_lab_key_knowledge_point_idx` 长 66 字符，超过 MySQL 64 字符上限，导致 `db:migrate` 与 `schema:ensure` 双双失败。该缺陷因 `LT-055` 从未实跑数据库而被长期掩盖。已改名 `recap_completions_user_lab_knowledge_point_idx`（46 字符）并同步三处定义，详见主项目执行文档 10.1 节。

### 3.2 Node fetch 的「坏端口」限制（阻断级）

E2E 首次运行时全局初始化报「等待服务就绪超时」，而主站进程确实已监听。定位过程：

1. 用 curl 分别探测，`127.0.0.1:6667` 返回 200，`localhost:6667` 失败 → 排除端口未监听。
2. 写最小复现脚本打印 `error.cause`，得到 `cause=bad port`。

**根因**：Node 的 `fetch`（undici）按 Fetch 规范拦截「坏端口」，主站固定端口 **6667 属于被拦名单**（6665–6669 为 IRC 端口段）。curl 不设此限制，主项目测试包也因为用 `node:http` 而不受影响。

**影响面与修复**：

- 测试包探测：`packages/testing/src/health.mjs` 改用自建 `src/http.mjs`（基于 `node:http`）。
- E2E 直调主站接口：同样改用该 helper。
- **`apps/admin-server` 的真实缺陷**：总览页原本用 `fetch` 请求 `127.0.0.1:6667/api/platform-info`，会**永远**被判为不可达。已改为 `src/lib/http-json.ts`（基于 `node:http`），并把探测函数做成可注入以便测试。

新增 `apps/admin-server/tests/http-json.test.ts` 记录这条约束，其中一条断言直接锁定「全局 fetch 拒绝 6667」，若将来 Node 放开限制，该断言失败即提示可以简化回 fetch。

### 3.3 E2E 交互细节

- 开关的 `input` 视觉隐藏（靠 `<label>` 呈现），Playwright 判定不可见而拒绝点击；改为点击 label，与真实用户操作一致。
- 主站目录卡片不含 labKey，改为按详情链接 `a[href="/labs/web/sql-injection"]` 定位卡片，不依赖标题文案。
- 守卫重定向带 `?disabled=vuln`，URL 断言需允许查询串。

## 4. 未覆盖与已知限制

| 项 | 说明 |
|---|---|
| 事件日志归档与保留策略 | 本轮不做，需先补设计文档 |
| 管理端登录失败锁定 | 本轮不做；审计已记录 `auth.login.failure`，可作后续数据源 |
| 知识点掌握度视图 | 依赖主项目 `LT-056`，本轮只展示题目级复盘完成情况 |
| 迁移 / 种子状态展示 | `LT-051` 遗留项，管理端有鉴权，是合适的后续落点 |
| 字体文件 | 未内置 Fira 二进制，仅在系统已安装时生效；中文回退 `Microsoft YaHei UI` |
| 覆盖率门禁 | 新仓库未设覆盖率阈值，与主项目 `LT-052` 的结论一致 |

## 5. 未执行的命令

以下命令本轮**未执行**，如需补做需另行授权：新仓库 `pnpm build:*`（生产构建）、覆盖率统计、主项目 `pnpm build:web` / `build:server` 与 nginx 发布复验。

## 6. 安全边界复核

- `admin-server` 启动即校验 `ADMIN_SERVER_HOST` 为回环地址，否则拒绝启动。
- 令牌密钥 `ADMIN_TOKEN_SECRET` 与主站 `AUTH_TOKEN_SECRET` 独立（配置与 `apps/admin-server/.env` 层面），签名不同因此两边令牌互不通用。已验证的是：异密钥签发的令牌调用管理端接口返回 401（API 测试覆盖）。**未做**的是用真实主站令牌去打管理端接口的跨站实测，如需补齐需同时启动两边服务。
- 事件、学习过程响应经测试断言不含 `inputSummaryJson`、`passwordHash`、`method`、`path`。
- 审计只存 `{"isEnabled": boolean}` 前后值；登录失败只记录截断后的用户名，不记录密码。
- 全部写操作均落 `admin_audit_logs`，且启停写入与审计写入在同一事务内。

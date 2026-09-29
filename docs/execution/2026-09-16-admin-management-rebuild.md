# 独立管理端重建执行文档

> 文档状态：P0～P6 全部完成，三层测试与全链路 E2E 均已实跑通过（证据见第 10.6 节，管理端收口文档见 `management/docs/execution/2026-09-16-admin-management-closeout.md`）
>
> 建立时间：2026-09-16
>
> 取代文档：`docs/execution/2026-09-16-admin-console-attack-defense-chain.md`（旧 `/admin` 只读观察页，本轮撤除）
>
> 队列位置：插队到 `LT-056` 之前，不重排 `LT-053`～`LT-100` 既有编号
>
> 代码位置：主仓库 `E:\github\network_safe_project` + 其子目录 `management/`（决策在实施后发生过变更，见 10.7 节）

## 1. 目标

在主仓库的子目录 `management/` 下建立一个独立 pnpm workspace（monorepo），作为本机学习平台的真管理端，具备权限边界与写操作能力：

- 管理员可查看跨用户的攻防事件日志，并按 `traceId` 还原完整攻防链路。
- 管理员可启停实验与变体，停用后主站**目录、实验接口、前台页面三层同时生效**。
- 管理员可只读查看每个用户的学习进度、验证记录与复盘完成情况。
- 管理员的每一次写操作都落库审计。
- 主项目只做必要的最小改动，不在主站新增任何 `/admin` 页面或接口。

## 2. 已确认的决策

| 决策项 | 结论 | 来源 |
|---|---|---|
| 定位 | 真管理端，有权限边界，有写操作 | 用户选择 |
| 代码位置 | 主仓库子目录 `management/`，自带 `pnpm-workspace.yaml`，与主仓库 workspace 互不包含 | 规划期为「新建独立仓库」，实施后由用户改为子目录，见 10.7 |
| 数据 | `admin-server` 直连主项目同一 MySQL；主项目 server 不新增任何 `/admin` 接口 | 用户选择「独立后端直连同库」 |
| 功能 | 总览、事件审计、实验目录配置、用户学习过程（只读） | 用户选择 |
| 账号 | 仅一个 `admin`，密码 `123456`，由主项目 `seed-auth-users.mjs` 维护；管理端对 `users` 表只读 | 用户明确要求 |
| 用户写操作 | 不做（无角色修改、无状态修改、无建号） | 用户明确要求 |
| 审计 | 新增 `admin_audit_logs` 表 | 用户选择 |
| 停用生效范围 | 目录、实验接口、前台页面三层都拦 | 用户选择 |
| 种子覆盖 | `seed:labs` 只在 create 时写 `isEnabled`，update 分支不覆盖，数据库为准 | 用户选择「保留管理端配置」 |
| 库不可用 | 主项目按 `meta.json` 放行，记告警，`/api/platform-info` 标记 `needs-attention` | 用户选择「放行并告警」 |
| UI | 独立布局壳 + 设计 token；高级黑底、白字、冷银蓝强调 | 用户选择 |
| 测试 | 单元、API、E2E 三层 | 用户选择 |
| 主项目旧 `/admin` | 全部撤除 | 用户选择 |

## 3. 核实过的事实基线

实施必须以下列**已读代码确认**的事实为准，不得凭记忆改写。

### 3.1 数据库结构

来源 `database/schema/platform/schema.prisma`（Prisma 是唯一运行期结构源）。

- `Lab`：主键 `id BigInt @db.UnsignedBigInt`，业务唯一键 `labKey`（`@unique`，等于 `meta.json` 的 `id`，形如 `web.xss`）与 `slug`（`@unique`，等于 `subcategory`）。含 `isEnabled Boolean @default(true)`，已有 `@@index([status, isEnabled])`，**不需要新增索引**。
- `LabVariant`：**没有 `slug`，也没有 `category` 字段**。唯一键是 `@@unique([labId, variantKey])`。含 `isEnabled Boolean @default(true)`。因此管理端定位一个变体必须用 `labKey` + `variantKey`，不能用 `slug`。
- `User`：含 `role String @db.VarChar(32)` 与 `status String @db.VarChar(32)`。
- `LabEventLog`：含 `inputSummaryJson`、`method`、`path` 三个**禁止外传**字段；已有 `@@index([traceId])`、`@@index([userId, createdAt])`、`@@index([labKey, variantKey, createdAt])`，管理端分页查询可直接用后两个。
- `LabRecapQuestionCompletion`：`knowledgePoint`、`selectedOptionKey`、`isCorrect` 三列已存在（`LT-055`）但**服务端无任何读写代码**，掌握度判定属 `LT-056`，不在本轮范围。

### 3.2 主项目服务端

- `GET /api/labs`（`app.ts:6315`）与 `GET /api/labs/:category/:scene`（`app.ts:6328`）数据源是 `labRegistry`，即磁盘 `meta.json` 扫描（`services/lab-registry.ts:85`），**完全不查数据库**。
- 内部辅助函数 `readLab`（`app.ts:709`）**只有两处调用**：`app.ts:1945`（learning-progress）与 `app.ts:2000`（verification-records）。约 60 条实验专用路由全部绕过它，所以「只过滤目录」挡不住直调接口，必须加中间件。
- 专用路由形态已逐条核对（`app.ts` 内 71 处 `/api/labs` 路由字符串），与中间件匹配规则相关的三类：
  - 含 `:variant` 占位：如 `/api/labs/auth/idor/:variant/read`、`/api/labs/web/ssrf/:variant/fetch`，**会**被 `:variant(vuln|fixed)` 匹配，符合预期。
  - 含字面量 `fixed` 段：`/api/labs/web/csrf/fixed/token`（`app.ts:2570`），**会**被匹配。这是 csrf 修复版专属接口，停用 fixed 变体时拦截它是正确行为。
  - 不含变体段：`/api/labs/web/csrf/state`（`app.ts:2548`）、各 `/workbench`（如 `app.ts:4530`）、`/learning-progress`、`/verification-records`，**不会**被匹配。因此实验级停用需要单独处理 `workbench`。
- 主项目 `express` 实际解析版本为 `5.2.1`。Express 5 使用 path-to-regexp v8，**不支持** `:variant(vuln|fixed)` 这类参数内联正则；既有兜底路由 `app.ts:6235` 也是写成普通 `:variant` 再在处理函数里校验。中间件必须沿用这个写法。
- 密码格式 `scrypt:<salt>:<hex>`，校验函数 `verifyPassword`（`services/password.ts:13`），使用 `timingSafeEqual`。
- 登录（`services/auth.ts:102`）只校验 `status !== "active"` 即拒绝，**不校验 `role`**。`AuthUser` 透传 `role`（`auth.ts:46`），但全仓无任何 `role` 鉴权分支。
- token 是自定义 HMAC 串 `<userId>.<issuedAt>.<signature>`（`services/session-token.ts:44`），**载荷不含 role**。本轮不改这个格式。
- `PrismaClient` 单例模式见 `lib/prisma.ts`，管理端沿用同样写法。
- `/api/platform-info`（`app.ts:521`）无需登录，注释明确禁止泄露 `DATABASE_URL`、`AUTH_TOKEN_SECRET`、环境变量取值、本机绝对路径、凭据、token，由 `tests/platform-info.test.ts` 的 8 类禁止模式强制。

### 3.3 主项目前端

- `routes.ts` 共 818 行、单一扁平数组，**无 `meta`、无守卫**。`/admin` 在 `routes.ts:44-48`。兜底引导式路由在 `routes.ts:807-816`，形如 `/labs/:category/:scene/:variant(vuln|fixed)`。
- `router.test.ts:9-117` 是对全部路径的 `toEqual` **精确快照**，顺序敏感。
- `apps/web/tests/entrypoint-consistency.test.ts` 经 `router/entrypoint-consistency.ts` 校验 156 个 Web 入口，其中 `:233` 与 `:332` 读取 `variant.enabled`。该模块比对的是**磁盘 `meta.json` 与路由表**，不经过 HTTP，因此不受 API 响应变化影响，但**这是不能改 `/labs/**` 路由的原因**。
- 新增的非 `admin-` 前缀工具类中，`.decision-accepted/blocked/failed` 被 `PlatformStatusView.vue:642-648` 使用，但该视图有自己的 scoped 样式（`:1167-1192`）覆盖，撤除 `main.css` 中这几条时需确认渲染不变。

### 3.4 版本基线（取自 `pnpm-lock.yaml` 实际解析版本）

管理端依赖**逐一对齐**下列版本，使用精确版本号，不用 `^`：

| 包 | 版本 |
|---|---|
| Node / pnpm | Node `>=22 <23`，pnpm `10.0.0` |
| `express` | `5.2.1` |
| `@prisma/client` / `prisma` | `6.19.3` |
| `dotenv` | `16.6.1` |
| `vue` | `3.5.42` |
| `vue-router` | `4.6.4` |
| `pinia` | `3.0.4` |
| `vite` | `5.4.21` |
| `@vitejs/plugin-vue` | `5.2.4` |
| `vitest` | `2.1.9` |
| `@vitest/coverage-v8` | `2.1.9` |
| `jsdom` | `25.0.1` |
| `typescript` | `5.9.3` |
| `vue-tsc` | `2.2.12` |
| `tsx` | `4.23.13` |
| `@types/node` | `24.13.3` |
| `@types/express` | `5.0.6` |
| `@playwright/test` | `1.62.1` |

服务端测试沿用主项目方式：`node --import tsx --test`，不引入 jest / supertest。前端测试用 vitest。不引入 UI 组件库、图标库、CSS 框架。

## 4. 范围

### 4.1 明确不在本轮范围

- 不做用户增删改、角色修改、状态修改。
- 不做知识点掌握度聚合（属 `LT-056`）。
- 不改 `session-token.ts` 的 token 格式，不把 role 放进 token 载荷。
- 不改主项目 60 条实验专用路由本身。
- 不新增 `/labs/**` 前端路由，不调整 `routes.ts` 顺序。
- 不给管理端加公网访问能力、外部目标扫描能力或任何真实攻击能力。
- 不做事件日志归档与保留策略（需另立设计文档）。
- 不做管理端登录失败锁定。

### 4.2 主项目改动清单

**M1 撤除旧 `/admin`**

| 对象 | 处理 |
|---|---|
| `apps/web/src/views/AdminView.vue` | 删除 |
| `apps/web/src/router/routes.ts:44-48` | 删除该路由对象 |
| `apps/web/src/App.vue:11` | 删除 `{ path: "/admin", label: "管理端" }` |
| `apps/web/tests/router.test.ts:18` | 删除快照中的 `"/admin"` |
| `apps/web/src/styles/main.css` | 删除 `1106-1954` 的 `.admin-*` 段、`2048-2050` 的 `.admin-page` 响应式规则、`2126-2150` 整块新增的 `@media (max-width: 520px)` 中 admin 相关规则 |
| `main.css:1956-1987` 的 `.risk-text-*` / `.severity-*` / `.decision-*` / `.text-danger` | **逐条确认消费方后再删**。`.decision-*` 被 `PlatformStatusView.vue` 使用但有 scoped 覆盖，删除后需确认该页渲染不变；其余若无消费方则一并删除 |
| `apps/web/src/api/labs.ts` 新增的 `estimatedMinutes?` / `safeBoundaries?` / `notes?` | 保留。三者均是共享规范已确认的字段，与旧 `/admin` 解耦，删掉反而是倒退 |
| 旧执行文档 | 删除 `docs/execution/2026-09-16-admin-console-attack-defense-chain.md` |

撤除后 `main.css` 应回到 1165 行量级，`git diff --stat` 中该文件净增量应接近 0。

**M2 新增实验可用性服务**

新建 `apps/server/src/services/lab-availability.ts`：

```text
type LabAvailabilitySnapshot = {
  source: "database" | "metadata-fallback";
  labs: Map<string, boolean>;                    // labKey -> isEnabled
  variants: Map<string, boolean>;                // `${labKey}:${variantKey}` -> isEnabled
};

createLabAvailabilityService(options?: { prisma?, logger? }): {
  getSnapshot(): Promise<LabAvailabilitySnapshot>;
}
```

- 一次查询取全表：`prisma.lab.findMany({ select: { labKey, isEnabled, variants: { select: { variantKey, isEnabled } } } })`。78 个实验、156 个变体，单次查询成本可接受。
- 查询抛错时返回空 Map 加 `source: "metadata-fallback"`，并通过注入的 logger 记一条 warn。**不抛出**，保证学习平台可用。
- 数据库中没有对应行时（如尚未执行 `seed:labs`）视为启用，同样走放行语义。

**M3 目录响应合并启用状态**

`GET /api/labs` 与 `GET /api/labs/:category/:scene` 在返回前合并可用性。

关键决策：**不覆写 `variant.enabled`，改为新增独立字段**。理由是 `variant.enabled` 是 `meta.json` 的元数据事实，被 `entrypoint-consistency.ts:233,332` 和 `platform-status.ts` 消费；若把运行期启停混入同一字段，元数据一致性判断会随管理端开关漂移，这与 `LT-046` 的教训（前后端取值不一致）同类。

响应新增顶层字段：

```text
availability: {
  source: "database" | "metadata-fallback";
  labEnabled: boolean;
  variants: { key: "vuln" | "fixed"; enabled: boolean }[];  // enabled = meta.enabled && labEnabled && variantEnabled
}
```

`/api/platform-info` 的 `enabledVariants` 等统计**继续按元数据计算**，语义不变。

同步改 `apps/web/src/api/labs.ts` 的 `LabMetadata` 类型，新增 `availability` 字段。因该字段由服务端稳定返回，定为必选而非可选，避免前端写兜底判断。

**M4 变体拦截中间件**

新建 `apps/server/src/middleware/lab-variant-availability.ts`，注册位置在 `express.json()` 之后、全部实验路由之前。

- 路径匹配：`app.use("/api/labs/:category/:scene/:variant", ...)` 做前缀挂载，处理函数内判断 `req.params.variant` 是否为 `vuln` 或 `fixed`，不是就直接 `next()`。不用内联正则，原因见 3.2 的 Express 5 说明。
- 按 3.2 的逐条核对，这条规则会拦到含 `:variant` 的专用路由和 `/api/labs/web/csrf/fixed/token`。`csrf/state`、`workbench`、`learning-progress`、`verification-records` 这几类路径会以 `variant` 等于 `state`、`workbench` 等值进入处理函数，然后因为不是 `vuln`/`fixed` 被放行。反向测试必须覆盖这几种情况。
- 停用时返回 `403 { status: "error", message: "lab variant disabled" }`。
- 实验级停用需额外拦 `GET /api/labs/:category/:scene/workbench`，单独一条判断。
- `category`/`scene` 到 `labKey` 的映射：`labKey` 等于 `${category}.${scene}`，已由 `packages/shared/src/guided-scenarios-v2.js:346` 的校验规则与 `labs/web/xss/meta.json` 实例确认（`id: "web.xss"`、`category: "web"`、`subcategory: "xss"`）。中间件直接拼接，不需要额外查询。
- fallback 状态下一律放行。

**M5 platform-info 告警**

`consistency` 新增 `availabilitySource: "database" | "metadata-fallback"`。取值为 `metadata-fallback` 时 `status` 置 `needs-attention`。同步改 `apps/web/src/api/platform-info.ts` 类型与 `PlatformStatusView.vue` 展示。

必须确认改动后仍通过 `tests/platform-info.test.ts` 的 8 类禁止模式检查——新增字段只有两个固定枚举值，不含路径与凭据。

**M6 种子不覆盖启停**

`services/lab-metadata-sync.ts`：`upsertLab` 的 `update` 分支（`:192`）与 `upsertVariant` 的 `update` 分支（`:235`）移除 `isEnabled`，`create` 分支（`:211`、`:245`）保留。同步改 `tests/lab-metadata-sync.test.ts`。

语义变化需写进 `README.md` 与 `database/README.md`：**首次入库以 `meta.json` 为准，之后以管理端为准**。

**M7 admin 密码**

`apps/server/scripts/seed-auth-users.mjs:19` 改为 `123456`。同步更新两处文档引用：`docs/execution/2026-06-09-mysql-auth-account-flow.md:97`、`docs/execution/2026-07-23-v1-windows-local-release-acceptance.md:202`（后者是凭据扫描清单，需把扫描目标同步改掉，否则该清单失效）。

**M8 前台守卫**

- 纯逻辑放 `apps/web/src/router/lab-availability.ts`，导出 `resolveVariantRedirect(route, availability)`，可单测。
- `router/index.ts` 新增 `beforeEach`：命中 `/labs/:category/:scene/:variant` 形态时，取该实验 `availability`，若对应变体 `enabled: false` 则重定向到 `/labs/:category/:scene?disabled=<variant>`。
- `LabDetailView.vue` 读 `disabled` query 展示「该变体已由管理端停用」提示。
- 可用性数据来源：新建 Pinia store `stores/lab-availability.ts`，首次守卫触发时拉取并缓存本次会话。拉取失败按放行处理。
- **不新增任何路由**，因此 `router.test.ts` 快照与 156 个入口门禁均不受影响。
- 实施前需先读 `LabsView.vue` 与 `LabDetailView.vue` 的变体渲染位置，确认目录层禁用态的准确插入点，不得凭猜测改模板。

### 4.3 管理端结构（主仓库 `management/` 子目录）

```text
management/
├─ AGENTS.md                      子目录级协作规则，声明「对主项目表只读，唯一例外是两列 is_enabled」
├─ README.md                      安装、启动、端口、账号、与主项目的关系
├─ package.json                   根脚本：dev / build / test / typecheck / verify / db:migrate
├─ pnpm-workspace.yaml            packages: apps/*, packages/*
├─ .env.example                   DATABASE_URL / ADMIN_TOKEN_SECRET / ADMIN_SERVER_HOST / ADMIN_SERVER_PORT
├─ apps/
│  ├─ admin-web/                  Vue 3 + Vite + Pinia + Vue Router，端口 6680
│  │  ├─ src/{api,components,modules,router,stores,styles,views}/
│  │  └─ tests/
│  └─ admin-server/               Express + Prisma，端口 6681，仅监听 127.0.0.1
│     ├─ src/{lib,services}/
│     ├─ prisma/schema.prisma
│     └─ tests/
├─ packages/
│  ├─ shared/                     接口契约类型、枚举、分页结构（前后端同一份）
│  └─ testing/                    Playwright E2E，自动拉起两侧四个进程
├─ database/
│  ├─ migrations/20260916_add_admin_audit_logs.sql
│  └─ scripts/apply-migrations.mjs     迁移记录表 nsm_schema_migrations
├─ tools/
│  └─ schema-drift/verify-schema-drift.ts
└─ docs/{execution,design,testing}/
```

`pnpm-workspace.yaml` 只声明 `apps/*` 与 `packages/*`；`tools/` 与 `database/` 不是 workspace 包，脚本由根 `package.json` 用 `tsx` / `node` 直接执行，与主项目 `tools/` 的做法一致。该子目录自带 lock 文件，依赖需在 `management/` 下单独 `pnpm install`。

### 4.4 权限模型

- 管理端 Prisma schema 只声明用到的模型：`User`、`LabCategory`、`Lab`、`LabVariant`、`LearningProgress`、`VerificationRecord`、`LabEventLog`、`LabRecapQuestionCompletion`，加自有 `AdminAuditLog`。字段定义逐列复制主项目 `schema.prisma`，由漂移门禁强制一致。
- 登录：`findUnique({ where: { username } })` → `status === "active"` **且** `role === "admin"` → `verifyPassword`（复制主项目 `scrypt:<salt>:<hex>` 校验实现，含 `timingSafeEqual`）→ 签发 token。
- token 沿用 `<userId>.<issuedAt>.<HMAC>` 格式，但密钥取 `ADMIN_TOKEN_SECRET`，与主站 `AUTH_TOKEN_SECRET` 不同，两边 token 互不通用。
- 每个受保护请求都重新查库校验 `role === "admin"`，**role 不放进 token 载荷**。这样主项目改了角色，管理端下一个请求即失效。
- 启动时校验 host：若 `ADMIN_SERVER_HOST` 不是 `127.0.0.1` 或 `localhost`，直接拒绝启动并打印原因。理由是 admin 密码为 `123456` 且可读全部事件日志。

### 4.5 admin_audit_logs

```sql
CREATE TABLE admin_audit_logs (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_user_id BIGINT UNSIGNED NULL,
  action        VARCHAR(64)  NOT NULL,
  target_type   VARCHAR(32)  NOT NULL,
  target_key    VARCHAR(160) NOT NULL,
  before_json   JSON NULL,
  after_json    JSON NULL,
  created_at    DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY admin_audit_logs_created_at_idx (created_at),
  KEY admin_audit_logs_action_created_at_idx (action, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- `action` 固定枚举：`auth.login.success`、`auth.login.failure`、`lab.enable`、`lab.disable`、`variant.enable`、`variant.disable`。
- `target_type` 固定枚举：`lab`、`variant`、`session`。
- `target_key`：`lab` 用 `labKey`；`variant` 用 `${labKey}:${variantKey}`；`session` 用尝试登录的用户名。长度 160 足够容纳 `labKey`(128) + 分隔符 + `variantKey`(32)。
- 登录失败时的用户名来自请求体，属于不可信输入：先 `trim()`，再截断到 64 字符（与 `users.username` 的 `VarChar(64)` 一致）后写入。密码在任何情况下都不写进审计。
- `admin_user_id` 可空且**不加外键**：登录失败时没有确定用户；不加外键也避免管理端反向约束主项目 `users` 表。
- `before_json` / `after_json` 只存 `{ "isEnabled": boolean }`，不存请求体。
- 启停写入与审计写入放在同一 `prisma.$transaction`。

### 4.6 admin-server 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/admin/auth/login` | 登录。成功写 `auth.login.success`，失败写 `auth.login.failure` |
| GET | `/api/admin/auth/me` | 当前管理员 |
| POST | `/api/admin/auth/logout` | 注销（进程内吊销，与主项目同构） |
| GET | `/api/admin/overview` | 实验数、分类数、启用变体数、事件总量、阻断率、近 7 日按日事件数、`availabilitySource` |
| GET | `/api/admin/events` | 分页 + 筛选，见下 |
| GET | `/api/admin/events/traces/:traceId` | 单条 trace 全部事件，按 `createdAt` 升序 |
| GET | `/api/admin/labs` | 数据库实验与变体启停状态，可按 `category`、`isEnabled` 筛选 |
| PATCH | `/api/admin/labs/:labKey` | `{ isEnabled: boolean }`，写审计 |
| PATCH | `/api/admin/labs/:labKey/variants/:variantKey` | `{ isEnabled: boolean }`，写审计 |
| GET | `/api/admin/learners` | 用户列表 + 进度 / 验证 / 事件计数，只读 |
| GET | `/api/admin/learners/:userId` | 单用户进度、验证记录、复盘完成情况，只读 |
| GET | `/api/admin/audit-logs` | 管理操作审计，分页 |
| GET | `/api/admin/health` | 服务与数据库探活 |

`GET /api/admin/events` 契约：

- 分页：`page`（≥1，默认 1）、`pageSize`（1–100，默认 20）。返回 `{ items, total, page, pageSize }`。
- 筛选：`labKey`、`variantKey`、`phase`、`riskLevel`、`decision`、`userId`、`from`、`to`。
- 枚举取值严格取自主项目 `services/lab-event-logs.ts`：`phase` 为 `attack|defense|normal`；`decision` 为 `accepted|blocked|failed`；`riskLevel` 为 `low|medium|high|critical`；`actorPerspective` 为 `attacker|user|system`。
- 非法枚举、越界 `pageSize`、非法日期一律 `400`，不做静默纠正。
- 只接受固定字段与枚举，不接受自由文本查询或原始 SQL，遵循 `docs/design/learning-paths-search-statistics.md` 的既有约束。

响应字段边界：

- 事件字段 = 主项目 `UserLabEventLogSummary` 的 13 个字段，加 `id`、`userId`、`username`。
- **禁止返回** `inputSummaryJson`、`method`、`path`、`passwordHash`。前三者是 `LabEventLog` 表中确实存在但不得外传的列，最后一个是 `User` 表的凭据列。
- 复盘只返回题目级完成情况（`traceId`、`labKey`、`questionIndex`、`questionKey`、`completed`、`completedAt`、`updatedAt`），不碰 `LT-055` 的三个新列。
- `BigInt` 统一序列化为字符串，与主项目 `user-repository.ts:22` 的做法一致。

### 4.7 admin-web 页面

| 路由 | 页面 |
|---|---|
| `/login` | 登录 |
| `/overview` | 总览：KPI 卡、近 7 日事件趋势、风险分布、可用性来源告警条 |
| `/events` | 事件审计表 + 筛选栏 + 分页；点击行开 trace 抽屉 |
| `/events/:traceId` | trace 攻防链路时间线，支持直链 |
| `/labs` | 实验目录配置：按分类分组，实验级与变体级开关，停用前二次确认 |
| `/learners` `/learners/:userId` | 用户学习过程，只读 |
| `/audit` | 管理操作审计 |

- 路由用 `meta: { requiresAdmin: true }` + 全局 `beforeEach`，`/login` 例外。
- 基础组件：`AppShell`、`SideNav`、`TopBar`、`DataTable`、`Pagination`、`FilterBar`、`StatusBadge`、`ToggleSwitch`、`ConfirmDialog`、`Drawer`、`EmptyState`、`Skeleton`、`Icon`（内联 SVG）。
- 页面逻辑拆到 `src/modules/*.ts`（纯函数 + 类型），SFC 只做渲染。这是为了避开主项目 `AdminView.vue` 695 行全内联、无法单测的问题。

### 4.8 设计系统

来源：`ui-ux-pro-max` skill 推荐 Data-Dense Dashboard 模式（字体 Fira Sans / Fira Code），按用户要求把配色由浅底反转为深底。

| Token | 值 | 用途 |
|---|---|---|
| `--bg` | `#0A0A0A` | 页面底 |
| `--surface` | `#111111` | 面板 |
| `--surface-raised` | `#1A1A1A` | 悬浮、选中、抽屉 |
| `--border` | `#262626` | 分隔线 |
| `--text` | `#FAFAFA` | 主文字（对 `--bg` 约 19:1） |
| `--text-muted` | `#A3A3A3` | 次要文字（约 8:1，满足 AA） |
| `--accent` | `#93C5FD` | 冷银蓝：选中竖条、链接、焦点环 |
| `--primary-bg` / `--primary-fg` | `#FFFFFF` / `#0A0A0A` | 主按钮白底黑字 |
| `--danger` / `--success` / `--warning` | `#F87171` / `#4ADE80` / `#FBBF24` | 只用于风险与结果状态 |

实现约束：

- 全部 token 定义在 `:root`，组件内**禁止**写硬编码颜色值。这是为了避开主项目 `main.css` 全站硬编码 hex、`--admin-*` 定义在 `.admin-page` 却被外部引用的问题。
- 字体文件放进仓库 `admin-web/public/fonts/`，不走 Google Fonts（运行环境仅本机）。`font-display: swap`。Fira 无中文字形，中文回退 `Microsoft YaHei UI`。
- 布局高度用 flex / grid，**不得**出现 `calc(100vh - 77px)` 这类写死 header 高度的写法。
- 交互：可见焦点环、`cursor: pointer`、150–300ms 过渡、响应 `prefers-reduced-motion`。
- 响应式 375 / 768 / 1024 / 1440 四档；表格窄屏 `overflow-x: auto`。
- 状态不只靠颜色区分，必须同时带文字或形状。
- 不用 emoji 当图标。

## 5. 实施步骤

| 阶段 | 内容 | 仓库 | 提交信息示例 |
|---|---|---|---|
| P0 | 本执行文档；在 `docs/TODO.md` 登记插队切片 | 主项目 | `docs(root): 建立独立管理端重建执行文档` |
| P1 | M1 撤除旧 `/admin` | 主项目 | `refactor(web): 撤除旧管理端观察页` |
| P2a | M2 可用性服务 + M3 目录合并 + 服务端测试 | 主项目 | `feat(server): 实验目录接入数据库启停状态` |
| P2b | M4 变体中间件 + M5 platform-info 告警 + 测试 | 主项目 | `feat(server): 新增变体停用拦截与可用性告警` |
| P2c | M6 种子 + M7 密码 + 文档同步 | 主项目 | `chore(server): 种子不再覆盖启停状态并调整管理员密码` |
| P2d | M8 前台守卫 + 前端测试 | 主项目 | `feat(web): 停用变体的前台入口拦截` |
| P3 | 管理端骨架、`AGENTS.md`、shared 契约、`admin_audit_logs` 迁移、漂移门禁 | 管理端 | `chore(root): 初始化管理端 monorepo 骨架` |
| P4 | admin-server 全部接口 + API 测试 | 管理端 | `feat(admin-server): 落地管理端接口与权限门禁` |
| P5 | admin-web token、布局壳、组件、页面、模块单测 | 管理端 | `feat(admin-web): 落地管理端工作台页面` |
| P6 | E2E 全链路；收口文档回填验证证据 | 两侧 | `test(root): 补齐管理端全链路验证证据` |

每阶段单独提交，遵循 Conventional Commits。P2 四个子阶段可分别验证，避免一次性改动过大难以定位问题。

## 6. 实施建议

- P2a 与 P2b 之间不要合并提交：目录合并是只读改动，中间件是拦截改动，风险等级不同。
- M8 实施前必须先读 `LabsView.vue`、`LabDetailView.vue` 的变体渲染代码，确认禁用态插入点。按字段规则，不得凭猜测改模板。
- 管理端的 Prisma 模型逐列复制主项目，复制完立刻写漂移门禁，先让门禁跑通再写接口，避免先写一堆接口才发现字段名对不上。
- 漂移门禁写完后必须做一次**注入测试**：故意改一个列名或可空性，确认门禁失败；然后改回。这条是 `LT-046` 首版门禁漏判留下的纪律。
- 管理端服务端每个接口先写 401 / 403 / 200 三条测试再写实现，权限是这轮的核心边界。
- 脱敏断言不要写成「检查某个字段不等于某值」，要写成「响应体 JSON 序列化后不包含 `inputSummaryJson`、`passwordHash`、`method`、`path` 这些 key」，这样新增字段时也能兜住。

## 7. 潜在风险分析

| 风险 | 影响 | 处理 |
|---|---|---|
| 管理端与主项目共库，schema 漂移导致管理端读写错误 | 高 | 漂移门禁逐列比对并做注入测试；管理端对主项目表只读，唯一例外是两列 `is_enabled` |
| admin 密码 `123456` 且可读全部事件日志 | 高 | `admin-server` 仅监听 `127.0.0.1`，host 不是回环地址则拒绝启动；独立 token 密钥；README 写明该账号不得用于任何非本机环境 |
| 主项目 `/api/labs` 从纯磁盘改为依赖数据库 | 中 | 库不可用时按 `meta.json` 放行并告警，学习平台保持可用；`platform-info` 标记 `needs-attention` 让状态可见 |
| 每个实验请求多一次查库 | 低 | 本机单用户；查询走 `labKey` 唯一索引；本轮不加缓存以保证停用立即生效 |
| 中间件误伤非变体子路径 | 中 | 只匹配 `vuln` / `fixed`；已逐条核对 71 处路由字符串；写专门的反向测试覆盖 `csrf/state`、`workbench`、`learning-progress`、`verification-records` |
| 新增 `availability` 字段被误当成元数据事实 | 中 | 不覆写 `variant.enabled`；`platform-info` 统计继续按元数据算；在 `labs.ts` 类型注释写明两者语义区别 |
| `seed:labs` 行为变化，新 `meta.json` 的 `enabled` 不再同步到已有行 | 中 | README 与 `database/README.md` 写明「首次入库为准，之后以管理端为准」；需要重置时由管理端操作 |
| 管理端 `/labs` 页在未执行 `seed:labs` 时为空 | 低 | 空表时提示先执行 `pnpm db:prepare`，不显示为「全部停用」 |
| 主项目 `LT-055` 迁移尚未实跑 | 中 | P3 前需用户授权执行 `pnpm db:migrate`、`schema:ensure`、`seed:auth`、`seed:labs` |
| 撤除 `main.css` 中 `.decision-*` 影响 `PlatformStatusView` | 低 | 该视图有 scoped 覆盖；删除后逐项确认渲染不变 |
| `Admin@123456` 出现在发布验收文档的凭据扫描清单中 | 低 | M7 同步更新该清单的扫描目标，否则清单失效 |
| `learning-paths-search-statistics.md` 的「不另起入口」原则 | 低 | 本轮管理端是主仓库子目录，未在主站另起入口；在该设计文档补一条说明 |
| 旧 `/admin` 撤除后用户已有书签失效 | 低 | 本机个人平台，无需重定向兼容 |

## 8. 优化方案（本轮不做，记录以便后续）

- 管理端登录失败锁定（进程内计数 + 审计已有 `auth.login.failure` 可作数据源）。
- 可用性快照加短 TTL 缓存 + 版本号主动失效，用于降低每请求查库。
- 知识点掌握度视图，待 `LT-056` 完成后接入学习过程页。
- 事件日志保留策略与归档，需先补设计文档（`learning-recap-statistics.md` 第 10 节已有此要求）。
- 管理端只读展示迁移 / 种子状态，即 `LT-051` 遗留项。管理端有鉴权，正好是这条的合适落点。

## 9. 验证方式

### 9.1 主项目测试设计

| 对象 | 用例 |
|---|---|
| 可用性服务 | 库正常返回快照；实验停用；变体停用；库抛错返回 `metadata-fallback` 且不抛出；数据库无对应行时视为启用 |
| 目录合并 | `availability.variants` 的 `enabled` 为三者与运算；`variant.enabled` 保持元数据原值；fallback 时全部放行 |
| 变体中间件 | 停用变体的 `POST .../vuln/read` 返回 403；启用时放行；`csrf/state` 不被拦；`workbench` 不被变体规则拦；`learning-progress` / `verification-records` 不被拦；实验级停用时 `workbench` 被拦；`csrf/fixed/token` 在 fixed 停用时被拦 |
| platform-info | fallback 时 `status` 为 `needs-attention` 且 `availabilitySource` 正确；仍通过既有 8 类禁止模式检查 |
| 种子 | `update` 分支不含 `isEnabled`；`create` 分支含 |
| 前台守卫纯逻辑 | 启用放行；停用重定向并带 `disabled` query；非实验路由不处理；可用性数据缺失时放行 |
| 既有门禁 | `router.test.ts` 恢复原快照；`test:entrypoints`、`test:api-entrypoints`、`test:contracts` 全部通过 |

### 9.2 管理端测试设计

| 层 | 用例 |
|---|---|
| 单元 | 分页与筛选参数解析（含越界、非法枚举、非法日期）；trace 归并与耗时计算；`role === "admin"` 判定；审计事务在写入失败时整体回滚 |
| API | 每个受保护接口三态：无 token 401、`demo_user` token 403、`admin` token 200；响应体序列化后不含 `inputSummaryJson` / `passwordHash` / `method` / `path`；PATCH 后 `admin_audit_logs` 新增一条且 `before_json` / `after_json` 正确；登录失败写 `auth.login.failure`；`pageSize=101` 返回 400 |
| 漂移门禁 | 逐模型比对列名、类型、可空性、唯一键；注入测试证明门禁会失败 |
| E2E | 管理端登录 → 总览 → 停用 `web.xss` 的 vuln 变体 → 主站目录该变体显示停用 → 直访 `/labs/web/xss/vuln` 被重定向 → 直调该变体接口返回 403 → 审计页出现记录 → 重新启用后三层恢复 |

### 9.3 需要授权的命令

按全局规则，下列命令在对应阶段逐次征得用户同意后执行，未执行的会在汇报中如实列出。

| 阶段 | 命令 | 说明 |
|---|---|---|
| P1 / P2 各子阶段 | `pnpm typecheck`、`pnpm test:server`、`pnpm test:web:run` | 主项目回归 |
| P2 收尾 | `pnpm test:entrypoints`、`pnpm test:api-entrypoints`、`pnpm test:contracts` | 确认未破坏既有门禁 |
| P3 前 | `pnpm db:migrate`、`pnpm --filter @network-safe/server schema:ensure`、`seed:auth`、`seed:labs`、`pnpm test:db-schema` | **写数据库**，含 `LT-055` 未实跑的迁移 |
| P3 | 管理端 `pnpm install`、`pnpm db:migrate` | 安装依赖与建 `admin_audit_logs` 表 |
| P4 / P5 | 管理端 `pnpm typecheck`、`pnpm test` | — |
| P6 | 两侧 `pnpm test:e2e` | 需同时启动主站与管理端 |

## 10. 实施实录与偏离说明

实施过程中与本文档原文不一致的地方，逐条记录原因与影响。

### 10.1 规划期未预见的缺陷：LT-055 索引名超长

**现象**：首次执行 `pnpm db:migrate` 直接失败：

```text
MySQL 执行失败：ERROR 1059 (42000) at line 76: Identifier name
'lab_recap_question_completions_user_id_lab_key_knowledge_point_idx' is too long
```

**原因**：该索引名 66 字符，超过 MySQL 的 64 字符标识符上限。`LT-055` 此前只做静态核对、未实跑数据库，因此该缺陷一直被掩盖（`docs/TODO.md` 里「LT-055 数据库实跑未执行」正是这个盲区）。

**影响**：迁移与 `schema:ensure` 两条路径都建不出该索引；且迁移在第 76 行失败，前面的三条 `ADD COLUMN` 已经生效但迁移未被记录。所幸迁移对每列都做了 `information_schema` 判存，重跑幂等，未产生半成品结构。

**处理**：三处同步改名为 `recap_completions_user_lab_knowledge_point_idx`（46 字符）：

- `database/migrations/20260910_add_recap_answer_fields.sql`
- `apps/server/scripts/ensure-local-schema.mjs`
- `database/schema/platform/schema.prisma`

**验证**：`pnpm db:migrate` 成功（applied 1, skipped 4），`pnpm db:status` 为 `up-to-date`（5/5），`schema:ensure` 通过，`pnpm test:db-schema` 通过。

### 10.2 偏离：目录可用性字段的承载方式

- **文档原文**（4.2 M3）：在 `LabMetadata` 上新增必选的 `availability` 字段。
- **实际实现**：新增独立类型 `LabCatalogItem = LabMetadata & { availability }`，字段仍为必选。
- **原因**：`LabMetadata` 被三个既有测试夹具直接构造，也被元数据读取路径复用；把运行期启停混进元数据类型会让「元数据」这个概念不再纯粹。字段必选这一要求仍然满足，因为 `fetchLabs` / `fetchLab` 返回的都是 `LabCatalogItem`。

### 10.3 偏离：中间件未单独成文件

- **文档原文**（4.2 M4）：新建 `apps/server/src/middleware/lab-variant-availability.ts`。
- **实际实现**：内联在 `app.ts`，紧接 `express.json()` 之后注册。
- **原因**：主项目的中间件与路由辅助函数（`readCurrentUser`、`readLab`）全部内联在 `app.ts`，不存在 middleware 目录。为一个函数新开目录与仓库惯例冲突更大。

### 10.4 偏离：前台守卫不缓存可用性

- **文档原文**（4.2 M8）：用 Pinia store 缓存可用性，首次守卫触发时拉取。
- **实际实现**：每次进入变体页实时请求该实验的可用性（`GET /api/labs/:category/:scene`），不设会话缓存。
- **原因**：缓存会让管理端的停用在用户刷新前不生效，与「三层同时生效」的目标冲突。代价是每次进入变体页多一次本机请求，在本机单用户场景可接受。读取失败按放行处理，与服务端 `metadata-fallback` 语义一致。

### 10.5 补充：登录失败审计的用户名截断

用户名来自请求体，属不可信输入，写入审计前先剔除不可打印字符并截断到 64 字符（与 `users.username` 的 `VarChar(64)` 一致）。密码在任何情况下都不写入审计。此项为 4.5 节的细化，非偏离。

### 10.6 验证证据汇总

| 项 | 命令 | 结果 |
|---|---|---|
| 主项目类型检查 | `pnpm typecheck:server` | 通过 |
| 主项目服务端测试 | `pnpm test:server` | 411/411（原 394，新增 17） |
| 主项目前端类型检查 | `pnpm typecheck:web` | 退出码 0 |
| 主项目前端测试 | `pnpm test:web:run` | 299/299（原 285，新增 14） |
| 入口一致性 | `pnpm test:entrypoints` | 退出码 0 |
| API 入口一致性 | `pnpm test:api-entrypoints` | 退出码 0 |
| 前后端固定契约 | `pnpm test:contracts` | 退出码 0 |
| 迁移结构一致性 | `pnpm test:db-schema` | 退出码 0 |
| 主项目全量门禁 | `pnpm verify` | 退出码 0 |
| 数据库准备 | `pnpm db:migrate` + `schema:ensure` + `seed:auth` + `seed:labs` | 全部成功，`db:status` 为 up-to-date |
| 管理端全量门禁 | `management/` 下 `pnpm verify` | 退出码 0（共享 3/3、服务端 36/36、前端 24/24、漂移门禁含变异自检） |
| 全链路 E2E | `management/` 下 `pnpm test:e2e` | 4/4 通过 |

### 10.7 决策变更：独立仓库改为主仓库子目录

**变更时间**：2026-09-16，P0～P6 全部实施完成之后。

**原决策**：新建独立仓库 `E:\github\network-safe-management`，规划期用户明确要求「不要嵌入当前项目」。

**变更后**：管理端代码放在主仓库子目录 `management/`，不单独建 GitHub 仓库。触发原因来自用户的新指示：「直接在这个文件夹下创建 management 文件夹就可以了啊 不用另外建立仓库」——主仓库已有远端，子目录随主仓库一起推送即可，省掉一个仓库。

**影响与处理**：

| 影响 | 处理 |
|---|---|
| 原独立仓库的 7 个提交历史 | 删除其 `.git`，管理端作为主仓库的一次提交进入历史。**提交粒度这一项不再保留**，内容与全部测试证据不受影响 |
| 跨目录路径解析 | 三处改为指向上级目录：`tools/schema-drift`、`packages/shared/tests/contract.test.ts`、`packages/testing/src/runtime.mjs`。均保留 `NSP_ROOT` 覆盖入口 |
| 嵌套 workspace | `management/` 自带 `pnpm-workspace.yaml` 与 lock；主仓库 workspace 的 globs（`apps/*`、`packages/*`）不含它，因此依赖必须在 `management/` 下单独 `pnpm install` |
| 文档表述 | README、AGENTS.md、收口文档与本文件同步改为「主仓库子目录」；「跨仓库」改为「全链路」 |
| 原决策理由 | 「不嵌入主项目」的初衷（避免管理端污染学习平台）仍由别的机制保证：管理端是嵌套 workspace、独立进程、独立端口，主项目 server 不新增任何 `/admin` 接口，且对主项目表只读 |

**验证**：移动后重装依赖、重新 `prisma:generate`、`management/` 下 `pnpm verify` 退出码 0；schema 漂移门禁已正确解析到 `../database/schema/platform/schema.prisma`（即主项目 schema）。

## 11. 完成标准

- [x] 主项目旧 `/admin` 已完全撤除，`router.test.ts` 恢复原快照，`main.css` 净增量接近 0（回到 1165 行）。
- [x] 停用一个变体后，目录、接口、前台三层同时生效；重新启用后三层同时恢复（由管理端 E2E 实测，见收口文档 2.2 节）。
- [x] 数据库不可用时主站仍可用，平台状态页显示 `needs-attention` 与 `availabilitySource`（由 `platform-info.test.ts` 降级用例覆盖）。
- [x] `seed:labs` 重跑不覆盖管理端配置（由 `lab-metadata-sync.test.ts` 的 update 分支断言覆盖）。
- [x] 管理端四个模块可用；只有 `admin` 能访问；每次写操作都有审计记录。
- [x] 三层测试与 schema 漂移门禁通过，漂移门禁已完成变异自检。
- [x] 主项目既有门禁（`test:entrypoints`、`test:api-entrypoints`、`test:contracts`、`test:db-schema`）全部通过，`pnpm verify` 退出码 0。
- [x] 验证证据回填到本文档第 10.6 节与收口文档，未执行的命令如实列出。

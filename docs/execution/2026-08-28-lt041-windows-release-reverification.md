# LT-041 全新 Windows 环境发布复验执行文档

> 对应长期目标：`LT-041`
>
> 文档状态：已完成
>
> 创建时间：2026-08-28
>
> 完成时间：2026-08-28

## 1. 背景与目标

`LT-001` 已在 2026-07-23 完成过一次 Windows 本机发布验收，当时基线是 65 个实验、9 个分类、130 个变体。第三轮审计（`LT-040`）确认自那次验收之后平台发生了以下结构性变化，但从未重新执行过生产构建与 nginx 发布链路：

- 实验数量由 65 增至 75，分类由 9 增至 14，变体由 130 增至 150。
- 新增认证 token TTL、`expiresAt` 与进程内吊销能力（`LT-035`）。
- `apps/web` 由深相对路径引用共享包改为 `@network-safe/shared` 工作区依赖。
- 新增 `test:controlled` 受控实验验证与 API 入口反向门禁。
- 新增 `lab_recap_question_completions` 表与 `schema:ensure` 幂等补齐入口。

本任务目标是重新证明当前 75 实验基线可以在 Windows 本机以可重复方式完成交付，覆盖数据库初始化、前后端生产构建、服务启动、nginx SPA fallback、`/api` 反向代理、登录闭环和代表性实验闭环。

本复验只针对本机、固定数据和受控学习场景，不访问外部目标，不读取真实凭据，不执行真实攻击行为。

## 2. 范围

### 2.1 纳入范围

- 环境预检：Node、pnpm、MySQL、nginx、端口占用。
- 数据库：`pnpm db:prepare` 全链路与幂等复跑。
- 构建：`pnpm build:web`、`pnpm build:server` 及产物检查。
- 启动：`node dist/index.js` 与 `/api/health`、`/api/health/db`。
- nginx：配置生成、`nginx -t` 校验、静态托管、history fallback、`/api` 反向代理。
- 发布链路功能验收：登录、当前用户、注销、实验目录、专用实验、引导式实验、事件日志、复盘。
- 自动化：`pnpm verify`、`pnpm test:smoke`、`pnpm test:e2e`。
- 修正发布脚本中与当前基线不一致的陈旧断言。
- 验收证据、失败排查与清理步骤。

### 2.2 不纳入范围

- 公网部署、域名、HTTPS 证书与外部服务。
- Docker、云服务或远程数据库。
- 真实邮件、短信、支付、浏览器凭据或第三方平台。
- 新增安全实验或新增安全能力（属于 `LT-042` 及之后）。
- 全量 75 个实验逐页人工验收；逐项证据继续由既有脚本、服务测试和 40 项 E2E 承担。

## 3. 已确认的现状事实

以下事实在编写本文档前已通过读取仓库和本机环境确认，不属于推测：

| 项目 | 确认值 | 来源 |
|---|---|---|
| 实验元数据数量 | 75 | `labs/*/*/meta.json` 计数 |
| `ready` 数量 | 75 | `meta.json` status 计数 |
| Node 版本 | v22.16.0 | 本机 `node -v`，满足 `>=22 <23` |
| MySQL 监听 | 3306 已监听 | `netstat` |
| nginx 可执行 | `E:\nginx-1.24.0\nginx.exe` | 本机检索 |
| 后端默认端口 | 6667 | `apps/server/src/config/runtime.ts` |
| nginx 验收端口 | 8080 | `tools/release/generate-nginx-config.ps1` 默认 `ListenPort` |
| Smoke 实验总数断言 | 动态计数 | `packages/testing/src/smoke/config.mjs` 的 `countLocalLabMetadata()` |

## 4. 已识别的待修正缺陷

复验前的静态审查发现两处陈旧断言，若不修正，nginx 运行时验收必然失败：

1. `tools/release/test-nginx-runtime.ps1` 第 150 行断言 `$labsResponse.total -ne 68`，第 154 行输出 `lab-count=68`。当前 `/api/labs` 返回 `total = 75`，该断言会直接 `throw`。
2. `database/README.md` 记录“当前 71 个 `ready`、4 个 `in-progress`，待 LT-036～LT-039 验证后收口”，与当前 75/75 `ready` 不一致。

修正原则：

- 脚本不再硬编码实验数量，改为按 `labs/*/*/meta.json` 实际计数动态断言，与 Smoke 的 `countLocalLabMetadata()` 口径保持一致，避免本类断言随基线变化再次腐化。
- 文档只同步事实，不扩大范围。

字段来源确认：`/api/labs` 的 `total` 来自 `apps/server/src/app.ts` 中 `items.length`，`items` 来自 `labRegistry.listLabs()` 扫描 `labs/` 下的 `meta.json`。因此“本地 `meta.json` 计数”与“API `total`”是同一口径，可作为动态断言依据。

## 5. 实施步骤

### 5.1 预检

1. 确认 Node、pnpm 版本符合根 `package.json` 约束。
2. 确认 `apps/server/.env` 存在且 `DATABASE_URL` 指向本机 MySQL；不打印密钥值。
3. 确认 6667、8080、6670 端口空闲，3306 已监听。
4. 确认工作区无未预期修改，`git diff --check` 通过。

### 5.2 修正陈旧断言

1. 将 `test-nginx-runtime.ps1` 的实验数量断言改为动态计数。
2. 同步 `database/README.md` 的 `ready` 状态描述。
3. 运行 `packages/testing` 相关测试确认脚本边界断言仍通过。

### 5.3 数据库准备

1. 执行 `pnpm db:prepare`，覆盖建库、迁移、`schema:ensure`、认证种子、实验种子。
2. 记录迁移条数、分类数、实验数、变体数。
3. 再次执行 `pnpm db:prepare`，确认幂等且无重复写入。

### 5.4 生产构建

1. 执行 `pnpm build:web`，确认 `apps/web/dist/index.html` 与静态资源生成。
2. 执行 `pnpm build:server`，确认 Prisma client 与 `apps/server/dist/index.js` 生成。
3. 扫描产物，确认不含 `.env`、固定演示密码、token 或个人路径凭据。

### 5.5 启动与 nginx 发布验收

1. 生成 nginx 配置并执行 `nginx -t` 校验。
2. 通过 `tools/release/test-nginx-runtime.ps1` 启动构建后的 Node 服务与 nginx，执行：
   - `/`、深层路由 `/labs/client/mitb/fixed` 的 history fallback。
   - `/api/health`、`/api/health/db`、`/api/labs` 的反向代理。
   - 实验总数动态断言。
   - 认证链路：登录、当前用户、引导式漏洞版/修复版三向评估、事件日志、复盘读写、注销。
3. 脚本 `finally` 段负责停止 nginx 与 Node 并清理残留进程。

### 5.6 自动化复验

1. `pnpm verify`（类型检查、shared、guided、controlled、Web/API 入口、覆盖矩阵、server、web）。
2. `pnpm test:smoke`。
3. `pnpm test:e2e`（40 项）。

### 5.7 清理

1. 确认 6667、8080 端口释放，Node 与 nginx 验收进程退出。
2. 保留不含秘密的验收摘要，写回本文档第 9 节。

## 6. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 陈旧数量断言导致 nginx 验收失败 | 误判发布链路损坏 | 先修正为动态计数再执行验收 |
| 复验写入个人学习记录 | 污染本机学习数据 | 只使用固定演示账号与固定 `network.mitm` 场景，验收后不清库但记录影响范围 |
| 演示密码经环境变量传入 | 凭据泄露风险 | 只用 `NETWORK_SAFE_DEMO_PASSWORD` 进程环境传递，不写入命令行、日志、文档或提交 |
| 8080/6667 被历史验收进程占用 | 结果不可信 | 脚本 `Assert-PortFree` 前置校验，失败即停止 |
| nginx 配置写入个人绝对路径 | 破坏可复现性 | 配置由模板生成到临时目录，仓库内只保留占位符模板 |
| 生产构建掩盖开发期问题 | 结论过于乐观 | 构建验收与 `pnpm verify`、E2E 并行执行，互相印证 |
| WSL 与 Windows 双环境路径混用 | 命令执行失败或结果错乱 | 构建、数据库、nginx 验收全部在 Windows 侧执行 |

## 7. 安全边界

- 只连接本机 `127.0.0.1` 与 `localhost`，不访问任何外部主机。
- 只使用固定演示账号与固定实验决策 key，不提交自由输入。
- 不读取真实浏览器凭据、系统凭据或个人隐私数据。
- 不新增任何攻击能力；本任务只验证交付链路。
- 密钥与密码不出现在文档、日志、提交记录或输出摘要中。

## 8. 完成标准

- [x] 预检通过：Node、pnpm、MySQL、nginx、端口。
- [x] 陈旧断言修正完成，脚本改为动态计数。
- [x] `pnpm db:prepare` 通过且二次执行幂等。
- [x] `pnpm build:web` 与 `pnpm build:server` 通过，产物无秘密。
- [x] 构建后 Node 服务启动，`/api/health` 与 `/api/health/db` 正常。
- [x] nginx 配置 `nginx -t` 通过。
- [x] nginx 静态托管、深层路由 fallback、`/api` 代理全部 200。
- [x] 实验总数动态断言通过（当前应为 75）。
- [x] 登录、当前用户、引导式三向评估、事件日志、复盘读写、注销全部通过。
- [x] `pnpm verify` EXIT=0。
- [x] `pnpm test:smoke` 通过。
- [x] `pnpm test:e2e` 40/40 通过。
- [x] 验收进程与端口清理完成。
- [x] 证据回填本文档第 9 节，并同步 `docs/TODO.md`、`SECURITY-COVERAGE-LONG-TERM-GOAL.md`。

## 9. 验收证据

执行时间：2026-08-28。全部命令在 Windows 侧执行，只连接 `127.0.0.1`。

### 9.1 环境预检

| 项目 | 实测值 |
|---|---|
| Node | v22.16.0（满足 `>=22 <23`） |
| pnpm | 见 9.2 版本偏差说明 |
| MySQL 3306 | 已监听 |
| 6667 / 6670 / 8080 | 执行前均空闲 |
| nginx | `E:\nginx-1.24.0\nginx.exe` |
| `apps/server/.env` | 存在，含 `PORT`、`APP_ENV`、`WEB_ORIGIN`、`AUTH_TOKEN_SECRET`、`DATABASE_URL`；未读取或输出任何值 |
| `git diff --check` | EXIT=0 |

### 9.2 pnpm 版本偏差（新发现，非阻塞）

本机 `PATH` 中的 pnpm 为 7.33.7，与根 `package.json` 的 `packageManager: pnpm@10.0.0` 声明不一致；`pnpm-lock.yaml` 为 `lockfileVersion: 5.4`（pnpm 7 格式）。

本次复验统一通过 `corepack pnpm@10.0.0` 执行，以声明版本为准。已实测确认：pnpm 10 可正常解析该 lockfile 并运行全部脚本，执行前后 `pnpm-lock.yaml` 哈希未发生变化，工作区 `@network-safe/shared` junction 链接完好。

结论：不影响本次交付结论，但属于文档与本机环境的真实偏差，已登记为遗留项（见 9.9）。本任务未改写 lockfile，也未变更 `packageManager` 声明。

### 9.3 数据库准备与幂等

两次 `pnpm db:prepare` 输出完全一致：

```text
database ready: network_safe_project; applied 0; skipped 4; total 4
lab_recap_question_completions already exists
seeded 2 auth users
synced 14 categories, 75 labs, 150 variants
EXIT=0
```

4 个迁移幂等跳过，无重复写入，14 分类 / 75 实验 / 150 变体与当前基线一致。

### 9.4 生产构建

| 命令 | 结果 |
|---|---|
| `pnpm build:web` | EXIT=0，`built in 5.28s`，`apps/web/dist/index.html` + 77 个静态资源 |
| `pnpm build:server` | EXIT=0，Prisma Client v6.19.3 生成，`apps/server/dist/index.js` 存在 |

产物秘密扫描：`dist` 内无 `.env` 副本、无固定演示密码、无 token、无个人路径凭据。唯一命中项为 `apps/server/dist/services/auth.js` 中 `process.env.AUTH_TOKEN_SECRET` 的变量名读取与 `AUTH_TOKEN_SECRET is required in production` 错误文案，属于变量引用而非泄露的值。

### 9.5 已修正的缺陷

第 4 节识别的两处陈旧断言（`test-nginx-runtime.ps1` 硬编码 68、`database/README.md` 的 71 ready 描述）在上一次提交中已完成修正，本次复验确认脚本已按 `labs/*/*/meta.json` 动态计数，文档已同步为 75 ready。

本次复验新发现并修正一处阻塞缺陷：

`tools/release/test-nginx-runtime.ps1` 为 UTF-8 **无 BOM**，而 Windows PowerShell 5.1 在无 BOM 时按 ANSI(GBK) 解码 `.ps1`。第 46 行中文注释的 UTF-8 字节被错误解码，吞掉后续语法结构，导致脚本无法解析：

```text
Missing closing '}' in statement block or type definition.  (line 39)
Unexpected token ')' in expression or statement.            (line 48)
```

该缺陷由上一次提交新增中文注释时引入——仓库其他 `.ps1` 均为纯 ASCII，故此前从未暴露。修复方式为给该文件添加 UTF-8 BOM，既保留中文注释（符合项目注释规则），也让 PS 5.1 正确解码。修复后 `PARSE_OK`，行尾 LF 保持不变。

结论：`LT-041` 的价值不止于确认既有链路可用，它实际拦截了一处会让 Windows 发布验收脚本完全不可执行的回归。

### 9.6 nginx 发布验收

配置生成与校验：

```text
nginx: the configuration file ...\network-safe-nginx.conf syntax is ok
nginx: configuration file ...\network-safe-nginx.conf test is successful
web root: E:\github\network_safe_project\apps\web\dist
listen: 8080; api upstream: 6667
```

运行时验收（`test-nginx-runtime.ps1 -RunAuthenticatedChecks`）：

```text
home status=200 bytes=395
deep-route status=200 bytes=395
proxy-health status=200 bytes=73
proxy-db status=200 bytes=100
proxy-labs status=200 bytes=262662
lab-count=75
authenticated-login-pass
guided-vulnerable-fixed-pass
event-log-recap-pass
NGINX_RUNTIME_ACCEPTANCE_PASS
```

覆盖内容：静态首页、深层路由 `/labs/client/mitb/fixed` 的 history fallback、`/api/health`、`/api/health/db`、`/api/labs` 反向代理、实验总数动态断言 75、登录、当前用户、`network.mitm` 引导式漏洞版接受 / 修复版阻断 / 修复版正常放行三向评估、事件日志读取、复盘读写、注销。

演示密码仅通过 `NETWORK_SAFE_DEMO_PASSWORD` 进程环境变量传入，未进入命令行、日志、文档或提交记录。

### 9.7 自动化复验

`pnpm verify` EXIT=0，各阶段计数：

| 阶段 | 结果 |
|---|---|
| 前后端类型检查 | 通过 |
| `test:shared` | 67 / 67 |
| `test:guided` | 30 / 30，`ok: true` |
| `test:controlled` | 4 个受控实验全部 `ok: true` |
| `test:entrypoints` | 路由 100，Web 入口 150 / 150 匹配，错误 0 |
| `test:api-entrypoints` | 路由 79，API 入口 198 / 198 匹配，错误 0 |
| `test:coverage` | 75 / 75 行，专用 45，引导式 30，模式 26/21/28，14 分类，Playwright 28，`ok: true` |
| `test:server` | 363 / 363 |
| `test:web:run` | 80 文件，285 / 285 |

`pnpm test:smoke` EXIT=0：`web-home`、`api-health-direct`、`api-labs-direct`、`api-health-proxy` 全部 200。

`pnpm test:e2e` EXIT=0：40 / 40 通过（1.1m）。

覆盖矩阵实测分布与 `SECURITY-COVERAGE-LONG-TERM-GOAL.md` 第 21.4 节记录的第三轮基线完全一致，未发生漂移。

### 9.8 清理与静态门禁

```text
6667 released
8080 released
nginx-procs=0
```

`git diff --check` EXIT=0。本次会话唯一代码改动为 `tools/release/test-nginx-runtime.ps1` 的 BOM 修复（1 insertion, 1 deletion）。

### 9.9 遗留项与影响范围

- pnpm 版本与 lockfile 格式偏差（9.2）：建议后续单独切片处理，选项为升级 lockfile 到 pnpm 10 格式，或将 `packageManager` 回落到实际使用版本。本任务不擅自决定该方向。
- 本次复验向本机数据库写入了 `network.mitm` 的固定演示学习记录、事件日志和一条复盘完成记录，账号为 `demo_user`。属于预期范围内的固定数据，未清库。
- 未修改任何实验元数据、页面、API 或安全边界。

## 10. 交付物

- 本执行文档与验收证据。
- `tools/release/test-nginx-runtime.ps1` 动态计数修正。
- `database/README.md` 状态同步。
- `docs/TODO.md` 与 `SECURITY-COVERAGE-LONG-TERM-GOAL.md` 的 `LT-041` 完成记录。

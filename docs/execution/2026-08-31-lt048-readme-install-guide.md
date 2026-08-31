# LT-048 README 从零安装与环境变量示例执行文档

> 文档状态：已完成
>
> 建立时间：2026-08-31
>
> 关联任务：`LT-048`

## 1. 目标

补齐长期目标第 12.1 节的三个未完成条目：

- 更新根 README，提供从零安装和运行顺序。
- 提供环境变量示例和启动前校验。
- 提供数据库初始化、迁移、种子和健康检查命令。

## 2. 实施前确认的现状

| 项目 | 实测结论 |
|---|---|
| README 章节 | 共 10 节（目标、约束、架构、目录结构、实验规范、脚本规范、覆盖策略、文档目录、当前状态、后续维护），**确无安装或运行章节** |
| 根 `.env.example` | 不存在 |
| `apps/server/.env.example` | 存在，含 5 项，**无注释** |
| 服务端实际读取的环境变量 | 6 个：`AUTH_TOKEN_SECRET`、`AUTH_TOKEN_TTL_SECONDS`、`DATABASE_URL`、`MYSQL_CLI_PATH`、`NODE_ENV`、`PRISMA_GENERATE_SKIP_AUTOINSTALL` |
| 示例文件缺失项 | `MYSQL_CLI_PATH` 未列出 |
| 端口真值 | Web 6670、API 6667（`apps/web/src/config/runtime.ts`）；nginx 验收 8080 |

`MYSQL_CLI_PATH` 的缺失是实质问题：`database/scripts/apply-migrations.mjs` 用它覆盖 mysql 可执行文件查找路径，MySQL 未加入 `PATH` 时缺少该变量会导致迁移直接失败，而示例文件不提它，新环境无从得知。

## 3. 交付内容

### 3.1 补全 `apps/server/.env.example`

- 新增缺失的 `MYSQL_CLI_PATH`（以注释形式提供，默认不启用）。
- 为全部 6 项加中文注释，说明用途、默认值与缺失后果。
- 顶部声明该文件只放示例值，禁止写入真实凭据。

未新建根目录 `.env.example`：服务端是唯一读取环境变量的应用，前端配置在 `apps/web/src/config/runtime.ts` 中为源码常量（`webDevPort = 6670`、`apiProxyTarget`），不经环境变量。再建一个根级示例文件会产生两处需同步维护的副本，属无必要重复。长期目标第 12.1 节「提供环境变量示例」的实质要求已由补全后的服务端示例满足。

### 3.2 README 新增第 2.1 节「从零安装与运行」

八个小节，覆盖前置要求、安装、环境配置、数据库初始化、启动、验证、生产构建、常见问题。

编号选择：插入为 `2.1` 而非新建第 3 节。全文仅一处章节交叉引用且指向 `AGENTS.md`（第 13 行），但插入独立编号仍会让后续 8 个章节号全部位移，改动面远大于收益。

内容要点：

- 前置要求列出 Node `>=22 <23`、pnpm、MySQL、nginx 及各自校验命令，并明确三个需空闲端口。
- 如实记录 pnpm 版本矛盾：声明 `pnpm@10.0.0` 而 lockfile 为 `lockfileVersion: 5.4`（pnpm 7 生成），标注为已知遗留项并指向 `LT-050`，同时给出 corepack 的可行走法。**不掩盖该矛盾**。
- 数据库初始化同时给出一条式 `db:prepare` 与四步分解命令，后者用于定位失败环节。
- 附 `db:prepare` 的预期输出，便于新环境比对。
- 常见问题表覆盖五类实际会遇到的故障，含 `MYSQL_CLI_PATH` 缺失与端口占用。

## 4. 验证

### 4.1 引用真实性核对

README 中引用的每条命令与路径均经脚本核对存在，无编造：

- 根级脚本 9 个：`db:prepare`、`db:migrate`、`dev:server`、`dev:web`、`verify`、`test:smoke`、`test:e2e`、`build:web`、`build:server` —— 全部存在。
- 服务端 filtered 脚本 4 个：`schema:ensure`、`seed:auth`、`seed:labs`、`start` —— 全部存在。
- 健康检查端点 `"/api/health"`、`"/api/health/db"` —— 均在 `apps/server/src/app.ts` 中注册。
- 引用路径 `nginx/README.md`、`tools/release/` —— 均存在。

### 4.2 预期输出实测

实际执行 `corepack pnpm@10.0.0 db:prepare`，EXIT=0，输出与 README 所写四行逐字一致：

```
database ready: network_safe_project; applied 0; skipped 4; total 4
lab_recap_question_completions already exists
seeded 2 auth users
synced 14 categories, 78 labs, 156 variants
```

文档中的 78 labs / 156 variants 取自本次实测，非沿用旧基线。

### 4.3 未执行项

未在真正的全新环境（空 MySQL、未装依赖）重跑全流程。`LT-041` 已完成过一次该验证并留有证据；本切片只把已验证过的流程写成文档，未改动任何脚本或运行时代码。README 中的安装顺序与 `LT-041` 验收所走路径一致。

## 5. 安全边界

- 示例文件只含占位与本机学习用示例值，无真实密钥。
- README 未记录任何真实凭据；演示账号仅指向种子脚本位置。
- 全过程只连接本机，未访问外部目标。

## 6. 完成标准

- [x] 核实 README 确无安装运行章节，非文档过时误判。
- [x] 核实服务端实际读取的环境变量清单，发现示例文件缺项。
- [x] 补全 `.env.example` 并加用途注释。
- [x] README 新增从零安装与运行章节。
- [x] 如实记录 pnpm 版本矛盾而非掩盖。
- [x] 文中所有命令与路径经核对存在。
- [x] 预期输出经实测确认一致。
- [x] 长期目标第 12.1 节三条勾选、TODO 同步。
- [x] `git diff --check` 通过并提交。

## 7. 遗留

- pnpm `packageManager` 声明与 lockfile 版本矛盾未解决，属 `LT-050` 范围。README 已标注。
- 未新建根 `.env.example`，理由见 3.1；若将来前端引入环境变量，需重新评估。

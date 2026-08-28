# LT-041 全新 Windows 环境发布复验执行文档

> 对应长期目标：`LT-041`
>
> 文档状态：进行中
>
> 创建时间：2026-08-28

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

- [ ] 预检通过：Node、pnpm、MySQL、nginx、端口。
- [ ] 陈旧断言修正完成，脚本改为动态计数。
- [ ] `pnpm db:prepare` 通过且二次执行幂等。
- [ ] `pnpm build:web` 与 `pnpm build:server` 通过，产物无秘密。
- [ ] 构建后 Node 服务启动，`/api/health` 与 `/api/health/db` 正常。
- [ ] nginx 配置 `nginx -t` 通过。
- [ ] nginx 静态托管、深层路由 fallback、`/api` 代理全部 200。
- [ ] 实验总数动态断言通过（当前应为 75）。
- [ ] 登录、当前用户、引导式三向评估、事件日志、复盘读写、注销全部通过。
- [ ] `pnpm verify` EXIT=0。
- [ ] `pnpm test:smoke` 通过。
- [ ] `pnpm test:e2e` 40/40 通过。
- [ ] 验收进程与端口清理完成。
- [ ] 证据回填本文档第 9 节，并同步 `docs/TODO.md`、`SECURITY-COVERAGE-LONG-TERM-GOAL.md`。

## 9. 验收证据

待执行后回填。

## 10. 交付物

- 本执行文档与验收证据。
- `tools/release/test-nginx-runtime.ps1` 动态计数修正。
- `database/README.md` 状态同步。
- `docs/TODO.md` 与 `SECURITY-COVERAGE-LONG-TERM-GOAL.md` 的 `LT-041` 完成记录。

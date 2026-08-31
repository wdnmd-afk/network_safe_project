# network_safe_project

一个面向个人学习的网络安全训练平台仓库。

项目目标是在 Windows 本机环境下，使用 `Node.js + MySQL + Vue` 构建一个覆盖常见网络安全问题的学习系统，并通过“漏洞版 / 修复版”对照模式支持实验、验证和后续自动化测试。

## ⚠️ 使用边界与免责声明

本仓库是**面向个人学习的网络安全教育平台**，所有漏洞场景仅用于在**本机受控实验环境**中进行原理学习、防御对照与修复验证。

- 仅限在你**本人拥有或已获明确授权**的环境中使用。
- **禁止**将本仓库的任何代码、脚本或技术用于攻击、扫描、入侵未经授权的真实系统、网络或第三方资产。
- 本项目不是、也不会成为对外攻击工具集或渗透接单工具箱（详见 `AGENTS.md` 第 9 节安全边界规则）。
- 对不适合真实复现的攻击类型，本项目采用模拟演示、案例讲解或受控脚本实验，而非提供可直接危害真实目标的能力。
- 使用者须自行承担因违反上述边界或当地法律法规而产生的全部责任。作者不对任何滥用行为负责。

> 简言之：**只在自己的机器上、为了学会防御而使用。**

## 1. 项目目标

本项目不是单一漏洞 demo，也不是纯知识文档仓库，而是一个分阶段建设的学习平台。

核心目标如下：

- 个人学习优先
- 同一场景尽量同时提供漏洞版与修复版
- 尽量覆盖更广泛的攻击类型
- 允许不同攻击类型采用不同呈现方式
- 为后续自动化测试预留统一结构

## 2. 当前约束

当前已确认的约束如下：

- 运行环境：Windows 本机
- 容器方案：暂不使用 Docker
- 数据库：本机 `localhost` MySQL
- 前端：Vue
- 后端：Node.js
- 仓库结构：monorepo
- 前端部署：允许 `build` 后交由 `nginx` 托管
- 后端部署：Node 服务独立常驻运行

## 2.1 从零安装与运行

以下顺序在全新 Windows 环境验证过（见 `docs/execution/2026-08-28-lt041-windows-release-reverification.md`）。全过程只连接本机，不访问外部目标。

### 2.1.1 前置要求

| 依赖 | 要求 | 校验命令 |
|---|---|---|
| Node.js | `>=22 <23`（根 `package.json` 的 `engines`） | `node -v` |
| pnpm | 见下方版本说明 | `pnpm -v` |
| MySQL | 本机实例，默认 3306 | `netstat -ano \| findstr :3306` |
| nginx | 仅生产托管需要，开发不需要 | `nginx -v` |

需要空闲的端口：**6667**（后端）、**6670**（前端开发服务器）、**8080**（nginx 验收，仅发布时）。

pnpm 版本说明：根 `package.json` 声明 `packageManager: pnpm@10.0.0`，但当前 `pnpm-lock.yaml` 为 `lockfileVersion: 5.4`（pnpm 7 生成）。二者不一致是已知遗留项，将由 `LT-050` 处理。当前推荐用 corepack 按声明版本执行，实测可正常解析该 lockfile 且不会改写它：

```powershell
corepack pnpm@10.0.0 install
```

若直接使用本机 pnpm，请确认其能读取 v5.4 lockfile。

### 2.1.2 安装依赖

```powershell
corepack pnpm@10.0.0 install
```

工作区包含 `apps/*` 与 `packages/*`（见 `pnpm-workspace.yaml`）。

### 2.1.3 配置环境变量

```powershell
Copy-Item apps\server\.env.example apps\server\.env
```

然后按本机实际情况修改 `apps/server/.env` 中的 `DATABASE_URL`。各变量用途见该示例文件内注释。`.env` 已被 `.gitignore` 忽略，不会进入提交。

若 MySQL 未加入 `PATH`，另需设置 `MYSQL_CLI_PATH` 指向 `mysql.exe`，否则迁移脚本找不到它。

### 2.1.4 初始化数据库

```powershell
corepack pnpm@10.0.0 db:prepare
```

该命令按顺序执行四步：建库与迁移、补齐缺失表、写入认证账号、同步实验元数据。命令是幂等的，重复执行输出一致。预期输出形如：

```
database ready: network_safe_project; applied 0; skipped 4; total 4
lab_recap_question_completions already exists
seeded 2 auth users
synced 14 categories, 78 labs, 156 variants
```

也可分步执行（用于排查具体环节）：

```powershell
corepack pnpm@10.0.0 db:migrate                                      # 建库与迁移
corepack pnpm@10.0.0 --filter @network-safe/server schema:ensure     # 补齐缺失表
corepack pnpm@10.0.0 --filter @network-safe/server seed:auth         # 认证账号
corepack pnpm@10.0.0 --filter @network-safe/server seed:labs         # 实验元数据
```

种子写入两个本机演示账号，凭据在 `apps/server/scripts/seed-auth-users.mjs` 中可查，仅用于本机学习。

### 2.1.5 启动开发环境

需要两个终端：

```powershell
corepack pnpm@10.0.0 dev:server    # 后端，http://localhost:6667
corepack pnpm@10.0.0 dev:web       # 前端，http://localhost:6670
```

前端开发服务器已把 `/api` 代理到 6667（见 `apps/web/src/config/runtime.ts`），无需额外配置。

### 2.1.6 验证安装

```powershell
# 健康检查
curl http://localhost:6667/api/health
curl http://localhost:6667/api/health/db

# 实验目录（应返回 78）
curl http://localhost:6667/api/labs
```

浏览器访问 `http://localhost:6670`，用演示账号登录后即可进入实验目录。

不依赖数据库的静态与单元验证：

```powershell
corepack pnpm@10.0.0 verify
```

依赖本机服务的验证：

```powershell
corepack pnpm@10.0.0 test:smoke     # 需前后端已启动
corepack pnpm@10.0.0 test:e2e       # Playwright，会自行拉起服务
```

### 2.1.7 生产构建与 nginx 托管（可选）

```powershell
corepack pnpm@10.0.0 build:web
corepack pnpm@10.0.0 build:server
corepack pnpm@10.0.0 --filter @network-safe/server start   # 启动构建产物
```

nginx 静态托管与 `/api` 反向代理的配置生成、校验与运行时验收，见 `nginx/README.md` 与 `tools/release/`。

### 2.1.8 常见问题

| 现象 | 原因与处理 |
|---|---|
| 迁移脚本报找不到 mysql | MySQL 未在 `PATH`；设置 `MYSQL_CLI_PATH` 指向 `mysql.exe` |
| 后端启动即退出 | 检查 `apps/server/.env` 是否存在、`DATABASE_URL` 是否可连通 |
| 前端能打开但接口 404 | 后端未启动或未监听 6667 |
| 端口被占用 | 用 `netstat -ano \| findstr :6667` 找到并结束占用进程 |
| `db:prepare` 中途失败 | 用 2.1.4 的分步命令定位具体环节 |

## 3. 架构思路

项目采用“平台核心分层 + 实验模块分层”的组织方式。

### 3.1 平台核心

平台核心负责统一的平台能力：

- 用户与认证
- 实验目录与学习路径
- 学习记录
- 验证记录
- 知识内容与题目
- 统一 API

### 3.2 实验模块

实验内容按安全领域拆分为四类：

1. Web 漏洞靶场
2. 认证授权与业务逻辑靶场
3. 网络与基础设施实验模块
4. 社会工程学与新型攻击学习模块

### 3.3 脚本与资源层

单独维护实验脚本与验证资源，主要语言为 Python 与 TypeScript，用于：

- 本地受控实验
- 场景验证
- 自动化测试复用
- 样本与产物管理

## 4. 当前目录结构

```text
network-safe-project/
├─ apps/
│  ├─ web/
│  └─ server/
├─ packages/
│  ├─ shared/
│  ├─ configs/
│  └─ testing/
├─ labs/
│  ├─ web/
│  ├─ auth/
│  ├─ network/
│  ├─ social/
│  ├─ client/
│  ├─ ai/
│  ├─ malware/
│  ├─ supply-chain/
│  └─ infrastructure/
├─ tools/
│  └─ lab-scripts/
├─ docs/
│  ├─ execution/
│  └─ design/
├─ database/
│  ├─ schema/
│  ├─ seeds/
│  └─ migrations/
├─ nginx/
└─ pnpm-workspace.yaml
```

当前仓库已经完成：

- 文档体系
- monorepo 根配置
- `apps/web` 与 `apps/server` 基础占位
- `packages/shared`、`packages/configs`、`packages/testing` 基础占位
- `database/`、`nginx/` 基础目录
- 一期 15 个实验的目录骨架与 `meta.json` 占位
- 对应脚本目录骨架

## 5. 实验目录规范

每个实验建议按以下结构组织：

```text
labs/<category>/<scene>/
├─ meta.json
├─ README.md
├─ vuln/
├─ fixed/
├─ mock/
└─ docs/
```

字段含义：

- `meta.json`：实验元数据
- `README.md`：实验说明与入口说明
- `vuln/`：漏洞版实现
- `fixed/`：修复版实现
- `mock/`：模拟服务、演示数据或辅助页面
- `docs/`：攻击步骤、修复说明、学习材料

## 6. 脚本目录规范

实验脚本按场景组织，不按语言优先组织：

```text
tools/lab-scripts/<category>/<scene>/
├─ README.md
├─ exploit.py
├─ verify.ts
├─ samples/
└─ artifacts/
```

约束如下：

- 仅用于本项目内的受控学习场景
- Python 主要承担实验与验证脚本
- TypeScript 主要承担平台集成与自动化验证
- 不作为通用攻击工具库使用

## 7. 覆盖策略

本项目追求“尽量全覆盖”，但不要求所有攻击类型都以同一种方式实现。

### 7.1 适合真实靶场化的内容

- XSS
- CSRF
- SQL 注入
- 文件上传
- 路径遍历
- SSRF
- JWT / 会话问题
- IDOR / 越权
- 业务逻辑漏洞

### 7.2 适合脚本实验或模拟演示的内容

- 端口扫描
- DNS 相关实验
- 中间人攻击原理演示
- ARP 欺骗原理演示
- 配置错误利用

### 7.3 适合案例化与半交互演示的内容

- 网络钓鱼
- 鱼叉式钓鱼
- 商业邮件诈骗
- 水坑攻击
- Prompt 注入
- AI 驱动攻击

## 8. 文档目录

文档按用途拆分：

- `docs/execution/`：执行文档
- `docs/design/`：架构设计与技术方案
- `docs/labs/`：漏洞场景说明
- `docs/testing/`：测试规划与验证方案

## 9. 当前状态

当前仓库处于：**78 个 `ready` 实验持续维护阶段**

当前已完成：

- Vue + Vite 前端、Node.js + Express 后端和 MySQL 平台数据链路。
- 实验元数据扫描、注册、列表、详情、学习进度、验证记录和复盘能力。
- 统一 `lab_event_logs` 事件日志和脱敏摘要。
- 78 个 `ready` 实验、14 个分类、156 个漏洞版 / 修复版变体。
- 26 个 `interactive`、22 个 `simulation`、30 个 `case-study` 实验模式。
- 48 个专用实验实现与 30 个通用引导式实验实现。
- 单元 / API / 共享校验 / 只读脚本 / Web 入口一致性 / Playwright 分层自动化验证。
- 本机数据库缺失复盘表的幂等补齐入口 `pnpm --filter @network-safe/server schema:ensure`。

当前长期队列：

- `LT-001`～`LT-044` 已完成；第三轮审计后的 `LT-041`～`LT-044` 队列全部收口，后续队列待新一轮阶段审计重排。
- `LT-031`～`LT-040` 的专项验证、根级 `pnpm verify` 和完整 40 项 Playwright E2E 已通过。
- `LT-041` 已在 75 实验基线上完成生产构建与 nginx 发布复验：`pnpm db:prepare` 幂等、前后端构建通过、`nginx -t` 通过、静态托管与 `/api` 反向代理全部 200、实验总数动态断言 75、登录与实验闭环通过。
- `LT-042` 已新增 `infrastructure.kubernetes-rbac-audit` 固定 RBAC 绑定审计（case-study，D3 专用模拟）：专项只读验证 18/18、根级 `pnpm verify` EXIT=0，实验总数升至 76。
- `LT-043` 已新增 `api.rate-limit-idempotency` 固定 Webhook 批次配额与幂等审计（simulation，D3 专用模拟）：专项只读验证 18/18、根级 `pnpm verify` EXIT=0，实验总数升至 77。
- `LT-044` 已新增 `host.persistence-triage` 固定自启动/计划任务持久化时间线研判（case-study，D3 专用模拟）：专项只读验证 19/19、根级 `pnpm verify` EXIT=0，实验总数升至 78；文件/目录 ACL 与 NTLM/Kerberos 固定案例本轮未实现，保留到后续队列。

总纲和最终验证证据见：

- `SECURITY-COVERAGE-LONG-TERM-GOAL.md`
- `docs/execution/2026-08-25-lt-second-round-phase-audit.md`
- `docs/execution/2026-08-25-lt040-third-round-audit.md`
- `docs/execution/2026-08-28-lt041-windows-release-reverification.md`
- `docs/execution/2026-08-28-lt042-kubernetes-rbac-audit.md`
- `docs/execution/2026-08-28-lt043-api-quota-idempotency.md`
- `docs/execution/2026-08-28-lt044-windows-persistence-triage.md`
- `docs/execution/2026-08-28-lt042-kubernetes-rbac-audit.md`
- `docs/execution/2026-08-28-lt043-api-quota-idempotency.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/execution/2026-07-20-security-lab-master-completion.md`

## 10. 后续维护

1. 新增实验前先编写独立执行文档，并明确 `interactive`、`simulation` 或 `case-study` 模式。
2. 继续使用固定数据、本机受控目标和统一事件日志，不扩展为外部攻击能力。
3. 修改共享目录或通用工作台后，执行服务端、前端、共享包、`test:guided`、类型检查和代表性 Playwright 验证。
4. 保持元数据、路由、API、脚本、文档和 `docs/TODO.md` 状态一致。

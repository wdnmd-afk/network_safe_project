# 一期落地实施计划

> 面向后续执行者：本计划用于把当前文档阶段转入工程落地阶段。后续实施必须优先遵循本计划中的阶段顺序、目录约定和验证要求推进。

## 1. 目标

在当前已完成项目规则、技术选型、实验元数据、一期实验清单和数据库基础表设计的前提下，推进本项目进入一期工程落地阶段，先构建可运行的平台骨架，再逐步接入一期高优先级实验。

## 2. 范围

本计划覆盖以下内容：

1. 自动化测试规划文档补齐
2. monorepo 基础骨架初始化
3. 前后端基础应用初始化
4. 共享类型与实验注册能力建立
5. 数据库目录与平台基础 schema 落地
6. nginx 目录与本机部署占位配置建立
7. 一期实验目录骨架建立
8. 第一批可执行实验的实施顺序确定

本计划不在本阶段直接实现所有实验细节代码，但会定义清楚实施顺序与最小完成标准。

## 3. 当前输入文档

后续实施必须以以下文档为依据：

- `README.md`
- `AGENTS.md`
- `docs/execution/2026-06-08-platform-runtime-contract.md`
- `docs/execution/2026-06-08-web-xss-sample-spec.md`
- `docs/design/tech-stack-and-version-strategy.md`
- `docs/design/lab-metadata-structure.md`
- `docs/design/database-foundation-schema.md`
- `docs/design/phase-1-lab-list.md`
- `docs/TODO.md`

## 4. 一期落地总策略

一期不按“把 15 个实验同时铺开”的方式推进，而按以下策略实施：

1. **先平台骨架**
   - 先让仓库、应用、共享包、数据库目录、脚本目录有统一基础结构
2. **再元数据驱动**
   - 先让实验能被平台注册、列出、读取、索引
3. **再打通一条纵向链路**
   - 先完成一个从前端、后端、数据库、元数据、验证记录跑通的实验
4. **再横向复制到其他实验**
   - 用已跑通的模式扩展到剩余高优先级实验

## 5. 推荐实施顺序

## 阶段 A：补齐最后一份设计文档

### 目标

补齐自动化测试规划文档，结束“设计口径未闭环”的状态。

### 产出

- `docs/design/automation-testing-plan.md`

### 要点

- 明确 `Vitest`、`Playwright`、`Python/TypeScript` 脚本三层分工
- 明确漏洞版验证与修复版回归验证的区分
- 明确一期首批自动化覆盖范围

### 完成标准

- 后续实现者不需要再猜每层测试工具负责什么

## 阶段 B：初始化 monorepo 基础骨架

### 目标

建立仓库基础目录和根级配置，使前后端、共享包、实验目录、数据库目录具备统一落点。

### 产出

- 根目录 `package.json`
- `pnpm-workspace.yaml`
- 根目录 `.npmrc`
- 根目录 `tsconfig.base.json`
- 根目录基础脚本约定
- 目录骨架：
  - `apps/web`
  - `apps/server`
  - `packages/shared`
  - `packages/configs`
  - `packages/testing`
  - `labs`
  - `tools/lab-scripts`
  - `database`
  - `nginx`

### 要点

- 使用 `pnpm workspace`
- Node 基线固定为 `22.x LTS`
- 不引入 `Nx`、`Turborepo`
- 根脚本只放最必要命令

### 完成标准

- 仓库目录可读、职责清晰
- 后续新增实验和共享模块有明确位置

## 阶段 C：初始化前端与后端基础应用

### 目标

建立最小可运行的 `web` 与 `server` 应用。

### 产出

- `apps/web`
  - Vue + Vite + Vue Router + Pinia + TypeScript
- `apps/server`
  - Node + Express + TypeScript

### 要点

- 前端先不追求 UI 丰富，先建立：
  - 平台首页
  - 实验列表页
  - 实验详情页占位
- 后端先建立：
  - 健康检查接口
  - 实验列表接口
  - 实验详情接口

### 完成标准

- 前端能启动
- 后端能启动
- 前端能请求后端健康接口

## 阶段 D：建立共享类型与实验注册能力

### 目标

把文档中的元数据结构真正落成类型、校验和注册逻辑。

### 产出

- `packages/shared`
  - 实验元数据 TypeScript 类型
  - 枚举或常量定义
  - 元数据校验逻辑
- `apps/server`
  - 扫描 `labs/*/*/meta.json`
  - 注册实验索引
  - 提供实验数据 API

### 要点

- 以 `docs/design/lab-metadata-structure.md` 为准
- 不允许服务端或前端自己猜字段
- 所有实验必须通过统一入口注册

### 完成标准

- 新增一个 `meta.json` 后，平台能自动识别并列出

## 阶段 E：落地数据库基础骨架

### 目标

把平台核心数据库结构与迁移目录建立起来。

### 产出

- `database/schema/platform`
- `database/schema/labs`
- `database/seeds/platform`
- `database/seeds/labs`
- `database/migrations`
- Prisma 基础 schema

### 要点

- 平台核心表优先落地：
  - `users`
  - `lab_categories`
  - `labs`
  - `lab_variants`
  - `lab_tags`
  - `lab_tag_relations`
  - `learning_progress`
  - `verification_records`
  - `lab_run_records`
- 实验业务表暂按场景目录建空位或最小 schema

### 完成标准

- 本机 MySQL 可成功建库
- 平台核心表可迁移
- 实验元数据可同步进 `labs` 与 `lab_variants`

## 阶段 F：建立 nginx 与本机运行约定

### 目标

明确本机开发和 build 后部署的运行方式。

### 产出

- `nginx/`
  - 本机静态托管示例配置
  - API 反向代理示例配置
- 运行说明文档

### 要点

- 前端 dev 和 build 后运行都要有口径
- 后端端口、前端端口、代理前缀要统一约定

### 完成标准

- 前端本地开发可跑
- 前端 build 后理论上可通过 nginx 托管
- API 代理路径明确定义

## 阶段 G：建立一期实验目录骨架

### 目标

把一期实验目录和脚本目录全部建立，但先不强行全部实现业务逻辑。

### 产出

- `labs/web/...`
- `labs/auth/...`
- `tools/lab-scripts/web/...`
- `tools/lab-scripts/auth/...`

每个实验目录至少包含：

- `meta.json`
- `README.md`
- `vuln/`
- `fixed/`
- `mock/`
- `docs/`

### 要点

- 先让一期实验有稳定目录与注册入口
- 再逐个补内容

### 完成标准

- 一期实验目录结构全部存在
- 平台能扫描到这些实验

## 阶段 H：先打通一个纵向样板实验

### 目标

先做一个最小但完整的样板实验，验证整个平台模式成立。

### 推荐样板

- 第一优先：`web/xss`

### 原因

- 前后端交互直观
- 能体现漏洞版 / 修复版差异
- 不需要一开始就引入过多复杂数据库逻辑
- 适合作为元数据、列表、详情、记录、验证的第一条打通链路

### 产出

- `labs/web/xss/` 完整实验目录
- 前端 XSS 实验页面
- 后端相关接口
- 记录学习与验证结果的最小链路
- 至少一条自动化验证

### 完成标准

- 前端可进入漏洞版与修复版
- 用户可观察到效果差异
- 平台能记录一次学习行为
- 平台能记录一次验证结果

## 阶段 I：扩展到第一批高优先级实验

### 范围

在 XSS 跑通后，按以下顺序扩展：

1. `csrf`
2. `file-upload`
3. `path-traversal`
4. `sql-injection`
5. `command-injection`
6. `brute-force`
7. `session-fixation`
8. `jwt`
9. `privilege-escalation`
10. `idor`

### 原则

- 先 Web 基础，再认证授权，再更依赖数据库和脚本的场景
- 每新增一个实验，都必须补：
  - `meta.json`
  - 文档
  - 至少一种验证方式

## 6. 当前不建议直接做的事

- 不建议一开始就同时实现 15 个实验的业务逻辑
- 不建议一开始就搭复杂权限系统
- 不建议一开始就追求完整 UI 视觉
- 不建议先写大量实验脚本再补平台骨架
- 不建议跳过 `meta.json` 和数据库基础表直接写 demo

## 7. 实施阶段的最小验证规则

每推进一个阶段，至少做对应最小验证：

- 阶段 B：确认 workspace 结构和脚本可识别
- 阶段 C：确认前后端都能启动
- 阶段 D：确认实验索引可读取
- 阶段 E：确认 MySQL 与平台核心迁移可运行
- 阶段 F：确认本机代理路径口径一致
- 阶段 G：确认实验目录能被扫描
- 阶段 H：确认样板实验跑通漏洞版 / 修复版差异

## 8. TODO 联动要求

后续每进入一个实施阶段，必须同步更新 `docs/TODO.md`：

1. 项目级阶段状态
2. 文档与设计项状态
3. 工程骨架项状态
4. 对应实验的“当前落点”
5. 已开始实现的攻击类型状态

## 9. 当前结论

现在可以正式从“文档规划期”进入“实施规划期”。

最合理的推进顺序不是直接写漏洞代码，而是：

1. 先补自动化测试规划文档
2. 再建 monorepo 与应用骨架
3. 再建元数据驱动与数据库基础能力
4. 再以 `web/xss` 为第一条纵向样板链路打通
5. 最后再复制模式到其余高优先级实验

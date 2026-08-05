# LT-021 API 功能级授权（BFLA）专用实验执行文档

## 1. 目标

按照 `SECURITY-COVERAGE-LONG-TERM-GOAL.md` 阶段 3、任务 `LT-021` 和设计文档 `docs/design/api-and-business-logic-labs.md` 第 5.1 节，新增 API 功能级授权（BFLA）专用交互实验（深度 D4）。这是**新增实验**（不是把现有引导式毕业），落地在新的 `api` 分类下。

实验用 `LT-005` 建立的第二版共享状态机驱动两步固定决策：先选择身份角色校验策略，再选择管理员专属操作的处置方式，观察普通用户越权执行管理功能与服务端功能级授权的差异。

模式为 `interactive`，`ready` 只代表本项目内固定学习闭环可运行、可观察、可验证，不代表具备对外攻击能力。

## 2. 范围

### 2.1 本轮实施

- 新增 `api` 分类：`labs/api/functional-authorization/` 标准目录、`meta.json`、README、vuln/fixed/mock 说明、attack-steps、fix-notes、manual-verification。
- 在 `apps/server/src/services/lab-metadata-sync.ts` 的 `categoryProfiles` 与 `apps/web/src/views/LabsView.vue` 的 `categoryTitles` 注册 `api` 分类。
- 新增后端专用服务 `apps/server/src/services/bfla-lab.ts`（基于第二版状态机的固定案例 `privileged-operation-request`）。
- 在 `apps/server/src/app.ts` 注册服务与专用路由：
  - `GET /api/labs/api/functional-authorization/workbench`
  - `POST /api/labs/api/functional-authorization/:variant/evaluate`
  - 两条路由位于通用 `/:category/:scene/...` 路由之前。
- 新增前端 `apps/web/src/api/bfla-lab.ts`、`apps/web/src/labs/bfla.ts`、`BflaLabView.vue`，专用 vuln/fixed 路由置于通用 catch-all 之前。
- 新增独立 `tools/lab-scripts/api/functional-authorization/verify.ts` 只读一致性验证与 `README.md`。
- 新增后端 API 测试与前端接口测试。
- 更新覆盖矩阵（新增 API 分类小节与该行）、计数断言（65→66、专用 34→35、interactive 23→24）。

### 2.2 明确不做

- 不修改第二版共享模型 `guided-scenarios-v2.js` 的语义。
- 不新建与 `auth.idor`（对象级授权 BOLA）同义的实验；本实验聚焦功能级授权（BFLA）。
- 不修改真实账户、角色或数据库；只使用固定虚构用户与操作枚举。
- 不新增自由正文、真实凭据、系统路径或外部连接字段。

## 3. 设计要点

### 3.1 固定案例与状态机

固定案例 `privileged-operation-request`，两步状态机：

1. `identity-check`（身份角色校验策略）：
   - `trust-client-side-hiding`（risk，accepted，`api-functional-authorization-check-open`，进入操作处置）。
   - `enforce-server-side-authorization`（fix，blocked，`api-functional-authorization-check-enforced`，进入操作处置）。
2. `operation-decision`（操作处置决策）：
   - `execute-privileged-operation`（risk，accepted，`api-functional-authorization-risk-accepted`，终止）。
   - `defense-blocks-unauthorized-operation`（fix，blocked，`api-functional-authorization-defense-blocked`，终止）。
   - `allow-verified-admin-operation`（normal，accepted，`api-functional-authorization-normal-verified`，终止）。

三个 canonical 终止信号与实验元数据 `expectedSignals` 一致。

### 3.2 评估契约

评估请求体只接受固定字段：`scenarioKey`（固定案例 key）和 `decisions`（有序 option key 数组）。服务把决策路径逐步喂给第二版状态机；任一未登记 caseKey/optionKey 脱敏阻断，不推进状态、不回显原始输入。

### 3.3 事件日志

评估结果写入统一 `lab_event_logs`，只记录固定案例 key、终止信号、决策、结果计数和风险等级，不记录原始未知输入或自由文本。

## 4. 安全边界

- 全部数据为固定虚构用户与操作枚举，状态机只在已登记 key 之间转移。
- 未知 scenarioKey / optionKey 一律脱敏阻断，不回显原始输入。
- 专用路由严格置于通用 catch-all 之前，不影响引导式场景。
- 事件日志只保存计算后的安全摘要。
- 不修改真实账户或角色，不提供可迁移的越权攻击载荷。

## 5. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 新增分类破坏计数与统计 | 元数据、注册表、页面不一致 | 同步更新 categoryProfiles、categoryTitles、覆盖矩阵和全部计数断言 |
| 专用路由吞掉通用路由 | 引导式场景回归 | 专用路由限定精确路径且置于通用路由之前，测试覆盖通用场景仍可用 |
| 与 auth.idor 同义 | 重复主题 | 本实验聚焦功能级授权（BFLA），与对象级授权（BOLA）区分 |
| 未知输入写入日志 | 敏感数据风险 | 状态机脱敏阻断且事件日志只输出安全摘要 |

## 6. 验证方式

- `pnpm test:server`（含新增 bfla API 测试）。
- `pnpm test:web`（含新增前端接口测试）。
- `pnpm test:shared`（引导式目录计数回归，应仍为 31）。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/api/functional-authorization/verify.ts`。
- `pnpm test:coverage`（65→66、专用 35、interactive 24）。
- `pnpm typecheck`（前后端）。
- `git diff --check` 和行尾空白检查。

## 7. 完成条件

- 新增 `api.functional-authorization` 实验可访问，专用 workbench 与评估 API 可用，引导式场景不回归。
- 三条固定路径分别产生三个 canonical 信号。
- 未知 key 脱敏阻断且不回显原始输入。
- 事件日志只包含安全摘要。
- 元数据、分类注册、路由、API、文档、脚本、覆盖矩阵和计数断言一致。
- 相关测试、类型检查和只读验证通过。

## 8. 验证结果

（实施后回填）

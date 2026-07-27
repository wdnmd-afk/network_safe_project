# LT-009 专用化 auth.session-hijacking 执行文档

## 1. 目标

按照 `SECURITY-COVERAGE-LONG-TERM-GOAL.md` 阶段 2 和任务队列 `LT-009`，把当前走通用引导式工作台的 `auth.session-hijacking` 升级为专用交互实验（深度 D4）。专用实验用 `LT-005` 的第二版共享状态机驱动两步决策：先选择会话上下文绑定策略，再选择会话处置方式，逐步观察漏洞路径与防御路径的判定差异。

本实验模式仍为 `interactive`，状态达到 `ready` 只代表本项目内固定学习闭环可运行、可观察、可验证，不代表具备对外攻击能力。

## 2. 范围

### 2.1 本轮实施

- 新增后端专用服务 `apps/server/src/services/session-hijacking-lab.ts`，基于第二版状态机构造固定案例 `replayed-session-summary`。
- 在 `apps/server/src/app.ts` 注册服务，新增专用路由，置于通用 `/:category/:scene/...` 路由之前：
  - `GET /api/labs/auth/session-hijacking/workbench`
  - `POST /api/labs/auth/session-hijacking/:variant/evaluate`
- 新增前端 `apps/web/src/api/session-hijacking-lab.ts`、`apps/web/src/labs/session-hijacking.ts` 和 `SessionHijackingLabView.vue`，专用 vuln/fixed 路由置于通用 catch-all 之前。
- `auth.session-hijacking` 从引导式目录毕业为专用实现；覆盖矩阵行由 D2 引导式改为 D4 专用交互。
- 更新 meta.json、README、攻防文档、手工验证文档、exploit.py 决策路径契约，`verify.ts` 改为独立只读一致性验证。
- 新增服务端 API 测试和前端接口测试。

### 2.2 明确不做

- 不修改第二版共享模型语义，不修改其他引导式场景或既有专用实验。
- 不新增自由正文、真实凭据、Cookie、token、系统路径或外部连接字段。
- 不读取真实会话、真实设备指纹或真实用户上下文。

## 3. 设计要点

### 3.1 固定案例与状态机

固定案例 `replayed-session-summary`，两步状态机：

1. `context-binding`（上下文绑定策略）：
   - `trust-long-lived-session`（risk，accepted，`auth-session-hijacking-context-open`，进入会话处置）。
   - `bind-session-context`（fix，blocked，`auth-session-hijacking-context-bound`，进入会话处置）。
2. `session-decision`（会话处置决策）：
   - `accept-replayed-session`（risk，accepted，`auth-session-hijacking-risk-accepted`，终止）。
   - `defense-blocks-replayed-session`（fix，blocked，`auth-session-hijacking-defense-blocked`，终止）。
   - `allow-reauthenticated-session`（normal，accepted，`auth-session-hijacking-normal-verified`，终止）。

三个 canonical 终止信号与既有元数据 `expectedSignals` 保持一致，保证向后兼容。

### 3.2 评估契约

评估请求体只接受固定字段：`scenarioKey` 和有序 `decisions` 决策路径。服务把决策路径逐步喂给第二版状态机；任一未登记 caseKey/optionKey 脱敏阻断，不推进状态、不回显原始输入。

### 3.3 事件日志

评估结果写入统一 `lab_event_logs`，只记录固定案例 key、终止信号、决策、结果计数和风险等级，不记录原始未知输入或自由文本。

## 4. 安全边界

- 全部数据为固定虚构脱敏会话摘要，状态机只在已登记 key 之间转移。
- 未知 scenarioKey / optionKey 一律脱敏阻断，不回显原始输入。
- 专用路由严格置于通用 catch-all 之前，不影响其余引导式场景。
- 事件日志只保存计算后的安全摘要。
- 不读取真实会话、Cookie、token 或设备指纹。

## 5. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 专用路由吞掉通用路由 | 其他引导式场景回归 | 专用路由限定精确路径且置于通用路由之前，并用测试覆盖通用场景仍可用 |
| canonical 信号漂移 | 手工验证与 exploit.py 失效 | 状态机保留三个既有终止信号并用测试断言 |
| 未知输入写入日志 | 敏感数据风险 | 状态机脱敏阻断且事件日志只输出安全摘要 |
| 毕业后覆盖统计不一致 | 无法审计 | 同步更新 guided 目录、coverage 测试、矩阵行并回归 |

## 6. 验证方式

- `pnpm test:server`（含新增 session-hijacking API 测试）。
- `pnpm test:web`（含新增前端接口测试）。
- `pnpm test:shared`（引导式目录计数回归）。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/auth/session-hijacking/verify.ts`。
- `pnpm test:coverage` 与 `pnpm test:guided`。
- 前后端 TypeScript 类型检查。
- `git diff --check` 和行尾空白检查。

## 7. 完成条件

- 专用 workbench 与评估 API 可用，通用引导式场景不回归。
- 漏洞路径、防御拦截路径和正常再认证路径分别产生三个 canonical 信号。
- 未知 key 脱敏阻断且不回显原始输入。
- 事件日志只包含安全摘要。
- 元数据、路由、API、文档、脚本和验证入口一致。
- 相关测试、类型检查和只读验证通过。

## 8. 验证结果

- 服务端：258/258 通过（含新增 session-hijacking API 测试）。
- 前端：241/241 通过（69 文件，含新增前端接口测试）。
- 共享包：51/51 通过（引导式目录 35→34 计数回归）。
- 覆盖矩阵测试通过：专用 31、引导式 34、模式 23/15/27、Playwright 10。
- `pnpm test:guided` 34/34 通过。
- 专用 `verify.ts` 输出 `ok: true`。
- 前后端 TypeScript 类型检查通过；`git diff --check` 与行尾空白检查干净。
- session-hijacking 从引导式目录毕业为 D4 专用交互，三个 canonical 信号保持不变。

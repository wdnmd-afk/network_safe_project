# LT-010 专用化 auth.oauth 执行文档

## 1. 目标

按照 `SECURITY-COVERAGE-LONG-TERM-GOAL.md` 阶段 2 和任务队列 `LT-010`，把当前走通用引导式工作台的 `auth.oauth` 升级为专用交互实验（深度 D4）。专用实验用 `LT-005` 建立的第二版共享状态机驱动两步决策：先选择授权请求绑定策略，再选择授权响应处置方式，逐步观察漏洞路径与防御路径的判定差异。

本实验模式仍为 `interactive`，状态达到 `ready` 只代表本项目内固定学习闭环可运行、可观察、可验证，不代表具备对外攻击能力。

## 2. 范围

### 2.1 本轮实施

- 新增后端专用服务 `apps/server/src/services/oauth-lab.ts`，基于第二版状态机构造固定案例 `tampered-authorization-response`。
- 在 `apps/server/src/app.ts` 注册服务，新增专用路由（置于通用 catch-all 之前）：
  - `GET /api/labs/auth/oauth/workbench`
  - `POST /api/labs/auth/oauth/:variant/evaluate`
- 新增前端 `apps/web/src/api/oauth-lab.ts`、`apps/web/src/labs/oauth.ts` 和 `OauthLabView.vue`，专用 vuln/fixed 路由置于 catch-all 之前。
- 将 `auth.oauth` 从引导式共享目录毕业（移出 `guided-scenarios.js`），覆盖矩阵改为 D4 专用交互。
- 更新 meta.json、README、攻防文档、手工验证文档、exploit.py 决策路径契约和独立 verify.ts。
- 新增后端 API 测试和前端接口测试。

### 2.2 明确不做

- 不修改第二版共享模型语义。
- 不修改其他引导式场景或既有专用实验。
- 不新增自由正文、真实令牌、授权码、凭据或外部 IdP 连接字段。

## 3. 设计要点

### 3.1 固定案例与状态机

固定案例 `tampered-authorization-response`，两步状态机：

1. `authorization-binding`（授权绑定策略）：
   - `trust-unbound-authorization`（risk，accepted，`auth-oauth-binding-open`，进入授权响应）。
   - `enforce-pkce-and-state`（fix，blocked，`auth-oauth-binding-enforced`，进入授权响应）。
2. `response-decision`（授权响应决策）：
   - `accept-tampered-response`（risk，accepted，`auth-oauth-risk-accepted`，终止）。
   - `defense-blocks-tampered-response`（fix，blocked，`auth-oauth-defense-blocked`，终止）。
   - `allow-verified-authorization`（normal，accepted，`auth-oauth-normal-verified`，终止）。

三个 canonical 终止信号与既有元数据 `expectedSignals` 保持一致。

### 3.2 评估契约

评估请求体只接受固定字段：`scenarioKey` 和有序 `decisions`。服务逐步喂给第二版状态机；未登记 caseKey/optionKey 脱敏阻断，不推进状态、不回显原始输入。

### 3.3 事件日志

评估结果写入统一 `lab_event_logs`，只记录固定案例 key、终止信号、决策、结果计数和风险等级。

## 4. 安全边界

- 全部数据为固定虚构内容，状态机只在已登记 key 之间转移。
- 未知 scenarioKey / optionKey 一律脱敏阻断，不回显原始输入。
- 专用路由严格置于通用 catch-all 之前，不影响其余引导式场景。
- 不提供真实授权码、令牌、外部 IdP 连接或可迁移攻击载荷。

## 5. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 专用路由吞掉通用路由 | 其他引导式场景回归 | 专用路由限定精确路径且置于通用路由之前，并用测试覆盖通用场景仍可用 |
| canonical 信号漂移 | 手工验证与 exploit.py 失效 | 状态机保留三个既有终止信号并用测试断言 |
| 毕业后计数不一致 | 覆盖矩阵审计失败 | 同步更新引导式目录、覆盖矩阵、覆盖测试与共享测试计数 |
| 未知输入写入日志 | 敏感数据风险 | 状态机脱敏阻断且事件日志只输出安全摘要 |

## 6. 验证方式

- `pnpm test:server`（含新增 oauth API 测试）。
- `pnpm test:web`（含新增前端接口测试）。
- `pnpm test:shared`（引导式目录计数回归）。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/auth/oauth/verify.ts`。
- `pnpm test:coverage` 与 `pnpm test:guided`。
- 前后端 TypeScript 类型检查。
- `git diff --check` 和行尾空白检查。

## 7. 完成条件

- 专用 workbench 与评估 API 可用，通用引导式场景不回归。
- 漏洞路径、防御拦截路径和正常授权路径分别产生三个 canonical 信号。
- 未知 key 脱敏阻断且不回显原始输入。
- 事件日志只包含安全摘要。
- 元数据、路由、API、文档、脚本和验证入口一致。
- 相关测试、类型检查和只读验证通过。

## 8. 验证结果

- 服务端：267 项测试通过（含新增 oauth API 测试），失败 0。
- 前端：70 个测试文件、244 项测试通过（含新增 oauth 接口测试）。
- 共享包：51 项测试通过（引导式目录 34→33 计数回归）。
- 覆盖矩阵测试通过：专用 32、引导式 33，与真实元数据一致。
- `pnpm test:guided`：33/33 引导式场景只读验证通过。
- 专用 `verify.ts`：`ok: true`，元数据/入口/信号/边界一致。
- 前后端 TypeScript 类型检查通过；`git diff --check` 与行尾空白检查干净。
- `auth.oauth` 从引导式目录毕业为 D4 专用交互，三个 canonical 信号（risk-accepted / defense-blocked / normal-verified）保持不变。

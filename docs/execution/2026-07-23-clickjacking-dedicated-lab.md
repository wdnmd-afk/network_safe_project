# LT-006 专用化 web.clickjacking 执行文档

## 1. 目标

按照 `SECURITY-COVERAGE-LONG-TERM-GOAL.md` 阶段 2 和任务队列 `LT-006`，把当前走通用引导式工作台的 `web.clickjacking` 升级为专用交互实验（深度 D4）。专用实验用 `LT-005` 建立的第二版共享状态机驱动多步骤交互：先选择框架嵌入策略，再选择敏感动作确认策略，逐步观察漏洞路径与防御路径的判定差异。

本实验模式仍为 `interactive`，状态达到 `ready` 只代表本项目内固定学习闭环可运行、可观察、可验证，不代表具备对外攻击能力。

## 2. 范围

### 2.1 本轮实施

- 新增后端专用服务 `apps/server/src/services/clickjacking-lab.ts`，基于第二版状态机构造固定案例 `embedded-approval-overlay`。
- 在 `apps/server/src/app.ts` 注册服务，新增专用路由：
  - `GET /api/labs/web/clickjacking/workbench`（专用工作台配置）。
  - `POST /api/labs/web/clickjacking/:variant/evaluate`（专用固定决策路径评估）。
  - 两条路由必须位于通用 `/:category/:scene/...` 路由之前。
- 新增前端 `apps/web/src/api/clickjacking-lab.ts`、`apps/web/src/labs/clickjacking.ts` 和 `ClickjackingLabView.vue`。
- 在 `apps/web/src/router/routes.ts` 增加专用 vuln/fixed 路由，位于通用 catch-all 之前。
- 更新 `labs/web/clickjacking/meta.json`、README、攻防文档、手工验证文档，反映专用多步骤交互与固定决策路径。
- 更新 `tools/lab-scripts/web/clickjacking/exploit.py` 请求体为固定决策路径。
- 新增后端 API 测试和前端组件/接口测试。

### 2.2 明确不做

- 不修改第二版共享模型 `guided-scenarios-v2.js` 的语义。
- 不修改其他 37 个引导式场景或 27 个既有专用实验。
- 不新增自由正文、真实目标、凭据、系统路径或外部连接字段。
- 不新增真实框架嵌入、真实审批动作或可迁移到外部站点的攻击载荷。

## 3. 设计要点

### 3.1 固定案例与状态机

固定案例 `embedded-approval-overlay`，两步状态机：

1. `frame-policy`（框架策略）：
   - `allow-any-origin-framing`（risk，accepted，`web-clickjacking-frame-open`，进入敏感动作）。
   - `enforce-frame-ancestors`（fix，blocked，`web-clickjacking-frame-restricted`，进入敏感动作）。
2. `sensitive-action`（敏感动作确认）：
   - `execute-without-confirmation`（risk，accepted，`web-clickjacking-risk-accepted`，终止）。
   - `defense-intercepts-clickjacked-action`（fix，blocked，`web-clickjacking-defense-blocked`，终止）。
   - `require-explicit-confirmation`（normal，accepted，`web-clickjacking-normal-verified`，终止）。

三个 canonical 终止信号与既有元数据 `expectedSignals` 保持一致，保证向后兼容。

### 3.2 评估契约

评估请求体只接受固定字段：`scenarioKey`（固定案例 key）和 `decisions`（有序 option key 数组）。服务把决策路径逐步喂给第二版状态机；任一未登记 caseKey/optionKey 脱敏阻断，不推进状态、不回显原始输入。响应返回每步结果、终止信号、结果计数、评分和安全复盘。

### 3.3 事件日志

评估结果写入统一 `lab_event_logs`，只记录固定案例 key、终止信号、决策、结果计数和风险等级，不记录原始未知输入或自由文本。

## 4. 安全边界

- 全部数据为固定虚构内容，状态机只在已登记 key 之间转移。
- 未知 scenarioKey / optionKey 一律脱敏阻断，不回显原始输入。
- 专用路由严格置于通用 catch-all 之前，不影响其余 37 个引导式场景。
- 事件日志只保存计算后的安全摘要。
- 不提供真实框架嵌入、跨站脚本或可迁移攻击载荷。

## 5. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 专用路由吞掉通用路由 | 其他引导式场景回归 | 专用路由限定精确路径且置于通用路由之前，并用测试覆盖通用场景仍可用 |
| canonical 信号漂移 | 手工验证与 exploit.py 失效 | 状态机保留三个既有终止信号并用测试断言 |
| 未知输入写入日志 | 敏感数据风险 | 状态机脱敏阻断且事件日志只输出安全摘要 |
| 多步骤实现破坏元数据一致性 | 无法审计 | 同步更新 meta.json、文档、脚本和验证入口，并用 verify 与共享测试校验 |

## 6. 验证方式

- `pnpm test:server`（含新增 clickjacking API 测试）。
- `pnpm test:web`（含新增前端组件与接口测试）。
- `pnpm test:shared`（第二版状态机回归）。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/clickjacking/verify.ts`。
- 前后端 TypeScript 类型检查。
- `git diff --check` 和行尾空白检查。
- 安全关键词扫描，确认没有外部连接、真实凭据读取、命令执行或攻击载荷。

## 7. 完成条件

- 专用 workbench 与评估 API 可用，通用引导式场景不回归。
- 漏洞路径、防御拦截路径和正常确认路径分别产生三个 canonical 信号。
- 未知 key 脱敏阻断且不回显原始输入。
- 事件日志只包含安全摘要。
- 元数据、路由、API、文档、脚本和验证入口一致。
- 相关测试、类型检查和只读验证通过。

## 8. 验证结果

- 服务端：231/231 通过（含新增 10 项 clickjacking 专用 API 测试）。
- 前端：232/232 通过（66 个测试文件，含新增 3 项 clickjacking 接口测试）。
- 共享包：51/51 通过（引导式目录 38→37，第二版状态机回归）。
- 引导式全量只读验证：37/37 通过（clickjacking 已移出引导式目录）。
- 覆盖矩阵测试通过：专用 27→28、引导式 38→37，模式仍为 23/15/27。
- clickjacking 独立 `verify.ts`：11 项一致性检查全部通过。
- 前后端 TypeScript 类型检查通过；`git diff --check` 干净。

### 8.1 架构决策：clickjacking 从引导式目录毕业

专用化（D4）意味着 clickjacking 不再属于通用引导式目录（D2）。覆盖验证器以「是否在引导式目录」判定深度等级，因此本轮将 `web.clickjacking` 从 `packages/shared/src/guided-scenarios.js` 移除，并同步：

- 引导式目录与第二版测试改用 `web.open-redirect` / `auth.oauth` 作为查询样例。
- 服务端与前端引导式测试的固定样例改用仍在目录内的场景。
- 覆盖矩阵文档将 `web.clickjacking` 行从 `D2 引导式` 升级为 `D4 专用交互`。
- 覆盖矩阵测试断言更新为专用 28、引导式 37。
- clickjacking `verify.ts` 从通用引导式验证器改为独立一致性验证器。

通用引导式工作台路由和其余 37 个引导式场景行为保持不变，已由服务端、前端和 Playwright 测试确认无回归。

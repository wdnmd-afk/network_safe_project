# LT-016 专用化 client.formjacking 执行文档

## 1. 目标

按照 `SECURITY-COVERAGE-LONG-TERM-GOAL.md` 阶段 5 和任务队列 `LT-016`，把当前走通用引导式工作台的 `client.formjacking` 升级为专用模拟实验（深度 D3）。专用实验用 `LT-005` 建立的第二版共享状态机驱动两步骤交互：先选择第三方脚本信任策略，再选择表单提交目标处置策略，逐步观察漏洞路径与防御路径的判定差异。

本实验模式仍为 `simulation`，状态达到 `ready` 只代表本项目内固定学习闭环可运行、可观察、可验证，不代表具备对外攻击能力。

## 2. 范围

### 2.1 本轮实施

- 新增后端专用服务 `apps/server/src/services/formjacking-lab.ts`，基于第二版状态机构造固定案例 `synthetic-checkout-target-change`。
- 在 `apps/server/src/app.ts` 注册服务，新增专用路由（位于通用 catch-all 之前）：
  - `GET /api/labs/client/formjacking/workbench`
  - `POST /api/labs/client/formjacking/:variant/evaluate`
- 新增前端 `apps/web/src/api/formjacking-lab.ts`、`apps/web/src/labs/formjacking.ts` 和 `FormjackingLabView.vue`，专用 vuln/fixed 路由置于通用 catch-all 之前。
- 更新 `labs/client/formjacking/meta.json`、README、攻防文档、手工验证文档，反映专用两步骤模拟。
- 更新 `tools/lab-scripts/client/formjacking/verify.ts` 为独立只读一致性验证。
- 从引导式共享目录移除 `client.formjacking`（毕业为专用实现）。
- 新增后端 API 测试和前端接口测试。

### 2.2 明确不做

- 不修改第二版共享模型 `guided-scenarios-v2.js` 的语义。
- 不修改其他引导式场景或既有专用实验。
- 不提供 `exploit.py`（simulation 不提供攻击脚本）。
- 不注入真实页面、不采集真实表单数据、不新增外部连接字段。

## 3. 设计要点

### 3.1 固定案例与状态机

固定案例 `synthetic-checkout-target-change`，两步状态机：

1. `script-trust`（第三方脚本信任策略）：
   - `trust-unpinned-third-party-script`（risk，accepted，`client-formjacking-script-open`，进入目标决策）。
   - `enforce-csp-sri-allowlist`（fix，blocked，`client-formjacking-script-restricted`，进入目标决策）。
2. `submit-target`（表单提交目标决策）：
   - `accept-tampered-submit-target`（risk，accepted，`client-formjacking-risk-accepted`，终止）。
   - `defense-blocks-tampered-target`（fix，blocked，`client-formjacking-defense-blocked`，终止）。
   - `submit-to-verified-first-party-target`（normal，accepted，`client-formjacking-normal-verified`，终止）。

三个 canonical 终止信号与既有元数据 `expectedSignals` 保持一致，保证向后兼容。

### 3.2 评估契约

评估请求体只接受固定字段：`scenarioKey` 和有序 `decisions` 决策路径。服务把决策路径逐步喂给第二版状态机；任一未登记 caseKey/optionKey 脱敏阻断，不推进状态、不回显原始输入。

### 3.3 事件日志

评估结果写入统一 `lab_event_logs`，只记录固定案例 key、终止信号、决策、结果计数和风险等级，不记录原始未知输入、真实表单字段或提交目标。

## 4. 安全边界

- 全部数据为固定虚构内容，状态机只在已登记 key 之间转移。
- 未知 scenarioKey / optionKey 一律脱敏阻断，不回显原始输入。
- 专用路由严格置于通用 catch-all 之前，不影响其余引导式场景。
- 事件日志只保存计算后的安全摘要。
- 不注入真实页面、不采集真实表单数据、不提供可迁移攻击载荷。

## 5. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 专用路由吞掉通用路由 | 其他引导式场景回归 | 专用路由限定精确路径且置于通用路由之前，并用测试覆盖通用场景仍可用 |
| canonical 信号漂移 | 手工验证失效 | 状态机保留三个既有终止信号并用测试断言 |
| 未知输入写入日志 | 敏感数据风险 | 状态机脱敏阻断且事件日志只输出安全摘要 |
| 毕业后计数不一致 | 无法审计 | 同步更新引导式目录计数、覆盖矩阵、coverage 测试和 guided-all |

## 6. 验证方式

- `pnpm test:server`（含新增 formjacking API 测试）。
- `pnpm test:web`（含新增前端接口测试）。
- `pnpm test:shared`（引导式目录计数回归）。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/client/formjacking/verify.ts`。
- `pnpm test:coverage` 与 `pnpm test:guided`。
- 前后端 TypeScript 类型检查。
- `git diff --check` 和行尾空白检查。

## 7. 完成条件

- 专用 workbench 与评估 API 可用，通用引导式场景不回归。
- 漏洞路径、防御拦截路径和正常提交路径分别产生三个 canonical 信号。
- 未知 key 脱敏阻断且不回显原始输入。
- 事件日志只包含安全摘要。
- 元数据、路由、API、文档、脚本和验证入口一致；coverage 矩阵与计数同步。
- 相关测试、类型检查和只读验证通过。

## 8. 验证结果

- 服务端：276 项测试通过（含新增 formjacking API/服务测试）。
- 前端：71 个测试文件、247 项测试通过（含新增 formjacking 接口测试）。
- 共享包：51 项测试通过（引导式目录 33→32，formjacking 已毕业）。
- `pnpm test:coverage` 通过：专用 33、引导式 32，模式计数不变（simulation 15）。
- `pnpm test:guided` 32/32 通过。
- 专用 `verify.ts` 输出 `ok: true`（含 no-exploit-script 检查）。
- 前后端 TypeScript 类型检查通过。
- `git diff --check` 与行尾空白检查通过。
- 三个 canonical 信号（risk-accepted / defense-blocked / normal-verified）保持不变。

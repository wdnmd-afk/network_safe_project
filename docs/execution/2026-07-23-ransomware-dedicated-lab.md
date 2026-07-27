# LT-017 升级 malware.ransomware 为专用证据分析实验执行文档

## 1. 目标

按照 `SECURITY-COVERAGE-LONG-TERM-GOAL.md` 阶段 5 和任务队列 `LT-017`，把当前走通用引导式工作台的 `malware.ransomware` 升级为专用证据分析实验。专用实验用 `LT-005` 的第二版共享状态机驱动两步证据分析：先选择异常文件行为的关联策略，再选择主机处置决策，逐步观察漏洞路径、防御拦截路径和正常恢复路径的判定差异。

本实验模式仍为 `case-study`，是高风险主题的案例化例外：只展示固定行为时间线和防御决策，`supportsAutomation` 保持 `false`，不提供 exploit.py、攻击脚本、外部连接或真实样本。状态达到 `ready` 只代表本项目内固定案例学习闭环可运行、可观察、可验证。

## 2. 范围

### 2.1 本轮实施

- 新增后端专用服务 `apps/server/src/services/ransomware-lab.ts`，基于第二版状态机构造固定案例 `synthetic-encryption-behavior`。
- 在 `apps/server/src/app.ts` 注册服务，新增专用路由，置于通用 catch-all 之前。
- 新增前端 API client、labs 展示模块、专用视图和路由。
- 更新元数据 apiTest 指向专用测试；更新 README、攻防文档、手工验证文档为两步证据分析模型。
- 新增后端 API 测试和前端接口测试；把 ransomware 从引导式目录毕业到专用。

### 2.2 明确不做

- 不修改第二版共享模型语义。
- 不新增 exploit.py、攻击脚本、真实样本、外部连接或可迁移攻击载荷。
- `supportsAutomation` 保持 `false`；notes 保留 case-study ready 例外与"不提供 exploit.py"声明。
- 不改动其他实验。

## 3. 设计要点

### 3.1 固定案例与状态机

固定案例 `synthetic-encryption-behavior`，两步证据分析状态机：

1. `behavior-correlation`（行为关联策略）：
   - `ignore-anomalous-file-behavior`（risk，accepted，`malware-ransomware-correlation-open`，进入处置决策）。
   - `correlate-and-detect-behavior`（fix，blocked，`malware-ransomware-correlation-enabled`，进入处置决策）。
2. `containment-decision`（主机处置决策）：
   - `allow-unrestricted-encryption`（risk，accepted，`malware-ransomware-risk-accepted`，终止）。
   - `isolate-and-block-host`（fix，blocked，`malware-ransomware-defense-blocked`，终止）。
   - `restore-from-offline-backup`（normal，accepted，`malware-ransomware-normal-verified`，终止）。

三个 canonical 终止信号与既有元数据 `expectedSignals` 保持一致。

### 3.2 评估契约与事件日志

评估请求体只接受固定 `scenarioKey` 和有序 `decisions`。任一未登记 key 脱敏阻断，不推进状态、不回显原始输入。评估结果写入统一 `lab_event_logs`，只记录固定案例 key、终止信号、决策、结果计数和风险等级。

## 4. 安全边界

- 全部数据为固定虚构行为时间线，不创建、下载或执行真实恶意样本。
- 状态机只在已登记 key 之间转移，未知 key 脱敏阻断。
- 专用路由严格置于通用 catch-all 之前，不影响其余引导式场景。
- `supportsAutomation` 保持 `false`，不提供 exploit.py 或真实攻击能力。

## 5. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 专用路由吞掉通用路由 | 其他引导式场景回归 | 专用路由限定精确路径且置于通用路由之前，并测试通用场景仍可用 |
| canonical 信号漂移 | 手工验证失效 | 状态机保留三个既有终止信号并用测试断言 |
| case-study 例外被破坏 | 越过高风险边界 | 保持 supportsAutomation:false、无 exploit.py、notes 保留例外声明 |
| 未知输入写入日志 | 敏感数据风险 | 状态机脱敏阻断且事件日志只输出安全摘要 |

## 6. 验证方式

- `pnpm test:server`（含新增 ransomware API 测试）。
- `pnpm test:web`（含新增前端接口测试）。
- `pnpm test:shared`（引导式目录计数回归）。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/malware/ransomware/verify.ts`。
- `pnpm test:coverage` 与 `pnpm test:guided`。
- 前后端 TypeScript 类型检查。
- `git diff --check` 和行尾空白检查。

## 7. 完成条件

- 专用 workbench 与评估 API 可用，通用引导式场景不回归。
- 漏洞路径、防御拦截路径和正常恢复路径分别产生三个 canonical 信号。
- 未知 key 脱敏阻断且不回显原始输入。
- `supportsAutomation` 保持 `false`，无 exploit.py。
- 元数据、路由、API、文档、脚本和验证入口一致。
- 相关测试、类型检查和只读验证通过。

## 8. 验证结果

（实施后回填）

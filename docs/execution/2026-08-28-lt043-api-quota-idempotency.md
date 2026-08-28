# LT-043 API 资源消耗与 Webhook 重放幂等固定实验执行文档

> 对应长期目标：`LT-043`
>
> 文档状态：进行中
>
> 创建时间：2026-08-28

## 1. 背景与目标

`SECURITY-COVERAGE-LONG-TERM-GOAL.md` 第 9.1 节中「资源消耗与限流」和「Webhook 签名与重放」两项仍为空白。第三轮审计后的队列把两者合并为 `LT-043`，要求「继续使用固定请求批次与内存状态机」。

`docs/design/api-and-business-logic-labs.md` 第 4 节已把「API 资源消耗与限流」定为 `api` 分类、`simulation` 模式、固定请求批次状态机；第 5.2 节锁定状态机为「无限流接受 → 触发配额 → 降级 / 阻断」，边界为「只使用内存计数与固定批次摘要，不发起真实并发请求」。

本任务把两个主题收敛为一个连贯场景：固定入站 Webhook 批次。漏洞版既不施加配额也不校验幂等键与时间戳，因此超额批次被全量接受且重复事件被重复处理；修复版同时施加配额、时间戳窗口与幂等键去重，阻断超额与重放，并证明配额内的正常批次仍可处理。

合并的理由是两者共享同一份固定请求批次数据与同一个计数模型，拆成两个实验会产生同义场景和重复的批次快照，违反「不重复创建同义主题」。

## 2. 范围

### 2.1 纳入范围

- 新实验 `api.rate-limit-idempotency`，复用现有 `api` 分类，不新增分类。
- 服务端专用服务：两份固定 Webhook 批次快照、确定性配额/重放审计纯函数、第二版两步状态机。
- 专用工作台 API 与漏洞版/修复版评估 API，只接受已登记 `scenarioKey` 与 `decisions`。
- 前端 API 客户端、变体配置模块、专用视图与置于通用 catch-all 之前的路由。
- 标准实验目录：`meta.json`、README、`vuln/`、`fixed/`、`mock/`、`docs/` 三份文档。
- 脚本目录 README 与独立只读 `verify.ts`。
- 统一事件日志安全摘要接入。
- 覆盖矩阵新增行与计数同步。
- 服务端专用测试与前端路由测试。

### 2.2 不纳入范围

- 不发起真实并发请求、压测、批量请求或任何外部 HTTP 调用。
- 不接入真实 Webhook 提供方、真实签名密钥或真实消息队列。
- 不实现可迁移到外部目标的请求泛洪器或重放工具。
- 不新增数据库表或字段。
- 不修改既有 75 个实验的行为。

## 3. 固定模型与字段来源

字段命名沿用 `LT-042` 建立的快照 + 审计计数结构（`apps/server/src/services/kubernetes-rbac-audit-lab.ts`），保持同类实验一致：

| 字段 | 语义枚举 | 说明 |
|---|---|---|
| `batchKey` | `virtual-*` | 固定批次标识，虚构值 |
| `quotaScope` | `unlimited` / `windowed-quota` | 是否施加固定时间窗配额 |
| `idempotencyScope` | `none` / `idempotency-key-required` | 是否要求幂等键去重 |
| `timestampScope` | `none` / `signed-window` | 是否校验签名时间戳窗口 |
| `degradeScope` | `none` / `throttle-then-degrade` | 超额后的降级策略 |
| `replayProcessedTwice` | boolean | 重复事件是否被重复处理 |
| `expectedPosture` | `vulnerable` / `hardened` | 固定姿态 |

审计计数与 `LT-042` 同构，避免新造口径：

- `findingCount`：固定 `findings` 数组长度。
- `criticalFindingCount`：只统计两类组合风险——「无配额且无降级」与「重复事件被重复处理」。
- `leastPrivilegeControlCount`：此处语义为「资源与重放控制数」，统计四项收敛控制（配额、幂等键、时间戳窗口、降级）是否成立。

固定案例键：`fixed-webhook-batch-quota-audit`。

两步决策（kebab-case，与既有实验一致）：

- 第一步 `webhook-batch-scope-assessment`：`accept-unthrottled-replayable-batch`（risk）/ `enforce-quota-and-idempotency`（fix）。
- 第二步 `webhook-batch-decision`：`approve-overload-and-replay`（risk）/ `block-overload-and-replay`（fix）/ `verify-throttled-baseline`（normal）。

三个 canonical 终止信号：

- `api-rate-limit-idempotency-risk-accepted`
- `api-rate-limit-idempotency-defense-blocked`
- `api-rate-limit-idempotency-normal-verified`

边界阻断信号：`api-rate-limit-idempotency-boundary-blocked`。

## 4. 实施步骤

1. 编写服务端专用服务，冻结两份批次快照并实现确定性审计纯函数与两步状态机。
2. 在 `apps/server/src/app.ts` 装配服务、挂载工作台与评估路由，位置在 `/api/labs/:category/:scene/workbench` 之前。
3. 接入统一事件日志，`inputSummary` 只写固定 key 与计数。
4. 编写前端 API 客户端、labs 配置模块、专用视图，并在通用 catch-all 之前注册两条路由。
5. 建立标准实验目录与七份文档，计数值以服务端实测输出为准。
6. 编写只读 `verify.ts`，反向核对元数据、入口、路由顺序、固定 key、文档一致性与禁用能力。
7. 编写服务端专用测试，覆盖三条 canonical 路径、未知 key 脱敏、登录校验与事件摘要。
8. 补前端路由测试断言。
9. 更新覆盖矩阵与所有硬编码计数断言（实验总数、变体数、API 入口数、模式与分类计数）。
10. 将专项验证注册进 `test:controlled` 门禁。
11. 运行专项验证与根级 `pnpm verify`。
12. 同步长期目标、TODO、README、AGENTS，回填本文档验收证据。

## 5. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 「限流」实验被误解为压测工具 | 越过安全边界 | 只用内存计数与固定批次摘要，不发起任何真实请求；验证器扫描禁用运行能力 |
| 与 `business-logic.race-condition` 主题重叠 | 产生同义实验 | race-condition 聚焦库存版本与双扣；本实验聚焦入站配额、时间戳窗口与幂等键去重，不复用其状态机 |
| 审计计数字段名新造 | 与同类实验口径不一致 | 沿用 `LT-042` 的 `findingCount` / `criticalFindingCount` / `leastPrivilegeControlCount` 三元组 |
| 文档写入未实测的计数值 | 文档与实现漂移 | 先运行服务端实测输出，再据实测值写文档 |
| 硬编码计数断言遗漏 | 根级门禁失败 | 按 `LT-042` 已知清单逐项更新：lab-registry、health、api-entrypoint-consistency、coverage-matrix |
| 前后端字段名不一致 | 类型检查失败 | 服务端类型为唯一真值来源，前端类型逐字段对照后再写视图 |
| 事件日志写入原始输入 | 敏感数据风险 | `inputSummary` 只允许固定 key、计数、终止结果与信号 |

## 6. 安全边界

- 只使用服务端内存中的两份虚构 Webhook 批次快照，不连接真实 Webhook 提供方、队列或外部端点。
- 标识固定使用 `virtual-*` 前缀，范围只使用语义枚举，不含真实签名密钥、端点 URL 或租户标识。
- 页面与 API 只接受已登记 `scenarioKey` 与 `optionKey`，未知输入脱敏阻断且不回显原值。
- 不发起真实并发请求、不实现请求泛洪器、不提供重放工具。
- 不提供 `exploit.py`。

## 7. 完成标准

- [x] 服务端服务、API、事件日志摘要落地。
- [x] 前端 API 客户端、变体配置、视图、路由落地。
- [x] 标准实验目录七份文档齐备，计数值与实测一致。
- [x] 只读 `verify.ts` 全项通过。
- [x] 服务端专用测试通过。
- [x] 覆盖矩阵新增行且计数一致。
- [x] 根级 `pnpm verify` EXIT=0。
- [x] 元数据推进 `ready`。
- [x] 长期目标、TODO、README、AGENTS 同步。
- [x] `git diff --check` 通过并提交。

## 8. 验收证据

执行时间：2026-08-28。

### 8.1 固定批次审计计数（实测）

| 批次 | 姿态 | 发现总数 | 关键组合风险 | 资源控制数 |
|---|---|---:|---:|---:|
| `virtual-unthrottled-replayable-batch` | vulnerable | 4 | 2 | 0 |
| `virtual-quota-idempotent-batch` | hardened | 0 | 0 | 4 |

文档中的全部计数值均取自服务端 `assessFixedWebhookBatch` 实测输出，未使用估计值。

### 8.2 专项只读验证

`tools/lab-scripts/api/rate-limit-idempotency/verify.ts`：`ok: true`，18/18 项检查通过，覆盖元数据结构、固定批次形状、虚构标识前缀、审计计数锁定、Web/API 入口、前后端路由顺序、canonical 信号、脚本入口、自动化范围、文件存在性、契约与语义一致性、安全边界声明、无 `exploit.py`、无禁用运行能力。

### 8.3 专用服务端测试

`apps/server/tests/rate-limit-idempotency-lab.test.ts`：9/9 通过，覆盖冻结快照与锁定计数、三条 canonical 路径、未知 scenarioKey/optionKey/不完整/终止后追加四类阻断且不回显、工作台只暴露固定批次、评估需登录、事件日志只记录固定 key、防御路径返回 403。

阻断用例已验证事件日志不包含真实端点 URL、签名密钥、租户 ID、幂等键原值与自由文本。

### 8.4 根级门禁

`pnpm verify` EXIT=0：

- 前后端 TypeScript 类型检查通过。
- `shared` 67/67。
- `guided` 30/30。
- `controlled` 6 个专项验证器全部 `ok: true`（含本实验）。
- Web 入口 154/154 匹配，`labCount` 77。
- API 入口 204/204 匹配，实验路由 70/70 覆盖，错误 0。
- 覆盖矩阵 77/77，`ok: true`，专用 47、引导式 30、`simulation` 22、`api` 分类 3。
- `server` 381/381。
- `web` 285/285。

### 8.5 静态检查

`git diff --check` 通过。

### 8.6 未执行项

本切片未执行生产 `build`、`test:smoke`、数据库集成与 Playwright E2E；代表性页面回归留待后续统一补充，元数据中 `playwright.enabled` 保持 `false`，未虚报页面证据。

## 9. 交付物

- 本执行文档与验收证据。
- 服务端服务、路由与专用测试。
- 前端 API、配置、视图与路由。
- 标准实验目录与脚本目录。
- 覆盖矩阵、长期目标、TODO、README、AGENTS 同步。

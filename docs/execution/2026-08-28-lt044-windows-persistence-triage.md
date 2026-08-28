# LT-044 Windows 计划任务与启动项持久化研判实验执行文档

> 对应长期目标：`LT-044`
>
> 文档状态：进行中
>
> 创建时间：2026-08-28

## 1. 背景与目标

长期目标第 21.3 节的 `LT-044` 原始措辞是「补充 Windows 文件 ACL、计划任务和 NTLM/Kerberos 固定案例」。开工前重读 `docs/design/windows-host-identity-labs.md` 后确认，该规划文档第 48 行已有明确的范围决策：

> NTLM/Kerberos、AD ACL 与委派因概念复杂、易被误解为攻击链，放到主机主线稳定后再评估。

因此本切片**不实现 NTLM/Kerberos**，只实现规划文档第 4 节首批候选中的第 2 项「计划任务与启动项持久化研判」（`case-study`）。这是一次有意的范围收窄，理由如下：

1. 规划文档的边界决策优先于长期目标的候选名称罗列，长期目标第 9 节开头亦声明候选名称不得直接照抄创建代码。
2. 一个切片保持一个完整闭环，符合项目「每轮控制在一个完整闭环」的实施建议。
3. Windows 文件 ACL 与 NTLM/Kerberos 保留在后续队列，本文档第 12 节记录未覆盖项。

本实验目标：以固定虚构持久化时间线，让学习者对比「接受可疑自启持久化」与「识别并处置持久化 + 确认受控自启项」两条路径，补齐 `host` 分类的持久化研判视角。

## 2. 范围

### 2.1 纳入范围

- 新增实验 `host.persistence-triage`，复用现有 `host` 分类，不新增分类。
- 两份冻结的虚构持久化条目快照与确定性研判计数纯函数。
- 第二版引导式两步状态机：持久化范围评估 → 处置决策。
- 专用工作台 API 与漏洞版/修复版评估 API，只接受已登记固定 key。
- 统一事件日志安全摘要接入，只记录固定 key 与计数。
- 前端 API 客户端、labs 配置模块、专用视图、置于通用 catch-all 之前的路由。
- 标准实验目录七份文档与脚本目录只读验证器。
- 覆盖矩阵新增行、`test:controlled` 门禁注册与受影响计数断言更新。

### 2.2 不纳入范围

- NTLM/Kerberos 认证流程实验（规划文档已推迟，见第 12 节）。
- Windows 文件与目录 ACL 实验（见第 12 节）。
- 读取、创建、修改或删除任何真实计划任务、启动项、注册表 Run 键或服务。
- 读取真实 Windows 事件日志、系统凭据或注册表。
- 生产构建、smoke、数据库集成与 Playwright（按既有切片收口口径，不属于本轮完成条件）。

## 3. 固定模型（字段来源以实现为准，实测锁定）

沿用 `host.service-permission-audit` 与 `LT-042`/`LT-043` 建立的「冻结快照 + 语义枚举 + 确定性计数」范式。

两份虚构持久化条目快照：

| 快照 | 姿态 | 语义 |
|---|---|---|
| `virtual-unsigned-autorun-entry` | `vulnerable` | 未签名、用户可写路径、高频触发、无审计 |
| `virtual-signed-managed-task` | `hardened` | 已签名、受保护路径、受控触发、有审计 |

五要素语义枚举（实际字段名与取值以 `apps/server/src/services/persistence-triage-lab.ts` 为唯一来源，文档在实现后按实测值回填）：

- 签名状态：未签名 / 已签名并验证发布者
- 镜像路径 ACL：低权限用户可写 / 仅管理员可写
- 触发方式：登录即触发且高频 / 受控计划窗口
- 运行账户范围：高权限账户 / 最小权限服务账户
- 审计与告警：无审计 / 变更审计并告警

关键组合风险只统计「未签名 + 用户可写路径」与「高权限运行且无审计」两类，避免把单一属性夸大为高危。

两步固定决策：

- 第一步 `persistence-scope-assessment`：接受可疑自启条目（风险）/ 收敛签名与 ACL（修复）。
- 第二步 `persistence-disposition`：批准持久化保留（风险）/ 阻断并移除（防御）/ 确认受控自启基线（正常）。

三个 canonical 终止信号：

- `host-persistence-triage-risk-accepted`
- `host-persistence-triage-defense-blocked`
- `host-persistence-triage-normal-verified`

边界阻断信号：`host-persistence-triage-boundary-blocked`。

## 4. 实施步骤

1. 编写服务端 `persistence-triage-lab.ts`：冻结快照、审计纯函数、两步状态机、评估与阻断路径。
2. 运行时实测审计计数，用实测值回填文档，不凭印象填写。
3. 挂载工作台 GET 与 `:variant/evaluate` POST 路由，置于 `/api/labs/:category/:scene/workbench` 之前。
4. 接入统一事件日志，`inputSummary` 只含固定 key、计数、步骤数、终止结果与信号。
5. 前端三层：API 客户端类型严格对齐服务端字段、labs 配置模块、专用视图。
6. 注册前端路由，置于 `/labs/:category/:scene/:variant(vuln|fixed)` 之前。
7. 建 `meta.json` 与七份标准文档；`case-study` `ready` 必须满足共享校验器的三条附加规则。
8. 建只读 `verify.ts`，反向核对元数据、路由顺序、固定 key、文档与禁用能力。
9. 建服务端 API 测试，覆盖三条 canonical 路径、未知 key 脱敏与登录要求。
10. 更新覆盖矩阵、`test:controlled` 门禁与受影响计数断言。
11. 运行专项只读验证与根级 `pnpm verify`。
12. 同步长期目标、TODO、README、AGENTS 与规划文档实施状态，提交。

## 5. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 被误解为持久化攻击教程 | 越过项目安全边界 | 只提供固定快照与防御决策，不输出注册表路径、任务 XML 或创建命令 |
| 前端类型与服务端字段漂移 | 类型检查失败或页面读到 undefined | 以服务端类型为唯一来源，前端类型逐字段对齐后跑 `typecheck:web` |
| 文档写入未实测的计数 | 文档与实现不一致 | 先运行时实测，再回填文档 |
| `case-study` ready 校验不通过 | 门禁阻塞 | 提前满足 safeBoundaries 含 `case-study`+`ready`、notes 含「不提供」+`exploit.py`、变体 `supportsAutomation: false`、至少两类自动化证据 |
| 只读验证器误判自身边界文案 | 验证器自伤 | 禁用片段只扫真实运行能力，不放入会出现在「不调用」声明中的裸命令名 |
| 新增实验导致多处硬编码计数失败 | 根级门禁失败 | 逐项按实测值更新 registry、health、api-entrypoints 与覆盖矩阵断言 |
| 范围收窄未被记录 | 后续误判 LT-044 已覆盖 NTLM/Kerberos | 第 12 节显式记录未覆盖项并回写长期目标队列 |

## 6. 安全边界

- 只使用服务端内存中冻结的两份虚构持久化条目快照。
- 不读取、创建、修改或删除任何真实计划任务、启动项、注册表键或服务。
- 不读取真实 Windows 事件日志、系统凭据、注册表或文件系统 ACL。
- 标识统一使用 `virtual-*` 前缀，五要素只使用语义枚举，不含真实路径、账户名或任务名。
- 页面与 API 只接受已登记 `scenarioKey` 与 `optionKey`，未知输入脱敏阻断且不回显原值。
- 不提供 `exploit.py`，不输出可迁移到真实主机的持久化命令或清单。

## 7. 完成标准

- [x] 服务端服务、API、事件日志摘要落地。
- [x] 前端 API 客户端、配置、视图、路由落地且类型与服务端一致。
- [x] 标准实验目录七份文档齐备，计数值与实测一致。
- [x] 只读 `verify.ts` 全项通过（19/19）。
- [x] 服务端专用测试通过（9/9）。
- [x] 覆盖矩阵新增行且计数一致（78/78）。
- [x] 根级 `pnpm verify` EXIT=0。
- [x] 元数据推进 `ready` 且满足 case-study ready 例外。
- [x] 长期目标、TODO、README、AGENTS、规划文档同步。
- [x] 范围收窄与未覆盖项已记录（见第 10 节）。
- [x] `git diff --check` 通过并提交。

## 8. 验收证据

完成时间：2026-08-28 18:02 +08:00。

### 8.1 固定数据实测计数

服务端 `assessFixedPersistenceEntry` 运行时实测，文档中的计数值以此为准：

| 固定条目 | 姿态 | 发现数 | 关键风险 | 加固控制 |
|---|---|---:|---:|---:|
| `virtual-unsigned-autorun-entry` | vulnerable | 4 | 2 | 0 |
| `virtual-signed-managed-task` | hardened | 0 | 0 | 5 |

### 8.2 专项与门禁

- 专项只读验证：19/19 全部 `passed`，报告 `ok: true`。
- 服务端专用测试 `persistence-triage-lab.test.ts`：9/9 通过，覆盖冻结快照、三条 canonical 路径、未知/不完整/终止后追加路径脱敏阻断、工作台只读、未登录 401、事件摘要脱敏与防御路径 403。
- 事件日志脱敏已验证：注入的真实主机名、账户、注册表路径、任务名、SID 与文件路径均未出现在事件摘要中。

### 8.3 根级 `pnpm verify`

EXIT=0，各阶段实测：

- 前后端 TypeScript 类型检查通过。
- `test:shared`：67/67。
- `test:guided`：30/30，`ok: true`。
- `test:controlled`：7 个受控实验全部 `ok: true`（含本实验新注册项）。
- `test:entrypoints`：78 个实验、156/156 Web 入口匹配、错误 0。
- `test:api-entrypoints`：207/207 API 入口匹配、实验路由 72/72 覆盖、错误 0。
- `test:coverage`：78/78，专用 48、引导式 30、14 分类、`host` 3、`case-study` 30、`ok: true`。
- `test:server`：390/390。
- `test:web:run`：80 个测试文件、285/285。

### 8.4 未执行项

按既有切片收口口径，本轮未运行 `pnpm build`、`test:smoke`、数据库集成与 Playwright；这些不属于本切片完成条件。本实验的 Playwright 三向页面验证（E6）保留到后续统一补齐，元数据中 `playwright.enabled` 为 `false`。

## 9. 交付物

- 本执行文档与验收证据。
- 服务端服务、路由与专用测试。
- 前端 API、配置、视图与路由。
- 标准实验目录与脚本目录。
- 覆盖矩阵、长期目标、TODO、README、AGENTS 与规划文档同步。

## 10. 未覆盖项（保留到后续队列）

`LT-044` 原始措辞中的以下两项本轮未实现，需在后续队列单独立项：

- Windows 文件与目录 ACL 固定案例（长期目标第 9.4 节第 1 条仍为未完成）。
- NTLM/Kerberos 基础风险固定认证流程（长期目标第 9.4 节第 7 条与阶段 4 对应条目仍为未完成；规划文档第 48 行已给出推迟理由）。

# API 安全与业务逻辑实验首批规划

> 文档状态：持续维护
>
> 首次建立：2026-07-23
>
> 关联任务：`LT-011`（规划 API 安全和业务逻辑首批实验）

## 1. 文档定位

本文档承接 `SECURITY-COVERAGE-LONG-TERM-GOAL.md` 第 9.1、9.2 节和阶段 3，用于在进入实现前确认 API 安全与业务逻辑首批实验的分类、目录、元数据字段、接口结构和安全边界。

本文档只做规划，不实现任何实验。每个实验进入实现前仍必须单独编写执行文档，并按第 14 节切片流程推进。

## 2. 规划原则

- 复用现有用户、商品、订单、学习记录和事件日志模型，不新建平行业务系统。
- 不重复创建同义主题：API 对象级授权（BOLA）复用并扩展现有 `auth.idor`，不新建 `api.bola`。
- 高价值应用安全结构性空白优先：功能级授权、属性级授权、资源消耗限流、业务流程滥用。
- 所有实验只使用固定虚构数据与内存状态机，不接入真实支付、真实账户或外部服务。
- 首批统一采用第二版引导式状态机（`interactive`），沿用 clickjacking～oauth 建立的专用化样板，或以 `simulation` 表达纯状态观察。

## 3. 现有可复用资产

| 资产 | 位置 | 复用方式 |
|---|---|---|
| 对象级授权模型 | `apps/server/src/services/idor-lab.ts` | 作为 API BOLA 视角的基础，补 API 安全映射 |
| 功能级授权模型 | `apps/server/src/services/privilege-escalation-lab.ts` | 作为 API BFLA 的基础，补普通用户访问管理功能视角 |
| 第二版状态机 | `packages/shared/src/guided-scenarios-v2.js` | 驱动多步骤固定决策 |
| 专用实验样板 | `apps/server/src/services/oauth-lab.ts` 等 | 服务 / 路由 / 前端 / 验证脚本结构模板 |
| 统一事件日志 | `lab_event_logs` | 只记录固定 key、决策、信号和安全摘要 |

## 4. 首批候选清单

优先级依据阶段 3 推荐首批切片，取风险高、可复用现有模型、边界清晰的四项作为首批。

| 顺序 | 实验 | 分类 | 建议模式 | 复用基础 | 结构性价值 |
|---|---|---|---|---|---|
| 1 | API 功能级授权（BFLA） | `api` | `interactive` | `auth.privilege-escalation` | 补普通用户访问管理功能的服务端策略与审计 |
| 2 | API 资源消耗与限流 | `api` | `simulation` | 固定请求批次状态机 | 补配额、节流、降级的可观察差异 |
| 3 | 竞态条件 | `business-logic` | `simulation` | 固定余额/库存状态机 | 补重复提交、幂等和顺序约束 |
| 4 | 业务流程跳步 | `business-logic` | `interactive` | 固定订单阶段状态机 | 补服务端状态校验和阶段顺序 |
| 5 | API 属性级授权与批量绑定 | `api` | `interactive` | 固定 DTO 字段快照 | 补字段允许列表和服务端所有权 |

说明：

- API 对象级授权（BOLA）不在首批新建，改为在 `auth.idor` 上补 API 安全视角与标准映射，作为独立小切片处理。
- `api` 与 `business-logic` 分类已分别在 `LT-021`、`LT-022` 确认，并接入分类注册、动态种子同步、页面分组和统计标签（见第 7 节）。
- `LT-021` 已完成 `api.functional-authorization` 专用 D4 实验；`LT-022` 已完成 `business-logic.workflow-bypass` 专用 D4 实验，两者均已推进到 `ready`。

## 5. 每个候选的固定模型与边界

### 5.1 API 功能级授权（BFLA）

- 固定案例：普通用户请求管理员专属操作（如查看全量订单、修改他人角色）。
- 两步决策：身份角色校验策略（仅前端隐藏 vs 服务端功能级授权）→ 操作处置（越权执行 / 阻断 / 正常管理员放行）。
- 边界：只使用固定虚构用户与操作枚举，不修改真实账户或角色。

### 5.2 API 资源消耗与限流

- 固定案例：单客户端在固定时间窗发起超额请求批次。
- 状态机：无限流接受 → 触发配额 → 降级 / 阻断。
- 边界：只使用内存计数与固定批次摘要，不发起真实并发请求。

### 5.3 竞态条件

- 固定案例：同一余额/库存被并发扣减两次。
- 状态机：无锁双花接受 → 幂等键/乐观锁识别 → 正常单次扣减。
- 边界：只使用固定余额状态机，不操作真实资金或数据库事务。

### 5.4 业务流程跳步

- 固定案例：跳过支付阶段直接进入发货。
- 两步决策：阶段校验策略（仅客户端流程 vs 服务端状态机）→ 处置（跳步接受 / 阻断 / 正常顺序放行）。
- 边界：只使用固定订单阶段枚举，不接入真实订单或支付。

### 5.5 API 属性级授权与批量绑定（LT-036）

- 实验 ID：`api.property-authorization`。
- 固定案例：`fixed-profile-update-dto`，字段锁定为 `displayName`、`role`、`status`、`accountLimit`。
- `displayName` 为 `user-editable`；其余字段为 `server-owned`，API 不接受自由 DTO。
- 两步决策：绑定全部字段 / 字段允许列表与服务端所有权 → 持久化服务端字段 / 阻断 / 正常 displayName 更新。
- 当前实现与标准目录已落地，元数据保持 `in-progress`，等待专项和根级门禁后推进 `ready`。

### 5.6 业务竞态与幂等（LT-037）

- 实验 ID：`business-logic.race-condition`。
- 固定案例：`fixed-single-stock-double-request`，虚构库存 1、版本 7、两条固定请求摘要。
- 两步决策：无版本读写 / 幂等与版本校验 → 双扣 / 阻断重复或陈旧请求 / 单次正常扣减。
- 不执行真实并发或数据库事务；元数据保持 `in-progress`，等待命令验证。

## 6. 统一产物要求

每个实验实现时必须具备（与现有专用实验一致）：

- `labs/<category>/<scene>/meta.json` 与标准目录、README、vuln/fixed/mock、attack-steps、fix-notes、manual-verification。
- 专用后端服务、专用工作台配置 API 与评估 API（只接受固定 key）。
- 前端 API client、labs 展示模块、专用视图与置于通用 catch-all 之前的路由。
- 独立 `verify.ts` 只读一致性验证与专用测试。
- 统一事件日志安全摘要接入。
- 独立执行文档。

## 7. 前置确认项（进入实现前必须解决）

- [x] `LT-021` 确认新增 `api` 分类；`LT-022` 确认新增 `business-logic` 分类，首个实验为 `business-logic.workflow-bypass`。
- [x] `api` 与 `business-logic` 已接入动态种子同步、`getLabCategoryProfile`、实验列表分组标题和平台状态统计标签。
- [x] BFLA 覆盖矩阵行按 `interactive` / D4 专用交互登记，验证器将其计入专用实现。
- [ ] 确认 BOLA 复用 `auth.idor` 的具体补充方式（映射、正常流程说明），不新建同义实验。
- [x] BFLA 已锁定 `privileged-operation-request` 和两步 kebab-case optionKey；后续实验仍须逐项确认。
- [x] workflow-bypass 已锁定 `pending-order-shipping-request`、`pending -> paid -> shipping` 固定阶段语义和两步 kebab-case optionKey；API 不接受订单 ID 或阶段自由输入。
- [x] LT-036 已锁定 `api.property-authorization`、四个固定 DTO 字段和只接受 scenarioKey/decisions 的契约。
- [x] LT-037 已锁定 `business-logic.race-condition`、单库存双请求快照和幂等/版本决策契约。

## 8. 安全边界总纲

- 只使用固定虚构数据、内存状态机与枚举决策，不接入真实支付、账户、外部 API 或数据库事务。
- API 与页面只接受注册过的固定 key，未知 key 脱敏阻断且不回显原始输入。
- 事件日志只记录固定 key、步骤、决策、信号和安全摘要。
- 不提供可迁移到外部目标的攻击载荷、批量请求器或真实并发压测工具。

## 9. 验证方式（规划阶段）

- 本文档只做规划，验证限于 `git diff --check` 与行尾空白检查。
- 每个实验实现阶段按执行文档单独验证：共享/服务/前端测试、`verify.ts`、类型检查与覆盖矩阵一致性。

## 10. 完成判定

- 首批四个候选均有明确的固定模型、模式、复用基础、产物要求和安全边界。
- 前置确认项清单完整，实现前逐项解决。
- 不在本轮引入任何实验代码或元数据变更。

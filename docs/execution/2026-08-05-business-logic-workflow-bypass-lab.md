# LT-022 业务流程跳步专用实验执行文档

## 1. 目标

按照 `SECURITY-COVERAGE-LONG-TERM-GOAL.md` 的 `LT-022` 和 `docs/design/api-and-business-logic-labs.md` 第 5.4 节，实现业务流程跳步专用交互实验（D4），并在同一切片建立 `business-logic` 分类。

实验使用固定待支付订单和两步决策状态机，对比“只信任客户端阶段请求”与“服务端校验订单阶段顺序”的差异。漏洞版展示待支付订单被直接推进到发货阶段；修复版阻断乱序迁移，同时保留已支付订单进入发货阶段的正常流程。

## 2. 已确认契约与字段来源

### 2.1 分类与实验标识

- 分类：`business-logic`，中文名称“业务逻辑”。
- 实验 ID：`business-logic.workflow-bypass`。
- slug / subcategory：`workflow-bypass`。
- 模式：`interactive`，深度：D4 专用交互。
- 元数据在实现和命令验证完成前保持 `in-progress`，验证通过后再单独推进为 `ready`。

### 2.2 固定订单模型

- 固定订单展示信息复用 `apps/web/src/data/catalog.ts` 中的待支付订单：`SM-20260608-1099`、`Priority Support Plan`、金额 `89`、归属“测试账户”。
- 阶段语义复用 `apps/server/src/services/idor-lab.ts` 已有订单状态：`pending`、`paid`、`shipping`。
- 本实验固定合法顺序为 `pending -> paid -> shipping`。
- 不新增数据库订单表，不修改 `OrdersView.vue` 的现有订单结构，不发起真实支付、发货或数据库事务。

### 2.3 请求字段

评估 API 只接受现有第二版专用实验契约：

```ts
{
  scenarioKey: "pending-order-shipping-request";
  decisions: string[];
}
```

- 不接受 `orderId`、`currentStage`、`requestedStage`、金额、用户、支付信息或自由文本。
- 固定订单和阶段只由服务端已注册的 scenario / option key 表达。
- 未知 key 必须脱敏阻断，不回显原始输入，也不得写入事件日志。

### 2.4 两步状态机

第一步 `sequence-policy`（阶段顺序校验策略）：

- `trust-client-stage-request`：风险路径，信任客户端请求的目标阶段，进入迁移处置。
- `enforce-server-side-sequence`：防御路径，由服务端校验当前阶段和允许迁移，进入迁移处置。

第二步 `transition-decision`（订单阶段迁移处置）：

- `ship-pending-order`：风险终止路径，canonical 信号 `business-logic-workflow-bypass-risk-accepted`。
- `block-out-of-order-transition`：防御终止路径，canonical 信号 `business-logic-workflow-bypass-defense-blocked`。
- `ship-paid-order`：正常终止路径，canonical 信号 `business-logic-workflow-bypass-normal-verified`。

边界阻断统一使用 `business-logic-workflow-bypass-boundary-blocked`。

## 3. 实施范围

- 新增 `labs/business-logic/workflow-bypass/` 标准目录、元数据和完整实验文档。
- 新增 `tools/lab-scripts/business-logic/workflow-bypass/verify.ts` 只读一致性验证及 README，不新增 `exploit.py`。
- 新增服务端专用第二版状态机、工作台 API、评估 API、统一事件日志安全摘要和专用测试。
- 新增前端 API client、模型配置、专用工作台页面、精确路由和前端 API / 路由测试。
- 将 `business-logic` 接入数据库动态分类同步、实验列表中文分组和平台状态统计标签。
- 同步实验总数、分类数、变体数、模式数、专用实现数、覆盖矩阵和相关断言。

## 4. 不在本轮范围

- 不连接真实订单、支付、库存、物流或第三方服务。
- 不创建订单数据库表、支付状态迁移或真实事务锁。
- 不接受任意订单 ID、目标阶段、金额、用户或外部 URL。
- 不提供批量流程绕过、接口枚举、并发请求、压力测试或可迁移攻击脚本。
- 不在本轮增加 Playwright、数据库集成、smoke 或发布构建证据。

## 5. 操作步骤

1. 建立 `business-logic` 分类 profile、前端标签和 `business-logic.workflow-bypass` 元数据，初始状态为 `in-progress`。
2. 新增专用服务，使用共享 `createGuidedScenarioMachine` 驱动固定两步状态机，覆盖风险、防御、正常和未知输入路径。
3. 在通用 guided catch-all 之前注册精确工作台 / 评估路由；评估接口要求登录，并只记录 scenarioKey、步数、结果计数、终止结果和 signal。
4. 新增前端 API、展示模型和专用页面；页面只通过固定按钮提交决策，不提供自由输入控件。
5. 接入学习进度和验证记录，保持现有字段契约，不新增猜测字段。
6. 新增标准实验文档、只读验证器、服务端测试、前端 API 测试、共享元数据断言和路由断言。
7. 更新覆盖矩阵和全局计数：实现阶段应为 67 个实验、11 个分类、134 个变体、25 个 interactive、36 个专用实现、31 个引导式实验。
8. 经用户明确授权后运行专项验证与根级 `pnpm verify`；全部通过后再把元数据推进到 `ready` 并回填 LT-022 完成证据。

## 6. 实施建议

- 结构上复用 BFLA 专用实验的服务 / 路由 / 前端 / 测试模式，保持第二版状态机和事件摘要一致。
- 业务含义使用独立 workflow-bypass key，避免与 `auth.idor` 的对象级授权或 `api.functional-authorization` 的功能级授权混淆。
- 本切片只新增一个专用实验，不抽取新的通用前端组件或服务端框架；等出现稳定的第三个同构新增实验后再评估抽象。
- 专用前后端路由必须位于通用 catch-all 之前，防止被引导式工作台吞掉。

## 7. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 与 IDOR 主题重叠 | 学习边界不清 | IDOR 关注订单归属；本实验只关注同一固定订单的阶段顺序 |
| 模拟真实支付或发货 | 超出安全边界 | 只使用固定状态枚举和决策信号，不执行外部调用或数据库事务 |
| 新分类造成统计漂移 | 元数据、数据库、页面和文档不一致 | 同步 profile、标签、覆盖矩阵、健康检查和注册表计数断言 |
| 自由阶段输入被用于任意跳转 | 形成可迁移绕过接口 | API 只接受固定 scenarioKey / optionKey，未知值脱敏阻断 |
| 事件日志泄露业务信息 | 写入订单或用户原始数据 | 只记录固定 key、步数、计数、终止结果和 signal |
| 专用路由被 catch-all 吞掉 | 页面或 API 命中错误服务 | 精确路由置于通用路由之前并增加测试 |
| Windows 并发启动过多 tsx/esbuild 进程 | 服务端测试在文件加载阶段出现 spawn UNKNOWN / EPIPE | 将 Node 测试并发显式限制为 4，保持测试内容不变 |

## 8. 优化方案

- 通过共享第二版状态机复用图校验、确定性决策和 recap 汇总，不重复实现状态机引擎。
- 固定订单信息只作为静态学习证据展示，评估请求和事件摘要不携带订单详情。
- 前端正常流程使用独立固定推荐路径，确保修复版既验证阻断，也验证合法业务不回归。
- 只读验证器同时核对元数据、文档、实现、测试、固定 key 和禁用能力，降低跨层漂移。

## 9. 验证方式

经用户明确授权后执行：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/business-logic/workflow-bypass/verify.ts`
- `pnpm verify`
- `git diff --check`

`pnpm verify` 应覆盖前后端类型检查、shared、guided、coverage、server 和 web 测试。build、smoke、数据库集成与 Playwright 不属于本切片最小门禁，除非用户另行授权。

## 10. 完成条件

- `business-logic.workflow-bypass` 专用页面和 API 可访问，风险、防御、正常三条路径产生预定 canonical 信号。
- 未知 scenario / option key 和不完整路径均被脱敏阻断。
- 事件日志只包含安全摘要，不包含订单、用户、金额、支付或外部目标原始数据。
- 分类注册、元数据、路由、页面、API、脚本、文档、覆盖矩阵和计数一致。
- 专项验证与 `pnpm verify` 全部通过，元数据推进为 `ready`，LT-022 完成证据回填。

## 11. 当前执行结果

- 已完成架构预读和字段来源核对。
- 已锁定分类、实验 ID、固定订单来源、阶段枚举、scenarioKey、optionKey、canonical 信号、API 字段和安全边界。
- 已接入服务端第二版两步状态机、精确工作台/评估路由、脱敏事件摘要和专用服务/API 测试。
- 已接入前端 API、展示模型、专用工作台、精确路由、学习进度、验证记录和前端 API / 路由测试。
- 已补齐 `business-logic` 分类 profile / 标签、标准实验目录、只读 `verify.ts`、覆盖矩阵和 67/11/134 全局计数。
- 静态审计确认 67 份元数据全部为 `ready`、134 个变体、25/15/27 模式分布和 67 行覆盖矩阵一致；实现未引入数据库订单、外部调用、子进程或命令执行能力。
- 首次 `pnpm verify` 已通过类型检查、shared 53/53、guided 31/31 和 coverage 67/67；服务端并发加载测试文件时触发 Windows `spawn UNKNOWN` / `EPIPE`，将服务端 Node 测试并发限制为 4 后完整复跑通过。
- 业务流程跳步专项只读验证 13/13 通过；`pnpm verify` 端到端 EXIT=0：前后端类型检查、shared 53/53、guided 31/31、coverage 67/67、server 303/303、web 265/265 全部通过。
- 元数据已从 `in-progress` 推进到 `ready`，LT-022 完成证据已同步到长期目标、TODO、设计文档和覆盖矩阵。
- 本轮未执行 build、smoke、数据库集成或 Playwright；这些项目不属于 LT-022 最小收口门禁。

# LT-027 客户端 MITB 专用模拟升级执行文档

## 1. 目标

按 `SECURITY-COVERAGE-LONG-TERM-GOAL.md` 的 `LT-027`，把 `client.mitb` 从通用引导式实现升级为专用模拟（D3），并从引导式目录 `guidedScenarioCatalog` 毕业。

实验使用固定交易视图三方对照（浏览器显示、服务端记录、带外确认通道），对比只信任浏览器显示的处置与要求交易签名加带外确认后的处置。漏洞版展示按被篡改的浏览器视图放行交易；修复版展示阻断视图不一致的交易，并保留一致交易正常放行的路径。

## 2. 选型理由

`LT-027` 允许在客户端或恶意软件主题中任选其一。选择 `client.mitb` 的依据：

- 队列条目把 `client.mitb` 列为首选示例。
- `severity` 为 `critical`，在两类候选中学习价值最高。
- 长期目标第 6.11 节对该主题的动作是「增加交易视图差异、交易签名和带外确认时间线」，与两步决策模型天然契合。
- 交易视图对照模型与既有专用实验（`client.formjacking` 脚本信任、`malware.ransomware` 行为关联）不重叠，不产生同义主题。

## 3. 已确认契约与字段来源

### 3.1 实验标识

- 分类：`client`（沿用，不新增分类）。
- 实验 ID：`client.mitb`（沿用现有 ID，不改标识以免破坏历史学习记录与事件日志）。
- slug / subcategory：`mitb`。
- 模式：`case-study`（沿用现有模式），深度：D3 专用模拟。
- 保持 case-study 的 ready 例外：不提供 `exploit.py`。
- 元数据在命令门禁通过前保持 `in-progress`。

### 3.2 固定交易视图数据

固定视图只在专用服务中登记为冻结常量。每组视图只允许以下字段：

```ts
{
  viewKey: string;
  displayName: string;
  browserPayee: string;
  browserAmount: string;
  serverPayee: string;
  serverAmount: string;
  outOfBandPayee: string;
  outOfBandAmount: string;
  transactionSigned: boolean;
  expectedPosture: "tampered" | "consistent";
  findings: string[];
}
```

固定案例包含：

- `virtual-tampered-transfer-view`：浏览器显示与服务端记录、带外通道均不一致，未签名，`tampered`。
- `virtual-consistent-transfer-view`：三方一致且已签名，`consistent`。

收款方与金额只使用 `virtual-*` 收款方名与固定教学金额，不含真实账户、卡号、IBAN、商户号或金额指令。服务端基于固定枚举计算 `findingCount`、`mismatchCount`、`trustedPathControlCount`，不解析真实交易报文，不发起任何支付请求。

### 3.3 请求字段

```ts
{
  scenarioKey: "fixed-browser-transaction-view-audit";
  decisions: string[];
}
```

- 不接受账户、卡号、金额、收款方、交易号、签名值、浏览器指纹或自由文本。
- 未知 key 必须脱敏阻断，不回显原始输入，也不写入事件日志。

### 3.4 两步状态机

第一步 `transaction-view-assessment`：

- `trust-browser-rendered-view`：风险路径，只信任浏览器显示的交易字段。
- `compare-server-and-out-of-band-view`：防御路径，比对服务端记录与带外确认通道。

第二步 `transaction-disposition`：

- `submit-transaction-from-browser-view`：风险终止，canonical 信号 `client-mitb-risk-accepted`。
- `block-mismatched-transaction`：防御终止，canonical 信号 `client-mitb-defense-blocked`。
- `confirm-consistent-transaction`：正常终止，canonical 信号 `client-mitb-normal-verified`。

边界阻断统一使用 `client-mitb-boundary-blocked`。

### 3.5 响应摘要字段

工作台增加 `transactionViews` 与 `viewAssessments`；评估结果增加 `viewAssessment` 与 `transactionDecision`，边界阻断时均为 `null`。

## 4. 实施范围

- 新增专用服务、固定视图对照纯函数、两步状态机、工作台与评估 API、脱敏事件摘要。
- 新增前端 API、展示模型、专用工作台页面、精确路由（置于通用 catch-all 之前）。
- 从 `guidedScenarioCatalog` 移除 `client.mitb` 条目，使引导式实现数由 31 降为 30、专用实现数由 40 升为 41。
- 改写 `labs/client/mitb/` 现有元数据与文档，登记专用入口、脚本与三个 canonical 信号。
- 新增 `tools/lab-scripts/client/mitb/verify.ts` 与 README；不新增 `exploit.py`。
- 新增服务端专用测试；更新覆盖矩阵深度列与相关计数断言。

## 5. 不在本轮范围

- 不发起真实支付、转账、扣款或任何金融接口调用。
- 不读取真实浏览器 DOM、扩展、Cookie、会话或凭据。
- 不注入脚本、不修改页面渲染、不实现任何浏览器内篡改能力。
- 不接受真实账户、卡号、IBAN、商户号、交易号或金额指令。
- 不改动实验 ID 与分类，不新增数据库表或字段。
- 不新增 Playwright、数据库集成、smoke 或发布构建证据。

## 6. 操作步骤

1. 锁定固定视图字段、scenarioKey、optionKey、canonical 信号与事件摘要字段。
2. 实现固定视图常量与对照纯函数。
3. 实现两步状态机、精确路由与脱敏边界阻断。
4. 实现前端三方视图对照、决策与记录链路。
5. 从引导式目录移除 `client.mitb`，同步引导式与专用计数。
6. 改写实验元数据与标准文档，补只读验证器与测试。
7. 更新覆盖矩阵深度列与计数断言。
8. 执行专项只读验证与 `pnpm verify`，通过后推进 `ready` 并回填证据。

## 7. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 三方视图数据被误解为真实交易 | 用户误判数据来源 | 收款方统一 `virtual-*`，页面与文档声明虚构教学金额 |
| 视图差异叙述演变为篡改教程 | 超出学习边界 | 只展示对照结果与防御决策，不描述任何注入或篡改手法 |
| 从引导式目录移除导致计数漂移 | 引导式/专用统计与测试不一致 | 同步 `guided`、`dedicated`、矩阵深度列与断言 |
| 沿用实验 ID 导致历史记录语义变化 | 旧事件日志与新链路混读 | 保持 ID、分类、模式不变，只提升实现深度与入口 |
| 未知输入进入事件日志 | 可能记录真实金融数据 | 统一脱敏阻断，日志只用服务端固定摘要 |

## 8. 优化方案

- 三方视图并排展示，用不一致计数直接暴露"只看浏览器显示"的盲区。
- 对照纯函数产出单一计数口径，供服务、测试与验证器复用。
- 验证器增加"已从引导式目录移除"检查，防止专用化后残留双实现。

## 9. 验证方式

- `pnpm --filter @network-safe/server exec tsx ../../tools/lab-scripts/client/mitb/verify.ts`
- `pnpm verify`
- `git diff --check`

build、smoke、数据库集成与 Playwright 不属于本切片最小门禁。

## 10. 完成条件

- 固定视图不含真实账户、卡号、商户号、交易号或可执行支付指令。
- 专用链路只接受固定 key，并产生风险、防御、正常和边界信号。
- `client.mitb` 已从引导式目录移除且无双实现。
- 元数据、页面、API、脚本、文档、矩阵与计数一致。
- 专项验证与 `pnpm verify` 全部通过，元数据推进 `ready`。

## 11. 当前执行状态

- 已完成候选盘点、选型与引导式目录条目预读。
- 已锁定固定视图字段、两步状态机、canonical 信号与安全边界。
- 下一步按本文档实现服务端链路。

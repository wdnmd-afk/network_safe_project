# LT-026 云 IAM 策略固定审计实验执行文档

## 1. 目标

按 `SECURITY-COVERAGE-LONG-TERM-GOAL.md` 的 `LT-026` 与 `docs/design/cloud-native-iac-labs.md` 首批第 1 项，实现云 IAM 策略最小权限固定审计专用模拟实验（D3）。

实验使用两份虚构 IAM 策略快照，对比通配符主体/动作/资源加无条件约束的过宽策略，与收敛到具名主体、具体动作、具体资源并附加条件后的最小权限策略。漏洞版展示批准过宽策略；修复版展示阻断过宽授权，并保留最小权限策略仍能通过正常复核的路径。

## 2. 已确认契约与字段来源

### 2.1 分类与实验标识

- 分类：`infrastructure`（复用现有分类，不新增 `cloud`，依据规划文档第 3 节）。
- 实验 ID：`infrastructure.iam-policy-audit`。
- slug / subcategory：`iam-policy-audit`。
- 模式：`simulation`，深度：D3 专用模拟。
- 元数据在命令门禁通过前保持 `in-progress`，通过后才推进 `ready`。

### 2.2 固定策略数据

固定策略只在专用服务中登记为冻结常量，不读取任何云配置。每份策略只允许以下字段：

```ts
{
  policyKey: string;
  displayName: string;
  principalScope: "wildcard-all" | "named-role";
  actionScope: "wildcard-all" | "wildcard-service" | "explicit-actions";
  resourceScope: "wildcard-all" | "explicit-resources";
  conditionScope: "none" | "source-restricted";
  privilegeEscalationReachable: boolean;
  expectedPosture: "vulnerable" | "hardened";
  findings: string[];
}
```

固定案例包含：

- `virtual-admin-wildcard-policy`：通配符主体、通配符动作、通配符资源、无条件，可达提权，`vulnerable`。
- `virtual-scoped-least-privilege-policy`：具名角色、显式动作、显式资源、来源受限，不可达提权，`hardened`。

标识只使用 `virtual-*` 前缀与虚构资源名，不含真实账号 ID、ARN、区域端点或密钥。服务端基于固定枚举计算 `findingCount`、`criticalFindingCount`、`leastPrivilegeControlCount`，不解析真实策略语言，不调用云 SDK。

### 2.3 请求字段

评估 API 沿用第二版专用实验契约：

```ts
{
  scenarioKey: "fixed-cloud-iam-policy-audit";
  decisions: string[];
}
```

- 不接受策略正文、JSON、YAML、ARN、账号、角色名、密钥、区域或自由文本。
- 未知 key 必须脱敏阻断，不回显原始输入，也不写入事件日志。

### 2.4 两步状态机

第一步 `iam-policy-scope-assessment`：

- `accept-wildcard-admin-policy`：风险路径，接受通配符主体/动作/资源与无条件约束。
- `scope-policy-to-least-privilege`：防御路径，收敛主体、动作、资源并附加来源条件。

第二步 `iam-policy-decision`：

- `approve-overbroad-policy-grant`：风险终止，canonical 信号 `infrastructure-iam-policy-audit-risk-accepted`。
- `block-overbroad-policy-grant`：防御终止，canonical 信号 `infrastructure-iam-policy-audit-defense-blocked`。
- `verify-least-privilege-baseline`：正常终止，canonical 信号 `infrastructure-iam-policy-audit-normal-verified`。

边界阻断统一使用 `infrastructure-iam-policy-audit-boundary-blocked`。

### 2.5 响应摘要字段

工作台在第二版通用字段之外返回：

- `policySnapshots`：两份固定策略摘要。
- `policyAssessments`：每份策略的固定计数摘要。

评估结果增加：

- `policyAssessment`：首步 optionKey 对应的策略审计摘要；边界阻断时为 `null`。
- `policyDecision`：固定 `actionKey`、`disposition`、`summary`、`nextAction`；边界阻断时为 `null`。

## 3. 实施范围

- 新增专用服务、固定策略审计纯函数、第二版两步状态机、工作台 API、评估 API 和事件日志安全摘要。
- 新增前端 API client、展示模型、专用工作台页面、精确路由、学习进度和验证记录。
- 新增 `labs/infrastructure/iam-policy-audit/` 标准目录与元数据。
- 新增 `tools/lab-scripts/infrastructure/iam-policy-audit/verify.ts` 与 README；不提供 `exploit.py`。
- 新增服务端与前端测试、共享元数据断言。
- 更新覆盖矩阵第 15 节与全局计数：71 个实验、14 个分类、142 个变体、19 个 `simulation`、40 个专用实现。

## 4. 不在本轮范围

- 不连接、认证或修改任何真实云账户、集群、对象存储或 IaC 后端。
- 不调用云 SDK、CLI、Terraform 或 Kubernetes API。
- 不读取本机云凭据、kubeconfig、环境变量或 CI 密钥。
- 不解析真实 IAM 策略语言、JSON 或 YAML。
- 不新增分类、数据库表或字段。
- 不新增 Playwright、数据库集成、smoke 或发布构建证据。

## 5. 操作步骤

1. 锁定固定策略字段、scenarioKey、optionKey、canonical 信号与事件摘要字段。
2. 实现固定策略常量与审计纯函数，确保数据只存在于内存冻结常量。
3. 使用共享 `createGuidedScenarioMachine` 实现两步状态机与脱敏边界阻断。
4. 在通用 catch-all 之前注册专用 GET / POST 路由；事件日志只记录固定 key、三项计数、步数、终止结果和 signal。
5. 实现前端固定策略对比、审计指标、两步决策、学习进度与验证记录。
6. 补齐标准实验目录、只读验证器与测试。
7. 更新覆盖矩阵与全局计数断言。
8. 执行专项只读验证与根级 `pnpm verify`，通过后推进 `ready` 并回填完成证据。

## 6. 实施建议

- 策略四要素（主体、动作、资源、条件）用独立语义枚举表达，便于页面并排展示收敛前后的差异。
- 审计纯函数只接受固定策略类型并返回计数，供服务、测试与验证器复用同一口径。
- 页面强调「通配符组合 + 无条件 + 可达提权」的叠加风险，而不是提供任何可复用的提权策略文本。
- 专用路由必须位于通用 catch-all 之前，避免命中通用引导式服务。

## 7. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 固定策略被误解为真实云配置 | 用户误判数据来源 | 统一 `virtual-*` 标识并在页面、API 与文档声明虚构 |
| 策略模型演变为真实策略解析器 | 触及真实云环境 | 只登记语义枚举，禁止 SDK、CLI 与策略语言解析 |
| 提权叙述形成可复用越权模板 | 超出学习边界 | 只展示风险结论与防御决策，不输出策略正文或操作步骤 |
| 复用 `infrastructure` 分类造成语义混杂 | 分类含义变宽 | 在规划文档记录归属决策与可逆拆分条件 |
| 未知输入进入事件日志 | 可能记录真实云标识 | 统一脱敏阻断，日志只用服务端固定摘要 |

## 8. 优化方案

- 固定风险策略与最小权限策略并排展示，突出四要素收敛差异。
- 只读验证器同时核对元数据、路由顺序、固定 key、文档与禁用能力。
- 审计计数由单一纯函数产出，避免服务端、测试与文档三处漂移。

## 9. 验证方式

经用户授权执行：

- `pnpm --filter @network-safe/server exec tsx ../../tools/lab-scripts/infrastructure/iam-policy-audit/verify.ts`
- `pnpm verify`
- `git diff --check`

build、smoke、数据库集成与 Playwright 不属于本切片最小门禁。

## 10. 完成条件

- 固定策略不包含真实账号、ARN、密钥、端点或可执行操作。
- 专用前后端链路只接受固定 key，并产生风险、防御、正常和边界信号。
- 事件日志只记录固定 key、计数与学习摘要。
- 元数据、页面、API、脚本、文档、矩阵与计数一致。
- 专项验证与 `pnpm verify` 全部通过，元数据推进 `ready`，完成证据回填。

## 11. 当前执行状态

- 已完成规划文档补齐、现有专用实验链路与第二版定义结构预读。
- 已锁定分类归属、实验 ID、固定策略字段、两步状态机、canonical 信号与安全边界。
- 已实现服务端固定策略常量、审计纯函数、两步状态机、精确路由与脱敏事件摘要。
- 已实现前端 API、展示模型、专用工作台页面与精确路由（位于通用 catch-all 之前）。
- 已补齐标准实验目录七份文档、只读验证器与 README、服务端专用测试 9 项。
- 已同步覆盖矩阵第 15 节、基线与统计表，以及四处计数断言（矩阵测试、注册表测试、健康检查测试、共享元数据测试）。
- 命令门禁已于 2026-08-20 15:34:58 +0800 执行并全部通过：专项只读验证 18/18 `ok: true`、`pnpm verify` EXIT=0（shared 64/64、guided 31/31、coverage 71/71、server 339/339、web 271/271）。
- 元数据已由 `in-progress` 推进为 `ready`；晋升后复跑专项验证与 `pnpm verify` 仍为 EXIT=0。
- 本轮未执行 build、smoke、数据库集成与 Playwright；不属于本切片最小收口门禁。
- 固定计数经实现核准：`virtual-admin-wildcard-policy` 为 4 发现 / 2 关键 / 0 最小权限控制，`virtual-scoped-least-privilege-policy` 为 0 / 0 / 4。

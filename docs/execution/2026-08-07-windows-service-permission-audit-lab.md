# LT-025 Windows 服务 ACL 与权限固定审计实验执行文档

## 1. 目标

按照 `SECURITY-COVERAGE-LONG-TERM-GOAL.md` 的 `LT-025` 和 `docs/design/windows-host-identity-labs.md`，实现 Windows 服务路径与 ACL 权限固定审计专用模拟实验（D3），并建立独立 `host` 分类。

实验只使用两组虚构服务配置摘要，对比低权限可写、未加引号的高权限服务路径与收敛 ACL、加引号路径后的基线差异。漏洞版展示接受低权限替换风险；修复版展示阻断未授权服务修改，并保留加固服务正常运行的验证路径。

## 2. 已确认契约与字段来源

### 2.1 分类与实验标识

- 分类：`host`，中文名称“Windows 主机安全”。
- 实验 ID：`host.service-permission-audit`。
- slug / subcategory：`service-permission-audit`。
- 模式：`simulation`，深度：D3 专用模拟。
- 元数据在未执行命令验证时保持 `in-progress`，不得推进为 `ready`。

### 2.2 固定服务配置数据

固定配置只在专用服务中登记，不读取操作系统。每条配置只允许以下字段：

```ts
{
  serviceKey: string;
  displayName: string;
  runAs: "virtual-local-system" | "virtual-service-account";
  executablePath: string;
  pathQuoted: boolean;
  binaryDirectoryAcl:
    | "users-write"
    | "administrators-write"
    | "system-only";
  serviceConfigAcl:
    | "users-change"
    | "administrators-change"
    | "system-only";
  expectedPosture: "vulnerable" | "hardened";
  findings: string[];
}
```

固定案例包含：

- `virtual-update-service-risky`：以 `virtual-local-system` 运行，路径未加引号，二进制目录和服务配置允许低权限修改。
- `virtual-update-service-hardened`：以 `virtual-service-account` 运行，路径加引号，目录只允许管理员写入，服务配置只允许系统修改。

`executablePath` 只使用 `C:\\LabVirtual\\...` 虚构路径，不映射真实文件。服务端基于固定枚举计算 `findingCount`、`criticalFindingCount` 和 `hardenedControlCount`，不调用 Windows API、PowerShell、`sc.exe`、WMI、注册表或文件系统。

### 2.3 请求字段

评估 API 沿用第二版专用实验契约：

```ts
{
  scenarioKey: "fixed-windows-service-permission-audit";
  decisions: string[];
}
```

- 不接受服务名、路径、ACL、SID、账号、主机、命令、注册表键、文件、凭据或自由文本。
- 未知 key 必须脱敏阻断，不回显原始输入，也不得写入事件日志。

### 2.4 两步状态机

第一步 `service-path-acl-assessment`：

- `accept-user-writable-unquoted-path`：风险路径，接受低权限可写且未加引号的高权限服务路径。
- `harden-path-and-service-acl`：防御路径，要求路径加引号、收敛目录 ACL、收敛服务配置 ACL 和最小化运行身份。

第二步 `service-permission-decision`：

- `allow-unprivileged-service-replacement`：风险终止路径，canonical 信号 `host-service-permission-audit-risk-accepted`。
- `block-unprivileged-service-modification`：防御终止路径，canonical 信号 `host-service-permission-audit-defense-blocked`。
- `verify-hardened-service-baseline`：正常终止路径，canonical 信号 `host-service-permission-audit-normal-verified`。

边界阻断统一使用 `host-service-permission-audit-boundary-blocked`。

### 2.5 响应摘要字段

工作台在第二版通用字段之外返回：

- `serviceProfiles`：两组固定服务配置摘要。
- `profileAssessments`：每组配置的固定计数摘要。

评估结果增加：

- `profileAssessment`：首步 optionKey 对应的固定配置审计摘要；边界阻断时为 `null`。
- `permissionDecision`：固定 `actionKey`、`disposition`、`summary`、`nextAction`；边界阻断时为 `null`。

## 3. 实施范围

- 新增 `host` 分类注册、前端标签和 `host.service-permission-audit` 元数据。
- 新增专用服务、固定配置审计纯函数、第二版两步状态机、工作台 API、评估 API 和事件日志安全摘要。
- 新增前端 API、展示模型、服务配置/ACL 对比工作台、精确路由、学习进度和验证记录。
- 新增标准实验目录、专用测试代码、只读 `verify.ts` 和覆盖矩阵行。
- 更新实现态全局计数。

## 4. 不在本轮范围

- 不读取或修改真实 Windows 服务、服务控制管理器、注册表、文件、目录 ACL、SID、账号、凭据或事件日志。
- 不执行 PowerShell、CMD、`sc.exe`、WMI、WinRM、系统命令、服务重启或权限修改。
- 不创建可执行文件、服务、计划任务、启动项、payload 或提权脚本。
- 不扫描、连接或认证到任何真实主机。
- 不新增 `exploit.py`。
- 按用户要求不运行测试、类型检查、构建、Playwright 或其他命令门禁。

## 5. 操作步骤

1. 锁定分类、实验 ID、固定服务字段、scenarioKey、optionKey、canonical 信号和事件摘要字段。
2. 新增 `host` 分类 profile、前端标签和 `in-progress` 元数据。
3. 实现固定服务配置与审计纯函数，确保数据只存在于内存常量且不接触操作系统。
4. 使用共享 `createGuidedScenarioMachine` 实现两步状态机和脱敏边界阻断。
5. 在通用 catch-all 之前注册专用 GET / POST 路由；事件日志只记录固定案例/配置 key、三个计数、步数、终止结果和 signal。
6. 实现前端固定配置对比、审计指标、两步决策、学习进度和验证记录。
7. 补齐标准实验文档、专用测试代码和只读验证器，不执行命令验证。
8. 更新实现态计数：70 个实验、14 个分类、140 个变体、25 个 interactive、18 个 simulation、27 个 case-study、39 个专用实现和 31 个引导式实验。
9. 完成静态调用链、字段、路由、矩阵、危险能力和行尾检查。
10. 2026-08-20 经用户授权执行专项只读验证与根级 `pnpm verify`；全部通过后把元数据推进为 `ready` 并回填 LT-025 完成证据（原计划第 9 步要求保持未完成，属上一轮跳过命令验证的约束，偏离原因见第 11 节）。

## 6. 实施建议

- 固定服务路径明确使用 `LabVirtual` 虚构目录，避免用户误以为页面读取本机路径。
- ACL 只使用语义枚举，不保存 SDDL、SID、ACE、真实账号或可执行命令。
- 工作台返回固定数据副本，前端不自行推导或提交服务字段。
- 页面强调高权限运行身份、路径可写性、配置修改权和引号策略的组合风险，而不是提供替换步骤。

## 7. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 虚构路径被误解为本机扫描结果 | 用户误判数据来源 | 固定使用 `C:\\LabVirtual` 并在页面、API 和文档声明虚构 |
| ACL 模型演变为真实枚举器 | 触及本机主机状态 | 只登记语义枚举，禁止 Windows API、命令和文件系统调用 |
| 服务替换叙述形成提权指南 | 超出学习边界 | 只展示风险结果与防御决策，不提供命令、payload 或操作步骤 |
| 新分类造成统计漂移 | 元数据、数据库和页面不一致 | 同步 profile、标签、矩阵和计数断言代码 |
| 未知输入进入事件日志 | 可能记录真实主机数据 | 统一脱敏阻断，日志只使用服务端固定摘要 |

## 8. 优化方案

- 审计纯函数只接受固定配置类型并返回计数，便于服务、测试和验证器复用。
- 固定风险与加固配置并排展示，突出组合控制差异。
- 专用验证器反向核对路由顺序、分类标签、固定 key、文档和禁用能力。
- 后续计划任务、事件日志和横向路径实验复用 `host` 分类，但不复用可能造成字段混淆的服务配置结构。

## 9. 验证方式

原计划（2026-08-07 轮次）按用户要求不运行测试、类型检查、构建或 Playwright，仅执行下列静态检查：

- 字段来源与前后端响应结构静态核对。
- 状态机 optionKey / signal 反向搜索。
- 专用路由位于通用 catch-all 之前的行号检查。
- 固定数据与危险能力静态扫描。
- 覆盖矩阵行数与元数据文件数静态核对。
- `git diff --check`。

2026-08-20 轮次经用户授权补充执行以下命令门禁，全部通过：

- `pnpm --filter @network-safe/server exec tsx ../../tools/lab-scripts/host/service-permission-audit/verify.ts`（19/19 `ok: true`）
- `pnpm verify`（EXIT=0：前后端类型检查、shared 63/63、guided 31/31、coverage 70/70、server 330/330、web 271/271）
- `git diff --check`（EXIT=0）

build、smoke、数据库集成与 Playwright 仍未执行，不属于本切片最小收口门禁。

## 10. 完成条件

- 固定服务配置不包含真实主机、SID、账号、凭据、注册表或可执行操作。
- 专用前后端链路只接受固定 key，并产生风险、防御、正常和边界信号。
- 事件日志只记录固定 key、计数和学习摘要。
- 分类、元数据、页面、API、脚本、文档、矩阵和计数一致。
- 专项只读验证与根级 `pnpm verify` 全部通过（2026-08-20 10:45:12 +0800），元数据推进为 `ready`，LT-025 标记完成。

## 11. 当前执行状态

- 已完成 Windows 主机规划和现有专用实验链路预读。
- 已锁定分类、实验 ID、固定服务字段、两步状态机、canonical 信号和安全边界。
- 专用前后端链路、专用测试和前端路由已实现。
- 2026-08-20 补齐实验目录侧：`host` 分类注册三处、`labs/host/service-permission-audit/` 标准目录与元数据、只读 `verify.ts` 与 README、覆盖矩阵第 16 节；不提供 `exploit.py`。
- 修复了阻塞全部门禁的类型缺陷：`ServicePermissionAuditWorkbench.serviceProfiles` 原声明为可变数组，而 `fixedServicePermissionProfiles` 是冻结的 `readonly` 常量，`structuredClone` 保留只读性导致 TS2322。字段已改为 `readonly`，与“工作台返回固定数据只读副本”的设计一致。
- 修正计数偏差：执行文档与首版实验文档写为风险配置 3 项关键发现、加固配置 4 项发现；按 `assessFixedServicePermissionProfile` 实现核准，真实值为风险配置 4 / 2 / 0、加固配置 0 / 0 / 4（加固配置 `findings` 为空数组）。验证器断言与三份文档已按实现纠正。
- 命令门禁已于 2026-08-20 10:45:12 +0800 经用户授权执行并全部通过：专项只读验证 19/19 `ok: true`、`pnpm verify` EXIT=0（前后端类型检查、shared 63/63、guided 31/31、coverage 70/70 且 14 分类 host 1、server 330/330、web 271/271）。
- 元数据已推进为 `ready`；实现态计数同步为 70 个实验、14 个分类、140 个变体、simulation 18、专用实现 39。
- 本轮未执行 build、smoke、数据库集成与 Playwright；这些不属于 LT-025 最小收口门禁。
- 第 9 节原写“本轮不运行测试、类型检查、构建或 Playwright”，属于上一轮的用户约束；本轮用户明确要求完成任务，故按最小收口门禁执行了类型检查、单元测试、覆盖矩阵与专项验证。

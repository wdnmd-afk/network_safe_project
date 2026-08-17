# LT-024 固定检测规则匹配与告警研判实验执行文档

## 1. 目标

按照 `SECURITY-COVERAGE-LONG-TERM-GOAL.md` 的 `LT-024` 和 `docs/design/detection-response-labs.md`，实现固定检测规则匹配与告警研判专用模拟实验（D3），并在同一切片建立 `detection` 分类和首版共享固定安全事件数据集。

实验使用固定脱敏事件、预登记规则画像和两步决策状态机，对比规则过宽造成误报、规则过窄造成漏报、跨来源关联规则准确命中以及告警研判处置的差异。漏洞版展示把关联告警当作噪声关闭；修复版展示按多源证据升级研判，同时保留有证据的已知维护事件正常关闭流程。

## 2. 已确认契约与字段来源

### 2.1 分类与实验标识

- 分类：`detection`，中文名称“检测与响应”。
- 实验 ID：`detection.rule-alert-triage`。
- slug / subcategory：`rule-alert-triage`。
- 模式：`simulation`，深度：D3 专用模拟。
- 元数据在实现和命令验证完成前保持 `in-progress`；只有专项验证与根级门禁通过后才推进为 `ready`。

### 2.2 共享固定安全事件数据集

共享数据放在 `packages/shared/src/fixed-security-events.js`，通过 `@network-safe/shared/fixed-security-events` 导出，并由同名 `.d.ts` 和共享测试约束。固定数据集与平台运行时 `lab_event_logs` 完全分离：前者是只读教学素材，后者只记录用户学习交互摘要。

数据集 key 固定为 `fixed-auth-process-alert-timeline`。每条事件只允许以下已确认字段：

```ts
{
  eventId: string;
  timestamp: string;
  source:
    | "virtual-auth-service"
    | "virtual-endpoint"
    | "virtual-network-sensor";
  category: "auth" | "process" | "network" | "file";
  severity: "low" | "medium" | "high" | "critical";
  signalTags: string[];
  summary: string;
  expectedDisposition: "benign" | "suspicious";
}
```

- `timestamp` 只使用 `T+MM:SS` 固定相对时间，不含真实日期时间。
- `expectedDisposition` 是教学数据的固定基线标签，用于确定性计算误报和漏报，不代表外部威胁情报或真实检测结论。
- 数据只包含虚构来源、固定标签和脱敏摘要，不包含真实主机名、账号、IP、域名、路径、凭据或样本内容。

### 2.3 固定规则画像

规则不保存或执行查询表达式，只登记固定 `ruleProfileKey` 和预期命中的 `eventId`：

- `broad-auth-failure-rule`：过宽单信号画像，命中可疑与正常认证事件，用于观察误报。
- `narrow-unsigned-process-rule`：过窄单进程画像，只命中部分可疑事件，用于观察漏报。
- `correlated-auth-process-network-rule`：跨认证、进程和网络来源的关联画像，命中固定可疑时间线且不命中已知维护事件。

服务端只基于固定命中集合和 `expectedDisposition` 计算 `truePositiveCount`、`falsePositiveCount`、`falseNegativeCount`、`precisionPercent` 与 `recallPercent`，不解析 Sigma/YARA/正则/SQL，不运行真实检测引擎。

### 2.4 请求字段

评估 API 继续使用第二版专用实验契约：

```ts
{
  scenarioKey: "fixed-auth-process-alert-timeline";
  decisions: string[];
}
```

- 不接受事件正文、规则表达式、查询、文件、主机、账号、IP、URL、凭据、SIEM 配置或自由文本。
- 固定数据集、规则画像和研判动作只由服务端已注册的 scenario / option key 表达。
- 未知 key 必须脱敏阻断，不回显原始输入，也不得写入事件日志。

### 2.5 两步状态机

第一步 `rule-profile-assessment`（规则画像评估）：

- `trust-broad-single-signal-rule`：风险路径，选择过宽认证单信号规则。
- `trust-narrow-single-signal-rule`：风险路径，选择过窄进程单信号规则。
- `correlate-multi-source-signals`：防御路径，选择跨认证、进程和网络来源的关联规则。

第二步 `alert-triage-decision`（告警研判处置）：

- `dismiss-correlated-alert-as-noise`：风险终止路径，canonical 信号 `detection-rule-alert-triage-risk-accepted`。
- `escalate-correlated-alert-for-containment`：防御终止路径，canonical 信号 `detection-rule-alert-triage-defense-escalated`。
- `close-known-maintenance-with-evidence`：正常终止路径，canonical 信号 `detection-rule-alert-triage-normal-verified`。

边界阻断统一使用 `detection-rule-alert-triage-boundary-blocked`。

### 2.6 响应摘要字段

工作台在现有第二版字段之外增加：

- `dataset`：共享固定安全事件数据集的只读副本。
- `ruleAnalyses`：三组固定规则画像的指标数组。

评估结果在现有 `steps`、`recap` 和 `assessment` 之外增加：

- `ruleAnalysis`：首步 optionKey 映射出的固定规则指标；边界阻断时为 `null`。
- `triage`：固定 `actionKey`、`disposition`、`summary`、`nextAction` 研判摘要；边界阻断时为 `null`。

这些字段均由服务端固定定义和共享数据计算，客户端不得提交或覆盖。

## 3. 实施范围

- 新增共享固定安全事件数据集、schema 校验器、类型声明和共享测试。
- 新增 `labs/detection/rule-alert-triage/` 标准目录、元数据和完整实验文档。
- 新增 `tools/lab-scripts/detection/rule-alert-triage/verify.ts` 只读一致性验证及 README，不新增 `exploit.py`。
- 新增服务端专用第二版状态机、固定规则指标计算、工作台 API、评估 API、统一事件日志安全摘要和专用测试。
- 新增前端 API client、展示模型、专用工作台页面、精确路由和前端 API / 路由测试。
- 将 `detection` 接入数据库动态分类同步、实验列表中文分组和平台状态统计标签。
- 同步实验总数、分类数、变体数、模式数、专用实现数、覆盖矩阵和相关断言。

## 4. 不在本轮范围

- 不接入真实 SIEM、EDR、日志源、Windows 事件日志、云审计日志或外部威胁情报。
- 不解析或执行 Sigma、YARA、正则、SQL、KQL、SPL 等规则或查询表达式。
- 不读取真实文件、进程、网络连接、主机信息、账号、IP、域名、凭据或恶意样本。
- 不执行真实隔离、账号冻结、密钥轮换、流量阻断、规则部署或告警关闭动作。
- 不接受任意事件、规则、查询、目标、文件上传或自由文本。
- 不在本轮增加 Playwright、数据库集成、smoke 或发布构建证据。

## 5. 操作步骤

1. 建立共享固定安全事件数据集与 schema 校验器，锁定事件字段、枚举、唯一 ID、相对时间和规则画像交叉引用。
2. 建立 `detection` 分类 profile、前端标签和 `detection.rule-alert-triage` 元数据，状态为 `in-progress`。
3. 新增专用服务，使用共享 `createGuidedScenarioMachine` 驱动固定两步状态机，并基于共享固定数据计算规则画像指标。
4. 在通用 guided catch-all 之前注册精确工作台 / 评估路由；评估接口要求登录，只记录 scenarioKey、规则画像 key、误报/漏报计数、步数、终止结果和 signal。
5. 新增前端 API、展示模型和专用页面；页面只提供固定决策按钮、事件时间线、规则指标和研判摘要，不提供文本输入或上传入口。
6. 接入学习进度和验证记录，保持现有字段契约，不新增数据库字段。
7. 新增标准实验文档、只读验证器、共享数据测试、服务端测试、前端 API 测试、共享元数据断言和路由断言。
8. 更新覆盖矩阵和全局计数：实现阶段应为 69 个实验、13 个分类、138 个变体、25 个 interactive、17 个 simulation、27 个 case-study、38 个专用实现和 31 个引导式实验。
9. 经用户明确授权后运行共享数据测试、专项只读验证与根级 `pnpm verify`；全部通过后再把元数据推进为 `ready` 并回填 LT-024 完成证据。

## 6. 实施建议

- 数据集与规则画像放在共享包，避免后续告警处置、事件时间线和威胁狩猎实验复制同一批教学事件。
- 规则画像只登记固定命中事件，不保存可执行查询语言，确保指标计算是确定性集合比较。
- 服务端工作台返回共享数据的只读副本，前端不自行重建事件或规则字段。
- 页面复用现有专用实验的状态机、学习进度和验证记录模式；本轮不抽取新的通用页面组件。
- 专用前后端路由必须位于通用 catch-all 之前，防止命中通用引导式服务。

## 7. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 教学数据与平台运行日志混淆 | 用户误以为页面读取了真实日志 | 共享固定数据独立命名并在 API、页面和文档中声明来源 |
| 规则表达式演变为真实查询引擎 | 增加外部检测或攻击面 | 只登记规则画像 key 与固定命中事件 ID，不保存、解析或执行表达式 |
| 误报/漏报指标缺少基线 | 统计结论不可验证 | 由共享数据的 `expectedDisposition` 作为固定教学基线 |
| 新分类造成统计漂移 | 元数据、数据库、页面和文档不一致 | 同步 profile、标签、覆盖矩阵、健康检查和注册表计数断言 |
| 未知输入写入日志 | 可能记录真实规则或事件内容 | API 只接受固定 key，未知值脱敏阻断，事件摘要不含原始输入 |
| 专用路由被 catch-all 吞掉 | 页面或 API 命中错误服务 | 精确路由置于通用路由之前并增加测试 |

## 8. 优化方案

- 共享校验器同时检查事件 ID 唯一性、枚举、相对时间、信号标签和规则画像交叉引用。
- 固定规则指标由一个纯函数计算，服务端状态机、共享测试和后续实验可复用同一结果口径。
- 工作台明确并排展示宽规则、窄规则和关联规则指标，避免只给结果、不解释误报/漏报来源。
- 只读验证器同时核对共享数据、元数据、文档、实现、测试、固定 key 和禁用能力，降低跨层漂移。

## 9. 验证方式

经用户明确授权后执行：

- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/detection/rule-alert-triage/verify.ts`
- `pnpm verify`
- `git diff --check`

默认静态验证包括调用链审阅、字段来源核对、元数据/矩阵/路由反向检查和危险能力扫描。build、smoke、数据库集成与 Playwright 不属于本切片最小门禁，除非用户另行授权。

## 10. 完成条件

- 共享固定安全事件数据集通过 schema 和交叉引用校验，且不包含真实系统或个人数据。
- `detection.rule-alert-triage` 专用页面和 API 可访问，规则宽/窄/平衡指标可观察，风险、防御、正常三条路径产生预定 canonical 信号。
- 未知 scenario / option key、不完整路径和终止后的多余决策均被脱敏阻断。
- 事件日志只包含固定 key、指标计数和安全摘要，不包含事件正文、规则表达式、主机、账号、IP、URL、凭据或原始输入。
- 分类注册、元数据、共享数据、路由、页面、API、脚本、文档、覆盖矩阵和计数一致。
- 专项验证与 `pnpm verify` 全部通过，元数据推进为 `ready`，LT-024 完成证据回填。

## 11. 当前执行状态

- 已完成项目架构、检测响应规划、共享状态机、事件日志、分类同步和最近专用实验全链路预读。
- 已锁定分类、实验 ID、固定数据集位置与字段、规则画像、scenarioKey、optionKey、canonical 信号、API 请求字段和安全边界。
- 已实现共享固定事件数据集、结构校验与规则指标纯函数，并新增共享测试和类型声明。
- 已实现服务端专用两步状态机、精确 API、脱敏事件摘要、前端固定事件/规则指标工作台、学习记录和专用测试。
- 已新增 `detection` 分类注册/标签、标准实验目录、只读验证器、覆盖矩阵和 69/13/138 实现态计数。
- 静态审阅与命令验证尚未收口；下一步完成调用链反向检查，再申请运行共享测试、专项验证和根级 `pnpm verify`。
- 用户明确要求跳过命令验证；静态审阅与 `git diff --check` 已完成，元数据保持 `in-progress`，LT-024 不标记完成。

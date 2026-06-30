# 端口扫描暴露面实验执行文档

## 1. 目标

本轮目标是为 `network/port-scan` 建立单独实现执行文档，作为下一波网络 / 传输层实验的第一个落地切片。

本实验首版定位为“虚拟暴露面观察器”，用于学习攻击方如何从开放端口推断资产暴露面，以及防御方如何通过最小暴露面、访问控制和资产清单收敛降低风险。

本轮只编写执行文档，不创建实验目录、元数据、页面、API、数据库迁移或脚本。

## 2. 范围

后续实现范围建议包含：

- `labs/network/port-scan/` 标准实验目录。
- `tools/lab-scripts/network/port-scan/` 脚本目录。
- 虚拟资产表和虚拟端口状态，不进行真实网络探测。
- 漏洞版 / 修复版两个变体。
- 后端受控 API，用于返回虚拟暴露面观察结果。
- 前端引导式工作台，用于选择固定虚拟目标并观察差异。
- `lab_event_logs` 事件日志写入。
- 元数据、文档、手动验证和最小自动化测试。

本轮和首版实现均不包含：

- 不扫描局域网、网段、外部 IP、域名或用户输入主机。
- 不调用真实 socket、系统命令、PowerShell、`nmap`、`Test-NetConnection`、`ping`、`tracert` 或类似探测工具。
- 不做并发扫描、压力探测、服务漏洞识别、认证绕过或利用。
- 不修改本机防火墙、路由、hosts、DNS、代理或系统网络配置。
- 不保存真实 IP、真实主机名、真实服务 banner、真实凭据、token 或 Cookie。
- 不提供可复用到外部目标的通用扫描脚本。

## 3. 已确认上下文

- `docs/design/project-scope-and-security-content.md`
  - 第二期重点包含端口扫描、DNS 相关实验、中间人攻击原理演示、配置错误利用和脚本目录体系。
  - 网络层内容适合脚本实验或本机模拟，但不适合默认真实攻击外部目标。
- `docs/design/next-wave-security-labs.md`
  - `network/port-scan` 是下一波首批推荐实验第一项。
  - 首版应使用虚拟资产表，不扫描局域网、网段或外部 IP。
- `docs/design/lab-metadata-structure.md`
  - 后续元数据应使用 `id: "network.port-scan"`、`slug: "port-scan"`。
  - 推荐模式为 `simulation`。
- `apps/server/src/services/lab-event-logs.ts`
  - 事件日志已支持 `attack` / `defense` / `normal` 阶段，`attacker` / `user` / `system` 视角，以及脱敏 `inputSummary`。
- `database/schema/platform/schema.prisma`
  - 统一事件日志字段已存在，本实验不需要新增日志表。

## 4. 实验设计

### 4.1 场景包装

建议场景名：

```text
端口扫描暴露面
```

建议业务包装：

- 虚拟企业资产清单。
- 固定目标分组，例如“办公网关”“后台管理节点”“最小化生产节点”。
- 学习者选择目标，不输入任意 IP 或域名。

### 4.2 学习目标

- 理解端口暴露面如何帮助攻击者做侦察。
- 理解管理端口、调试端口和多余服务暴露的风险。
- 理解最小暴露面、访问控制、服务指纹收敛和资产清单审计的防御价值。
- 理解本项目只模拟侦察结果，不执行真实扫描。

### 4.3 变体设计

`vuln` 变体：

- 展示虚拟资产暴露多个不必要端口。
- 固定受控目标返回更多虚拟开放端口。
- 学习信号突出“暴露面扩大”和“管理服务可见”。

`fixed` 变体：

- 展示同类资产经过最小暴露面治理后的结果。
- 同样目标只返回必要业务端口和受控访问提示。
- 学习信号突出“暴露面收敛”和“管理面隔离”。

## 5. 虚拟资产模型

后续建议使用内存固定模型，不从用户输入构造目标。

建议字段：

| 字段 | 说明 |
|---|---|
| `targetKey` | 固定虚拟目标标识，例如 `office-gateway`、`admin-node`、`hardened-service` |
| `targetTitle` | 展示名 |
| `profile` | `exposed` / `hardened` / `baseline` |
| `allowedVariant` | 可选，用于限定某些样例只在对应变体展示 |
| `ports` | 虚拟端口列表 |
| `riskNotes` | 面向学习者的风险说明 |

虚拟端口字段建议：

| 字段 | 说明 |
|---|---|
| `port` | 固定教学端口号 |
| `protocol` | `tcp` 或教学用固定值 |
| `serviceLabel` | 脱敏服务标签，例如“管理界面”“数据库服务”“业务入口” |
| `exposure` | `public` / `restricted` / `internal-only` |
| `riskLevel` | `low` / `medium` / `high` / `critical` |
| `learningHint` | 端口暴露的学习提示 |

约束：

- 不保存真实服务 banner。
- 不解析真实协议。
- 不探测真实端口状态。
- 不接受任意端口范围输入。

## 6. 后端实现建议

后续建议新增：

```text
apps/server/src/services/port-scan-lab.ts
apps/server/tests/port-scan-lab.test.ts
```

建议 API：

```text
POST /api/labs/network/port-scan/:variant/scan
```

请求字段建议：

| 字段 | 来源 | 说明 |
|---|---|---|
| `targetKey` | 前端固定选项 | 只能是服务端允许列表中的虚拟目标 |
| `scanProfile` | 前端固定选项 | 只能是 `quick-observe` 或 `surface-review` 等教学枚举 |

禁止请求字段：

- 不接收 `host`、`ip`、`cidr`、`domain`、`portRange`、`timeout`、`concurrency` 等真实扫描字段。
- 不接收用户自定义目标。
- 不接收代理、认证、Cookie 或 token。

后端响应建议：

| 字段 | 说明 |
|---|---|
| `status` | `ok` / `blocked` / `failed` |
| `decision` | `accepted` / `blocked` / `failed` |
| `signal` | 学习信号 |
| `message` | 面向学习者的说明 |
| `target` | 虚拟目标摘要 |
| `ports` | 虚拟端口结果 |
| `summary` | 暴露面统计 |

建议学习信号：

- `port-scan-exposure-expanded`
- `port-scan-management-surface-visible`
- `port-scan-surface-reduced`
- `port-scan-target-blocked`
- `port-scan-normal-inventory-returned`

## 7. 事件日志设计

本实验继续写入 `lab_event_logs`，不新增数据库表。

建议日志映射：

| 场景 | `phase` | `eventType` | `actorPerspective` | `decision` | `riskLevel` |
|---|---|---|---|---|---|
| 漏洞版虚拟暴露面扩大 | `attack` | `success` | `attacker` | `accepted` | `high` |
| 修复版暴露面收敛 | `defense` | `success` | `user` | `accepted` | `low` |
| 非允许目标 key | `defense` | `blocked` | `attacker` | `blocked` | `medium` |
| 正常资产清单查看 | `normal` | `success` | `user` | `accepted` | `low` |

建议 `inputSummary` 只记录：

- `targetKey`
- `scanProfile`
- `virtualPortCount`
- `openPortCount`
- `restrictedPortCount`
- `highRiskPortCount`
- `exposureScore`
- `matchedControlledSample`
- `signal`

禁止记录：

- 真实 IP。
- 真实主机名。
- 真实端口扫描结果。
- 真实服务 banner。
- 原始用户输入。
- 任何凭据、token、Cookie。

## 8. 前端实现建议

后续建议新增：

```text
apps/web/src/api/port-scan-lab.ts
apps/web/src/labs/port-scan.ts
apps/web/src/views/PortScanLabView.vue
apps/web/tests/port-scan-api.test.ts
apps/web/tests/port-scan-lab.test.ts
```

建议页面结构：

- 变体标题：漏洞版 / 修复版。
- 安全边界提示：只展示虚拟资产，不扫描真实网络。
- 固定目标选择器。
- 固定观察模式选择器。
- 提交按钮。
- 虚拟端口结果表。
- 暴露面统计。
- 后端决策、学习信号和下一步建议。
- 最近事件复盘卡片沿用现有详情页能力。

页面禁止：

- 不提供任意 IP / 域名输入框。
- 不提供端口范围输入。
- 不显示“扫描真实目标”等措辞。
- 不展示真实网络探测命令。

## 9. 目录与元数据建议

后续实验目录：

```text
labs/network/port-scan/
├─ meta.json
├─ README.md
├─ vuln/
├─ fixed/
├─ mock/
└─ docs/
```

脚本目录：

```text
tools/lab-scripts/network/port-scan/
```

首版元数据建议：

- `id`: `network.port-scan`
- `slug`: `port-scan`
- `category`: `network`
- `subcategory`: `port-scan`
- `mode`: `simulation`
- `status`: 目录和文档切片先用 `planned`，页面 / API 接入后用 `in-progress`，完成验证后再用 `ready`
- `variants`: `vuln` / `fixed`
- `entrypoints.docs`: 目录阶段先登记文档入口
- `entrypoints.web`: 页面完成后再登记
- `entrypoints.api`: API 完成后再登记
- `entrypoints.scripts`: 首版没有脚本时不登记攻击脚本

## 10. 脚本策略

首版不建议创建 `exploit.py`。

可选后续脚本：

- `verify.ts`：只读校验元数据、文档和固定虚拟资产样例。
- `exploit.py`：仅在后续明确需要时创建，并且必须默认只调用本项目 localhost API，不执行真实端口探测。

若后续创建脚本，必须满足：

- 默认目标固定为 `http://127.0.0.1:6667` 或项目实际本机 API。
- 不接收任意主机、网段或端口范围。
- 不调用系统网络探测命令。
- 不使用原始 socket 扫描。
- 不并发探测。
- 输出本机受控学习信号，不输出可用于外部目标的扫描结果。

## 11. 文档要求

后续需要补齐：

- `labs/network/port-scan/README.md`
- `labs/network/port-scan/vuln/README.md`
- `labs/network/port-scan/fixed/README.md`
- `labs/network/port-scan/mock/README.md`
- `labs/network/port-scan/docs/attack-steps.md`
- `labs/network/port-scan/docs/fix-notes.md`
- `labs/network/port-scan/docs/manual-verification.md`
- `tools/lab-scripts/network/port-scan/README.md`

文档必须强调：

- 本实验是虚拟暴露面观察，不是真实扫描器。
- 攻击方视角用于理解侦察风险，不用于对外目标。
- 防御方重点是最小暴露面、访问控制、资产清单和审计。
- 所有结果来自固定虚拟资产模型。

## 12. 潜在风险分析

- 若允许用户输入目标，实验会变成扫描工具；因此首版必须只允许固定 `targetKey`。
- 若提供端口范围输入，容易滑向真实扫描器；因此首版只使用服务端固定端口列表。
- 若后续脚本调用 socket 或系统探测命令，会越过本项目安全边界；因此首版不提供攻击脚本。
- 若日志保存真实主机、IP 或 banner，可能引入隐私和本机环境泄露风险；因此日志只保存虚拟摘要。
- 若把修复版设计成“完全阻断观察”，会丢失防御方资产清单价值；修复版应展示收敛后的虚拟暴露面，而不是让学习者什么都看不到。

## 13. 优化方案

- 首版使用内存虚拟资产模型，降低运行环境复杂度。
- 页面采用固定目标按钮和固定观察模式，避免任意输入。
- 日志复用 `lab_event_logs`，不新增专用表。
- 复盘问题沿用现有通用生成逻辑，后续再考虑补充网络实验专属问题。
- 自动化优先覆盖 service / API 差异，再补前端 helper 和 Playwright。

## 14. 验证方式

本轮是执行文档任务，最小验证为：

- 新增执行文档存在于 `docs/execution/`。
- `docs/TODO.md` 和 `docs/execution/security-lab-master-goal.md` 同步本轮进展。
- `docs/design/next-wave-security-labs.md` 标记 `network/port-scan` 已进入执行文档阶段。
- 目标文档通过行尾空白检查。
- 目标文档通过 `git diff --check`，若有既有 LF/CRLF 提示需记录。
- 安全关键词扫描只允许命中文档中的禁止性说明，不应出现真实目标、真实扫描命令执行方案或可复用扫描器实现。

后续进入实现切片时，最小验证建议：

- `pnpm --filter @network-safe/server test -- tests/port-scan-lab.test.ts`
- `pnpm --filter @network-safe/web exec vitest run tests/port-scan-api.test.ts tests/port-scan-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/shared test`
- 若接入 Playwright，再运行网络实验聚焦用例。

## 15. 下一步建议

下一步建议进入 `network/port-scan` 目录与元数据切片：

1. 创建 `labs/network/port-scan/` 标准目录。
2. 创建 `planned` 状态 `meta.json`，只登记 docs 入口。
3. 创建 README、漏洞版说明、修复版说明、mock 说明、攻击步骤、修复说明和手动验证文档。
4. 暂不创建后端 API、前端页面或扫描脚本。
5. 运行共享元数据测试和文档安全扫描。


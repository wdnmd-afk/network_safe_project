# DNS 劫持 / 污染实验执行文档

## 1. 目标

本轮目标是为 `network/dns-hijack` 建立单独实现执行文档，承接 `network/port-scan` ready 之后的下一项网络 / 传输层实验。

本实验首版定位为“内存 DNS 解析差异模拟器”，用于学习攻击方如何利用错误解析结果把用户引向错误虚拟地址，以及防御方如何通过可信解析源、证书校验、异常解析审计和最小信任边界降低风险。

本轮只编写执行文档并同步规划状态，不创建实验目录、元数据、页面、API、数据库迁移或脚本。

## 2. 范围

后续实现范围建议包含：

- `labs/network/dns-hijack/` 标准实验目录。
- `tools/lab-scripts/network/dns-hijack/` 脚本目录。
- 内存 DNS 解析表和固定域名样例，不请求真实外部 DNS。
- 漏洞版 / 修复版两个变体。
- 后端受控 API，用于返回虚拟解析结果、证书状态和异常审计信号。
- 前端引导式工作台，用于选择固定域名样例并观察漏洞版与修复版差异。
- `lab_event_logs` 事件日志写入。
- 元数据、文档、手动验证和最小自动化测试。

本轮和首版实现均不包含：

- 不修改本机 DNS、hosts、代理、路由、防火墙或系统网络配置。
- 不请求真实外部 DNS、DoH、DoT 或公共解析服务。
- 不实现真实 DNS 投毒、DNS 劫持、DNS 隧道、流量转发或中间人代理。
- 不接收任意域名、解析服务器、IP 地址、网络接口、端口或代理参数。
- 不保存真实域名访问记录、真实 IP、真实证书、真实 Cookie、token 或凭据。
- 不提供可复用到外部目标的 DNS 攻击脚本或网络篡改工具。

## 3. 已确认上下文

- `docs/design/next-wave-security-labs.md`
  - `network/dns-hijack` 是下一波首批推荐实验第二项。
  - 首版必须使用内存 DNS 解析表，不修改本机 DNS、hosts、代理或路由。
- `docs/execution/security-lab-master-goal.md`
  - 后续实验必须从攻击方视角设计学习路径，并提供修复版、防御验证、结构化日志和数据库事件日志。
  - 棘手问题必须写明安全模拟方式、刻意限制能力和学习者应观察的内容。
- `apps/server/src/services/lab-event-logs.ts`
  - 统一事件日志已支持 `attack` / `defense` / `normal` 阶段、`attacker` / `user` / `system` 视角和脱敏 `inputSummary`。
- `apps/server/src/app.ts`
  - 现有实验采用 `POST /api/labs/<category>/<scene>/:variant/<action>` 风格，并在路由层读取当前用户、白名单化变体和必需字段。
- `apps/web/src/router/routes.ts`
  - 网络类实验当前已有 `/labs/network/port-scan/vuln` 与 `/labs/network/port-scan/fixed` 作为相邻页面模式。
- `labs/network/port-scan/` 与 `tools/lab-scripts/network/port-scan/`
  - 端口扫描已作为网络类受控模拟实验样板，安全边界是固定虚拟数据、无真实网络探测和只读一致性验证。

## 4. 实验设计

### 4.1 场景包装

建议场景名：

```text
DNS 劫持 / 污染
```

建议业务包装：

- 虚拟企业访问入口解析。
- 固定域名样例，例如“客户门户”“更新服务”“内部看板”。
- 学习者只选择固定 `domainKey`，不输入任意域名。
- 页面展示“期望解析结果”“当前解析结果”“证书校验状态”“异常审计结论”四类观察点。

### 4.2 学习目标

- 理解攻击方为什么关注域名解析链路。
- 理解错误解析结果如何把用户引向错误虚拟地址。
- 理解证书校验、可信解析源和异常解析审计为什么能降低风险。
- 理解 DNS 劫持在真实环境中涉及网络、终端、解析器、证书和监控多层防护。
- 理解本项目只模拟解析结果差异，不改动本机或真实网络。

### 4.3 变体设计

`vuln` 变体：

- 固定域名样例被解析到错误虚拟地址类别。
- 页面展示攻击方观察到的异常：地址类别偏离、证书状态不匹配、业务入口看起来相似但信任链异常。
- 学习信号突出“解析被误导”和“证书不匹配可见”。

`fixed` 变体：

- 同一固定域名样例通过可信解析源返回期望虚拟地址类别。
- 服务端对异常解析类别、证书状态和受信来源做白名单判断。
- 学习信号突出“可信解析恢复”和“异常解析被阻断或审计”。

## 5. 攻击方视角

攻击方学习路径需要回答：

1. 攻击者的目标是让用户访问错误的虚拟服务入口。
2. 攻击者可观察或操纵的是解析结果类别，而不是本项目外部真实 DNS。
3. 漏洞版为什么会接受错误解析结果并继续访问虚拟入口。
4. 攻击成功信号是什么，例如解析目标变成 `shadow-service` 类别、证书状态变成 `mismatch`、学习信号变成 `dns-hijack-resolution-misdirected`。
5. 后端日志如何记录域名样例 key、解析结果类别、证书状态和学习信号。
6. 同样样例在修复版为什么被阻断或恢复到可信解析结果。

攻击方视角只用于理解风险，不提供真实投毒、劫持、代理或流量篡改能力。

## 6. 防御方视角

修复版学习路径需要回答：

1. 漏洞根因是信任了未校验的解析结果或忽略证书异常。
2. 修复点放在服务端受控解析模型、证书状态校验、可信来源判断和异常审计。
3. 修复版如何识别错误解析类别。
4. 修复版如何保持正常业务样例可用。
5. 修复版日志与漏洞版日志有什么差异。
6. 自动化测试如何证明同一 `domainKey` 在漏洞版会暴露异常信号，在修复版会被恢复或阻断。

## 7. 虚拟解析模型

后续建议使用内存固定模型，不从用户输入构造真实域名或真实解析请求。

建议域名样例字段：

| 字段 | 说明 |
|---|---|
| `domainKey` | 固定样例标识，例如 `customer-portal`、`update-service`、`internal-dashboard` |
| `displayDomain` | 教学展示域名，建议使用 `.test` 或项目内虚拟后缀 |
| `expectedAddressCategory` | 期望虚拟地址类别，例如 `trusted-service` |
| `vulnerableAddressCategory` | 漏洞版错误虚拟地址类别，例如 `shadow-service` |
| `certificateExpectation` | 期望证书状态，例如 `trusted` |
| `riskNotes` | 面向学习者的风险说明 |

建议解析结果字段：

| 字段 | 说明 |
|---|---|
| `domainKey` | 固定样例标识 |
| `resolverProfile` | 固定解析视角，例如 `public-cache`、`trusted-resolver` |
| `resolvedAddressCategory` | 虚拟解析结果类别 |
| `expectedAddressCategory` | 期望虚拟地址类别 |
| `certificateStatus` | `trusted` / `mismatch` / `unknown` |
| `anomalyDetected` | 是否检测到解析异常 |
| `learningHint` | 学习提示 |

约束：

- 不保存真实 IP。
- 不执行真实 DNS 查询。
- 不解析真实证书。
- 不接收任意域名、解析器地址或网络接口输入。

## 8. 后端实现建议

后续建议新增：

```text
apps/server/src/services/dns-hijack-lab.ts
apps/server/tests/dns-hijack-lab.test.ts
```

建议 API：

```text
POST /api/labs/network/dns-hijack/:variant/resolve
```

请求字段建议：

| 字段 | 来源 | 说明 |
|---|---|---|
| `domainKey` | 前端固定选项 | 只能是服务端允许列表中的虚拟域名样例 |
| `resolverProfile` | 前端固定选项 | 只能是教学枚举，例如 `public-cache` 或 `trusted-resolver` |

禁止请求字段：

- 不接收 `domain`、`host`、`ip`、`dnsServer`、`resolverUrl`、`networkInterface`、`proxy`、`port` 等真实网络字段。
- 不接收用户自定义目标。
- 不接收 Cookie、token、认证信息或真实证书内容。

后端响应建议：

| 字段 | 说明 |
|---|---|
| `status` | `ok` / `blocked` / `failed` |
| `decision` | `accepted` / `blocked` / `failed` |
| `signal` | 学习信号 |
| `message` | 面向学习者的说明 |
| `domain` | 虚拟域名样例摘要 |
| `resolution` | 虚拟解析结果 |
| `audit` | 异常审计摘要 |
| `nextStep` | 下一步引导 |

建议学习信号：

- `dns-hijack-resolution-misdirected`
- `dns-hijack-certificate-mismatch-visible`
- `dns-hijack-trusted-resolution-restored`
- `dns-hijack-anomaly-blocked`
- `dns-hijack-domain-blocked`
- `dns-hijack-normal-resolution-returned`

## 9. 事件日志设计

本实验继续写入 `lab_event_logs`，不新增数据库表。

建议日志映射：

| 场景 | `phase` | `eventType` | `actorPerspective` | `decision` | `riskLevel` |
|---|---|---|---|---|---|
| 漏洞版解析被误导 | `attack` | `success` | `attacker` | `accepted` | `high` |
| 漏洞版证书不匹配可见 | `attack` | `success` | `attacker` | `accepted` | `high` |
| 修复版异常解析被阻断 | `defense` | `blocked` | `attacker` | `blocked` | `medium` |
| 修复版可信解析恢复 | `defense` | `success` | `user` | `accepted` | `low` |
| 正常解析样例查看 | `normal` | `success` | `user` | `accepted` | `low` |

建议 `inputSummary` 只记录：

- `domainKey`
- `resolverProfile`
- `expectedAddressCategory`
- `resolvedAddressCategory`
- `certificateStatus`
- `anomalyDetected`
- `matchedControlledSample`
- `signal`

禁止记录：

- 真实域名访问历史。
- 真实 IP。
- 真实 DNS 响应。
- 真实证书内容。
- 真实 Cookie、token、凭据或个人信息。

## 10. 前端实现建议

后续建议新增：

```text
apps/web/src/api/dns-hijack-lab.ts
apps/web/src/labs/dns-hijack.ts
apps/web/src/views/DnsHijackLabView.vue
apps/web/tests/dns-hijack-api.test.ts
apps/web/tests/dns-hijack-lab.test.ts
```

建议页面结构：

- 变体标题：漏洞版 / 修复版。
- 当前视角：攻击方观察 / 防御方复盘。
- 安全边界提示：只展示内存解析表，不修改本机 DNS。
- 固定域名样例选择器。
- 固定解析视角选择器。
- 一键提交观察按钮。
- 期望解析结果与当前解析结果对比。
- 证书状态与异常审计面板。
- 后端决策、学习信号和下一步建议。
- 最近事件复盘卡片沿用现有详情页能力。

页面禁止：

- 不提供任意域名、IP、DNS 服务器或代理输入框。
- 不显示真实 DNS 查询命令。
- 不提供修改 hosts、DNS、代理、路由或防火墙的步骤。
- 不使用“攻击外部目标”“污染真实解析”等措辞。

## 11. 目录与元数据建议

后续实验目录：

```text
labs/network/dns-hijack/
├─ meta.json
├─ README.md
├─ vuln/
├─ fixed/
├─ mock/
└─ docs/
```

脚本目录：

```text
tools/lab-scripts/network/dns-hijack/
```

首版元数据建议：

- `id`: `network.dns-hijack`
- `slug`: `dns-hijack`
- `category`: `network`
- `subcategory`: `dns-hijack`
- `mode`: `simulation`
- `status`: 目录和文档切片先用 `planned`，页面 / API 接入后用 `in-progress`，完成验证后再用 `ready`
- `variants`: `vuln` / `fixed`
- `entrypoints.docs`: 目录阶段先登记文档入口
- `entrypoints.web`: 页面完成后再登记
- `entrypoints.api`: API 完成后再登记
- `entrypoints.scripts`: 首版没有脚本时不登记攻击脚本

## 12. 脚本策略

首版不建议创建 `exploit.py`。

可选后续脚本：

- `verify.ts`：只读校验元数据、文档和固定内存解析样例。
- `exploit.py`：仅在后续明确需要时创建，并且必须默认只调用本项目 localhost API，不执行真实 DNS 查询或系统配置改动。

若后续创建脚本，必须满足：

- 默认目标固定为本项目本机 API。
- 不接收任意域名、解析服务器、IP、代理、网络接口或端口参数。
- 不调用系统 DNS、hosts、代理、路由或防火墙配置命令。
- 不请求外部 DNS、DoH、DoT 或第三方服务。
- 输出本机受控学习信号，不输出可用于外部目标的真实解析或劫持结果。

## 13. 文档要求

后续需要补齐：

- `labs/network/dns-hijack/README.md`
- `labs/network/dns-hijack/vuln/README.md`
- `labs/network/dns-hijack/fixed/README.md`
- `labs/network/dns-hijack/mock/README.md`
- `labs/network/dns-hijack/docs/attack-steps.md`
- `labs/network/dns-hijack/docs/fix-notes.md`
- `labs/network/dns-hijack/docs/manual-verification.md`
- `tools/lab-scripts/network/dns-hijack/README.md`

文档必须强调：

- 本实验是内存解析表模拟，不是真实 DNS 工具。
- 攻击方视角用于理解解析链路风险，不用于对外目标。
- 防御方重点是可信解析源、证书校验、异常解析审计和最小信任边界。
- 所有结果来自固定虚拟解析模型。

## 14. 棘手问题与风险分析

- DNS 劫持真实复现会涉及终端配置、网络设备、解析器、代理或中间人能力；本项目不进行真实复现，只模拟解析结果差异。
- 如果允许用户输入任意域名或解析器地址，实验可能变成真实 DNS 探测工具；因此首版必须只允许固定 `domainKey` 和固定 `resolverProfile`。
- 如果提供 hosts、DNS、代理或路由修改步骤，可能影响用户本机网络；因此文档、脚本和页面都不得提供此类操作。
- 如果保存真实域名或 DNS 响应，可能泄露学习者访问习惯或本机环境；因此日志只保存虚拟摘要。
- 如果把修复版做成单纯失败页，学习者无法观察防御信号；修复版应展示可信解析、证书校验和审计结论。

## 15. 优化方案

- 首版使用内存解析表，降低运行环境复杂度。
- 页面采用固定域名样例和固定解析视角，避免任意输入。
- 日志复用 `lab_event_logs`，不新增专用表。
- 复盘问题沿用现有通用生成逻辑，后续再考虑补充网络实验专属问题。
- 自动化优先覆盖 service / API 差异，再补前端 helper、Playwright 和只读一致性验证。

## 16. 验证方式

本轮是执行文档任务，最小验证为：

- 新增执行文档存在于 `docs/execution/`。
- `docs/TODO.md` 和 `docs/execution/security-lab-master-goal.md` 同步本轮进展。
- `docs/design/next-wave-security-labs.md` 标记 `network/dns-hijack` 已进入执行文档阶段。
- 目标文档通过行尾空白检查。
- 目标文档通过 `git diff --check`，若有既有 LF/CRLF 提示需记录。
- 安全关键词扫描只允许命中文档中的禁止性说明，不应出现真实 DNS 配置改动、外部解析请求、真实劫持链路或可复用攻击脚本实现。

后续进入实现切片时，最小验证建议：

- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/dns-hijack-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `pnpm --filter @network-safe/web exec vitest run tests/dns-hijack-api.test.ts tests/dns-hijack-lab.test.ts tests/router.test.ts`
- 若接入 Playwright，再运行 DNS 劫持聚焦用例。
- 若接入只读验证脚本，再运行 `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/network/dns-hijack/verify.ts`。

## 17. 下一步建议

下一步建议进入 `network/dns-hijack` 目录与元数据切片：

1. 创建 `labs/network/dns-hijack/` 标准目录。
2. 创建 `planned` 状态 `meta.json`，只登记 docs 入口。
3. 创建 README、漏洞版说明、修复版说明、mock 说明、攻击步骤、修复说明和手动验证文档。
4. 暂不创建后端 API、前端页面或 DNS 脚本。
5. 运行共享元数据测试和文档安全扫描。

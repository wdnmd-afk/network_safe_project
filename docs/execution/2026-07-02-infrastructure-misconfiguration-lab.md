# 配置错误利用实验执行文档

## 1. 目标

本轮目标是为基础设施实验 `infrastructure/misconfiguration` 编写单独实现执行文档，承接 `supply-chain/dependency-confusion` simulation ready 收口之后的下一项扩展实验。

本实验首版定位为“静态配置风险审计器”：学习者通过固定配置片段、固定暴露面信号和固定修复策略，观察攻击方为什么会关注调试入口、默认凭据提示、目录索引、过宽 CORS、公开管理状态页和详细错误信息，以及防御方如何通过最小暴露面、默认关闭、认证要求、最小权限 CORS 和配置审计降低风险。

本轮只编写执行文档并同步规划状态，不创建实验目录、元数据、页面、API、数据库迁移、真实配置文件或脚本。

## 2. 范围

本轮只新增执行文档：

- `docs/execution/2026-07-02-infrastructure-misconfiguration-lab.md`

后续实现范围建议包含：

- `labs/infrastructure/misconfiguration/` 标准实验目录。
- `tools/lab-scripts/infrastructure/misconfiguration/` 脚本目录占位或只读验证脚本。
- 固定配置片段、固定暴露面信号、固定修复策略和固定审计结果。
- 漏洞版 / 修复版两个变体。
- 后端受控 API，用于返回确定性的配置风险审计结果。
- 前端引导式工作台，用于选择固定配置样例并观察漏洞版与修复版差异。
- `lab_event_logs` 事件日志写入。
- 元数据、场景文档、手动验证、服务端 / 前端测试和只读一致性验证。

本轮和首版实现均不包含：

- 不修改真实 `nginx`、MySQL、Node、Windows 服务、系统防火墙、代理、hosts、证书或云账号配置。
- 不读取真实 `.env`、本机配置文件、服务配置、云凭据、数据库连接串、token、Cookie 或密码。
- 不启动真实调试端口、管理端口、目录索引、公开状态页或跨域代理。
- 不扫描本机端口、局域网、外部 IP、域名、云资源或服务指纹。
- 不提供配置利用脚本、扫描器、弱口令测试、服务枚举或可复用攻击流程。

## 3. 已确认上下文

- `docs/design/next-wave-security-labs.md`
  - `infrastructure/misconfiguration` 是下一波首批推荐实验第六项。
  - 首版建议使用静态配置片段。
  - 禁止修改真实 nginx、MySQL、Node、系统服务或云账号配置。
- `docs/execution/security-lab-master-goal.md`
  - 后续实验必须提供攻击方观察路径、防御方修复路径、结构化控制台日志和数据库事件日志。
  - 棘手问题必须说明如何安全模拟、哪些能力被刻意限制、学习者应该观察什么。
- 当前仓库状态
  - 已有 `lab_event_logs` 统一事件日志表和服务。
  - 已有 `network/port-scan`、`network/dns-hijack`、`ai/prompt-injection`、`social/phishing` 和 `supply-chain/dependency-confusion` 作为扩展实验样板。
  - 当前尚不存在 `labs/infrastructure/misconfiguration/` 或 `tools/lab-scripts/infrastructure/misconfiguration/`。

## 4. 场景定位

建议元数据初始值：

- 实验 id：`infrastructure.misconfiguration`
- slug：`misconfiguration`
- 分类：`infrastructure`
- 子分类：`misconfiguration`
- 模式：`simulation`
- 初始状态：`planned`
- 风险等级：`high`
- 难度：`intermediate`

采用 `simulation` 的原因：

- 配置错误真实复现容易触碰本机服务、系统配置、管理端口、凭据和云资源风险。
- 本项目只用固定配置片段解释风险信号，不读取或修改真实运行环境。
- 漏洞版和修复版的差异来自内存固定数据和确定性审计规则，不来自真实服务暴露。

## 5. 学习目标

攻击方视角只用于理解风险，不用于构造真实利用能力：

- 攻击者会观察调试入口、目录索引、公开状态页、过宽 CORS、详细错误信息和默认凭据提示。
- 攻击者希望从配置失误中推断服务边界、管理入口、敏感路径、接口信任关系或后续攻击机会。
- 学习者需要观察哪些配置会让“本应内部可见的信息”变成外部可见风险信号。

防御方视角需要训练：

- 默认关闭调试、目录索引和管理状态页。
- 管理入口必须要求认证、授权和来源限制。
- CORS 只允许明确可信来源、方法和头部。
- 错误页只输出必要信息，详细堆栈只进入受控日志。
- 配置变更需要审计清单、环境隔离和上线前检查。

## 6. 固定模拟数据模型

首版只允许固定 key，不接收任意配置文本、真实服务地址、真实端口、真实凭据或本机路径。

建议固定配置样例：

- `debug-console-exposed`：调试入口处于开启状态，用于观察调试面暴露风险。
- `directory-index-enabled`：目录索引处于开启状态，用于观察文件列表暴露风险。
- `wildcard-cors-with-credentials`：跨域策略过宽，用于观察浏览器信任边界风险。
- `public-admin-status`：管理状态页公开可见，用于观察内部状态泄露风险。
- `verbose-error-detail`：详细错误信息外显，用于观察技术栈和路径线索泄露风险。
- `default-credential-hint-visible`：页面或配置摘要中出现默认凭据提示，但不展示任何真实账号或密码。

建议固定审计策略：

- `exposure-review`：漏洞版教学策略，展示暴露面扩大后的风险信号。
- `least-exposure-policy`：修复版教学策略，展示默认关闭和最小暴露面。
- `authenticated-admin-only`：修复版教学策略，展示管理入口认证、授权和来源限制。
- `strict-cors-audit`：修复版教学策略，展示可信来源、方法和凭据策略收敛。
- `safe-error-reporting`：修复版教学策略，展示用户错误信息和内部日志分离。

以上字段是后续实现建议。进入代码实现前，必须再次以共享类型、元数据规范和实际服务设计确认字段名，不允许用猜测字段兜底。

## 7. 漏洞版设计

漏洞版不是扫描器或真实配置修改器，而是“配置风险观察模式”：

- 页面展示固定配置摘要、固定暴露面信号和固定审计策略。
- 学习者可以观察调试入口开启、目录索引开启、过宽 CORS、公开状态页或详细错误信息如何扩大攻击面。
- 后端返回固定分析结果，例如 `decision: accepted`、`signal: misconfiguration-debug-surface-visible`。
- 事件日志只记录固定配置 key、风险标签数量、暴露面类别、是否命中固定样例和学习信号。

禁止：

- 不展示真实配置文件内容。
- 不提供真实服务配置路径、修改命令、重载命令或上线步骤。
- 不提供弱口令、扫描、枚举、绕过认证或访问真实管理端口的流程。

## 8. 修复版设计

修复版作为“配置审计与暴露面收敛模式”：

- 页面展示同一固定样例经过默认关闭、认证要求、最小权限 CORS、错误信息收敛和配置审计后的结果。
- 后端根据固定策略返回阻断、收敛、审计通过或补充检查建议。
- 固定安全样例可返回 `accepted`，用于证明正常服务配置仍可被正确放行。
- 日志记录固定审计项、暴露面类别、建议动作、风险等级和学习信号。

建议学习信号：

- `misconfiguration-debug-surface-visible`
- `misconfiguration-directory-index-visible`
- `misconfiguration-cors-too-broad`
- `misconfiguration-admin-status-public`
- `misconfiguration-error-detail-exposed`
- `misconfiguration-default-credential-hint-visible`
- `misconfiguration-exposure-reduced`
- `misconfiguration-auth-required`
- `misconfiguration-cors-policy-restricted`
- `misconfiguration-safe-error-reporting`
- `misconfiguration-boundary-verified`

## 9. 后端与日志设计

后端服务建议：

```text
apps/server/src/services/misconfiguration-lab.ts
```

API 建议：

```text
POST /api/labs/infrastructure/misconfiguration/:variant/audit
```

请求体后续建议只允许固定 key：

- `configCaseKey`
- `auditPolicyKey`

禁止读取或保存：

- 任意真实配置文本。
- 真实主机、IP、域名、端口、URL、服务名或云资源 ID。
- 真实 `.env`、nginx、MySQL、Node、系统服务、CI、云账号或代理配置。
- 真实账号、密码、token、Cookie、证书、数据库连接串或本机路径。

统一事件日志摘要建议：

- `configCaseKey`
- `auditPolicyKey`
- `exposureCategory`
- `riskIndicatorCount`
- `auditActions`
- `matchedControlledSample`
- `signal`

不得记录完整配置、真实路径、真实服务地址、真实凭据、真实端口清单、token、Cookie、证书或个人本机信息。

## 10. 前端设计

前端建议使用配置审计工作台，但必须保持固定样例：

- 左侧固定配置样例列表。
- 中间固定配置摘要和暴露面信号。
- 右侧审计策略、后端判定和防御建议。
- 漏洞版突出“攻击方能从配置失误中观察到什么”。
- 修复版突出“防御方如何收敛暴露面并保留正常服务”。
- 展示最近事件复盘卡片，继续复用统一事件日志。

页面不得提供：

- 任意配置文本输入框。
- 主机、IP、域名、端口、路径、管理入口、账号、密码、token 或 Cookie 输入。
- 真实服务探测、扫描、连接、登录、重载、部署或下载按钮。
- 真实配置文件上传、导入或保存入口。
- 可复制到真实环境的配置修改命令。

## 11. 脚本与验证边界

首版不创建 `exploit.py`。

后续脚本目录只允许：

- `README.md`：说明脚本边界。
- `verify.ts`：只读一致性验证脚本，校验元数据、文档、固定样例、前端、后端和测试入口。

`verify.ts` 不得：

- 扫描端口、网段、服务、域名、云资源或本机进程。
- 读取真实配置文件、`.env`、服务配置、系统配置、云凭据、token 或密码。
- 修改、重载或启动真实 nginx、MySQL、Node、Windows 服务、代理、防火墙或云配置。
- 请求外部目标或连接真实管理接口。
- 生成扫描器、利用脚本、弱口令测试脚本或配置修改脚本。

## 12. 操作步骤

后续实施按以下切片推进：

1. 建立 `labs/infrastructure/misconfiguration/` 标准目录和 `planned` 元数据，只登记 docs 入口。
2. 编写场景 README、漏洞版说明、修复版说明、mock 固定配置样例说明、攻击方观察步骤、修复说明和手动验证文档。
3. 建立后端固定配置审计服务和受控 `audit` API，接入统一事件日志安全摘要。
4. 补齐服务端 API 测试，覆盖漏洞版暴露面可见、修复版暴露面收敛、正常安全配置放行、未知 key 脱敏阻断和日志摘要脱敏。
5. 建立前端 API client、固定配置样例模型、配置审计工作台和路由。
6. 补齐前端模型 / API / 路由测试。
7. 补齐 Playwright 页面差异验证，确认漏洞版 / 修复版差异和无任意配置、主机、端口或凭据输入框。
8. 补齐本机只读一致性验证脚本。
9. 按 simulation ready 标准做收口审计。

## 13. 棘手问题与风险分析

- 配置错误真实复现可能影响本机服务可用性和安全边界；本项目只使用固定静态配置摘要，不触碰真实配置。
- 如果允许输入主机、端口、URL 或路径，实验可能变成扫描或枚举工具；因此首版必须只允许固定 `configCaseKey` 和固定 `auditPolicyKey`。
- 如果展示真实默认账号或密码，会形成弱口令滥用风险；因此只展示“默认凭据提示可见”这一风险信号，不展示任何真实值。
- 如果提供配置修改、重载或部署命令，学习者可能误操作本机服务；因此文档、页面和脚本都不得提供真实修改流程。
- 如果日志保存真实配置片段、路径或服务地址，可能泄露本机环境；因此日志只保存固定 key、类别和学习信号。
- 如果修复版只做“全部关闭”，学习者无法理解正常业务如何继续可用；修复版应展示管理入口受控开放、业务端口保留和错误信息分层。

## 14. 优化方案

- 首版使用内存固定规则，降低运行环境复杂度。
- 用静态配置摘要和风险标签替代真实配置文件。
- 用固定 key、暴露面类别和审计动作替代端口、路径、主机和凭据。
- 日志复用 `lab_event_logs`，不新增专用表。
- Playwright 和只读脚本都要检查页面没有任意配置、主机、端口、路径、凭据、扫描或连接入口。
- 后续如需扩展云安全、IoT 或容器逃逸，必须另写执行文档并继续使用案例化或模拟边界。

## 15. 验证方式

本执行文档切片的最小验证：

- `git diff --check -- docs/execution/2026-07-02-infrastructure-misconfiguration-lab.md docs/design/next-wave-security-labs.md docs/TODO.md docs/execution/security-lab-master-goal.md`
- `rg -n "[ \t]+$" -- docs/execution/2026-07-02-infrastructure-misconfiguration-lab.md docs/design/next-wave-security-labs.md docs/TODO.md docs/execution/security-lab-master-goal.md`
- 安全关键词扫描，确认未新增真实配置修改、真实服务扫描、真实凭据读取、真实管理接口连接或可复用利用流程。

后续实现切片的最小验证建议：

- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/misconfiguration-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `pnpm --filter @network-safe/web exec vitest run tests/misconfiguration-api.test.ts tests/misconfiguration-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/testing e2e -- --grep "配置错误"`
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/infrastructure/misconfiguration/verify.ts`

## 16. 本轮完成条件

- 执行文档明确首版定位、固定配置样例、安全边界、后端 / 前端建议和后续切片顺序。
- 文档明确不修改真实 nginx、MySQL、Node、系统服务或云账号配置，不读取真实凭据，不扫描真实服务，不连接真实管理接口。
- `docs/design/next-wave-security-labs.md`、`docs/TODO.md` 和 `docs/execution/security-lab-master-goal.md` 同步 `infrastructure/misconfiguration` 已进入执行文档阶段。
- 文档级验证通过后再提交。

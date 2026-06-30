# LDAP 注入案例化实验执行文档

## 1. 目标

本轮目标是为 `web/ldap-injection` 建立案例化实验执行文档，先锁定学习目标、案例边界、后续目录结构、元数据策略和验证方式。

LDAP 注入一期不做真实交互靶场，目标是让学习者从攻击方视角理解：

- 用户输入如何进入目录服务过滤条件。
- 漏洞版为什么会让过滤条件语义偏离原本业务意图。
- 修复版为什么需要服务端查询模板、字段允许列表和过滤器转义。
- 真实生产中为什么还需要最小权限、账号策略和审计。

本实验不提供真实 LDAP 查询能力，不连接真实目录服务，不生成对外 LDAP 查询脚本。

## 2. 范围

本轮执行文档覆盖：

- `web/ldap-injection` 的案例化定位。
- 后续实验目录和文档结构。
- 后续 `meta.json` 建议字段与状态。
- 漏洞案例、修复案例和 mock 说明的内容边界。
- 是否需要脚本目录以及脚本允许做什么。
- 最小验证方式。

本轮不包含：

- 不新增后端 API。
- 不新增前端页面。
- 不新增数据库表或迁移。
- 不新增 `labs/web/ldap-injection/` 目录。
- 不新增 `tools/lab-scripts/web/ldap-injection/` 脚本目录。
- 不接入真实 LDAP 服务、目录账号、组织结构或凭据。

## 3. 落地方式

一期落地方式为：

```text
mode: case-study
status: planned
```

选择案例化的原因：

- 当前项目没有 LDAP 服务。
- Windows 本机且暂不使用 Docker，引入目录服务会显著增加运行成本。
- LDAP 绑定账号、目录结构和组织数据容易触碰真实凭据与隐私边界。
- 对初学者而言，先理解过滤条件拼接、查询意图变化和修复思路，比搭建目录服务更有学习价值。

后续若要从案例化升级为交互式演示，必须另写执行文档，并先确认：

- 是否仍然不连接真实 LDAP 服务。
- 是否只使用内存虚拟目录数据。
- 是否不提供通用过滤器执行器。
- 是否不写入或展示真实目录凭据。

## 4. 建议业务案例

一期建议使用三个案例，但均只做文档化或静态演示，不执行真实查询。

### 4.1 组织成员搜索

业务意图：

- 用户输入姓名关键词。
- 系统只应搜索当前组织的成员。

风险观察：

- 攻击方关注“姓名关键词是否被拼进过滤条件”。
- 漏洞版示意输入影响过滤条件语义后，结果范围可能偏离当前组织。
- 修复版示意服务端固定组织范围和查询模板，只把关键词作为文本值处理。

### 4.2 权限组查询

业务意图：

- 管理员按组名搜索权限组。
- 普通用户只能查看允许范围内的组。

风险观察：

- 攻击方关注“组名输入是否能影响权限范围条件”。
- 漏洞版示意输入改变过滤条件后，可能暴露不该展示的组名。
- 修复版示意服务端强制角色边界，不接受客户端传入权限过滤结构。

### 4.3 登录筛选案例

业务意图：

- 登录流程按用户名定位候选用户，再进行密码或凭据校验。

风险观察：

- 攻击方关注“用户名是否参与目录过滤条件拼接”。
- 漏洞版示意过滤条件语义偏移可能影响候选用户定位。
- 修复版强调登录不能依赖可拼接过滤条件，且必须有独立凭据校验、失败计数和审计。

## 5. 安全边界

后续所有 LDAP 注入内容必须遵守：

- 不连接真实 LDAP / AD / OpenLDAP 服务。
- 不进行真实 bind、search、modify 或 delete 操作。
- 不保存目录账号、组织结构、DN、真实邮箱、真实手机号或凭据。
- 不读取本机目录服务配置。
- 不请求外部目标。
- 不提供可对外复用的 LDAP 查询脚本。
- 不提供通用过滤器 payload 库。
- 不实现任意 LDAP 过滤器执行器。
- 不把完整危险输入、真实凭据、真实 token、真实 Cookie 或外部目标信息写入日志。
- 不在前端展示原始 `inputSummaryJson`。

允许内容：

- 使用固定案例标签描述风险，例如 `member-search-scope-risk`。
- 使用脱敏伪数据说明查询意图变化。
- 使用文字化的“漏洞意图 / 修复意图”对照，不输出可直接复用的攻击字符串。
- 说明真实生产需要过滤器转义、模板化、最小权限和审计。

## 6. 后续目录规划

后续目录切片建议新增：

```text
labs/web/ldap-injection/
├─ meta.json
├─ README.md
├─ vuln/README.md
├─ fixed/README.md
├─ mock/README.md
└─ docs/
   ├─ attack-steps.md
   ├─ fix-notes.md
   └─ manual-verification.md
```

脚本目录一期可以暂不创建。若后续为了统一结构创建脚本目录，只允许提供文档一致性验证脚本：

```text
tools/lab-scripts/web/ldap-injection/
├─ README.md
└─ verify.ts
```

脚本不得：

- 命名或描述为对外 LDAP 攻击工具。
- 连接 LDAP 服务。
- 请求网络目标。
- 生成过滤器 payload。
- 保存凭据或 Cookie。

## 7. 元数据建议

后续 `meta.json` 建议：

- `id`: `web.ldap-injection`
- `slug`: `ldap-injection`
- `title`: `LDAP 注入`
- `category`: `web`
- `subcategory`: `ldap-injection`
- `mode`: `case-study`
- `status`: `planned`
- `severity`: `high`
- `difficulty`: `intermediate`

变体建议保留：

- `vuln`：漏洞案例，用于解释过滤条件拼接风险。
- `fixed`：修复案例，用于解释模板化、转义和权限边界。

初始阶段只登记 docs 入口，不登记 web / api / scripts 入口。只有后续真实创建对应页面、接口或脚本后，才允许补充对应 entrypoints。

## 8. 案例文档要求

### 8.1 `README.md`

必须说明：

- 本实验是案例化学习，不是真实 LDAP 靶场。
- 为什么一期不连接真实 LDAP 服务。
- 学习者应该观察输入、过滤条件意图、结果范围和修复策略。
- 后续若升级为交互式模拟，需要重新写执行文档。

### 8.2 `vuln/README.md`

必须说明：

- 漏洞点是“用户输入影响目录过滤条件语义”。
- 案例只展示风险路径，不提供可复用攻击字符串。
- 漏洞版观察重点是查询范围、权限边界和候选用户定位风险。

### 8.3 `fixed/README.md`

必须说明：

- 修复不是靠前端隐藏输入框。
- 修复点在服务端固定查询模板、过滤器转义、字段允许列表和权限边界。
- 真实生产还需要目录账号最小权限、失败审计、异常告警和账号策略。

### 8.4 `mock/README.md`

只允许保存脱敏伪案例说明：

- 伪组织名称。
- 伪成员角色。
- 伪权限组。
- 固定案例标签。

不得保存真实目录结构、真实 DN、真实邮箱、真实手机号或真实凭据。

### 8.5 `docs/attack-steps.md`

从攻击方视角描述观察步骤：

- 识别输入点。
- 判断输入是否参与过滤条件。
- 观察业务约束是否由服务端固定。
- 观察漏洞案例中结果范围为何偏离。

不得提供真实可复制过滤器 payload。

### 8.6 `docs/fix-notes.md`

必须覆盖：

- 服务端查询模板。
- 字段允许列表。
- 过滤器转义。
- 最小权限目录账号。
- 登录场景的独立凭据校验。
- 日志审计与异常告警。

### 8.7 `docs/manual-verification.md`

手动验证只检查文档和元数据：

- `mode` 是否为 `case-study`。
- `status` 是否与入口一致。
- 是否未登记不存在的 web / api / scripts 入口。
- 文档是否明确“不连接真实 LDAP 服务”。
- 文档是否未包含真实凭据或外部目标。

## 9. 日志策略

一期案例化阶段不新增后端事件日志写入，因为没有真实交互动作和受控 API。

若后续新增静态前端案例页，可只记录学习复盘类事件，例如：

- 案例已阅读。
- 防御问题已完成。
- 学习者完成手动验证。

即便后续记录事件，也只能写入：

- `labKey`: `web.ldap-injection`
- 案例 key。
- 视角：`attacker` / `defender` / `reviewer`
- 学习信号。
- 完成状态。

不得写入：

- 完整危险输入。
- LDAP 过滤器字符串。
- 目录账号。
- DN。
- 邮箱、手机号或凭据。
- 外部目标信息。
- 原始 `inputSummaryJson` 前端展示。

## 10. 实施步骤

建议后续分两步推进。

第一步：目录与文档切片。

1. 创建 `labs/web/ldap-injection/` 标准目录。
2. 创建 `meta.json`，状态为 `planned`，模式为 `case-study`。
3. 创建 README、漏洞案例、修复案例、mock、攻击步骤、修复说明和手动验证文档。
4. 只登记 docs 入口。
5. 补充共享元数据测试，确认 planned/docs-only 元数据合法。
6. 更新 `docs/TODO.md` 和总纲。

第二步：可选静态案例页。

1. 单独编写新的执行文档。
2. 决定是否新增前端静态案例页。
3. 如新增页面，只展示固定案例，不接后端 LDAP 查询。
4. 如新增脚本，只做文档/元数据一致性验证。
5. 补齐对应前端路由和测试。

## 11. 潜在风险分析

- 真实 LDAP 服务会引入账号、组织结构、目录权限和本机部署复杂度，因此一期不接入。
- 直接给出过滤器 payload 容易把案例变成可复用攻击教程，因此文档只描述风险意图和防御方式。
- 如果误登记 web / api / scripts 入口，会让平台误认为实验已可运行，因此 planned 阶段只登记 docs。
- 如果后续创建脚本，脚本名称和说明必须避免被理解为通用攻击工具。
- 如果后续做前端案例页，必须继续避免展示原始输入摘要 JSON 或可复制危险字符串。

## 12. 优化方案

- 先用案例化文档把概念讲清楚，再决定是否值得做虚拟目录模拟器。
- 复用现有实验元数据扫描和详情页，不为 LDAP 单独发明入口结构。
- 把 LDAP 与 SQL / NoSQL / XPath 做横向对比，强调“查询语言不同，但输入不能改变查询结构”的共同点。
- 将真实生产防护拆成模板化、转义、最小权限、审计、账号策略五类，方便学习者复盘。

## 13. 验证方式

本轮执行文档完成后运行：

```powershell
git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/design/injection-remaining-labs.md
rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/design/injection-remaining-labs.md
rg -n "真实 LDAP|OpenLDAP|AD|凭据|外部目标|payload 库|不连接真实 LDAP|不提供对外 LDAP 查询脚本" docs/execution/2026-06-30-web-ldap-injection-lab.md
```

后续目录切片完成后建议运行：

```powershell
pnpm --filter @network-safe/shared test
git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md labs/web/ldap-injection packages/shared/tests/lab-metadata.test.mjs
rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md labs/web/ldap-injection packages/shared/tests/lab-metadata.test.mjs
```

## 14. 完成判定

本执行文档切片完成后，应满足：

- 明确 LDAP 一期为 `case-study`。
- 明确不连接真实 LDAP 服务。
- 明确不保存目录账号、组织结构或凭据。
- 明确不提供对外 LDAP 查询脚本。
- 明确后续目录、元数据、文档和验证方式。
- TODO 和总纲同步下一步状态。
- 文档空白检查通过。

后续只有完成目录与文档切片后，才允许在 `labs/web/ldap-injection/meta.json` 中登记 docs 入口；只有真实创建页面、API 或脚本后，才允许登记对应入口。

## 15. 下一步

下一步进入 `web/ldap-injection` 目录与文档切片：创建 `labs/web/ldap-injection/`、planned/case-study 元数据和基础案例文档，暂不创建后端 API、前端页面或 LDAP 查询脚本。

## 16. 本轮执行结果

本轮已完成执行文档与进度同步：

- 新增本文档。
- 同步 `docs/TODO.md`。
- 同步 `docs/execution/security-lab-master-goal.md`。
- 同步 `docs/design/injection-remaining-labs.md` 的当前执行状态。

验证记录：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/design/injection-remaining-labs.md` 未发现空白错误，仅有 `docs/TODO.md` 的既有 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/design/injection-remaining-labs.md` 未发现目标文档行尾空白。
- 安全边界关键词检查确认本文档已明确 `case-study`、`planned`、不连接真实 LDAP、不保存目录账号、不提供对外 LDAP 查询脚本、不生成过滤器 payload 库和不实现任意 LDAP 过滤器执行器。
- 风险关键词扫描仅命中禁止展示原始 `inputSummaryJson` 的说明，未发现真实 LDAP URL、ldapsearch / ldapmodify / bindDN、文件读取、外部请求、动态执行或命令执行内容。

## 17. 目录与案例文档切片结果

本轮已完成目录与案例文档切片：

- 新增 `labs/web/ldap-injection/meta.json`。
- 新增 `labs/web/ldap-injection/README.md`。
- 新增 `labs/web/ldap-injection/vuln/README.md`。
- 新增 `labs/web/ldap-injection/fixed/README.md`。
- 新增 `labs/web/ldap-injection/mock/README.md`。
- 新增 `labs/web/ldap-injection/docs/attack-steps.md`。
- 新增 `labs/web/ldap-injection/docs/fix-notes.md`。
- 新增 `labs/web/ldap-injection/docs/manual-verification.md`。
- 补充 `packages/shared/tests/lab-metadata.test.mjs`，确认 LDAP 元数据保持 planned/docs-only/case-study。

当前状态：

- `meta.json` 状态为 `planned`。
- `mode` 为 `case-study`。
- `entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 均为空数组。
- `verification.automation.supported` 为 `false`。
- 当前未创建后端 API、前端页面或 LDAP 查询脚本。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，23 项测试通过。
- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/design/injection-remaining-labs.md labs/web/ldap-injection packages/shared/tests/lab-metadata.test.mjs` 未发现空白错误，仅有 `docs/TODO.md` 与 `packages/shared/tests/lab-metadata.test.mjs` 的既有 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/design/injection-remaining-labs.md labs/web/ldap-injection packages/shared/tests/lab-metadata.test.mjs` 未发现目标文件行尾空白。
- `rg -n "ldap://|ldaps://|ldapsearch|ldapmodify|ldapdelete|ldapadd|bindDN|password|process\\.env|createReadStream|readFile|http\\.request|https\\.request|eval\\(|new Function|child_process" labs/web/ldap-injection` 未命中。
- `Test-Path -LiteralPath tools\\lab-scripts\\web\\ldap-injection` 返回 `False`，确认本轮未创建 LDAP 脚本目录。

后续已单独编写静态案例页执行文档，并完成前端静态页面切片。

## 18. 静态案例页切片结果

本轮已完成静态案例页切片：

- 新增 `docs/execution/2026-06-30-web-ldap-injection-static-case-page.md`。
- 新增 `apps/web/src/labs/ldap-injection.ts`。
- 新增 `apps/web/src/views/LdapInjectionLabView.vue`。
- 新增 `/labs/web/ldap-injection/vuln` 与 `/labs/web/ldap-injection/fixed` 路由。
- 更新 `labs/web/ldap-injection/meta.json` 为 `in-progress`。
- 元数据当前只登记 web 与 docs 入口，api / scripts 入口仍为空。
- 更新 LDAP README、攻击步骤、修复案例说明和手动验证文档。
- 补充前端 helper 测试、路由测试和共享元数据测试。

当前仍不包含：

- 后端 API。
- 事件日志写入。
- LDAP 查询脚本。
- 真实 LDAP / AD / OpenLDAP 服务连接。
- 可复制过滤器 payload 或通用过滤器执行器。

验证记录：

- `pnpm --filter @network-safe/web exec vitest run tests/ldap-injection-lab.test.ts tests/router.test.ts` 通过，2 个测试文件、5 项测试通过。
- `pnpm --filter @network-safe/shared test` 通过，23 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- 目标文件 `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- 目标文件行尾空白扫描未命中。
- LDAP 静态页、helper 与场景文档安全关键词扫描未命中。
- `Test-Path -LiteralPath tools\lab-scripts\web\ldap-injection` 返回 `False`，确认本轮未创建 LDAP 脚本目录。

后续已单独编写文档一致性验证脚本执行文档，并完成只读脚本入口切片。

## 19. 文档一致性验证脚本切片结果

本轮已完成文档一致性验证脚本切片：

- 新增 `docs/execution/2026-06-30-web-ldap-injection-consistency-verify.md`。
- 新增 `tools/lab-scripts/web/ldap-injection/README.md`。
- 新增 `tools/lab-scripts/web/ldap-injection/verify.ts`。
- 更新 `labs/web/ldap-injection/meta.json`，登记 `ldap-injection-verify` 脚本入口。
- `entrypoints.api` 仍为空数组。
- `verification.automation.supported` 为 `true`，但仅表示接入只读文档一致性验证脚本。
- `variants[].supportsAutomation` 仍为 `false`，不表示存在自动化攻防差异验证。
- 更新 LDAP README、手动验证文档和共享元数据测试。

当前仍不包含：

- 后端 API。
- 事件日志写入。
- Python 攻击脚本。
- LDAP 查询脚本。
- 真实 LDAP / AD / OpenLDAP 服务连接。
- 可复制过滤器 payload 或通用过滤器执行器。

验证记录：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ldap-injection/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，23 项测试通过。
- 目标文件 `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- 目标文件行尾空白扫描未命中。
- LDAP 脚本目录与场景文档安全关键词扫描未命中。

## 20. 虚拟目录 API 切片结果

本轮已完成受控虚拟目录 API 后端切片：

- 新增 `docs/execution/2026-06-30-web-ldap-injection-virtual-directory-api.md`。
- 新增 `apps/server/src/services/ldap-injection-lab.ts`，只使用内存虚拟目录数据。
- 新增 `POST /api/labs/web/ldap-injection/:variant/search`，支持 `vuln` / `fixed` 两个受控变体。
- 漏洞版固定受控样例触发 `ldap-injection-scope-expanded`，只扩大虚拟教学结果范围。
- 修复版同样样例触发 `ldap-injection-controlled-sample-blocked`。
- LDAP 事件已接入 `lab_event_logs`，日志只写入场景、关键词长度、脱敏预览、风险类型、结果范围、条目数量和学习信号。
- 更新 `labs/web/ldap-injection/meta.json`，登记虚拟目录 API 和 API 测试。
- 更新只读一致性验证脚本，使其校验静态页面、虚拟目录 API、文档和脚本入口一致性。

当前仍不包含：

- Python 攻击脚本。
- LDAP 查询脚本。
- 真实 LDAP / AD / OpenLDAP 服务连接。
- 可复制过滤器 payload 或通用过滤器执行器。

验证记录：

- `pnpm --filter @network-safe/server test -- tests/ldap-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该脚本实际运行服务端全量测试，154 项通过。

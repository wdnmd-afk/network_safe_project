# LDAP 注入静态案例页执行文档

## 1. 目标

本轮目标是在保持 `web/ldap-injection` 案例化边界的前提下，补充前端静态案例页，让实验详情页可以进入漏洞案例和修复案例两个页面。

页面只用于学习过滤条件拼接风险、服务端查询模板、防御边界和生产补充措施，不提供真实 LDAP 查询、后端接口、脚本或事件日志写入。

## 2. 范围

本轮包含：

- 新增 `apps/web/src/labs/ldap-injection.ts`，集中维护静态案例数据、变体配置和学习信号文案。
- 新增 `apps/web/src/views/LdapInjectionLabView.vue`，展示漏洞案例 / 修复案例的固定观察清单。
- 新增 `/labs/web/ldap-injection/vuln` 与 `/labs/web/ldap-injection/fixed` 前端路由。
- 更新 `labs/web/ldap-injection/meta.json`，登记已存在的 web 入口，状态从 `planned` 调整为 `in-progress`。
- 更新 LDAP 实验 README、手动验证文档、共享元数据测试和前端路由 / helper 测试。
- 同步 `docs/TODO.md`、总纲和注入类规划文档。

本轮不包含：

- 不新增后端 API。
- 不新增数据库表或迁移。
- 不写入 `lab_event_logs`。
- 不新增 `tools/lab-scripts/web/ldap-injection/`。
- 不连接真实 LDAP / AD / OpenLDAP 服务。
- 不执行真实 bind、search、modify 或 delete。
- 不展示或保存真实目录账号、组织结构、DN、邮箱、手机号、凭据或外部目标信息。
- 不提供可复制过滤器 payload、通用 payload 库或任意 LDAP 过滤器执行器。

## 3. 实施建议

前端页面采用静态案例页，而不是可提交表单：

1. 漏洞版页面说明攻击方观察路径：输入点、服务端边界、结果范围偏移、日志观察点。
2. 修复版页面说明防御路径：查询模板、字段允许列表、过滤器转义、最小权限和审计。
3. 页面只展示固定案例标签和描述性文本，不展示 LDAP 过滤器字符串。
4. 页面不导入后端 API client，不读取 session token，不写学习进度或验证记录。
5. 元数据只补充 web 入口，`entrypoints.api` 与 `entrypoints.scripts` 保持空数组。
6. `verification.automation.supported` 保持 `false`，因为本轮没有可运行攻防差异验证，只做前端静态模型和路由测试。

## 4. 操作步骤

1. 新增静态案例 helper：
   - 定义 `LdapInjectionVariantKey`。
   - 定义 `getLdapInjectionVariantConfig`。
   - 定义 `ldapInjectionCaseStudies`、`ldapInjectionReviewChecklist` 和 `formatLdapInjectionSignal`。
2. 新增静态案例页面：
   - 复用现有 `page-section two-column`、`section-heading`、`variant-switch`、`lab-note`、`status-panel` 风格。
   - 漏洞版和修复版通过路由 `props.variant` 切换文案。
   - 不加入输入框、提交按钮或后端请求。
3. 更新路由：
   - `/labs/web/ldap-injection/vuln`
   - `/labs/web/ldap-injection/fixed`
4. 更新元数据：
   - `status` 改为 `in-progress`。
   - `variants[].entryKey` 改为对应 web 入口 key。
   - `entrypoints.web` 登记两个静态页面。
   - `entrypoints.api` 与 `entrypoints.scripts` 保持空数组。
5. 更新文档：
   - README 和手动验证说明新增静态页面入口。
   - TODO、总纲和注入类规划记录本轮进度。
6. 补充测试：
   - 新增 `apps/web/tests/ldap-injection-lab.test.ts`。
   - 更新 `apps/web/tests/router.test.ts`。
   - 更新 `packages/shared/tests/lab-metadata.test.mjs`。

## 5. 潜在风险分析

- 静态页面如果出现输入框或可复制过滤器字符串，容易被误解为攻击工具，因此本轮只展示固定案例标签和解释性文字。
- 若误将 `status` 标记为 `ready`，会让平台误认为 LDAP 实验已有完整可运行攻防闭环，因此只调整到 `in-progress`。
- 若误登记 API 或 scripts 入口，会与实际实现不一致，因此本轮保持空数组并由测试锁定。
- 静态页面不写事件日志，实验详情页的最近事件复盘会为空，这是预期行为；后续如需学习进度或复盘事件，需要另写执行文档。

## 6. 优化方案

- 先用静态页面承接学习路径，避免把 LDAP 服务搭建成本提前引入当前阶段。
- 后续若要升级为交互式模拟，可使用内存虚拟目录数据与固定案例标签，但仍不得连接真实目录服务。
- 可在后续复盘模块中为 case-study 实验设计“阅读完成”记录，但需要独立设计事件类型与日志摘要。

## 7. 验证方式

本轮完成后运行最小必要验证：

```powershell
pnpm --filter @network-safe/web exec vitest run tests/ldap-injection-lab.test.ts tests/router.test.ts
pnpm --filter @network-safe/shared test
pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit
git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/execution/2026-06-30-web-ldap-injection-static-case-page.md docs/design/injection-remaining-labs.md labs/web/ldap-injection apps/web/src/labs/ldap-injection.ts apps/web/src/views/LdapInjectionLabView.vue apps/web/src/router/routes.ts apps/web/src/styles/main.css apps/web/tests/ldap-injection-lab.test.ts apps/web/tests/router.test.ts packages/shared/tests/lab-metadata.test.mjs
rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/execution/2026-06-30-web-ldap-injection-static-case-page.md docs/design/injection-remaining-labs.md labs/web/ldap-injection apps/web/src/labs/ldap-injection.ts apps/web/src/views/LdapInjectionLabView.vue apps/web/src/router/routes.ts apps/web/src/styles/main.css apps/web/tests/ldap-injection-lab.test.ts apps/web/tests/router.test.ts packages/shared/tests/lab-metadata.test.mjs
Test-Path -LiteralPath tools\lab-scripts\web\ldap-injection
```

其中 `Test-Path` 预期返回 `False`。

另需对 `labs/web/ldap-injection`、`apps/web/src/labs/ldap-injection.ts` 和 `apps/web/src/views/LdapInjectionLabView.vue` 执行 LDAP 安全边界关键词扫描，确认未出现真实连接地址、目录命令、外部请求、文件读取、动态执行或命令执行能力。

## 8. 完成判定

本轮完成后应满足：

- 前端存在漏洞案例和修复案例静态页面入口。
- 页面不依赖后端 API、session token 或事件日志写入。
- 元数据状态为 `in-progress`，只登记 web 和 docs 入口。
- API 和 scripts 入口仍为空。
- 文档继续明确不连接真实 LDAP 服务、不提供查询脚本、不展示原始输入摘要。
- 前端 helper / router 测试、共享元数据测试和 Vue 类型检查通过。

## 9. 本轮执行结果

本轮已按本文档完成静态案例页切片：

- 新增 LDAP 静态案例 helper。
- 新增漏洞案例 / 修复案例 Vue 页面。
- 新增两条前端路由。
- 更新 LDAP 元数据为 `in-progress`，并只登记 web 与 docs 入口。
- 更新 LDAP 场景文档、TODO、总纲和注入类规划文档。
- 补充前端 helper 测试、路由测试和共享元数据测试。

验证记录：

- `pnpm --filter @network-safe/web exec vitest run tests/ldap-injection-lab.test.ts tests/router.test.ts` 通过，2 个测试文件、5 项测试通过。
- `pnpm --filter @network-safe/shared test` 通过，23 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- 目标文件 `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- 目标文件行尾空白扫描未命中。
- LDAP 静态页、helper 与场景文档安全关键词扫描未命中。
- `Test-Path -LiteralPath tools\lab-scripts\web\ldap-injection` 返回 `False`，确认本轮未创建 LDAP 脚本目录。

当前限制：

- 仍无后端 API。
- 仍不写入事件日志。
- 当前静态页切片本身未创建脚本；后续切片已补充只读文档一致性验证脚本。
- 仍无 LDAP 查询脚本或攻击脚本。
- 仍不连接真实 LDAP / AD / OpenLDAP 服务。

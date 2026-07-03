# 鱼叉式钓鱼目录与 planned 元数据执行文档

## 1. 目标

本轮目标是在 `docs/execution/2026-07-03-social-spear-phishing-boundary-design.md` 的约束下，建立 `social/spear-phishing` 的标准实验目录、`planned` 元数据和基础文档入口。

本轮只建立文档和元数据入口，不实现页面、API、数据库写入、事件日志写入、真实画像采集、真实投递、凭据收集、模板生成、第三方平台调用或攻击脚本。

## 2. 范围

本轮新增：

- `labs/social/spear-phishing/meta.json`
- `labs/social/spear-phishing/README.md`
- `labs/social/spear-phishing/vuln/README.md`
- `labs/social/spear-phishing/fixed/README.md`
- `labs/social/spear-phishing/mock/README.md`
- `labs/social/spear-phishing/docs/attack-steps.md`
- `labs/social/spear-phishing/docs/fix-notes.md`
- `labs/social/spear-phishing/docs/manual-verification.md`
- `tools/lab-scripts/social/spear-phishing/README.md`

本轮同步：

- `packages/shared/tests/lab-metadata.test.mjs`
- `apps/server/tests/health.test.ts`
- `apps/server/tests/lab-registry.test.ts`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

## 3. 实施建议

- 元数据状态保持 `planned`。
- 模式使用 `case-study`，表示首版只做固定虚构案例与流程复盘。
- `entrypoints.docs` 只登记真实存在的文档入口。
- `entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 保持空数组。
- `verification.automation.supported` 保持 `false`。
- `variants[].supportsAutomation` 保持 `false`。
- 脚本目录只提供 README 边界说明，不提供 `exploit.py`、`verify.ts`、投递脚本、模板生成脚本或第三方平台连接脚本。
- 文档必须明确当前不采集真实姓名、邮箱、手机号、公司、部门、职位、社交账号、组织关系或公开资料。
- 文档必须明确当前不发送真实邮件、短信、消息或链接，不生成可投递标题库、正文模板库、附件诱导文案、跟踪链接或群发脚本。

## 4. 潜在风险

- 如果登记未实现页面或 API，平台会误以为鱼叉式钓鱼实验已经可运行。
- 如果使用真实人员、真实组织或真实业务上下文，可能引入隐私、骚扰或误用风险。
- 如果提供完整话术、标题库、正文模板库或附件诱导文案，可能被误用为可投递素材。
- 如果创建 `exploit.py`、投递脚本、跟踪链接或第三方平台连接能力，容易让案例化学习变成攻击工具。
- 如果后续日志保存真实业务材料、姓名、邮箱或链接，会违反项目日志脱敏约束。

## 5. 优化方案

- 使用固定案例 key、风险标签、流程节点和复盘问题替代完整邮件、短信或 IM 话术。
- 使用“角色核验 / 可信通道二次确认 / 审批链 / 最小授权 / 隔离举报”固定动作替代真实投递流程。
- 后续 API 只允许固定案例 key 和固定检查策略 key，未知 key 必须阻断且不得回显原始输入。
- 后续日志只记录固定案例 key、风险类别、建议动作、后端决策和学习信号。
- 后续只读验证脚本只检查仓库内元数据、文档和边界，不发起 HTTP 请求，不连接外部服务。

## 6. 验证方式

- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- `rg --files labs/social/spear-phishing tools/lab-scripts/social/spear-phishing`
- 鱼叉式钓鱼安全关键词扫描，确认命中内容只属于禁止性说明、边界约束、历史进度或字段 / 路径名。

## 7. 本轮完成条件

- `social/spear-phishing` 标准目录和 planned 元数据存在。
- 元数据只登记 docs 入口，不登记 web、api 或 scripts 入口。
- README、漏洞版说明、修复版说明、mock 说明、攻击方观察步骤、修复说明和手动验证文档存在。
- 脚本目录只提供 README，不提供 `exploit.py` 或 `verify.ts`。
- 共享元数据测试和服务端索引测试同步新增场景总数与 planned 条目。
- 进度文档同步 `social/spear-phishing` 已进入 planned 元数据阶段。

## 8. 本轮执行结果

本轮已完成目录与 planned 元数据切片：

- 新增 `labs/social/spear-phishing/meta.json`，状态为 `planned`，模式为 `case-study`。
- 新增 README、针对性误判观察版说明、流程核验复盘版说明、固定虚构案例说明、攻击方观察步骤、修复说明和手动验证文档。
- 新增 `tools/lab-scripts/social/spear-phishing/README.md`，当前只说明脚本边界，不提供 `exploit.py` 或 `verify.ts`。
- 元数据当前只登记 docs 入口，`entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 均为空数组。
- `verification.automation.supported` 为 `false`，`variants[].supportsAutomation` 均为 `false`。
- 更新共享元数据测试，确认鱼叉式钓鱼 planned/docs-only 元数据合法。
- 更新服务端 health / registry 测试，本地元数据总数从 25 增加到 26，并确认 `social.spear-phishing` 为 planned 条目。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，34 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，203 项通过。
- `git diff --check -- <本轮目标文件>` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- `rg --files labs/social/spear-phishing tools/lab-scripts/social/spear-phishing` 确认当前脚本目录只包含 README，场景目录只包含元数据和文档。
- 鱼叉式钓鱼安全关键词扫描命中均为禁止性说明、安全边界说明、历史记录、测试断言或字段 / 路径名，未发现真实投递、画像采集、凭据收集、模板生成、第三方平台调用或攻击脚本实现。

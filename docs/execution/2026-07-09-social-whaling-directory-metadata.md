# 捕鲸攻击目录与 planned 元数据执行文档

## 1. 目标

本轮目标是在 `docs/execution/2026-07-03-social-whaling-boundary-design.md` 的约束下，建立 `social/whaling` 的标准实验目录、`planned` 元数据和基础文档入口。

本轮只建立文档和元数据入口，不实现页面、API、数据库写入、事件日志写入、真实高管画像采集、真实组织结构收集、真实投递、凭据收集、模板生成、第三方平台调用或攻击脚本。

## 2. 范围

本轮新增：

- `labs/social/whaling/meta.json`
- `labs/social/whaling/README.md`
- `labs/social/whaling/vuln/README.md`
- `labs/social/whaling/fixed/README.md`
- `labs/social/whaling/mock/README.md`
- `labs/social/whaling/docs/attack-steps.md`
- `labs/social/whaling/docs/fix-notes.md`
- `labs/social/whaling/docs/manual-verification.md`
- `tools/lab-scripts/social/whaling/README.md`

本轮同步：

- `packages/shared/tests/lab-metadata.test.mjs`
- `apps/server/tests/health.test.ts`
- `apps/server/tests/lab-registry.test.ts`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

## 3. 实施建议

- 元数据状态保持 `planned`。
- 模式使用 `case-study`，表示首版只做固定虚构高层决策案例和流程复盘。
- `entrypoints.docs` 只登记真实存在的文档入口。
- `entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 保持空数组。
- `verification.automation.supported` 保持 `false`。
- `variants[].supportsAutomation` 保持 `false`。
- 脚本目录只提供 README 边界说明，不提供 `exploit.py`、`verify.ts`、投递脚本、画像采集脚本、模板生成脚本或第三方平台连接脚本。
- 文档必须明确当前不采集真实高管、董事会成员、外部顾问、供应商、客户、组织结构、汇报关系或公开资料。
- 文档必须明确当前不生成完整邮件正文、IM 对话、会议邀请模板、付款指令、附件诱导文案、跟踪链接或群发脚本。

## 4. 潜在风险

- 如果登记未实现页面或 API，平台会误以为捕鲸攻击实验已经可运行。
- 如果使用真实高管、真实组织结构或真实业务交易语境，可能引入隐私、骚扰、诈骗素材或误用风险。
- 如果提供完整话术、会议邀请、付款指令、标题库、正文模板库或附件诱导文案，可能被误用为可投递素材。
- 如果创建 `exploit.py`、投递脚本、画像采集脚本或第三方平台连接能力，容易让案例化学习变成攻击工具。
- 如果后续日志保存真实付款、法务、董事会或并购资料，会违反项目日志脱敏约束。

## 5. 优化方案

- 使用固定案例 key、虚构角色标签、风险标签、流程节点和复盘问题替代完整邮件、短信或 IM 话术。
- 使用“大额付款双人复核 / 可信通道回拨 / 法务核验 / 董事会固定通道 / 例外冻结 / 最小授权 / 隔离举报”固定防御动作替代真实投递流程。
- 后续 API 只允许固定案例 key 和固定核验策略 key，未知 key 必须阻断且不得回显原始输入。
- 后续日志只记录固定案例 key、风险类别、建议动作、后端决策和学习信号。
- 后续只读验证脚本只检查仓库内元数据、文档和边界，不发起 HTTP 请求，不连接外部服务。

## 6. 验证方式

- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- `rg --files labs/social/whaling tools/lab-scripts/social/whaling`
- `Test-Path tools/lab-scripts/social/whaling/exploit.py` 返回 `False`
- `Test-Path tools/lab-scripts/social/whaling/verify.ts` 返回 `False`
- 捕鲸攻击安全关键词扫描，确认命中内容只属于禁止性说明、边界约束、历史进度或字段 / 路径名。

## 7. 本轮完成条件

- `social/whaling` 标准目录和 planned 元数据存在。
- 元数据只登记 docs 入口，不登记 web、api 或 scripts 入口。
- README、漏洞版说明、修复版说明、mock 说明、攻击方观察步骤、修复说明和手动验证文档存在。
- 脚本目录只提供 README，不提供 `exploit.py` 或 `verify.ts`。
- 共享元数据测试和服务端索引测试同步新增场景总数与 planned 条目。
- 进度文档同步 `social/whaling` 已进入 planned 元数据阶段。

## 8. 本轮执行结果

本轮已完成目录与 planned 元数据切片：

- 新增 `labs/social/whaling/meta.json`，状态为 `planned`，模式为 `case-study`。
- 新增 README、高权威误判观察版说明、高风险流程核验复盘版说明、mock 边界说明、攻击方观察步骤、修复说明和手动验证文档。
- 新增 `tools/lab-scripts/social/whaling/README.md`，当前只说明脚本边界，不提供 `exploit.py` 或 `verify.ts`。
- 元数据当前只登记 docs 入口，`entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 均为空数组。
- `verification.automation.supported` 为 `false`，`variants[].supportsAutomation` 均为 `false`。
- 更新共享元数据测试，确认捕鲸攻击 planned/docs-only 元数据合法。
- 更新服务端 health / registry 测试，本地元数据总数从 26 增加到 27，并确认 `social.whaling` 为 planned 条目。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，35 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，209 项通过。
- `git diff --check -- <本轮目标文件>` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- `rg --files labs/social/whaling tools/lab-scripts/social/whaling` 确认当前脚本目录只包含 README，场景目录只包含元数据和文档。
- `Test-Path tools/lab-scripts/social/whaling/exploit.py` 与 `Test-Path tools/lab-scripts/social/whaling/verify.ts` 均返回 `False`。
- 捕鲸攻击安全关键词扫描命中均为禁止性说明、安全边界说明、手动验证说明、历史规划或字段 / 路径名，未发现真实投递、画像采集、凭据收集、模板生成、第三方平台调用或攻击脚本实现。

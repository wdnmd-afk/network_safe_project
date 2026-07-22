# 2026-07-20 最新进展：65 个安全实验全量 ready 收口

- [x] 新增总执行文档 `docs/execution/2026-07-20-security-lab-master-completion.md`，锁定 65 个主题和剩余 38 个实验的实施范围。
- [x] 反向审计原有 27 个实验，并补齐 `web.xss` 手动验证记录到统一事件日志的脱敏链路。
- [x] `social/whaling` 完成 case-study ready 收口，补齐只读 `verify.ts`、脚本元数据和安全边界证据。
- [x] 新增 38 个主题的独立目录、文档、元数据、API、页面和验证入口。
- [x] 当前 65 个 `meta.json` 全部为 `ready`，共登记 9 个分类、130 个变体。
- [x] 本机数据库已存在 `lab_recap_question_completions`，Playwright 启动前通过 `schema:ensure` 做幂等补齐。
- [x] 修复通用 `evaluate` 路由遮蔽 Prompt 注入专用路由的问题，专用路由与通用路由回归均通过。
- [x] 服务端 221 项、前端 229 项、共享包 40 项、测试基础设施 9 项和 38 项逐场景验证全部通过。
- [x] 前后端类型检查通过，Prompt 注入与跨 9 分类代表性 Playwright 共 2 项通过。
- [x] 危险能力扫描确认新增实现不连接外部目标、不读取环境或浏览器凭据、不执行系统命令，也不包含恶意二进制样本。

当前状态：主总纲范围内 65 个安全学习实验已完成实现、元数据和自动化证据收口；后续新增主题按独立执行文档继续维护。

# 2026-07-09 最新进展：捕鲸攻击页面差异验证

- [x] 新增执行文档 `docs/execution/2026-07-09-social-whaling-playwright-verification.md`。
- [x] 更新 Playwright 页面级验证 `packages/testing/tests/e2e/platform.spec.mjs`，覆盖 `/labs/social/whaling/vuln` 与 `/labs/social/whaling/fixed`。
- [x] 页面级验证只登录本机 demo 用户，只访问固定路由，只点击固定按钮，并断言页面没有文本输入框。
- [x] 漏洞版验证 `accepted`、高权威误判学习信号和固定风险标签。
- [x] 修复版验证 `blocked`、冻结复核学习信号、可信通道和付款冻结状态。
- [x] 更新 `labs/social/whaling/meta.json`，登记 Playwright 页面差异验证证据，状态仍保持 `in-progress`，scripts 入口仍为空。
- [x] 同步共享元数据测试、捕鲸攻击 README、手动验证、脚本目录边界说明、下一波规划和主目标文档。
- [x] 当前仍不提供 `verify.ts`、`exploit.py`、真实高管画像采集、真实组织结构收集、真实投递、凭据收集、模板生成、第三方平台调用、会议邀请、付款指令、群发脚本或攻击脚本能力。

验证记录：
- `pnpm --filter @network-safe/testing e2e -- --grep "捕鲸攻击"` 通过，1 项 Playwright 测试通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/shared test` 通过，35 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/whaling-api.test.ts tests/whaling-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `git diff --check` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- `Test-Path tools/lab-scripts/social/whaling/exploit.py` 与 `Test-Path tools/lab-scripts/social/whaling/verify.ts` 均返回 `False`。
- 捕鲸攻击安全关键词扫描命中均为禁止性说明、安全边界说明、历史文档或固定字段 / 文档路径，未发现真实投递、画像采集、凭据收集、模板生成、第三方平台调用、会议邀请、付款指令或攻击脚本实现。

下一项建议：进入 `social/whaling` 只读一致性验证切片，只读取仓库内元数据、文档、前端、后端和测试文件，不发起 HTTP 请求，不读取 `.env`、凭据、Cookie、token 或真实业务材料。

# 2026-07-09 最新进展：捕鲸攻击前端固定案例工作台

- [x] 新增执行文档 `docs/execution/2026-07-09-social-whaling-frontend-workbench.md`。
- [x] 新增前端 API client `apps/web/src/api/whaling-lab.ts`，只提交固定 `caseKey` 和 `verificationPolicyKey`。
- [x] 新增前端实验模型 `apps/web/src/labs/whaling.ts`，集中维护固定高层决策案例、固定核验策略、默认策略、学习进度和验证记录安全摘要。
- [x] 新增前端工作台页面 `apps/web/src/views/WhalingLabView.vue`，接入 `/labs/social/whaling/vuln` 与 `/labs/social/whaling/fixed`。
- [x] 页面只提供固定案例选择器、固定核验策略选择器和固定样例按钮，不提供任意正文、真实人员、邮箱、链接、附件、付款信息、会议邀请、凭据或第三方平台参数输入。
- [x] 新增前端测试 `apps/web/tests/whaling-api.test.ts` 与 `apps/web/tests/whaling-lab.test.ts`，同步路由测试和共享元数据测试。
- [x] 更新 `labs/social/whaling/meta.json`，登记 web 入口，继续保持 scripts 入口为空、`variants[].supportsAutomation` 为 `false`。
- [x] 同步捕鲸攻击 README、漏洞版 / 修复版说明、攻击步骤、修复说明、手动验证、脚本目录边界说明、下一波规划和主目标文档。
- [x] 当前仍不提供 `verify.ts`、`exploit.py`、真实高管画像采集、真实组织结构收集、真实投递、凭据收集、模板生成、第三方平台调用、会议邀请、付款指令、群发脚本或攻击脚本能力。

验证记录：
- `pnpm --filter @network-safe/web exec vitest run tests/whaling-api.test.ts tests/whaling-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/shared test` 通过，35 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/whaling-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，215 项通过。
- `git diff --check` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- `Test-Path tools/lab-scripts/social/whaling/exploit.py` 与 `Test-Path tools/lab-scripts/social/whaling/verify.ts` 均返回 `False`。
- 捕鲸攻击安全关键词扫描命中均为禁止性说明、安全边界说明、测试反向断言或固定字段 / 文档路径，未发现真实投递、画像采集、凭据收集、模板生成、第三方平台调用、会议邀请、付款指令或攻击脚本实现。

下一项建议：进入 `social/whaling` 页面差异验证或只读一致性验证切片，继续只读取固定案例、固定策略和仓库内文档，不创建真实投递、画像采集、凭据收集、模板生成、第三方平台调用或攻击脚本能力。

# 2026-07-09 最新进展：捕鲸攻击后端固定案例 API

- [x] 新增执行文档 `docs/execution/2026-07-09-social-whaling-fixed-case-api.md`。
- [x] 新增后端固定案例服务 `apps/server/src/services/whaling-lab.ts`，只处理固定 `caseKey` 和 `verificationPolicyKey`。
- [x] 新增受控 API：
  - `POST /api/labs/social/whaling/vuln/review`
  - `POST /api/labs/social/whaling/fixed/review`
- [x] API 已接入登录校验和统一事件日志安全摘要，日志只记录固定 key、风险标签、建议动作、后端决策和学习信号。
- [x] 新增服务端测试 `apps/server/tests/whaling-lab.test.ts`，覆盖漏洞版误判观察、修复版阻断、未知 key 脱敏阻断、登录要求和日志摘要脱敏。
- [x] 更新 `labs/social/whaling/meta.json`，状态推进到 `in-progress`，只登记 docs 和 api 入口，web/scripts 入口仍为空。
- [x] 同步捕鲸攻击 README、漏洞版 / 修复版说明、攻击步骤、修复说明、手动验证、脚本目录边界说明、共享元数据测试、服务端 health / registry 测试和下一波规划。
- [x] 当前仍不提供页面、`verify.ts`、`exploit.py`、真实高管画像采集、真实组织结构收集、真实投递、凭据收集、模板生成、第三方平台调用、会议邀请、付款指令、群发脚本或攻击脚本能力。

验证记录：

- `pnpm --filter @network-safe/server test -- tests/whaling-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，215 项通过。
- `pnpm --filter @network-safe/shared test` 通过，35 项测试通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- `git diff --check` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- `Test-Path tools/lab-scripts/social/whaling/exploit.py` 与 `Test-Path tools/lab-scripts/social/whaling/verify.ts` 均返回 `False`。
- 捕鲸攻击安全关键词扫描命中均为禁止性说明、安全边界说明、测试反向断言、历史规划或字段 / 路径名，未发现真实投递、画像采集、凭据收集、模板生成、第三方平台调用、会议邀请、付款指令或攻击脚本实现。
- 下一项建议：进入 `social/whaling` 前端固定案例工作台切片，只提供固定案例选择器和固定核验策略选择器，不提供任意正文、真实人员、邮箱、链接、附件、付款信息、会议邀请或凭据输入。

# 2026-07-09 最新进展：捕鲸攻击固定案例文档

- [x] 新增执行文档 `docs/execution/2026-07-09-social-whaling-fixed-cases.md`。
- [x] 新增 `labs/social/whaling/docs/fixed-cases.md`，定义四个固定虚构高层决策案例卡：`executive-wire-approval`、`board-confidential-request`、`legal-settlement-transfer`、`ma-data-room-access`。
- [x] 每个案例只记录案例目标、虚构角色标签、误判线索、防御动作和学习信号，不提供完整邮件正文、IM 对话、会议邀请模板、可复制标题、可投递附件名、真实链接、付款指令、跟踪链接、模板库、群发脚本或第三方平台调用方式。
- [x] 更新 `labs/social/whaling/meta.json`，在 docs 入口登记 `fixed-cases`，状态仍保持 `planned`，模式仍保持 `case-study`。
- [x] `entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 继续为空数组，`verification.automation.supported` 和 `variants[].supportsAutomation` 继续保持 `false`。
- [x] 同步捕鲸攻击 README、mock 说明、攻击方观察步骤、手动验证文档和共享元数据测试。
- [x] 当前仍不提供页面、API、数据库写入、事件日志写入、`verify.ts`、`exploit.py`、真实高管画像采集、真实组织结构收集、真实投递、凭据收集、模板生成、第三方平台调用、会议邀请、付款指令、群发脚本或攻击脚本能力。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，35 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，209 项通过。
- `git diff --check -- <本轮目标文件>` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- `rg --files labs/social/whaling tools/lab-scripts/social/whaling` 确认当前脚本目录只包含 README，场景目录只包含元数据和文档。
- `Test-Path tools/lab-scripts/social/whaling/exploit.py` 与 `Test-Path tools/lab-scripts/social/whaling/verify.ts` 均返回 `False`。
- 捕鲸攻击安全关键词扫描命中均为禁止性说明、安全边界说明、手动验证说明、历史规划或字段 / 路径名，未发现真实投递、画像采集、凭据收集、模板生成、第三方平台调用、会议邀请、付款指令或攻击脚本实现。
- 下一项建议：进入 `social/whaling` 后端固定案例 API 切片，只读取固定案例 key 和固定核验策略 key，并接入统一事件日志安全摘要。

# 2026-07-09 最新进展：捕鲸攻击 planned 元数据

- [x] 新增执行文档 `docs/execution/2026-07-09-social-whaling-directory-metadata.md`。
- [x] 建立 `labs/social/whaling/` 标准目录。
- [x] 新增 `labs/social/whaling/meta.json`，状态为 `planned`，模式为 `case-study`。
- [x] 新增捕鲸攻击 README、高权威误判观察版说明、高风险流程核验复盘版说明、mock 边界说明、攻击方观察步骤、修复说明和手动验证文档。
- [x] 新增 `tools/lab-scripts/social/whaling/README.md`，当前只说明脚本边界，不提供 `exploit.py` 或 `verify.ts`。
- [x] 元数据当前只登记 docs 入口，`entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 均为空数组。
- [x] `verification.automation.supported` 为 `false`，`variants[].supportsAutomation` 均为 `false`。
- [x] 更新共享元数据测试和服务端 health / registry 测试，确认 `social.whaling` 为 planned 条目。
- [x] 当前仍不提供页面、API、数据库写入、事件日志写入、真实高管画像采集、真实组织结构收集、真实投递、凭据收集、模板生成、第三方平台调用、会议邀请模板、付款指令、群发脚本或攻击脚本能力。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，35 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，209 项通过。
- `git diff --check -- <本轮目标文件>` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- `rg --files labs/social/whaling tools/lab-scripts/social/whaling` 确认当前脚本目录只包含 README，场景目录只包含元数据和文档。
- `Test-Path tools/lab-scripts/social/whaling/exploit.py` 与 `Test-Path tools/lab-scripts/social/whaling/verify.ts` 均返回 `False`。
- 捕鲸攻击安全关键词扫描命中均为禁止性说明、安全边界说明、手动验证说明、历史规划或字段 / 路径名，未发现真实投递、画像采集、凭据收集、模板生成、第三方平台调用或攻击脚本实现。
- 下一项建议：进入 `social/whaling` 固定案例文档切片，继续不创建页面、API、脚本或自动化攻击能力。

# 2026-07-03 最新进展：捕鲸攻击边界设计

- [x] 新增执行文档 `docs/execution/2026-07-03-social-whaling-boundary-design.md`。
- [x] 将 `social/whaling` 首版定位为 `case-study`，只允许固定虚构高层决策案例、固定线索卡、固定风险标签和固定防御流程复盘。
- [x] 明确攻击方视角只用于观察高层授权压力、重大业务事件、董事会或外部顾问语境、保密理由、时间窗口压缩和越级审批如何造成流程失守。
- [x] 明确防御方视角重点覆盖大额付款双人复核、可信通道回拨、法务核验、董事会固定通道、例外冻结、最小授权、隔离举报和日志复盘。
- [x] 明确本轮不创建 `labs/social/whaling/`、`tools/lab-scripts/social/whaling/`、页面、API、数据库字段、元数据或脚本。
- [x] 当前仍不提供真实高管画像采集、真实组织结构收集、真实投递、凭据收集、模板生成、第三方平台调用、跟踪链接、附件诱导文案、会议邀请模板、付款指令、群发脚本或攻击脚本能力。
- [x] 同步 `docs/design/next-wave-security-labs.md`，将捕鲸攻击推进到边界设计阶段，并把下一步切片指向目录与 `planned` 元数据。

验证记录：

- `git diff --check -- docs/execution/2026-07-03-social-whaling-boundary-design.md docs/design/next-wave-security-labs.md docs/TODO.md docs/execution/security-lab-master-goal.md` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- docs/execution/2026-07-03-social-whaling-boundary-design.md docs/design/next-wave-security-labs.md docs/TODO.md docs/execution/security-lab-master-goal.md` 无命中。
- `Test-Path labs/social/whaling` 与 `Test-Path tools/lab-scripts/social/whaling` 均返回 `False`，确认本轮未创建实验目录或脚本目录。
- 捕鲸攻击边界设计安全关键词扫描命中均为禁止性说明、安全边界说明、风险控制说明、案例化学习说明或只读验证边界，未发现真实投递、画像采集、凭据收集、模板生成、第三方平台调用或攻击脚本实现。
- 下一项建议：进入 `social/whaling` 目录与 `planned` 元数据切片，先只登记 docs 入口，不创建页面、API、脚本或自动化攻击能力。

# 2026-07-03 最新进展：鱼叉式钓鱼 case-study ready 收口

- [x] 新增执行文档 `docs/execution/2026-07-03-social-spear-phishing-ready-closeout.md`。
- [x] 将 `labs/social/spear-phishing/meta.json` 从 `in-progress` 更新为 `ready`，ready 仅代表本项目内固定案例学习闭环完成。
- [x] 更新 `tools/lab-scripts/social/spear-phishing/verify.ts`，只读一致性验证脚本改为校验 `ready` 状态、case-study ready 边界、Playwright 页面差异验证、服务端 API 测试和只读脚本证据。
- [x] 同步共享元数据测试、服务端 health / registry 测试、鱼叉式钓鱼 README、固定案例、攻击步骤、修复说明、手动验证、脚本目录边界说明和下一波规划文档。
- [x] `variants[].supportsAutomation` 仍为 `false`，避免把 Playwright、API 测试或只读脚本误标为攻击脚本自动化。
- [x] 当前仍不提供 `exploit.py`、真实画像采集、真实投递、凭据收集、模板生成、第三方平台调用、跟踪链接、附件诱导文案、群发脚本或攻击脚本能力。

验证记录：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/social/spear-phishing/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，34 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/spear-phishing-api.test.ts tests/spear-phishing-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/spear-phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，209 项通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/testing e2e -- --grep "鱼叉式钓鱼"` 通过，1 项 Playwright 测试通过。
- `git diff --check` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `Test-Path tools/lab-scripts/social/spear-phishing/exploit.py` 返回 `False`。
- 鱼叉式钓鱼实现文件安全关键词窄扫描命中均为 `verify.ts` 内的禁止项检测片段和反向断言；脚本目录仅包含 `README.md` 与 `verify.ts`，未发现真实投递、画像采集、凭据收集、模板生成、第三方平台调用或攻击脚本实现。
- 下一项建议：进入新的扩展案例边界设计切片，例如社会工程学后续案例或下一波供应链 / 基础设施扩展；继续先写单独执行文档。

# 2026-07-03 最新进展：鱼叉式钓鱼只读一致性验证

- [x] 新增执行文档 `docs/execution/2026-07-03-social-spear-phishing-readonly-verification.md`。
- [x] 新增 `tools/lab-scripts/social/spear-phishing/verify.ts`，只读取仓库内鱼叉式钓鱼元数据、文档、前端、后端和测试文件，并输出 JSON 一致性报告。
- [x] 只读脚本校验 web / api / docs / scripts 入口、四个固定 `caseKey`、五个固定 `verificationPolicyKey`、四个学习信号、前端固定请求体、Playwright 无文本输入框断言、统一事件日志安全摘要和安全边界。
- [x] 更新 `labs/social/spear-phishing/meta.json`，登记 `spear-phishing-verify` scripts 入口和 scriptVerification 自动化证据，状态仍为 `in-progress`。
- [x] `variants[].supportsAutomation` 仍为 `false`，避免把只读验证脚本误标为攻击脚本自动化。
- [x] 同步共享元数据测试、鱼叉式钓鱼 README、漏洞版 / 修复版说明、攻击步骤、修复说明、手动验证文档、脚本目录边界说明、下一波规划和主目标文档。
- [x] 当前仍不提供 `exploit.py`、真实画像采集、真实投递、凭据收集、模板生成、第三方平台调用、跟踪链接、附件诱导文案、群发脚本或攻击脚本能力。

验证记录：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/social/spear-phishing/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/testing e2e -- --grep "鱼叉式钓鱼"` 通过，1 项 Playwright 测试通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/shared test` 通过，34 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/spear-phishing-api.test.ts tests/spear-phishing-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/spear-phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，209 项通过。
- `git diff --check` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `Test-Path tools/lab-scripts/social/spear-phishing/exploit.py` 返回 `False`。
- 下一项建议：进入 `social/spear-phishing` case-study ready 收口切片，继续保持固定案例选择器和固定核验策略选择器。

# 2026-07-03 最新进展：鱼叉式钓鱼页面差异验证

- [x] 新增执行文档 `docs/execution/2026-07-03-social-spear-phishing-playwright-verification.md`。
- [x] 更新 `packages/testing/tests/e2e/platform.spec.mjs`，新增鱼叉式钓鱼漏洞版误判与修复版核验页面差异验证。
- [x] Playwright 用例只登录本机演示账号，只访问 `/labs/social/spear-phishing/vuln` 和 `/labs/social/spear-phishing/fixed`，只点击固定按钮和固定选择器。
- [x] 漏洞版验证 `accepted` 决策、审批链绕过学习信号和固定风险标签。
- [x] 修复版验证 `blocked` 决策、可信通道二次确认学习信号、审批链复核与可信通道核验状态。
- [x] 用例断言页面没有文本输入框，不提供任意正文、真实人员、邮箱、链接、附件、凭据或投递参数输入。
- [x] 更新 `labs/social/spear-phishing/meta.json`，启用 Playwright 自动化证据，状态仍为 `in-progress`，scripts 入口仍为空。
- [x] 同步共享元数据测试、鱼叉式钓鱼 README、手动验证文档、脚本目录边界说明、下一波规划和主目标文档。
- [x] 当前仍不提供 `verify.ts`、`exploit.py`、真实画像采集、真实投递、凭据收集、模板生成、第三方平台调用、跟踪链接、附件诱导文案、群发脚本或攻击脚本能力。

验证记录：

- `pnpm --filter @network-safe/testing e2e -- --grep "鱼叉式钓鱼"` 通过，1 项 Playwright 测试通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/shared test` 通过，34 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/spear-phishing-api.test.ts tests/spear-phishing-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/spear-phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，209 项通过。
- 下一项建议：进入 `social/spear-phishing` 只读一致性验证切片，继续保持固定案例选择器和固定核验策略选择器。

# 2026-07-03 最新进展：鱼叉式钓鱼前端固定案例工作台

- [x] 新增执行文档 `docs/execution/2026-07-03-social-spear-phishing-frontend-workbench.md`。
- [x] 新增 `apps/web/src/api/spear-phishing-lab.ts`，API client 只提交固定 `caseKey` 和 `verificationPolicyKey`。
- [x] 新增 `apps/web/src/labs/spear-phishing.ts`，集中维护四个固定虚构案例、五个固定核验策略、默认策略、学习进度和验证记录安全摘要。
- [x] 新增 `apps/web/src/views/SpearPhishingLabView.vue`，提供 `/labs/social/spear-phishing/vuln` 和 `/labs/social/spear-phishing/fixed` 固定案例工作台。
- [x] 页面只提供固定案例选择器、固定核验策略选择器和固定样例按钮，不提供任意正文、真实人员、邮箱、链接、附件、凭据或投递参数输入。
- [x] 新增 `apps/web/tests/spear-phishing-api.test.ts` 与 `apps/web/tests/spear-phishing-lab.test.ts`，覆盖请求体边界、固定选项、默认策略、验证记录安全摘要和静态安全文案。
- [x] 更新前端路由、路由测试和共享样式选择器。
- [x] 更新 `labs/social/spear-phishing/meta.json`，登记 web、api 和 docs 入口，scripts 入口仍为空，状态仍为 `in-progress`。
- [x] 同步鱼叉式钓鱼 README、漏洞版 / 修复版说明、固定案例、攻击步骤、修复说明、手动验证、脚本目录边界说明、共享元数据测试和下一波规划文档。
- [x] 当前仍不提供 `verify.ts`、`exploit.py`、Playwright 页面差异验证、真实画像采集、真实投递、凭据收集、模板生成、第三方平台调用、跟踪链接、附件诱导文案、群发脚本或攻击脚本能力。

验证记录：

- `pnpm --filter @network-safe/web exec vitest run tests/spear-phishing-api.test.ts tests/spear-phishing-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/shared test` 通过，34 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/spear-phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，209 项通过。
- 下一项建议：进入 `social/spear-phishing` 页面差异验证或只读一致性验证切片，继续保持固定案例选择器和固定核验策略选择器。

# 2026-07-03 最新进展：鱼叉式钓鱼后端固定案例 API

- [x] 新增执行文档 `docs/execution/2026-07-03-social-spear-phishing-fixed-case-api.md`。
- [x] 新增 `apps/server/src/services/spear-phishing-lab.ts`，只处理四个固定虚构 `caseKey` 和五个固定 `verificationPolicyKey`。
- [x] 新增 `POST /api/labs/social/spear-phishing/:variant/review`，支持针对性误判观察版和流程核验复盘版。
- [x] API 已接入登录校验和统一事件日志安全摘要，日志只记录固定 key、风险类别、建议动作、后端决策和学习信号。
- [x] 未知 `caseKey` 或 `verificationPolicyKey` 会被阻断，并返回 `blocked-case` 或 `blocked-verification-policy`，不回显原始输入。
- [x] 新增 `apps/server/tests/spear-phishing-lab.test.ts`，覆盖漏洞版误判观察、修复版阻断、未知 key 脱敏阻断、登录要求和日志摘要脱敏。
- [x] 将 `labs/social/spear-phishing/meta.json` 从 `planned` 更新为 `in-progress`，只登记 docs 和 api 入口，不登记 web 或 scripts 入口。
- [x] 同步鱼叉式钓鱼 README、漏洞版 / 修复版说明、攻击步骤、修复说明、手动验证、脚本目录边界说明、共享元数据测试、服务端 health / registry 测试和下一波规划文档。
- [x] 当前仍不提供前端页面、`verify.ts`、`exploit.py`、真实画像采集、真实投递、凭据收集、模板生成、第三方平台调用、跟踪链接、附件诱导文案、群发脚本或攻击脚本能力。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，34 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/spear-phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，209 项通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- `git diff --check -- <本轮目标文件>` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- `Test-Path tools/lab-scripts/social/spear-phishing/exploit.py` 与 `Test-Path tools/lab-scripts/social/spear-phishing/verify.ts` 均返回 `False`。
- 鱼叉式钓鱼安全关键词扫描命中均为禁止性说明、安全边界说明、测试反向断言、文档路径或固定测试数据，未发现真实投递、画像采集、凭据收集、模板生成、第三方平台调用或攻击脚本实现。
- 下一项建议：进入 `social/spear-phishing` 前端固定案例工作台切片，只提供固定案例选择器和固定核验策略选择器。

# 2026-07-03 最新进展：鱼叉式钓鱼固定案例文档

- [x] 新增执行文档 `docs/execution/2026-07-03-social-spear-phishing-fixed-cases.md`。
- [x] 新增 `labs/social/spear-phishing/docs/fixed-cases.md`，定义四个固定虚构案例卡：`executive-invoice-approval`、`vendor-payment-change`、`engineering-access-request`、`hr-benefit-personalized`。
- [x] 每个案例只记录案例目标、虚构角色标签、误判线索、防御动作和学习信号，不提供完整邮件正文、IM 对话、可复制标题、可投递附件名、真实链接、跟踪链接、模板库、群发脚本或第三方平台调用方式。
- [x] 更新 `labs/social/spear-phishing/meta.json`，在 docs 入口登记 `fixed-cases`，状态仍保持 `planned`，模式仍保持 `case-study`。
- [x] `entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 继续为空数组，`verification.automation.supported` 和 `variants[].supportsAutomation` 继续保持 `false`。
- [x] 同步鱼叉式钓鱼 README、mock 说明、攻击方观察步骤、手动验证文档和共享元数据测试。
- [x] 当前仍不提供页面、API、数据库写入、事件日志写入、`verify.ts`、`exploit.py`、真实画像采集、真实投递、凭据收集、模板生成、第三方平台调用、跟踪链接、附件诱导文案、群发脚本或攻击脚本能力。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，34 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，203 项通过。
- `git diff --check -- <本轮目标文件>` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- `rg --files labs/social/spear-phishing tools/lab-scripts/social/spear-phishing` 确认当前脚本目录只包含 README，场景目录只包含元数据和文档。
- 鱼叉式钓鱼安全关键词扫描命中均为禁止性说明、安全边界说明、测试断言或文档路径，未发现真实投递、画像采集、凭据收集、模板生成、第三方平台调用或攻击脚本实现。
- 下一项建议：进入 `social/spear-phishing` 后端固定案例 API 切片，只读取固定案例 key 和固定检查策略 key，并接入统一事件日志安全摘要。

# 2026-07-03 最新进展：鱼叉式钓鱼 planned 元数据

- [x] 新增执行文档 `docs/execution/2026-07-03-social-spear-phishing-directory-metadata.md`。
- [x] 建立 `labs/social/spear-phishing/` 标准目录。
- [x] 新增 `labs/social/spear-phishing/meta.json`，状态为 `planned`，模式为 `case-study`。
- [x] 新增鱼叉式钓鱼 README、针对性误判观察版说明、流程核验复盘版说明、固定虚构案例说明、攻击方观察步骤、修复说明和手动验证文档。
- [x] 新增 `tools/lab-scripts/social/spear-phishing/README.md`，当前只说明脚本边界，不提供 `exploit.py` 或 `verify.ts`。
- [x] 元数据当前只登记 docs 入口，`entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 均为空数组。
- [x] `verification.automation.supported` 为 `false`，`variants[].supportsAutomation` 均为 `false`。
- [x] 更新共享元数据测试和服务端 health / registry 测试，确认 `social.spear-phishing` 为 planned 条目。
- [x] 当前仍不提供页面、API、数据库写入、事件日志写入、真实画像采集、真实投递、凭据收集、模板生成、第三方平台调用、跟踪链接、附件诱导文案、群发脚本或攻击脚本能力。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，34 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，203 项通过。
- `git diff --check -- <本轮目标文件>` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- `rg --files labs/social/spear-phishing tools/lab-scripts/social/spear-phishing` 确认当前脚本目录只包含 README，场景目录只包含元数据和文档。
- 鱼叉式钓鱼安全关键词扫描命中均为禁止性说明、安全边界说明、历史记录、测试断言或字段 / 路径名，未发现真实投递、画像采集、凭据收集、模板生成、第三方平台调用或攻击脚本实现。
- 下一项建议：进入 `social/spear-phishing` 固定案例文档切片，继续不创建页面、API、脚本或自动化攻击能力。

# 2026-07-03 最新进展：鱼叉式钓鱼边界设计

- [x] 新增执行文档 `docs/execution/2026-07-03-social-spear-phishing-boundary-design.md`。
- [x] 将 `social/spear-phishing` 首版定位为 `case-study`，只允许固定虚构案例、固定线索卡、固定风险标签和固定防御流程复盘。
- [x] 明确攻击方视角只用于观察针对性上下文、角色权威、审批链绕过、供应商 / 人事 / 工程协作语境和二次确认缺失如何造成误判。
- [x] 明确防御方视角重点覆盖角色核验、可信通道二次确认、审批链、供应商主数据变更流程、最小授权、隔离举报和日志复盘。
- [x] 明确本轮不创建 `labs/social/spear-phishing/`、`tools/lab-scripts/social/spear-phishing/`、页面、API、数据库字段、元数据或脚本。
- [x] 当前仍不提供真实画像采集、真实投递、凭据收集、模板生成、第三方平台调用、跟踪链接、附件诱导文案、群发脚本或攻击脚本能力。
- [x] 同步 `docs/design/next-wave-security-labs.md`，将鱼叉式钓鱼从“延后”推进到“边界设计阶段”，并把下一步切片指向目录与 `planned` 元数据。

验证记录：

- `git diff --check -- docs/execution/2026-07-03-social-spear-phishing-boundary-design.md docs/design/next-wave-security-labs.md docs/TODO.md docs/execution/security-lab-master-goal.md` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- docs/execution/2026-07-03-social-spear-phishing-boundary-design.md docs/design/next-wave-security-labs.md docs/TODO.md docs/execution/security-lab-master-goal.md` 无命中。
- `Test-Path labs/social/spear-phishing` 与 `Test-Path tools/lab-scripts/social/spear-phishing` 均返回 `False`，确认本轮未创建实验目录或脚本目录。
- 鱼叉式钓鱼边界设计安全关键词扫描命中均为禁止性说明、安全边界说明、历史记录或案例化学习说明，未发现真实投递、凭据收集、模板生成、第三方平台调用或攻击脚本实现。
- 下一项建议：进入 `social/spear-phishing` 目录与 `planned` 元数据切片，先只登记 docs 入口，不创建页面、API、脚本或自动化攻击能力。

# 2026-07-03 最新进展：配置错误 simulation ready 收口

- [x] 新增执行文档 `docs/execution/2026-07-03-infrastructure-misconfiguration-ready-closeout.md`。
- [x] 将 `labs/infrastructure/misconfiguration/meta.json` 从 `in-progress` 推进到 `ready`，并补充 ready 只代表本项目内固定配置样例学习闭环完成的安全边界。
- [x] 更新 `tools/lab-scripts/infrastructure/misconfiguration/verify.ts`，只读一致性验证脚本改为校验 `ready` 状态、固定配置样例学习边界、只读验证证据和不提供 `exploit.py`。
- [x] 同步共享元数据测试、服务端 health / registry 测试、配置错误 README、漏洞版 / 修复版说明、固定样例说明、攻击步骤、修复说明、手动验证、脚本目录边界说明和下一波规划文档。
- [x] `variants[].supportsAutomation` 仍为 `false`，避免把 Playwright、API 测试或只读脚本误标为攻击脚本自动化。
- [x] 当前仍不提供 `exploit.py`、真实配置读取、真实配置修改、真实服务扫描、真实管理接口连接、弱口令测试、服务枚举、配置修改、部署、重载或回滚能力。

验证记录：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/infrastructure/misconfiguration/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，33 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/misconfiguration-api.test.ts tests/misconfiguration-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、10 项测试通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/testing e2e -- --grep "配置错误"` 通过，1 项 Playwright 测试通过。
- `pnpm --filter @network-safe/server test -- tests/misconfiguration-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，203 项通过。
- `git diff --check` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 配置错误实现文件安全关键词扫描无命中；脚本目录仅包含 `README.md` 和 `verify.ts`，未发现 `exploit.py`。
- 下一项建议：进入后续社会工程学、供应链或基础设施扩展案例的边界设计，继续按单独执行文档推进。

# 2026-07-03 最新进展：配置错误只读一致性验证

- [x] 新增执行文档 `docs/execution/2026-07-03-infrastructure-misconfiguration-readonly-verification.md`。
- [x] 新增 `tools/lab-scripts/infrastructure/misconfiguration/verify.ts`，只读取仓库内配置错误元数据、文档、前端、后端和测试文件，并输出 JSON 一致性报告。
- [x] 只读脚本校验 web / api / docs / scripts 入口、固定配置样例 key、固定审计策略 key、预期学习信号、前端固定请求体、Playwright 无文本输入框断言、统一事件日志安全摘要和基础设施安全边界。
- [x] `labs/infrastructure/misconfiguration/meta.json` 已登记 `misconfiguration-verify` scripts 入口和 `scriptVerification` 自动化证据，状态仍保持 `in-progress`。
- [x] `variants[].supportsAutomation` 仍为 `false`，避免把只读验证脚本误标为攻击脚本自动化。
- [x] 更新共享元数据测试、配置错误 README、漏洞版 / 修复版说明、固定样例说明、攻击步骤、手动验证、脚本目录边界说明和下一波规划文档。
- [x] 当前仍不提供 `exploit.py`、真实配置读取、真实配置修改、真实服务扫描、真实管理接口连接、弱口令测试、服务枚举或配置修改能力。

验证记录：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/infrastructure/misconfiguration/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，33 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/misconfiguration-api.test.ts tests/misconfiguration-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、10 项测试通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/misconfiguration-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，203 项通过。
- 下一项建议：对 `infrastructure/misconfiguration` 执行 simulation ready 收口审计，继续保持不提供攻击脚本、真实配置读取、真实服务扫描、真实管理接口连接或配置修改能力。

# 2026-07-03 最新进展：配置错误页面级差异验证

- [x] 新增执行文档 `docs/execution/2026-07-03-infrastructure-misconfiguration-playwright-verification.md`。
- [x] 更新 `packages/testing/tests/e2e/platform.spec.mjs`，新增配置错误页面级 Playwright 差异验证。
- [x] 漏洞版覆盖固定“调试入口”和“CORS 策略”路径，断言调试入口可见、过宽 CORS、`debug-surface`、`visible`、`not-required`、`audit-missing`、`cross-origin-trust` 和 `too-broad` 等页面信号。
- [x] 修复版覆盖固定“调试入口”“管理状态”“CORS 策略”和“错误信息”路径，断言暴露面收敛、管理入口认证阻断、CORS 收敛和安全错误信息分层。
- [x] Playwright 断言漏洞版和修复版页面均不存在文本输入框，继续避免任意配置文本、主机、端口、路径、凭据、真实配置、扫描或连接入口。
- [x] `labs/infrastructure/misconfiguration/meta.json` 已登记 Playwright 自动化证据，状态仍保持 `in-progress`，scripts 入口仍为空，`variants[].supportsAutomation` 仍为 `false`。
- [x] 更新共享元数据测试、配置错误 README、手动验证文档、脚本目录边界说明和下一波规划文档。
- [x] 当前仍不提供 `exploit.py`、`verify.ts`、真实配置读取、真实配置修改、真实服务扫描、真实管理接口连接、弱口令测试或服务枚举能力。

验证记录：

- `pnpm --filter @network-safe/testing e2e -- --grep "配置错误"` 通过，1 项 Playwright 测试通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/shared test` 通过，33 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/misconfiguration-api.test.ts tests/misconfiguration-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、10 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/misconfiguration-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，203 项通过。
- `git diff --check -- <本轮目标文件>` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 配置错误页面验证安全关键词扫描通过：新增 Playwright 用例未命中真实配置读取、真实配置修改、真实服务扫描、真实管理接口连接、弱口令测试、服务枚举、脚本入口或可复用利用流程；文档命中均为禁止性说明、安全边界说明和固定样例说明。
- 下一项建议：进入 `infrastructure/misconfiguration` 本机只读一致性验证，或执行 simulation ready 收口审计，继续保持不提供攻击脚本、真实配置读取、真实服务扫描、真实管理接口连接或配置修改能力。

# 2026-07-03 最新进展：配置错误前端固定审计工作台

- [x] 新增 `apps/web/src/views/MisconfigurationLabView.vue`，提供配置风险观察版和配置审计复盘版固定选择器工作台。
- [x] 新增 `/labs/infrastructure/misconfiguration/vuln` 与 `/labs/infrastructure/misconfiguration/fixed` 路由。
- [x] 页面只提交固定 `configCaseKey` 和固定 `auditPolicyKey`，不提供任意配置文本、主机、端口、路径、凭据、扫描、连接、上传、下载、部署或重载入口。
- [x] 页面展示后端决策、学习信号、暴露面类别、暴露状态、认证要求、CORS 状态、错误信息状态、风险标签、审计动作和推荐动作。
- [x] 页面提交成功后记录 `infrastructure/misconfiguration` 学习进度，并对预期学习信号写入验证记录安全摘要。
- [x] `labs/infrastructure/misconfiguration/meta.json` 已登记 web 入口，状态仍保持 `in-progress`，scripts 入口仍为空，Playwright 和脚本验证仍未启用。
- [x] 新增 `apps/web/tests/misconfiguration-api.test.ts` 和 `apps/web/tests/misconfiguration-lab.test.ts`，并更新路由测试和共享元数据测试。
- [x] 同步配置错误 README、漏洞版 / 修复版说明、攻击步骤、修复说明、手动验证和下一波规划文档。
- [x] 当前仍不提供 `exploit.py`、`verify.ts`、真实配置读取、真实配置修改、真实服务扫描、真实管理接口连接、弱口令测试或服务枚举能力。

验证记录：

- `pnpm --filter @network-safe/web exec vitest run tests/misconfiguration-api.test.ts tests/misconfiguration-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、10 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/shared test` 通过，33 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/misconfiguration-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，203 项通过。
- `git diff --check -- <本轮目标文件>` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 配置错误前端安全关键词扫描通过：实现文件未发现真实 URL、真实配置文本输入、真实主机 / 端口 / 路径 / 凭据输入、扫描入口、连接入口、上传下载入口、部署重载入口或真实配置读取能力；文档命中仅为禁止性说明、安全边界说明和固定字段反向断言。
- 下一项建议：进入 `infrastructure/misconfiguration` 页面差异验证或本机只读一致性验证切片，继续保持不提供 `exploit.py`、真实配置读取、真实服务扫描、真实管理接口连接或配置修改能力。

# 2026-07-03 最新进展：配置错误利用后端固定审计 API

- [x] 新增执行文档 `docs/execution/2026-07-03-infrastructure-misconfiguration-fixed-audit-api.md`。
- [x] 新增 `apps/server/src/services/misconfiguration-lab.ts`，只处理固定 `configCaseKey` 和固定 `auditPolicyKey`。
- [x] 新增 `POST /api/labs/infrastructure/misconfiguration/:variant/audit`，支持配置风险观察版和配置审计复盘版。
- [x] API 已接入统一事件日志，日志只记录固定 key、暴露面类别、风险标签数量、审计动作、是否命中固定样例和学习信号。
- [x] 新增 `apps/server/tests/misconfiguration-lab.test.ts`，覆盖漏洞版调试面可见、修复版 CORS 收敛、修复版管理状态认证阻断、未知 key 不回显、登录要求和日志摘要脱敏。
- [x] 将 `labs/infrastructure/misconfiguration/meta.json` 更新为 `in-progress`，只登记 docs 和 api 入口，不登记 web 或 scripts 入口。
- [x] 更新配置错误 README、漏洞版 / 修复版说明、固定配置样例说明、攻击步骤、修复说明、手动验证和脚本目录边界说明。
- [x] 当前仍不提供前端页面、`exploit.py`、`verify.ts`、真实配置读取、真实配置修改、真实服务扫描、真实管理接口连接、弱口令测试或服务枚举能力。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，33 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/misconfiguration-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，203 项通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- `git diff --check -- <本轮目标文件>` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 配置错误安全关键词扫描通过：服务实现未发现真实配置读取、真实配置修改、真实服务扫描、真实管理接口连接、命令执行、弱口令测试或服务枚举；测试命中仅为反向脱敏断言；文档命中为禁止性说明和安全边界说明。
- 下一项建议：进入 `infrastructure/misconfiguration` 前端固定配置审计工作台切片，只提供固定样例选择器，不提供任意配置文本、主机、端口、路径、凭据、扫描或连接入口。

# 2026-07-03 最新进展：配置错误利用 planned 元数据

- [x] 新增执行文档 `docs/execution/2026-07-03-infrastructure-misconfiguration-directory-metadata.md`。
- [x] 建立 `labs/infrastructure/misconfiguration/` 标准目录。
- [x] 新增 `labs/infrastructure/misconfiguration/meta.json`，状态为 `planned`，模式为 `simulation`。
- [x] 新增配置错误 README、配置风险观察版说明、配置审计复盘版说明、固定配置样例说明、攻击方观察步骤、修复说明和手动验证文档。
- [x] 新增 `tools/lab-scripts/infrastructure/misconfiguration/README.md`，当前只说明脚本边界，不提供 `exploit.py` 或 `verify.ts`。
- [x] 元数据当前只登记 docs 入口，`entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 均为空数组。
- [x] `verification.automation.supported` 为 `false`，`variants[].supportsAutomation` 均为 `false`。
- [x] 更新共享元数据测试和服务端 health / registry 测试，确认本地元数据总数从 24 增加到 25，并确认 `infrastructure.misconfiguration` 为 planned 条目。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，33 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，195 项通过。
- `git diff --check -- <本轮目标文件>` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- `rg --files labs/infrastructure/misconfiguration tools/lab-scripts/infrastructure/misconfiguration` 确认当前脚本目录只包含 README，场景目录只包含元数据和文档。
- 配置错误危险命令窄扫描无命中；宽泛安全关键词扫描仅命中禁止性说明、历史进度和本轮安全边界说明，未发现真实配置读取、真实配置修改、真实服务扫描、真实管理接口连接、扫描器、弱口令测试或可复用利用流程。
- 下一项建议：进入 `infrastructure/misconfiguration` 后端固定配置审计 API 切片，只读取固定 `configCaseKey` 和固定 `auditPolicyKey`，并接入统一事件日志安全摘要。

# 2026-07-02 最新进展：配置错误利用实验执行文档

- [x] 新增执行文档 `docs/execution/2026-07-02-infrastructure-misconfiguration-lab.md`。
- [x] 将 `infrastructure/misconfiguration` 首版定位为“静态配置风险审计器”，只使用固定配置片段、固定暴露面信号和固定审计策略观察配置错误风险。
- [x] 明确攻击方视角只用于理解调试入口、默认凭据提示、目录索引、过宽 CORS、公开管理状态页和详细错误信息等风险信号，不用于扫描、枚举或连接真实服务。
- [x] 明确后续只允许固定 `configCaseKey` 和固定 `auditPolicyKey`，实现前仍需按共享类型、元数据规范和服务设计确认字段名。
- [x] 明确不修改真实 nginx、MySQL、Node、Windows 服务、系统防火墙、代理、hosts、证书或云账号配置。
- [x] 明确不读取真实 `.env`、本机配置文件、服务配置、云凭据、数据库连接串、token、Cookie 或密码。
- [x] 同步 `docs/design/next-wave-security-labs.md`，将配置错误利用从“规划中”推进到“执行文档阶段”，并把下一步切片改为目录与 `planned` 元数据。
- [x] 当前不创建 `labs/infrastructure/misconfiguration/`、`tools/lab-scripts/infrastructure/misconfiguration/`、页面、API、元数据或脚本。

验证记录：

- `git diff --check -- docs/execution/2026-07-02-infrastructure-misconfiguration-lab.md docs/design/next-wave-security-labs.md docs/TODO.md docs/execution/security-lab-master-goal.md` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- docs/execution/2026-07-02-infrastructure-misconfiguration-lab.md docs/design/next-wave-security-labs.md docs/TODO.md docs/execution/security-lab-master-goal.md` 无命中。
- 安全关键词扫描通过：本轮危险命令窄扫描无命中；宽泛安全词仅命中禁止性说明、既有历史边界和本轮安全边界说明，未新增真实配置修改、真实服务扫描、真实凭据读取、真实管理接口连接或可复用利用流程。
- 下一项建议：进入 `infrastructure/misconfiguration` 目录与 `planned` 元数据切片，先只登记 docs 入口，不创建扫描器、利用脚本、真实配置文件或真实服务连接能力。

# 2026-07-02 最新进展：依赖混淆 simulation ready 收口

- [x] 新增执行文档 `docs/execution/2026-07-02-supply-chain-dependency-confusion-ready-closeout.md`。
- [x] 按主计划完成标准审计 `supply-chain/dependency-confusion` 当前证据：漏洞版 / 修复版页面、受控 `resolve` API、统一事件日志安全摘要、Playwright 页面差异验证、只读一致性验证和场景文档均已形成固定样例学习闭环。
- [x] 将 `labs/supply-chain/dependency-confusion/meta.json` 从 `in-progress` 更新为 `ready`，并补充 ready 状态仅代表本项目内固定样例学习闭环完成。
- [x] 更新 `tools/lab-scripts/supply-chain/dependency-confusion/verify.ts`，只读一致性验证脚本改为校验 `ready` 状态和 simulation ready 边界。
- [x] 更新共享元数据测试、服务端 health / registry 测试和依赖混淆页面状态文案。
- [x] 同步依赖混淆 README、漏洞版 / 修复版说明、攻击步骤、修复说明、手动验证、脚本目录边界说明和下一波实验规划。
- [x] `variants[].supportsAutomation` 仍为 `false`，避免把 Playwright、API 测试或只读验证脚本误标为攻击脚本自动化。
- [x] 当前仍不提供 `exploit.py`、真实安装、真实发布、registry 连接、凭据读取、生命周期脚本、包归档、任意包名输入、真实 registry URL 输入或攻击脚本。

验证记录：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/supply-chain/dependency-confusion/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，32 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/dependency-confusion-api.test.ts tests/dependency-confusion-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/dependency-confusion-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，195 项通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/testing e2e -- --grep "依赖混淆"` 通过，1 项 Playwright 测试通过。
- `git diff --check` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 依赖混淆实现文件安全关键词扫描无命中；文档和脚本目录宽扫描仅命中禁止性说明、固定字段、验证脚本反向检查片段和安全边界说明。
- 下一项建议：进入 `infrastructure/misconfiguration` 模拟实验执行文档，仍不修改真实 nginx、MySQL、Node、系统服务或云账号配置。

# 2026-07-02 最新进展：依赖混淆只读一致性验证

- [x] 新增执行文档 `docs/execution/2026-07-02-supply-chain-dependency-confusion-readonly-verification.md`。
- [x] 新增 `tools/lab-scripts/supply-chain/dependency-confusion/verify.ts`，只读取仓库内依赖混淆元数据、文档、前端、后端和测试文件，并输出 JSON 一致性报告。
- [x] `labs/supply-chain/dependency-confusion/meta.json` 已登记 `dependency-confusion-verify` scripts 入口和 `scriptVerification` 自动化证据，状态仍保持 `in-progress`。
- [x] `variants[].supportsAutomation` 仍为 `false`，避免把只读验证脚本误标为攻击脚本自动化。
- [x] 只读脚本校验 web / api / docs / scripts 入口、固定 key、前端固定请求体、Playwright 无文本输入框断言、统一事件日志入口和供应链安全边界。
- [x] 更新共享元数据测试、依赖混淆 README、漏洞版 / 修复版说明、攻击步骤、手动验证、脚本目录边界说明和下一波实验规划。
- [x] 当前仍不提供 `exploit.py`、真实安装、真实发布、registry 连接、凭据读取、生命周期脚本、任意包名输入、真实 registry URL 输入或攻击脚本。

验证记录：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/supply-chain/dependency-confusion/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，32 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/dependency-confusion-api.test.ts tests/dependency-confusion-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/dependency-confusion-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，195 项通过。
- 下一项建议：对 `supply-chain/dependency-confusion` 执行 ready 收口审计，仍不创建真实安装、发布、registry 连接或攻击脚本能力。

# 2026-07-02 最新进展：依赖混淆页面级差异验证

- [x] 新增执行文档 `docs/execution/2026-07-02-supply-chain-dependency-confusion-playwright-verification.md`。
- [x] 更新 `packages/testing/tests/e2e/platform.spec.mjs`，新增依赖混淆页面级 Playwright 差异验证。
- [x] Playwright 覆盖漏洞版“未绑定 scope”固定样例，断言错误公共来源选择、`accepted` 决策、`public-registry` 来源、`untrusted` 信任状态、`missing` scope 状态和 `missing` lockfile 状态。
- [x] Playwright 覆盖修复版“私有 scope”“完整性审计”“混合来源”三条固定路径，断言私有来源固定、完整性阻断和正常公开依赖审计放行。
- [x] Playwright 断言漏洞版和修复版页面均不存在文本输入框，继续避免任意包名、真实 registry URL、`.npmrc`、token、lockfile、安装或发布参数输入。
- [x] 更新 `labs/supply-chain/dependency-confusion/meta.json`，登记 Playwright 自动化证据，状态仍保持 `in-progress`，scripts 入口仍为空，`variants[].supportsAutomation` 仍为 `false`。
- [x] 更新共享元数据测试、依赖混淆 README、漏洞版 / 修复版说明、手动验证、脚本目录边界说明和下一波实验规划。
- [x] 当前仍不提供 `exploit.py`、`verify.ts`、真实安装、真实发布、registry 连接、凭据读取、生命周期脚本、任意包名输入、真实 registry URL 输入或攻击脚本。

验证记录：

- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/testing e2e -- --grep "依赖混淆"` 通过，1 项 Playwright 测试通过。
- `pnpm --filter @network-safe/shared test` 通过，32 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/dependency-confusion-api.test.ts tests/dependency-confusion-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/dependency-confusion-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，195 项通过。
- `git diff --check` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- `rg --files tools/lab-scripts/supply-chain/dependency-confusion` 确认脚本目录当前仍只包含 README。
- 依赖混淆页面验证安全关键词扫描仅命中禁止性说明、元数据安全边界、历史共享元数据断言和既有 CSRF token 页面文案，未发现本轮新增真实安装、真实发布、registry 连接、凭据读取、生命周期脚本、命令执行或攻击脚本实现。
- 下一项建议：为 `supply-chain/dependency-confusion` 补齐只读一致性验证脚本或执行 ready 收口审计，仍不创建真实安装、发布、registry 连接或攻击脚本能力。

# 2026-07-02 最新进展：依赖混淆前端解析观察工作台

- [x] 新增执行文档 `docs/execution/2026-07-02-supply-chain-dependency-confusion-frontend-workbench.md`。
- [x] 新增 `apps/web/src/api/dependency-confusion-lab.ts`，前端只提交固定 `manifestKey`、`registryScenarioKey` 和 `resolutionPolicyKey`。
- [x] 新增 `apps/web/src/labs/dependency-confusion.ts`，定义固定 manifest 摘要、固定伪 registry 场景、固定解析策略、学习信号文案、学习进度和验证记录载荷。
- [x] 新增 `apps/web/src/views/DependencyConfusionLabView.vue`，提供解析风险观察版 / 来源审计复盘版固定选择器工作台。
- [x] 新增 `/labs/supply-chain/dependency-confusion/vuln` 与 `/labs/supply-chain/dependency-confusion/fixed` 路由。
- [x] 页面只提供固定 manifest、固定伪 registry 场景和固定解析策略选择器，不提供任意包名、真实 registry URL、`.npmrc`、token、lockfile、安装命令、发布命令或生命周期脚本输入。
- [x] `labs/supply-chain/dependency-confusion/meta.json` 已登记 web 入口，状态仍保持 `in-progress`，scripts 入口仍为空，`variants[].supportsAutomation` 仍为 `false`。
- [x] 更新依赖混淆 README、漏洞版 / 修复版说明、攻击步骤、修复说明、手动验证、脚本目录说明、共享元数据测试和下一波实验规划。
- [x] 当前仍不提供 `exploit.py`、`verify.ts`、真实安装、真实发布、registry 连接、凭据读取、生命周期脚本或攻击脚本。

验证记录：

- `pnpm --filter @network-safe/web exec vitest run tests/dependency-confusion-api.test.ts tests/dependency-confusion-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/shared test` 通过，32 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/dependency-confusion-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过，实际执行服务端测试 195 项通过。
- `git diff --check` 通过。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 依赖混淆前端和文档安全关键词扫描仅命中禁止性说明、固定字段名、测试反向断言、API client `token` 参数和学习信号名，未发现真实安装、真实发布、registry 连接、凭据读取、生命周期脚本或攻击脚本实现。
- 下一项建议：为 `supply-chain/dependency-confusion` 补齐页面级差异验证或只读一致性验证脚本，仍不提供 `exploit.py`、真实安装、真实发布、registry 连接、凭据读取或生命周期脚本。

# 2026-07-02 最新进展：依赖混淆后端固定解析 API

- [x] 新增执行文档 `docs/execution/2026-07-02-supply-chain-dependency-confusion-fixed-resolve-api.md`。
- [x] 新增 `apps/server/src/services/dependency-confusion-lab.ts`，只处理固定 `manifestKey`、`registryScenarioKey` 和 `resolutionPolicyKey`。
- [x] 新增 `POST /api/labs/supply-chain/dependency-confusion/:variant/resolve`，支持漏洞版错误来源观察和修复版来源审计复盘。
- [x] API 已接入统一事件日志，日志只记录固定 key、来源类别、风险标签数量、审计动作、是否命中固定样例和学习信号。
- [x] 新增 `apps/server/tests/dependency-confusion-lab.test.ts`，覆盖漏洞版公共来源选择、修复版私有 scope 固定、lockfile 完整性阻断、正常公开依赖可接受、未知 key 不回显和日志摘要脱敏。
- [x] 将 `labs/supply-chain/dependency-confusion/meta.json` 更新为 `in-progress`，只登记 docs 和 api 入口，不登记 web 或 scripts 入口。
- [x] 更新依赖混淆 README、漏洞版 / 修复版说明、固定模拟数据说明、攻击步骤、修复说明、手动验证和脚本目录说明。
- [x] 当前仍不提供前端页面、`exploit.py`、`verify.ts`、真实安装、真实发布、registry 连接、凭据读取、生命周期脚本或攻击脚本。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，32 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/dependency-confusion-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，195 项通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- `git diff --check` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 依赖混淆服务实现窄危险能力扫描无命中；目标范围危险关键词扫描仅命中测试中的反向脱敏断言和禁止性说明。
- 下一项建议：进入 `supply-chain/dependency-confusion` 前端依赖解析观察工作台切片，只提供固定样例选择器，不提供任意包名、registry URL、token、安装或发布入口。

# 2026-07-02 最新进展：依赖混淆 planned 元数据

- [x] 新增执行文档 `docs/execution/2026-07-02-supply-chain-dependency-confusion-directory-metadata.md`。
- [x] 建立 `labs/supply-chain/dependency-confusion/` 标准目录。
- [x] 新增 `labs/supply-chain/dependency-confusion/meta.json`，状态为 `planned`，模式为 `simulation`。
- [x] 新增依赖混淆 README、解析风险观察版说明、来源审计复盘版说明、固定模拟数据说明、攻击方观察步骤、修复说明和手动验证文档。
- [x] 新增 `tools/lab-scripts/supply-chain/dependency-confusion/README.md`，当前只说明脚本边界，不提供 `exploit.py` 或 `verify.ts`。
- [x] 元数据当前只登记 docs 入口，`entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 均为空数组。
- [x] `verification.automation.supported` 为 `false`，`variants[].supportsAutomation` 均为 `false`。
- [x] 更新共享元数据测试和服务端 health / registry 测试，确认本地元数据总数从 23 增加到 24，并确认 `supply-chain.dependency-confusion` 为 planned 条目。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，32 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，186 项通过。
- `git diff --check -- <本轮目标文件>` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- `rg --files tools/lab-scripts/supply-chain/dependency-confusion labs/supply-chain/dependency-confusion` 确认当前脚本目录只包含 README，场景目录只包含元数据和文档。
- 依赖混淆供应链危险实现标记扫描未发现真实发布、登录、registry 网络请求、动态执行、子进程调用或生命周期脚本实现。
- 下一项建议：进入 `supply-chain/dependency-confusion` 后端固定解析 API 切片，只读取固定 `manifestKey`、固定 `registryScenarioKey` 和固定 `resolutionPolicyKey`，并接入统一事件日志安全摘要。

# 2026-07-02 最新进展：依赖混淆实验执行文档

- [x] 新增执行文档 `docs/execution/2026-07-02-supply-chain-dependency-confusion-lab.md`。
- [x] 将 `supply-chain/dependency-confusion` 首版定位为“依赖解析风险观察器”，只使用固定 manifest、伪 registry 元数据和固定解析策略观察供应链解析风险。
- [x] 明确攻击方视角只用于理解私有包名与公共包名冲突、scope 缺失、registry 解析优先级和 lockfile 缺失等风险信号，不用于构造真实投毒能力。
- [x] 明确后续只允许固定 `manifestKey`、固定 `registryScenarioKey` 和固定 `resolutionPolicyKey`，实现前仍需按共享类型、元数据规范和服务设计确认字段名。
- [x] 明确不运行真实安装命令、不访问真实 registry、不发布真实包、不创建投毒包或生命周期脚本、不读取 `.npmrc` / registry token / CI 凭据。
- [x] 同步 `docs/design/next-wave-security-labs.md`，将依赖混淆从“规划中”推进到“执行文档阶段”，并把下一步切片改为目录与 `planned` 元数据。
- [x] 当前不创建 `labs/supply-chain/dependency-confusion/`、`tools/lab-scripts/supply-chain/dependency-confusion/`、页面、API、元数据或脚本。

验证记录：

- `git diff --check -- <本轮目标文件>` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 依赖混淆安全关键词扫描仅命中禁止性说明、固定 key 建议、风险说明和后续测试文件名建议，未新增真实安装、真实发布、registry 连接、凭据读取、生命周期脚本生成或可复用投毒流程。
- 下一项建议：进入 `supply-chain/dependency-confusion` 目录与 `planned` 元数据切片，先只登记 docs 入口，不创建安装、发布、registry 连接或攻击脚本能力。

# 2026-07-02 最新进展：网络钓鱼识别 case-study ready 收口

- [x] 新增执行文档 `docs/execution/2026-07-02-social-phishing-ready-closeout.md`。
- [x] 按主计划完成标准和 case-study ready 例外标准审计 `social/phishing` 当前证据。
- [x] 将 `labs/social/phishing/meta.json` 从 `in-progress` 更新为 `ready`，并补充 ready 状态仅代表本项目内固定案例学习闭环完成。
- [x] 更新 `tools/lab-scripts/social/phishing/verify.ts`，只读一致性验证脚本改为校验 `ready` 状态和 case-study ready 边界。
- [x] 更新共享元数据测试，确认网络钓鱼仍保持 `mode: "case-study"`、`variants[].supportsAutomation` 均为 `false`，自动化证据来自服务端 API 差异测试和只读一致性验证。
- [x] 同步网络钓鱼 README、漏洞版 / 修复版说明、攻击步骤、修复说明、手动验证和脚本目录说明。
- [x] 当前仍不提供 `exploit.py`、真实邮件 / 短信 / 消息投递、真实邮箱或凭据收集、可投递模板生成、第三方平台调用、收件箱连接或攻击脚本。

验证记录：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/social/phishing/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，31 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/phishing-api.test.ts tests/phishing-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过，实际执行服务端测试 186 项通过。
- 服务端 health / registry 测试已同步 `social.phishing` 的 `ready` 状态断言。
- `git diff --check -- <本轮目标文件>` 通过。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 网络钓鱼安全关键词扫描仅命中禁止性说明、测试反向断言、API client `token` 参数、学习信号 `credential-request`、只读脚本检查片段和既有非 phishing 认证字段；实现文件窄扫描未发现真实投递、凭据收集、模板生成或第三方平台调用实现。
- 下一项建议：进入 `supply-chain/dependency-confusion` 或 `infrastructure/misconfiguration` 的单独执行文档切片，继续保持受控案例化 / 本机模拟边界。

# 2026-07-02 最新进展：网络钓鱼识别只读一致性验证

- [x] 新增执行文档 `docs/execution/2026-07-02-social-phishing-readonly-verification.md`。
- [x] 新增 `tools/lab-scripts/social/phishing/verify.ts`，只读取仓库内元数据、文档、前端、后端和测试文件并输出一致性验证报告。
- [x] `labs/social/phishing/meta.json` 已登记 `phishing-verify` scripts 入口和 `scriptVerification` 自动化证据，状态仍保持 `in-progress`。
- [x] `variants[].supportsAutomation` 仍为 `false`，scripts 入口不表示攻击脚本自动化。
- [x] 网络钓鱼 README、攻击步骤、修复说明、手动验证、脚本目录说明、共享元数据测试和下一波实验规划已同步只读验证状态。
- [x] 当前仍不提供 `exploit.py`、真实邮件 / 短信 / 消息投递、真实邮箱或凭据收集、可投递模板生成、第三方平台调用或攻击脚本。

验证记录：
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/social/phishing/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，31 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/phishing-api.test.ts tests/phishing-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过，实际执行服务端测试 186 项通过。
- `git diff --check` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 网络钓鱼安全关键词扫描仅命中禁止性说明、脚本检查片段、测试反向断言、`local-session-token`、API client `token` 参数、学习信号 `credential-request` 和历史记录，未发现真实投递、凭据收集、模板生成或第三方平台调用实现。
- 后续已按 case-study ready 例外标准完成 `social/phishing` 收口审计；当前 ready 证据明确来自 API 差异验证和只读一致性验证两类自动化证据。

# 2026-07-02 最新进展：网络钓鱼识别前端仿真收件箱工作台

- [x] 新增执行文档 `docs/execution/2026-07-02-social-phishing-frontend-workbench.md`。
- [x] 新增 `apps/web/src/api/phishing-lab.ts`，前端只向后端提交固定 `caseKey`、`reviewModeKey` 和 `defenseChecklistKey`。
- [x] 新增 `apps/web/src/labs/phishing.ts`，定义固定线索卡、观察模式、检查清单、学习信号文案、学习进度和验证记录载荷。
- [x] 新增 `apps/web/src/views/PhishingLabView.vue`，提供误判观察版 / 识别复盘版固定案例工作台。
- [x] 新增 `/labs/social/phishing/vuln` 与 `/labs/social/phishing/fixed` 路由。
- [x] 页面只提供固定线索卡、固定观察模式和固定检查清单选择器，不提供任意邮件正文、真实邮箱、真实链接、真实附件、凭据或投递参数输入。
- [x] `labs/social/phishing/meta.json` 已登记 web 入口，状态仍保持 `in-progress`，scripts 入口仍为空，`variants[].supportsAutomation` 仍为 `false`。
- [x] 网络钓鱼 README、漏洞版 / 修复版说明、攻击步骤、修复说明、手动验证、共享元数据测试和下一波实验规划已同步前端工作台状态。

验证记录：
- `pnpm --filter @network-safe/web exec vitest run tests/phishing-api.test.ts tests/phishing-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/shared test` 通过，31 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过，实际执行服务端测试 186 项通过。
- `git diff --check` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 网络钓鱼安全关键词扫描仅命中禁止性说明、测试反向断言、`local-session-token`、API client `token` 参数、学习信号 `credential-request` 和历史记录，未发现真实投递、凭据收集、模板生成或第三方平台调用实现。
- 下一项建议：为 `social/phishing` 补齐页面级验证或只读一致性验证脚本，仍不提供 `exploit.py`、真实投递、凭据收集、模板生成或第三方平台调用。

# 2026-07-02 最新进展：网络钓鱼识别后端固定案例 API

- [x] 新增执行文档 `docs/execution/2026-07-02-social-phishing-fixed-case-api.md`。
- [x] 新增 `apps/server/src/services/phishing-lab.ts`，只处理固定 `caseKey`、`reviewModeKey` 和 `defenseChecklistKey`。
- [x] 新增 `POST /api/labs/social/phishing/:variant/review`，支持漏洞版误判观察和修复版识别复盘。
- [x] API 已接入统一事件日志，日志只记录固定 key、风险标签数量、建议动作、是否命中固定案例和学习信号。
- [x] 新增 `apps/server/tests/phishing-lab.test.ts`，覆盖漏洞版误判、修复版阻断、安全消息放行、未知 key 不回显和日志摘要脱敏。
- [x] 将 `labs/social/phishing/meta.json` 更新为 `in-progress`，登记漏洞版 / 修复版 API 入口和 API 测试证据，web / scripts 入口仍为空。
- [x] 更新网络钓鱼 README、漏洞版 / 修复版说明、固定案例说明、攻击步骤、修复说明、手动验证、共享元数据测试、服务端 registry / health 测试和下一波实验规划。
- [x] 当前仍不提供前端页面、`exploit.py`、`verify.ts`、真实邮件发送、真实凭据收集、模板生成或第三方平台调用。

验证记录：
- `pnpm --filter @network-safe/shared test` 通过，31 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，186 项测试通过。
- `git diff --check` 未发现空白错误，仅有 Windows 下 LF 将转换为 CRLF 的提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 未发现目标文件行尾空白。
- 网络钓鱼安全关键词扫描仅命中禁止性说明、字段名 / 学习信号、既有认证与 JWT 代码、测试中的本地 `127.0.0.1` URL 和脱敏反向断言，未发现真实邮件发送、凭据收集、可投递模板包或第三方平台调用实现。
- 下一项建议：进入 `social/phishing` 前端仿真收件箱工作台切片，只使用固定案例、固定观察模式和固定检查清单。

# 2026-07-02 最新进展：网络钓鱼识别 planned 元数据

- [x] 新增执行文档 `docs/execution/2026-07-02-social-phishing-directory-metadata.md`。
- [x] 新增 `labs/social/phishing/meta.json`，状态为 `planned`，模式为 `case-study`。
- [x] 新增网络钓鱼识别 README、误判观察版说明、识别复盘版说明、固定案例说明、攻击方观察步骤、修复说明和手动验证文档。
- [x] 新增 `tools/lab-scripts/social/phishing/README.md`，当前只说明脚本边界，不提供 `exploit.py` 或 `verify.ts`。
- [x] 元数据当前只登记 docs 入口，`entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 均为空数组。
- [x] `verification.automation.supported` 为 `false`，`variants[].supportsAutomation` 均为 `false`。
- [x] 更新共享元数据测试和服务端 health / registry 测试，确认本地元数据总数从 22 增加到 23，并确认 `social.phishing` 为 planned 条目。

验证记录：
- `pnpm --filter @network-safe/shared test` 通过，31 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，178 项通过。
- `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 未发现目标文件行尾空白。
- 网络钓鱼识别安全关键词扫描仅命中禁止性说明、历史进度和本地 `127.0.0.1` 测试 URL，未发现真实邮件发送、凭据收集、可投递模板包或第三方平台调用实现。
- `rg --files tools/lab-scripts/social/phishing labs/social/phishing` 确认当前脚本目录只包含 README，场景目录只包含元数据和文档。
- 下一项建议：进入 `social/phishing` 后端固定案例 API 切片，只接受固定 `caseKey`、固定 `reviewModeKey` 和固定 `defenseChecklistKey`，并接入统一事件日志安全摘要。

# 2026-07-02 最新进展：网络钓鱼识别实验执行文档

- [x] 新增执行文档 `docs/execution/2026-07-02-social-phishing-lab.md`。
- [x] 将 `social/phishing` 首版定位为“仿真收件箱识别训练”，用于学习相似域名、紧急语气、凭据请求、附件诱导和品牌仿冒等固定风险线索。
- [x] 明确首版采用 `case-study` 模式，后续只使用固定案例 key、线索卡、风险标签和举报 / 隔离 / 二次确认等固定动作。
- [x] 明确不发送真实邮件、短信或链接，不收集真实凭据，不连接第三方邮件 / 短信 / 社交平台，不生成可投递模板包，不提供攻击脚本。
- [x] 明确后续切片顺序：目录与 planned 元数据、场景文档、后端固定案例 API、前端仿真收件箱、页面验证、只读一致性验证和 case-study ready 收口。
- [x] 同步下一波实验规划、旧社会工程学清单和主目标进度。

验证记录：
- `git diff --check -- docs/execution/2026-07-02-social-phishing-lab.md docs/design/next-wave-security-labs.md docs/TODO.md docs/execution/security-lab-master-goal.md` 通过；仅出现 Windows 下 LF 将转换为 CRLF 的提示。
- `rg -n "[ \t]+$" -- docs/execution/2026-07-02-social-phishing-lab.md docs/design/next-wave-security-labs.md docs/TODO.md docs/execution/security-lab-master-goal.md` 未发现目标文件行尾空白。
- 网络钓鱼识别安全关键词扫描仅命中禁止性说明、风险说明和历史验证记录，未发现真实邮件发送能力、凭据收集能力、可投递模板包或第三方平台调用实现说明。
- 下一项建议：进入 `social/phishing` 目录与 planned 元数据切片，先只登记 docs 入口，不创建邮件发送、凭据收集、模板生成或攻击脚本能力。

# 2026-07-02 最新进展：Prompt 注入 ready 收口

- [x] 新增执行文档 `docs/execution/2026-07-02-ai-prompt-injection-ready-closeout.md`。
- [x] 按主计划完成标准逐项审计 `ai/prompt-injection`，确认漏洞版、修复版、攻击方观察路径、防御方阻断 / 安全问答路径、引导式页面、统一事件日志安全摘要、文档、元数据和自动化验证均有证据闭环。
- [x] 将 `labs/ai/prompt-injection/meta.json` 从 `in-progress` 更新为 `ready`，并补充 ready 状态仅代表本项目内固定样例学习闭环完成，不表示提供真实 AI 攻击能力。
- [x] 更新 `tools/lab-scripts/ai/prompt-injection/verify.ts`，只读一致性验证脚本改为校验 `ready` 状态。
- [x] 更新共享元数据测试、Prompt 注入 README、漏洞版 / 修复版说明、攻击步骤、修复说明、手动验证、脚本目录说明、下一波实验规划和主目标进度。
- [x] 当前仍不提供 `exploit.py`、Prompt 注入攻击脚本、任意提示词输入框、外部 AI 调用、真实工具调用、完整危险提示词或可复用绕过模板。

验证记录：
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/ai/prompt-injection/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，30 项测试通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/prompt-injection-api.test.ts tests/prompt-injection-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/prompt-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，178 项通过。
- `pnpm --filter @network-safe/testing e2e -- --grep "Prompt 注入"` 通过，1 个 Playwright 用例通过。
- `git diff --check -- <本轮目标文件>` 通过；仅出现 Windows 下 LF 将转换为 CRLF 的提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 未发现目标文件行尾空白。
- Prompt 注入安全关键词扫描仅命中历史进度、只读脚本禁止片段清单和本地 `127.0.0.1` 测试 URL，未发现外部 AI 调用、任意提示词输入器、真实工具执行或攻击脚本实现。
- 下一项建议：进入 `social/phishing` 网络钓鱼识别实验执行文档切片，优先做案例化 / 仿真页面，不发送真实邮件、不收集真实凭据、不生成可投递模板包。

# 2026-07-02 最新进展：Prompt 注入只读一致性验证

- [x] 新增执行文档 `docs/execution/2026-07-02-ai-prompt-injection-readonly-verification.md`。
- [x] 新增 `tools/lab-scripts/ai/prompt-injection/verify.ts`，只读取仓库内 Prompt 注入元数据、文档、前端、后端和测试文件，输出一致性验证报告。
- [x] 验证脚本校验 `ai.prompt-injection` 仍保持 `interactive` / `in-progress`，不提前标记 `ready`。
- [x] 验证脚本校验 web 入口只包含漏洞版 / 修复版固定样例工作台，API 入口只包含漏洞版 / 修复版 `evaluate` 接口。
- [x] 验证脚本校验 scripts 入口只登记 `prompt-injection-verify`，并确认不存在 `exploit.py`。
- [x] 验证脚本校验自动化证据包含 Playwright、服务端 API 测试和只读脚本验证。
- [x] 验证脚本扫描相关实现文件，确认未引入外部 AI SDK、模型配置、命令执行、外部 URL 或任意提示词输入框。
- [x] 更新 `labs/ai/prompt-injection/meta.json`、场景 README、漏洞版 / 修复版说明、攻击步骤、修复说明、手动验证和脚本目录说明，登记只读验证状态并保留无攻击脚本边界。
- [x] 更新共享元数据测试、下一波实验规划和主目标进度。

验证记录：
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/ai/prompt-injection/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，30 项测试通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/prompt-injection-api.test.ts tests/prompt-injection-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/prompt-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，178 项通过。
- `pnpm --filter @network-safe/testing e2e -- --grep "Prompt 注入"` 通过，1 个 Playwright 用例通过。
- 下一项建议：按完成标准对 `ai/prompt-injection` 做 ready 收口审计，仍不提供 `exploit.py`、任意提示词输入框、外部 AI 调用或攻击脚本入口。

# 2026-07-02 最新进展：Prompt 注入 Playwright 页面级验证

- [x] 新增执行文档 `docs/execution/2026-07-02-ai-prompt-injection-playwright-verification.md`。
- [x] 在 `packages/testing/tests/e2e/platform.spec.mjs` 新增 Prompt 注入漏洞版 / 修复版页面差异验证。
- [x] Playwright 用例登录 `demo_user` 后只操作固定场景和固定来源，不提供任意提示词输入框、模型配置、URL、API key 或真实工具参数输入。
- [x] 漏洞版断言固定检索资料被错误抬高为指令来源，并校验 `accepted`、`retrieval-contamination`、`confused`、`missing` 和策略未阻断状态。
- [x] 修复版断言策略护栏阻断检索污染样例，并校验 `blocked`、`isolated`、`blocked` 和策略阻断状态。
- [x] 修复版同时验证固定文档问答安全路径，校验 `accepted`、`safe-reference`、`applied` 和策略未阻断状态。
- [x] `labs/ai/prompt-injection/meta.json` 已登记 Playwright 页面验证证据，scripts 入口仍保持为空。
- [x] Prompt 注入 README、手动验证文档、脚本目录边界说明、下一波实验规划和共享元数据测试已同步页面级验证状态。

验证记录：
- `pnpm --filter @network-safe/testing e2e -- --grep "Prompt 注入"` 通过，1 个 Playwright 用例通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/shared test` 通过，30 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/prompt-injection-api.test.ts tests/prompt-injection-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/prompt-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，178 项通过。
- 下一项建议：为 `ai/prompt-injection` 补齐只读一致性验证脚本，仍不提供 `exploit.py`、任意提示词输入框、外部 AI 调用或攻击脚本入口。

# 2026-07-01 最新进展：Prompt 注入前端固定样例工作台

- [x] 新增执行文档 `docs/execution/2026-07-01-ai-prompt-injection-frontend-workbench.md`。
- [x] 新增 `apps/web/src/api/prompt-injection-lab.ts`，前端只向后端提交固定 `scenarioKey`、固定 `instructionSourceKey` 和固定 `defensePolicyKey`。
- [x] 新增 `apps/web/src/labs/prompt-injection.ts`，定义固定场景样例、固定外部内容来源、防御策略、学习信号文案、学习进度和验证记录载荷。
- [x] 新增 `apps/web/src/views/PromptInjectionLabView.vue`，提供漏洞版 / 修复版固定样例观察工作台。
- [x] 新增 `/labs/ai/prompt-injection/vuln` 与 `/labs/ai/prompt-injection/fixed` 路由。
- [x] 页面只提供固定场景、固定来源和固定策略选择器，不提供任意提示词输入、模型配置、URL、密钥或真实工具参数输入。
- [x] `labs/ai/prompt-injection/meta.json` 已登记 web 入口，状态仍保持 `in-progress`，scripts 入口仍为空。
- [x] Prompt 注入 README、漏洞版说明、修复版说明、攻击步骤、修复说明、手动验证、脚本目录边界、下一波实验规划和共享元数据测试已同步当前状态。

验证记录：

- `pnpm --filter @network-safe/web exec vitest run tests/prompt-injection-api.test.ts tests/prompt-injection-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/shared test` 通过，30 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，178 项通过。
- `git diff --check -- <本轮目标文件>` 通过；仅出现 Windows 下 LF 将转换为 CRLF 的提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 未发现目标文件行尾空白。
- Prompt 注入安全关键词扫描仅命中禁止性说明、字段名反向断言、历史进度、路径 / 学习信号名和本地 API client 的 `fetch`，未发现外部 AI 调用、任意提示词输入器、危险提示词正文、可复用绕过模板、真实工具执行或攻击脚本实现。
- 下一项建议：为 `ai/prompt-injection` 补齐页面级验证或只读一致性验证脚本，仍不提供任意提示词输入框、外部 AI 调用或攻击脚本入口。

# 2026-07-01 最新进展：Prompt 注入后端确定性路由 API

- [x] 新增执行文档 `docs/execution/2026-07-01-ai-prompt-injection-virtual-router-api.md`。
- [x] 新增 `apps/server/src/services/prompt-injection-lab.ts`，使用固定 `scenarioKey`、固定 `instructionSourceKey` 和固定 `defensePolicyKey` 返回确定性路由结果。
- [x] 新增 `POST /api/labs/ai/prompt-injection/:variant/evaluate`，漏洞版 / 修复版均写入统一事件日志。
- [x] 新增 `apps/server/tests/prompt-injection-lab.test.ts`，覆盖漏洞版风险信号、修复版阻断、安全问答、未知 key 脱敏和路由日志摘要。
- [x] 日志 `inputSummary` 只记录固定 key、输入摘要长度、风险类别、策略状态和学习信号，不记录完整提示词、真实系统提示词、URL、密钥或外部目标。
- [x] 将 `labs/ai/prompt-injection/meta.json` 更新为 `in-progress`，登记 docs 和 api 入口，不登记 web 或 scripts 入口。
- [x] 更新 Prompt 注入 README、漏洞版说明、修复版说明、mock 说明、攻击步骤、修复说明、手动验证和脚本目录边界说明。
- [x] 更新共享元数据测试、服务端 health / registry 测试和下一波实验规划。

验证记录：

- `pnpm --filter @network-safe/server test -- tests/prompt-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，178 项通过。
- `pnpm --filter @network-safe/shared test` 通过，30 项测试通过。
- `git diff --cached --check` 通过。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 未发现目标文件行尾空白。
- Prompt 注入安全关键词扫描仅命中文档中的禁止性说明、字段名、localhost 测试 URL、历史进度或路径 / 学习信号名，未发现外部 AI 调用、危险提示词正文、可复用绕过模板、真实工具执行或攻击脚本实现。
- 下一项建议：进入 `ai/prompt-injection` 前端固定样例观察工作台切片，仍不提供任意提示词输入框、外部 AI 调用或脚本入口。

# 2026-07-01 最新进展：Prompt 注入目录与 planned 元数据

- [x] 新增执行文档 `docs/execution/2026-07-01-ai-prompt-injection-directory-metadata.md`。
- [x] 建立 `labs/ai/prompt-injection/` 标准目录。
- [x] 新增 `labs/ai/prompt-injection/meta.json`，状态为 `planned`，模式为 `interactive`，只登记 docs 入口。
- [x] 新增 Prompt 注入 README、漏洞版说明、修复版说明、mock 说明、攻击步骤、修复说明和手动验证文档。
- [x] 新增 `tools/lab-scripts/ai/prompt-injection/README.md`，当前只说明脚本边界，不提供 `exploit.py` 或 `verify.ts`。
- [x] 当前不登记 web、api 或 scripts 入口，不创建前端页面、后端 API、事件日志写入、模型调用、工具调用或 Prompt 注入攻击脚本。
- [x] 更新共享元数据测试，确认 Prompt 注入 planned/docs-only 元数据合法。
- [x] 更新服务端 health / registry 测试，本地元数据总数从 21 增加到 22，并确认 `ai.prompt-injection` 为 planned 条目。
- [x] 更新下一波实验规划和旧 AI / 新型攻击清单，将 Prompt 注入推进到 planned 文档入口。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，30 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，169 项通过。
- `git diff --check -- <本轮目标文件>` 未发现空白错误，仅有既有 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 未发现目标文件行尾空白。
- Prompt 注入安全关键词扫描仅命中文档中的禁止性说明、历史进度、localhost 测试 URL 或路径 / 信号名，未发现外部 AI 调用、危险提示词正文、可复用绕过模板、真实工具执行或攻击脚本实现。
- 下一项建议：进入 `ai/prompt-injection` 后端确定性路由 API 切片，仍只接受固定 `scenarioKey`、固定 `instructionSourceKey` 和固定 `defensePolicyKey`。

# 2026-07-01 最新进展：Prompt 注入实验执行文档

- [x] 新增执行文档 `docs/execution/2026-07-01-ai-prompt-injection-lab.md`。
- [x] 将 `ai/prompt-injection` 首版定位为“确定性提示词路由模拟器”，用于学习外部内容、检索片段、用户意图和工具调用之间的指令边界风险。
- [x] 明确后续实现只允许固定 `scenarioKey`、固定 `instructionSourceKey` 和固定 `defensePolicyKey`，不接收任意提示词正文、真实系统提示词、模型配置、工具参数、URL、密钥或外部目标。
- [x] 明确首版不调用外部 AI、云模型、本地大模型、第三方推理接口或真实工具调用。
- [x] 明确不生成钓鱼文本、恶意代码、绕过策略、仿冒身份内容、可投递攻击素材、完整危险提示词或危险样例库。
- [x] 明确事件日志只记录场景 key、来源 key、防御策略 key、输入长度、风险类别、命中固定样例、策略状态和学习信号，不保存完整提示词、完整检索片段、真实模型输出、Cookie、token 或凭据。
- [x] 更新下一波实验规划，将 `ai/prompt-injection` 从规划中推进到已有执行文档，并把下一步切片调整为目录与 planned 元数据。
- [x] 同步旧 AI / 新型攻击清单中的 Prompt 注入状态，避免继续显示为规划中。

验证记录：

- `git diff --check -- docs/execution/2026-07-01-ai-prompt-injection-lab.md docs/design/next-wave-security-labs.md docs/TODO.md docs/execution/security-lab-master-goal.md` 未发现空白错误，仅有 `docs/TODO.md`、`docs/design/next-wave-security-labs.md` 与 `docs/execution/security-lab-master-goal.md` 的既有 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- docs/execution/2026-07-01-ai-prompt-injection-lab.md docs/design/next-wave-security-labs.md docs/TODO.md docs/execution/security-lab-master-goal.md` 未发现目标文件行尾空白。
- 安全关键词扫描仅命中文档中的禁止性说明、历史进度或路径 / 信号名，未发现外部 AI 调用、危险提示词正文、可复用绕过模板、真实工具执行或攻击脚本实现。
- 下一项建议：进入 `ai/prompt-injection` 目录与 planned 元数据切片，先只登记 docs 入口，不创建后端 API、前端页面或 Prompt 注入脚本。

# 2026-07-01 最新进展：DNS 劫持 ready 收口

- [x] 新增执行文档 `docs/execution/2026-07-01-network-dns-hijack-ready-closeout.md`。
- [x] 按主计划完成标准逐项审计 `network/dns-hijack`，确认漏洞版、修复版、攻击方观察路径、防御方阻断 / 恢复路径、引导式页面、统一事件日志、文档、元数据和自动化验证均有证据闭环。
- [x] 将 `labs/network/dns-hijack/meta.json` 从 `in-progress` 更新为 `ready`，并补充 ready 状态安全边界说明。
- [x] 更新 `tools/lab-scripts/network/dns-hijack/verify.ts`，只读一致性验证脚本改为校验 `ready` 状态。
- [x] 修正 DNS 劫持页面空状态中的脚本入口文案为“只读一致性验证”。
- [x] 更新 DNS 劫持 README、漏洞版说明、修复版说明、mock 说明、攻击步骤、修复说明、手动验证、脚本目录说明、下一波实验规划、共享元数据测试和服务端注册表测试。
- [x] 当前仍不提供 `exploit.py`、真实 DNS 查询脚本、真实 DNS 劫持能力、系统网络配置脚本或可复用攻击工具。

验证记录：

- 通过 `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/network/dns-hijack/verify.ts`，报告 `ok: true`。
- 通过 `pnpm --filter @network-safe/shared test`，29 项测试通过。
- 通过 `pnpm --filter @network-safe/web exec vitest run tests/dns-hijack-api.test.ts tests/dns-hijack-lab.test.ts tests/router.test.ts`，3 个测试文件、9 项测试通过。
- 通过 `pnpm --filter @network-safe/testing e2e -- --grep "DNS 劫持"`，1 项 Playwright 用例通过。
- 通过 `pnpm --filter @network-safe/testing test`，9 项测试通过。
- 通过 `pnpm --filter @network-safe/server test -- tests/dns-hijack-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`，当前服务端测试脚本执行 169 项测试并全部通过。
- 下一项建议：进入 `ai/prompt-injection` 实现执行文档切片，仍不调用外部 AI 生成攻击内容，不生成钓鱼文本、恶意代码或绕过策略。

# 2026-07-01 最新进展：DNS 劫持只读一致性验证

- [x] 新增执行文档 `docs/execution/2026-07-01-network-dns-hijack-readonly-verification.md`。
- [x] 新增 `tools/lab-scripts/network/dns-hijack/verify.ts`，只读取仓库内 DNS 劫持元数据、文档、前端工作台、前端 API client、前端模型、后端服务实现和 Playwright 验证文件。
- [x] 验证脚本校验 `network.dns-hijack` 仍保持 `simulation` / `in-progress`，web 入口只包含漏洞版与修复版页面，API 入口只包含漏洞版与修复版 `resolve` 接口。
- [x] 验证脚本确认元数据只登记 `dns-hijack-verify` 这一只读验证脚本，不存在 `exploit.py` 或真实 DNS 查询脚本。
- [x] `labs/network/dns-hijack/meta.json` 已启用 `verification.automation.scriptVerification`，并保留 Playwright 页面验证和服务端 API 测试证据。
- [x] 更新 DNS 劫持 README、手动验证、脚本目录说明、下一波实验规划和共享元数据测试。
- [x] 当前仍不提供 `exploit.py`、真实 DNS 查询脚本、系统网络配置脚本或可复用攻击工具。

验证记录：

- 通过 `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/network/dns-hijack/verify.ts`，报告 `ok: true`。
- 通过 `pnpm --filter @network-safe/shared test`，29 项测试通过。
- 通过 `pnpm --filter @network-safe/testing test`，9 项测试通过。
- 通过 `pnpm --filter @network-safe/web exec vitest run tests/dns-hijack-api.test.ts tests/dns-hijack-lab.test.ts tests/router.test.ts`，3 个测试文件、9 项测试通过。
- 通过 `pnpm --filter @network-safe/server test -- tests/dns-hijack-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`，当前服务端测试脚本执行 169 项测试并全部通过。
- 下一项建议：按完成标准对 `network/dns-hijack` 做 ready 收口审计，确认是否可从 `in-progress` 推进到 `ready`。

# 2026-07-01 最新进展：DNS 劫持 Playwright 页面级验证

- [x] 新增执行文档 `docs/execution/2026-07-01-network-dns-hijack-playwright-verification.md`。
- [x] 在 `packages/testing/tests/e2e/platform.spec.mjs` 新增 DNS 劫持漏洞版 / 修复版页面差异验证。
- [x] Playwright 用例登录 `demo_user` 后只操作固定域名样例“客户门户”和固定解析视角，不输入任意域名、DNS 服务器、IP、代理、网络接口或端口。
- [x] 漏洞版断言 `dns-hijack-certificate-mismatch-visible` 对应页面文案、`accepted` 决策、错误虚拟地址类别 `shadow-customer-portal` 和证书状态 `mismatch`。
- [x] 修复版 public-cache 断言 `dns-hijack-anomaly-blocked` 对应页面文案、`blocked` 决策和策略阻断状态。
- [x] 修复版 trusted-resolver 断言 `dns-hijack-trusted-resolution-restored` 对应页面文案、`accepted` 决策、可信虚拟地址类别 `trusted-customer-portal` 和证书状态 `trusted`。
- [x] 更新 `labs/network/dns-hijack/meta.json` 的 Playwright 自动化证据，scripts 入口仍为空。
- [x] 更新 DNS 劫持 README、手动验证、下一波实验规划和共享元数据测试。

验证记录：

- `pnpm --filter @network-safe/testing e2e -- --grep "DNS 劫持"` 通过，1 项 Playwright 用例通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/shared test` 通过，29 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/dns-hijack-api.test.ts tests/dns-hijack-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/dns-hijack-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，169 项通过。
- `git diff --check` 通过；仅出现 Windows 下 LF 将转换为 CRLF 的提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 真实 DNS / 系统命令 / 脚本入口扫描无命中；任意输入关键词扫描无命中。
- 下一项建议：为 `network/dns-hijack` 补齐只读一致性验证脚本，或按完成标准做 ready 收口审计；仍不创建真实 DNS 查询脚本或系统网络配置能力。

# 2026-07-01 最新进展：DNS 劫持前端固定样例观察工作台

- [x] 新增执行文档 `docs/execution/2026-07-01-network-dns-hijack-frontend-workbench.md`。
- [x] 新增 `apps/web/src/api/dns-hijack-lab.ts`，前端只向后端提交固定 `domainKey` 和固定 `resolverProfile`。
- [x] 新增 `apps/web/src/labs/dns-hijack.ts`，定义固定域名样例、固定解析视角、学习信号文案、学习进度和验证记录载荷。
- [x] 新增 `apps/web/src/views/DnsHijackLabView.vue`，提供漏洞版 / 修复版固定样例观察工作台。
- [x] 新增 `/labs/network/dns-hijack/vuln` 与 `/labs/network/dns-hijack/fixed` 路由。
- [x] 页面只提供固定域名样例和固定解析视角选择器，不提供任意域名、DNS 服务器、IP、代理、网络接口或端口输入。
- [x] 将 `labs/network/dns-hijack/meta.json` 登记为已有 web 入口，状态仍保持 `in-progress`，scripts 入口仍为空。
- [x] 更新 DNS 劫持 README、漏洞版说明、修复版说明、攻击步骤、手动验证、下一波实验规划和共享元数据测试。

验证记录：

- `pnpm --filter @network-safe/web exec vitest run tests/dns-hijack-api.test.ts tests/dns-hijack-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/shared test` 通过，29 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，169 项通过。
- `git diff --check` 通过；仅出现 Windows 下 LF 将转换为 CRLF 的提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 真实 DNS / 系统命令扫描无命中；任意输入关键词扫描只命中固定 `domainKey` 选择器和测试中的反向断言。
- 下一项建议：为 `network/dns-hijack` 补齐页面级验证或只读一致性验证脚本，仍不创建真实 DNS 查询脚本或系统网络配置能力。

# 2026-07-01 最新进展：DNS 劫持后端受控内存解析 API

- [x] 新增执行文档 `docs/execution/2026-07-01-network-dns-hijack-virtual-api.md`。
- [x] 新增 `apps/server/src/services/dns-hijack-lab.ts`，使用固定 `domainKey` 和固定 `resolverProfile` 的内存解析表。
- [x] 新增 `POST /api/labs/network/dns-hijack/:variant/resolve`，只读取 `domainKey` 与 `resolverProfile`。
- [x] 漏洞版 `public-cache` 可观察错误虚拟地址类别和 `dns-hijack-certificate-mismatch-visible`。
- [x] 修复版 `public-cache` 可观察 `dns-hijack-anomaly-blocked`，修复版 `trusted-resolver` 可观察 `dns-hijack-trusted-resolution-restored`。
- [x] API 已写入统一事件日志，日志只记录域名样例 key、固定解析视角、虚拟地址类别、证书状态、异常标记和学习信号。
- [x] 未知 `domainKey` 或 `resolverProfile` 会被阻断，并在响应与日志中脱敏为 `blocked-domain` / `blocked-resolver`。
- [x] 更新 `labs/network/dns-hijack/meta.json` 为 `in-progress`，只登记 API 入口和 API 测试证据，web / scripts 入口仍为空。
- [x] 更新 DNS 劫持 README、漏洞版说明、修复版说明、mock 说明、攻击步骤、修复说明和手动验证文档。

验证记录：

- `pnpm --filter @network-safe/server test -- tests/dns-hijack-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，169 项通过。
- `pnpm --filter @network-safe/shared test` 通过，29 项通过。
- `git diff --check` 通过；仅出现 Windows 下 LF 将转换为 CRLF 的提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 真实 DNS / 系统命令相关扫描无命中；宽泛安全关键词扫描仅命中文档中的禁止性说明、边界约束和历史记录。
- 下一项建议：进入 `network/dns-hijack` 前端固定样例观察工作台切片，仍不创建 DNS 脚本或真实 DNS 查询能力。

# 2026-07-01 最新进展：DNS 劫持目录与 planned 元数据

- [x] 新增执行文档 `docs/execution/2026-07-01-network-dns-hijack-directory-metadata.md`。
- [x] 建立 `labs/network/dns-hijack/` 标准目录和 `tools/lab-scripts/network/dns-hijack/` 脚本目录占位。
- [x] 新增 `labs/network/dns-hijack/meta.json`，状态为 `planned`，模式为 `simulation`，只登记 docs 入口。
- [x] 新增 README、漏洞版说明、修复版说明、mock 说明、攻击方观察步骤、修复说明和手动验证文档。
- [x] 脚本目录当前只包含 README，不提供 `exploit.py`、`verify.ts`、真实 DNS 查询脚本或系统网络配置脚本。
- [x] 更新共享元数据测试，确认 `network.dns-hijack` 是 planned/docs-only simulation。
- [x] 更新服务端 health / registry 测试，当前本地元数据总数从 20 增加到 21，并包含 `network.dns-hijack` planned 条目。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试。
- `git diff --check -- <本轮目标文件>` 通过；仅出现 Windows 下 LF 将转换为 CRLF 的提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- DNS 劫持安全关键词扫描仅命中文档中的禁止性说明、planned 边界和历史记录，未发现真实 DNS 配置改动、外部解析请求、真实投毒链路、隧道通信或可复用攻击脚本实现。
- 下一项建议：已在后续切片接入 `network/dns-hijack` 后端受控内存解析 API，下一步进入前端固定样例观察工作台。

# 2026-07-01 最新进展：DNS 劫持实验执行文档

- [x] 新增执行文档 `docs/execution/2026-07-01-network-dns-hijack-lab.md`。
- [x] 将 `network/dns-hijack` 首版定位为“内存 DNS 解析差异模拟器”，用于学习错误解析、证书不匹配、可信解析源和异常解析审计。
- [x] 明确后续实现只允许固定 `domainKey` 和固定 `resolverProfile`，不接收任意域名、DNS 服务器、IP、代理、网络接口或端口参数。
- [x] 明确首版不修改本机 DNS、hosts、代理、路由、防火墙或系统网络配置，不请求真实外部 DNS、DoH、DoT 或公共解析服务。
- [x] 明确事件日志只记录域名样例 key、解析结果类别、证书状态、异常审计结论和学习信号，不保存真实域名访问记录、真实 IP、真实证书、Cookie、token 或凭据。
- [x] 更新下一波实验规划，将 `network/dns-hijack` 从规划中推进到已有执行文档，并把下一步切片调整为目录与 planned 元数据。
- [x] 同步旧网络 / 传输层清单中的端口扫描与 DNS 劫持状态，避免继续显示为规划中。

验证记录：

- `git diff --check -- docs/execution/2026-07-01-network-dns-hijack-lab.md docs/design/next-wave-security-labs.md docs/TODO.md docs/execution/security-lab-master-goal.md` 通过；仅出现 Windows 下 LF 将转换为 CRLF 的提示。
- `rg -n "[ \t]+$" -- docs/execution/2026-07-01-network-dns-hijack-lab.md docs/design/next-wave-security-labs.md docs/TODO.md docs/execution/security-lab-master-goal.md` 无命中。
- 安全关键词扫描仅命中文档中的禁止性说明、边界约束和历史进度记录，未发现真实 DNS 配置改动、外部解析请求、真实投毒链路、隧道通信或可复用攻击脚本实现。
- 下一项建议：已在后续切片建立 `network/dns-hijack` 目录与 planned 元数据，下一步进入后端受控内存解析 API。

# 2026-07-01 最新进展：端口扫描 ready 收口

- [x] 新增执行文档 `docs/execution/2026-07-01-network-port-scan-ready-closeout.md`。
- [x] 按主计划完成标准逐项审计 `network/port-scan`，确认漏洞版、修复版、攻击方观察路径、防御方收敛路径、引导式页面、统一事件日志、文档、元数据和自动化验证均有证据闭环。
- [x] 将 `labs/network/port-scan/meta.json` 从 `in-progress` 更新为 `ready`，并补充 ready 状态安全边界说明。
- [x] 更新 `tools/lab-scripts/network/port-scan/verify.ts`，只读一致性验证脚本改为校验 `ready` 状态。
- [x] 修正端口扫描页面空状态中的脚本入口文案为“只读一致性验证”。
- [x] 更新端口扫描 README、手动验证、攻击步骤、脚本目录说明、下一波实验规划、共享元数据测试和服务端注册表测试。
- [x] 当前仍不提供 `exploit.py`、真实端口扫描脚本、真实网络探测或通用扫描器能力。

验证记录：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/network/port-scan/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，28 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/port-scan-api.test.ts tests/port-scan-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/testing e2e -- --grep "端口扫描"` 通过，1 项 Playwright 用例通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/port-scan-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，161 项通过。
- `git diff --check -- <本轮目标文件>` 通过；仅出现 Windows 下 LF 将转换为 CRLF 的提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 安全关键词扫描仅命中禁止性说明和只读脚本的负向检查列表，未发现真实网络探测、系统命令或通用扫描器实现。
- 下一项建议：进入 `network/dns-hijack` 目录与 planned 元数据切片，继续保持内存解析表和不修改本机 DNS / hosts / 代理 / 路由的边界。

# 2026-07-01 最新进展：端口扫描只读一致性验证

- [x] 新增执行文档 `docs/execution/2026-07-01-network-port-scan-readonly-verification.md`。
- [x] 新增 `tools/lab-scripts/network/port-scan/verify.ts`，只读取仓库内端口扫描元数据、文档和相关实现文件。
- [x] 验证脚本确认 web 入口、API 入口、脚本入口、Playwright 证据、服务端 API 测试证据和安全边界一致。
- [x] `labs/network/port-scan/meta.json` 已登记 `port-scan-verify` 脚本入口，并启用 `verification.automation.scriptVerification`。
- [x] 更新端口扫描 README、攻击步骤、修复说明、手动验证、脚本目录说明和下一波实验规划。
- [x] 共享元数据测试已同步端口扫描脚本入口和自动化证据断言。
- [x] 首次运行只读脚本时发现标准文档缺少精确边界短语，已补强 README 后重跑通过。

验证记录：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/network/port-scan/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，28 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/port-scan-api.test.ts tests/port-scan-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，161 项通过。
- 本轮仍未新增 `exploit.py`、真实端口扫描脚本、真实网络探测或通用扫描器能力。
- 下一项建议：按完成标准对 `network/port-scan` 做 ready 收口审计，确认是否可从 `in-progress` 推进到 `ready`。

# 2026-07-01 最新进展：端口扫描 Playwright 页面级验证

- [x] 新增执行文档 `docs/execution/2026-07-01-network-port-scan-playwright-verification.md`。
- [x] 在 `packages/testing/tests/e2e/platform.spec.mjs` 新增端口扫描漏洞版 / 修复版页面差异验证。
- [x] Playwright 用例登录 `demo_user` 后只操作固定虚拟目标“后台管理节点”和固定观察模式，不输入任意 IP、域名、网段或端口范围。
- [x] 漏洞版断言 `port-scan-management-surface-visible` 对应页面文案、`accepted` 决策、暴露面评分 `155`、高风险端口 `3` 和 `public / critical` 数据库端口。
- [x] 修复版断言 `port-scan-surface-reduced` 对应页面文案、`accepted` 决策、公开端口 `0`、高风险端口 `0`，以及数据库服务收敛为 `internal-only / medium`。
- [x] 将 `labs/network/port-scan/meta.json` 的 Playwright 自动化证据更新为 `packages/testing/tests/e2e/platform.spec.mjs`。
- [x] 更新端口扫描 README、手动验证、下一波实验规划和共享元数据测试。

验证记录：

- `pnpm --filter @network-safe/testing e2e -- --grep "端口扫描"` 通过，1 项 Playwright 用例通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/shared test` 通过，28 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/port-scan-api.test.ts tests/port-scan-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，161 项通过。
- `git diff --check -- <本轮已跟踪目标文件>` 通过；仅出现 Windows 下 LF 将转换为 CRLF 的提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中，已覆盖新增未跟踪文件。
- 端口扫描前端和 Playwright 实现未新增真实网络探测、系统命令、`nmap`、`Test-NetConnection`、`ping`、`tracert`、`netcat` 或独立 `nc` 调用；安全关键词命中均为禁止性说明、边界文案或测试中的反向断言。
- 本轮未新增 `exploit.py`、`verify.ts`、真实端口扫描脚本、真实网络探测或通用扫描器能力。
- 下一项建议：补齐 `network/port-scan` 只读一致性验证脚本，或按完成标准做 ready 收口审计。

# 2026-07-01 最新进展：端口扫描前端工作台

- [x] 新增执行文档 `docs/execution/2026-07-01-network-port-scan-frontend-workbench.md`。
- [x] 新增 `apps/web/src/api/port-scan-lab.ts`，前端只提交 `targetKey` 和 `scanProfile`。
- [x] 新增 `apps/web/src/labs/port-scan.ts`，定义固定虚拟目标、固定观察模式、学习信号文案、学习进度和验证记录载荷。
- [x] 新增 `apps/web/src/views/PortScanLabView.vue`，提供漏洞版 / 修复版固定目标观察工作台。
- [x] 新增 `/labs/network/port-scan/vuln` 与 `/labs/network/port-scan/fixed` 路由。
- [x] 页面只提供固定虚拟目标和固定观察模式选择器，不提供任意 IP、域名、网段、端口范围、超时、并发或代理输入框。
- [x] 将 `labs/network/port-scan/meta.json` 登记为已有 web 入口，状态仍保持 `in-progress`，脚本入口仍为空。
- [x] 更新端口扫描 README、攻击步骤、修复说明、手动验证、下一波实验规划和共享元数据测试。

验证记录：

- `pnpm --filter @network-safe/web exec vitest run tests/port-scan-api.test.ts tests/port-scan-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/shared test` 通过，28 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，161 项通过。
- `git diff --check -- <本轮已跟踪目标文件>` 通过；仅出现 Windows 下 LF 将转换为 CRLF 的提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中，已覆盖新增未跟踪文件。
- 端口扫描前端实现代码未命中真实网络探测、系统命令、`nmap`、`Test-NetConnection`、`ping`、`tracert`、`netcat` 或独立 `nc`；宽泛安全关键词扫描命中的内容均为禁止性说明、文档边界或测试中的反向断言。
- 本轮未新增数据库迁移、`exploit.py`、`verify.ts`、真实端口扫描脚本或通用扫描器能力。
- 下一项建议：为 `network/port-scan` 补齐页面级 Playwright 差异验证或只读一致性验证脚本，仍不创建真实扫描脚本。

# 2026-06-30 最新进展：端口扫描虚拟资产观察 API

- [x] 新增执行文档 `docs/execution/2026-06-30-network-port-scan-virtual-api.md`。
- [x] 新增 `apps/server/src/services/port-scan-lab.ts`，只使用固定虚拟资产表和虚拟端口状态。
- [x] 新增 `POST /api/labs/network/port-scan/:variant/scan` 后端受控 API，只读取 `targetKey` 和 `scanProfile`。
- [x] API 不接收任意 IP、域名、网段、端口范围、超时、并发、代理、认证、Cookie 或 token 字段。
- [x] 未知虚拟目标或观察模式会返回 `port-scan-target-blocked`，并将响应与事件日志中的原始目标脱敏为 `blocked-target` / `blocked-profile`。
- [x] 事件日志只记录虚拟目标 key、观察模式、虚拟端口数量、公开端口数量、受限端口数量、高风险端口数量、暴露面评分和学习信号。
- [x] 新增 `apps/server/tests/port-scan-lab.test.ts`，覆盖漏洞版管理面暴露、修复版暴露面收敛、未知目标阻断、登录要求和事件日志脱敏摘要。
- [x] 将 `labs/network/port-scan/meta.json` 更新为 `in-progress`，登记漏洞版 / 修复版 API 入口和 API 测试证据，脚本入口仍为空。
- [x] 更新端口扫描 README、攻击步骤、修复说明、mock 说明和手动验证文档，说明当前仅接入后端 API，尚未接入页面或脚本。

验证记录：

- `pnpm --filter @network-safe/server test -- tests/port-scan-lab.test.ts` 通过；该命令实际运行服务端全量测试，161 项通过。
- `pnpm --filter @network-safe/shared test` 通过，28 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/port-scan-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，161 项通过。
- `git diff --check -- <本轮目标文件>` 通过；仅出现 Windows 下 LF 将转换为 CRLF 的提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 端口扫描相关代码安全关键词复核通过，未命中真实 socket、系统命令、`nmap`、`Test-NetConnection`、`ping`、`tracert`、`netcat` 或独立 `nc`。
- 本轮未新增前端页面、数据库迁移、`exploit.py`、`verify.ts`、真实端口扫描脚本或通用扫描器能力。
- 下一项建议：进入 `network/port-scan` 前端工作台切片，继续使用固定目标选择器和固定观察模式，不提供任意目标输入。

# 2026-06-30 最新进展：端口扫描目录与 planned 元数据

- [x] 新增执行文档 `docs/execution/2026-06-30-network-port-scan-directory-metadata.md`。
- [x] 建立 `labs/network/port-scan/` 标准目录和 `tools/lab-scripts/network/port-scan/` 脚本目录占位。
- [x] 新增 `labs/network/port-scan/meta.json`，状态为 `planned`，模式为 `simulation`，只登记 docs 入口。
- [x] 新增 README、漏洞版说明、修复版说明、mock 说明、攻击方观察步骤、修复说明和手动验证文档。
- [x] 脚本目录当前只包含 README，不提供 `exploit.py`、`verify.ts`、真实端口扫描脚本或通用扫描器能力。
- [x] 更新共享元数据测试，确认 `network.port-scan` 是 planned/docs-only simulation。
- [x] 更新服务端 health / registry 测试，当前本地元数据总数从 19 增加到 20，并包含 `network.port-scan` planned 条目。

验证记录：

- 本轮未新增页面、API、数据库迁移、事件日志写入实现或扫描脚本。
- `pnpm --filter @network-safe/shared test` 通过，28 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，154 项测试通过。
- `git diff --check -- docs\execution\2026-06-30-network-port-scan-lab.md docs\execution\2026-06-30-network-port-scan-directory-metadata.md docs\design\next-wave-security-labs.md docs\TODO.md docs\execution\security-lab-master-goal.md labs\network\port-scan tools\lab-scripts\network\port-scan packages\shared\tests\lab-metadata.test.mjs apps\server\tests\health.test.ts apps\server\tests\lab-registry.test.ts` 未发现新增空白错误，仅提示 `apps/server/tests/health.test.ts`、`apps/server/tests/lab-registry.test.ts`、`docs/TODO.md`、`packages/shared/tests/lab-metadata.test.mjs` 既有 LF/CRLF 转换。
- `rg -n "[ \t]+$" ...` 未发现目标文件行尾空白。
- 端口扫描安全关键词扫描仅命中文档中的禁止性说明、localhost 测试 URL 和历史验证记录，未发现真实扫描脚本、真实 socket 探测、系统命令探测或通用扫描器实现。
- 下一项建议：进入 `network/port-scan` 虚拟资产模型与受控 API 设计切片，仍不创建真实扫描能力。

# 2026-06-30 最新进展：端口扫描暴露面实验执行文档

- [x] 新增执行文档 `docs/execution/2026-06-30-network-port-scan-lab.md`。
- [x] 将 `network/port-scan` 首版定位为“虚拟暴露面观察器”，用于学习端口暴露面侦察和最小暴露面治理，不作为真实扫描器。
- [x] 明确后续实现只允许固定虚拟目标 `targetKey` 和固定观察模式，不接收任意 IP、域名、网段、端口范围、超时、并发或代理参数。
- [x] 明确首版不调用真实 socket、系统命令、PowerShell、`nmap`、`Test-NetConnection`、`ping`、`tracert` 或类似探测工具。
- [x] 明确事件日志只记录虚拟目标 key、虚拟端口数量、开放端口数量、高风险端口数量、暴露面评分和学习信号，不保存真实 IP、主机名、banner、凭据、token 或 Cookie。
- [x] 更新 `docs/design/next-wave-security-labs.md`，将端口扫描状态从规划中推进到已有执行文档。

验证记录：

- 本轮只新增执行文档并更新规划状态，未新增目录、元数据、页面、API、数据库迁移或脚本。
- `git diff --check -- docs\execution\2026-06-30-network-port-scan-lab.md docs\design\next-wave-security-labs.md docs\TODO.md docs\execution\security-lab-master-goal.md` 未发现新增空白错误，仅提示 `docs/TODO.md` 既有 LF/CRLF 转换。
- `rg -n "[ \t]+$" ...` 未发现目标文档行尾空白。
- 端口扫描安全关键词扫描仅命中文档中的禁止性说明、localhost 固定目标说明和历史验证记录，未发现真实目标扫描方案、可执行扫描命令或通用扫描器实现。
- 下一项建议：进入 `network/port-scan` 目录与 `planned` 元数据切片，先只登记 docs 入口，不创建扫描脚本。

# 2026-06-30 最新进展：下一波安全实验规划

- [x] 新增执行文档 `docs/execution/2026-06-30-next-wave-security-labs-planning.md`。
- [x] 新增设计文档 `docs/design/next-wave-security-labs.md`，承接网络 / 传输层、社会工程学、AI、供应链、恶意软件、客户端和基础设施扩展实验。
- [x] 推荐首批顺序锁定为 `network/port-scan`、`network/dns-hijack`、`ai/prompt-injection`、`social/phishing`、`supply-chain/dependency-confusion`、`infrastructure/misconfiguration`。
- [x] 明确网络实验首版以虚拟资产和内存解析表为主，不扫描真实网段，不修改本机 DNS、hosts、代理、路由或防火墙。
- [x] 明确社会工程学只做仿真页面、固定样例和识别训练，不发送真实邮件 / 短信，不收集真实凭据。
- [x] 明确 AI 首批以确定性 Prompt 注入模拟器为主，不调用外部 AI 生成攻击内容。
- [x] 明确供应链、恶意软件、客户端和基础设施方向的禁止能力，避免演变成真实投毒、恶意样本、表单外传或真实配置改动。

验证记录：

- 本轮为规划文档切片，未新增页面、API、数据库迁移、实验元数据或脚本。
- `git diff --check -- docs\execution\2026-06-30-next-wave-security-labs-planning.md docs\design\next-wave-security-labs.md docs\TODO.md docs\execution\security-lab-master-goal.md` 未发现新增空白错误，仅提示 `docs/TODO.md` 既有 LF/CRLF 转换。
- `rg -n "[ \t]+$" ...` 未发现目标文档行尾空白。
- 安全关键词扫描命中的内容均为禁止性说明或历史验证记录，未发现外部 URL、真实凭据或可执行外部攻击链。
- 下一项建议：为 `network/port-scan` 单独编写实现执行文档，优先锁定虚拟资产模型和 localhost-only 脚本边界。

# 2026-06-30 最新进展：case-study ready 共享元数据规则

- [x] 新增执行文档 `docs/execution/2026-06-30-case-study-ready-metadata-rule.md`。
- [x] 更新 `packages/shared/src/lab-metadata.js`，为 `status: "ready"` 且 `mode: "case-study"` 的元数据增加共享校验。
- [x] 规则要求 case-study ready 必须具备 `safeBoundaries`、说明不提供攻击脚本的 `notes`、全部为 `false` 的 `variants[].supportsAutomation`，并至少登记两类自动化证据。
- [x] 更新 `packages/shared/tests/lab-metadata.test.mjs`，覆盖合法样例、缺少边界和 notes、误标变体自动化、自动化证据不足等情况。
- [x] 当前唯一 `ready + case-study` 实验仍是 `web.ldap-injection`，现有 19 个实验元数据均通过共享校验。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，27 项测试通过。
- 目标文件 `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- 目标文件行尾空白扫描未命中。
- 当前唯一 `ready + case-study` 元数据仍为 `web.ldap-injection`。

# 2026-06-30 最新进展：LDAP 注入 case-study ready 收口

- [x] 新增执行文档 `docs/execution/2026-06-30-web-ldap-injection-ready-closeout.md`。
- [x] 将 `labs/web/ldap-injection/meta.json` 更新为 `status: "ready"`，并保留 `mode: "case-study"`。
- [x] 保持 `variants[].supportsAutomation` 为 `false`，明确当前没有攻击脚本自动化。
- [x] 在元数据 `safeBoundaries` 与 `notes` 中说明当前 ready 是 case-study 例外收口，不提供 `exploit.py` 或 LDAP 查询脚本。
- [x] 更新共享元数据测试、服务端 health / registry 测试和 LDAP 只读一致性验证脚本，使 ready 状态与安全边界一起被校验。
- [x] 更新 LDAP README、手动验证文档、注入类剩余规划和总纲，说明当前 ready 由页面、API、事件日志、Playwright、文档和只读验证闭环证明。
- [x] 当前仍不连接真实 LDAP / AD / OpenLDAP 服务，不创建 LDAP 查询脚本或攻击脚本，不提供过滤器 payload 库或任意过滤器执行器。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，23 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/ldap-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；当前服务端脚本实际运行全量测试，154 项通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ldap-injection/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/testing e2e -- --grep "LDAP"` 通过，1 项 Playwright 测试通过。
- 首轮 shared / LDAP verify 曾暴露 `safeBoundaries` 缺少同时包含 `case-study` 与 `ready` 的证据，已补强元数据后重跑通过。
- 目标文件 `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- 目标文件行尾空白扫描未命中。
- LDAP 聚焦安全关键词扫描仅命中文档中的禁止性说明和共享元数据测试读取 fixture 的 `readFile`，未发现真实目录连接、目录命令、动态执行、命令执行、外部请求或 `inputSummaryJson` 暴露。

# 2026-06-30 最新进展：LDAP 注入 Playwright 页面验证切片

- [x] 新增执行文档 `docs/execution/2026-06-30-web-ldap-injection-playwright-verification.md`。
- [x] 在 `packages/testing/tests/e2e/platform.spec.mjs` 中新增 LDAP 页面级差异验证，用真实浏览器流程登录、进入漏洞版 / 修复版工作台、填入受控样例并提交虚拟目录查询。
- [x] 漏洞版断言学习信号为“漏洞版虚拟目录结果范围被扩大”，后端决策为 `accepted`，结果范围为 `expanded`，并展示虚拟受限教学记录。
- [x] 修复版断言学习信号为“修复版阻断受控 LDAP 样例”，后端决策与结果范围均为 `blocked`，并确认不展示虚拟受限教学记录。
- [x] 修正 `packages/testing/src/smoke/config.mjs` 的实验总数前置检查，从本地 `labs/*/*/meta.json` 动态统计当前实验数量，避免新增实验后 smoke 仍停留在旧的固定总数。
- [x] 补充 `packages/testing/tests/smoke-config.test.mjs`，确认 labs API smoke 检查使用当前本地元数据数量。
- [x] 更新 LDAP 元数据、共享元数据测试、只读一致性验证脚本、README、手动验证文档和注入类剩余规划，登记 Playwright 页面验证入口。
- [x] 该 Playwright 切片当时仍保持 LDAP `status: in-progress`、`mode: case-study`；后续已按 case-study ready 标准收口，仍不连接真实 LDAP / AD / OpenLDAP 服务，不创建 LDAP 查询脚本或攻击脚本，不提供过滤器 payload 库。

验证记录：

- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/testing e2e -- --grep "LDAP"` 通过，1 项 Playwright 测试通过。
- `pnpm --filter @network-safe/shared test` 通过，23 项测试通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ldap-injection/verify.ts` 通过，报告 `ok: true`。
- 本轮曾发现两个可追溯问题并已修正：testing smoke 旧基线期望 `total: 15`，实际当前本地实验为 19；LDAP E2E 短文本状态断言匹配过宽，已改为状态面板内的精确语义断言。

# 2026-06-30 最新进展：LDAP 注入前端工作台接入切片

- [x] 新增执行文档 `docs/execution/2026-06-30-web-ldap-injection-frontend-workbench.md`。
- [x] 新增 `apps/web/src/api/ldap-injection-lab.ts`，接入 `POST /api/labs/web/ldap-injection/:variant/search`。
- [x] 扩展 `apps/web/src/labs/ldap-injection.ts`，补充正常样例、受控样例、学习进度载荷、验证记录载荷和虚拟目录 API 信号文案。
- [x] 改造 `apps/web/src/views/LdapInjectionLabView.vue`，从静态案例页升级为案例观察 + 虚拟目录工作台。
- [x] 页面只展示后端决策、学习信号、目录条目数量、关键词长度、脱敏预览、风险类型、结果范围和虚拟目录条目，不展示原始 `inputSummaryJson`。
- [x] 补充 `apps/web/tests/ldap-injection-api.test.ts`，更新 `apps/web/tests/ldap-injection-lab.test.ts`。
- [x] 更新 LDAP 元数据、场景文档、手动验证、只读一致性验证脚本、共享元数据测试和注入类剩余规划。
- [x] 当前仍不连接真实 LDAP / AD / OpenLDAP 服务，不创建 LDAP 查询脚本或攻击脚本，不提供过滤器 payload 库。

验证记录：

- `pnpm --filter @network-safe/web exec vitest run tests/ldap-injection-api.test.ts tests/ldap-injection-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ldap-injection/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，23 项测试通过。
- 目标文件 `git diff --check` 未发现空白错误，仅有 `docs/TODO.md` 与 `packages/shared/tests/lab-metadata.test.mjs` 的既有 LF/CRLF 提示。
- 目标文件行尾空白扫描未命中。
- LDAP 前端、helper、测试、场景文档和脚本聚焦安全扫描未发现真实目录连接、目录命令、动态执行、命令执行、文件读取或 `inputSummaryJson` 暴露；唯一 `fetch(` 为前端调用本项目 API。

# 2026-06-30 最新进展：LDAP 注入虚拟目录 API 切片

- [x] 新增执行文档 `docs/execution/2026-06-30-web-ldap-injection-virtual-directory-api.md`。
- [x] 新增 `apps/server/src/services/ldap-injection-lab.ts`，只使用内存虚拟目录数据，不连接真实 LDAP / AD / OpenLDAP 服务。
- [x] 新增 `POST /api/labs/web/ldap-injection/:variant/search`，支持漏洞版和修复版虚拟目录查询。
- [x] 漏洞版固定受控样例触发 `ldap-injection-scope-expanded`，修复版同样样例触发 `ldap-injection-controlled-sample-blocked`。
- [x] LDAP 事件已接入 `lab_event_logs`，日志只写入场景、关键词长度、脱敏预览、风险类型、结果范围、条目数量和学习信号。
- [x] 更新 `labs/web/ldap-injection/meta.json`，登记虚拟目录 API 和 API 测试，仍不登记攻击脚本。
- [x] 更新只读一致性验证脚本，校验前端工作台、虚拟目录 API、文档和脚本入口一致性。
- [x] 更新共享元数据测试、服务端 health / registry 断言和 LDAP 文档。

验证记录：

- `pnpm --filter @network-safe/server test -- tests/ldap-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该脚本实际运行服务端全量测试，154 项通过。

# 2026-06-30 最新进展：LDAP 注入一致性验证脚本切片

- [x] 新增执行文档 `docs/execution/2026-06-30-web-ldap-injection-consistency-verify.md`。
- [x] 新增 `tools/lab-scripts/web/ldap-injection/README.md`。
- [x] 新增 `tools/lab-scripts/web/ldap-injection/verify.ts`，只读取本仓库内固定 LDAP 元数据和案例文档，输出一致性验证报告。
- [x] 更新 `labs/web/ldap-injection/meta.json`，登记 `ldap-injection-verify` 脚本入口；后续虚拟目录 API 切片已补齐 api 入口。
- [x] `verification.automation.supported` 调整为 `true`，仅表示接入文档一致性验证脚本；`variants[].supportsAutomation` 仍为 `false`。
- [x] 更新 LDAP README 和手动验证文档，当时明确没有后端 API、事件日志写入、LDAP 查询脚本或攻击脚本；后续已补齐受控虚拟目录 API。
- [x] 更新共享元数据测试，确认 LDAP 当前登记前端工作台、虚拟目录 API、文档和一致性验证脚本。

验证记录：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ldap-injection/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，23 项测试通过。
- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/execution/2026-06-30-web-ldap-injection-static-case-page.md docs/execution/2026-06-30-web-ldap-injection-consistency-verify.md docs/design/injection-remaining-labs.md labs/web/ldap-injection tools/lab-scripts/web/ldap-injection packages/shared/tests/lab-metadata.test.mjs` 未发现空白错误，仅有既有 LF/CRLF 提示。
- `rg -n "[ \t]+$" ...` 未发现目标文件行尾空白。
- LDAP 脚本目录与场景文档安全关键词扫描未命中。

# 2026-06-30 最新进展：LDAP 注入静态案例页切片

- [x] 新增执行文档 `docs/execution/2026-06-30-web-ldap-injection-static-case-page.md`。
- [x] 新增 `apps/web/src/labs/ldap-injection.ts`，维护 LDAP 静态案例、变体配置、复盘清单和学习信号文案。
- [x] 新增 `apps/web/src/views/LdapInjectionLabView.vue`，提供漏洞案例 / 修复案例静态学习页面。
- [x] 新增 `/labs/web/ldap-injection/vuln` 与 `/labs/web/ldap-injection/fixed` 路由。
- [x] 更新 `labs/web/ldap-injection/meta.json` 为 `in-progress`，该静态页切片当时只登记 web 与 docs 入口；后续已补齐脚本和虚拟目录 API 入口。
- [x] 更新 LDAP README、攻击步骤、修复案例说明和手动验证文档，静态页切片当时明确没有后端 API、事件日志写入或脚本入口；后续已补齐受控虚拟目录 API。
- [x] 补充 `apps/web/tests/ldap-injection-lab.test.ts`，更新路由测试和共享元数据测试。
- [x] 当前仍不连接真实 LDAP / AD / OpenLDAP 服务，不创建 LDAP 查询脚本，不提供过滤器 payload 库，不写入事件日志。

验证记录：

- `pnpm --filter @network-safe/web exec vitest run tests/ldap-injection-lab.test.ts tests/router.test.ts` 通过，2 个测试文件、5 项测试通过。
- `pnpm --filter @network-safe/shared test` 通过，23 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/execution/2026-06-30-web-ldap-injection-static-case-page.md docs/design/injection-remaining-labs.md labs/web/ldap-injection apps/web/src/labs/ldap-injection.ts apps/web/src/views/LdapInjectionLabView.vue apps/web/src/router/routes.ts apps/web/src/styles/main.css apps/web/tests/ldap-injection-lab.test.ts apps/web/tests/router.test.ts packages/shared/tests/lab-metadata.test.mjs` 未发现空白错误，仅有既有 LF/CRLF 提示。
- `rg -n "[ \t]+$" ...` 未发现目标文件行尾空白。
- LDAP 静态页、helper 与场景文档安全关键词扫描未命中。
- `Test-Path -LiteralPath tools\lab-scripts\web\ldap-injection` 返回 `False`，确认本轮未创建 LDAP 脚本目录。

# 2026-06-30 最新进展：LDAP 注入目录与案例文档切片

- [x] 建立 `labs/web/ldap-injection/` 标准实验目录结构。
- [x] 新增 `labs/web/ldap-injection/meta.json`，当前状态为 `planned`，模式为 `case-study`。
- [x] 元数据只登记 docs 入口，不登记尚未实现的 web / api / scripts 入口。
- [x] 新增实验总说明、漏洞案例、修复案例、mock 说明、攻击方观察步骤、修复说明和手动验证文档。
- [x] 补充共享元数据测试，确认 LDAP 当前为 planned/docs-only/case-study 元数据。
- [x] 当前仍不创建后端 API、前端页面或 LDAP 查询脚本。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，23 项测试通过。
- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/design/injection-remaining-labs.md labs/web/ldap-injection packages/shared/tests/lab-metadata.test.mjs` 未发现空白错误，仅有 `docs/TODO.md` 与 `packages/shared/tests/lab-metadata.test.mjs` 的既有 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/design/injection-remaining-labs.md labs/web/ldap-injection packages/shared/tests/lab-metadata.test.mjs` 未发现目标文件行尾空白。
- `rg -n "ldap://|ldaps://|ldapsearch|ldapmodify|ldapdelete|ldapadd|bindDN|password|process\\.env|createReadStream|readFile|http\\.request|https\\.request|eval\\(|new Function|child_process" labs/web/ldap-injection` 未命中。
- `Test-Path -LiteralPath tools\\lab-scripts\\web\\ldap-injection` 返回 `False`，确认本轮未创建 LDAP 脚本目录。

# 2026-06-30 最新进展：LDAP 注入案例化执行文档

- [x] 新增 `docs/execution/2026-06-30-web-ldap-injection-lab.md`。
- [x] 明确 `web/ldap-injection` 一期落地方式为 `case-study`，状态先保持 `planned`。
- [x] 明确本实验不连接真实 LDAP / AD / OpenLDAP 服务，不进行真实 bind、search、modify 或 delete 操作。
- [x] 明确不保存目录账号、组织结构、DN、邮箱、手机号、凭据或外部目标信息。
- [x] 明确不提供对外 LDAP 查询脚本、不生成过滤器 payload 库、不实现任意 LDAP 过滤器执行器。
- [x] 规划后续目录为 `labs/web/ldap-injection/`，初始只登记 docs 入口，不登记未实现的 web / api / scripts 入口。
- [x] 规划案例内容为组织成员搜索、权限组查询和登录筛选三个固定案例。
- [x] 下一步进入 `web/ldap-injection` 目录与文档切片，创建 planned/case-study 元数据和基础案例文档，暂不创建后端 API、前端页面或 LDAP 查询脚本。

验证记录：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/design/injection-remaining-labs.md` 未发现空白错误，仅有 `docs/TODO.md` 的既有 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/design/injection-remaining-labs.md` 未发现目标文档行尾空白。
- LDAP 执行文档安全边界关键词检查确认已明确 `case-study`、`planned`、不连接真实 LDAP、不保存目录账号、不提供对外 LDAP 查询脚本、不生成过滤器 payload 库和不实现任意 LDAP 过滤器执行器。
- LDAP 执行文档风险关键词扫描仅命中禁止展示原始 `inputSummaryJson` 的说明，未发现真实 LDAP URL、ldapsearch / ldapmodify / bindDN、文件读取、外部请求、动态执行或命令执行内容。

# 2026-06-30 最新进展：XPath 注入实验 ready 收口

- [x] 新增 `apps/web/src/api/xpath-injection-lab.ts`，接入 `POST /api/labs/web/xpath-injection/:variant/search`。
- [x] 新增 `apps/web/src/labs/xpath-injection.ts`，提供漏洞版 / 修复版配置、正常样例、受控样例、学习进度和验证记录载荷。
- [x] 新增 `apps/web/src/views/XpathInjectionLabView.vue`，提供 XML 产品目录查询工作台、受控样例填充、后端判定、学习信号、虚拟产品目录结果和日志摘要说明。
- [x] 新增 `/labs/web/xpath-injection/vuln` 与 `/labs/web/xpath-injection/fixed` 路由。
- [x] 新增 `tools/lab-scripts/web/xpath-injection/exploit.py` 与 `verify.ts`，脚本仅允许本机受控目标。
- [x] 更新 `labs/web/xpath-injection/meta.json` 为 `ready`，补齐 web / api / scripts / docs / verification 入口。
- [x] 更新 XPath 实验 README、漏洞版 / 修复版 / mock 说明、攻击步骤、修复说明、手动验证文档和脚本目录说明。
- [x] 补齐前端 API/helper/router 测试、共享元数据测试和服务端 registry/health 状态断言。
- [x] 已清理 `python -m py_compile` 生成的 `tools/lab-scripts/web/xpath-injection/__pycache__`。
- [x] 后续已完成 `web/ldap-injection` 案例化执行文档，下一步进入目录与文档切片。

验证记录：

- `pnpm --filter @network-safe/web exec vitest run tests/xpath-injection-api.test.ts tests/xpath-injection-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、7 项测试通过。
- `pnpm --filter @network-safe/shared test` 通过，22 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/xpath-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该脚本实际运行服务端全量测试，147 项通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/xpath-injection/verify.ts` 通过并输出本机验证计划。
- `python -m py_compile tools/lab-scripts/web/xpath-injection/exploit.py` 通过，生成的 `__pycache__` 已清理。
- 文档更新后目标文件 `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- 文档更新后目标文件行尾空白扫描未命中。
- 文档更新后 XPath service 安全关键词扫描零命中；全链路扫描仅命中文档中的禁止性说明、共享元数据测试的 `readFile` 和既有 `readFileUploadVariantKey` 函数名误报。
- 文档更新后 `tools/lab-scripts/web/xpath-injection/` 下未发现残留 `__pycache__`。

# 2026-06-30 最新进展：XPath 注入后端切片

- [x] 新增 `apps/server/src/services/xpath-injection-lab.ts`，使用内存虚拟 XML 产品目录数据集合和固定查询路径模拟器。
- [x] 新增 `POST /api/labs/web/xpath-injection/:variant/search`，支持 `vuln` / `fixed` 两个受控变体。
- [x] 漏洞版固定受控样例触发 `xpath-injection-result-scope-expanded`，只扩大虚拟教学结果范围，不执行任意 XPath 表达式。
- [x] 修复版同样样例触发 `xpath-injection-controlled-sample-blocked`，在进入虚拟查询前阻断。
- [x] XPath 事件已接入 `lab_event_logs`，日志只写入模板、范围、关键词长度、脱敏预览、风险类别、结果范围、文档数量和学习信号。
- [x] 更新 `labs/web/xpath-injection/meta.json` 为 `in-progress`，当前只登记后端 API 和 API 测试，web / scripts 入口仍为空。
- [x] 补齐服务端测试、共享元数据测试和服务端 registry/health 数量断言。
- [x] `pnpm --filter @network-safe/server test -- tests/xpath-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该脚本实际运行服务端全量测试，147 项通过。
- [x] `pnpm --filter @network-safe/shared test` 通过，22 项测试通过。
- [x] 后续已补齐前端 API client、实验 helper、工作台页面、路由和本机受控脚本入口。

验证记录：

- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- 目标文件 `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- 目标文件行尾空白扫描未命中。
- XPath 后端切片安全关键词扫描仅命中测试中的本机 `fetch` 和既有 `readFileUploadVariantKey` 函数名；`apps/server/src/services/xpath-injection-lab.ts` 单独扫描未命中危险 API、文件读取、外部请求、XPath 执行器或原始输入摘要暴露。

# 2026-06-30 最新进展：XPath 注入目录与文档切片

- [x] 新增 `docs/execution/2026-06-30-web-xpath-injection-lab.md`，锁定业务包装、接口计划、日志摘要和安全边界。
- [x] 建立 `labs/web/xpath-injection/` 标准实验目录结构。
- [x] 新增 `labs/web/xpath-injection/meta.json`，当前状态为 `planned`，模式为 `simulation`。
- [x] 元数据当前只登记 docs 入口，web / api / scripts 暂为空，避免误标为可运行实验。
- [x] 新增实验总说明、漏洞版规划、修复版规划、mock 说明、攻击步骤、修复说明和手动验证计划。
- [x] 新增 `tools/lab-scripts/web/xpath-injection/README.md`，预留本机受控脚本入口并明确 localhost 边界。
- [x] 补充共享元数据测试，确认 XPath 当前为 docs-only planned 元数据。
- [x] `pnpm --filter @network-safe/shared test` 通过，22 项测试通过。
- [x] 已在后续切片中实现后端虚拟 XML 产品目录查询模拟 service、受控 API 和服务端测试。

验证记录：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-xpath-injection-lab.md labs/web/xpath-injection tools/lab-scripts/web/xpath-injection packages/shared/tests/lab-metadata.test.mjs` 未发现空白错误，仅有 `docs/TODO.md` 与 `packages/shared/tests/lab-metadata.test.mjs` 的既有 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-xpath-injection-lab.md labs/web/xpath-injection tools/lab-scripts/web/xpath-injection packages/shared/tests/lab-metadata.test.mjs` 未发现目标文件行尾空白。
- XPath 目录、脚本 README 与执行文档安全关键词扫描未命中危险 API、外部请求、文件读取或原始输入摘要暴露。
- XPath 安全边界扫描确认文档明确包含“不读取真实 XML 文件、不执行任意 XPath 表达式、不接入外部 XML 数据源、不访问外部目标”等约束。

# 2026-06-30 最新进展：CRLF 注入实验 ready 收口

- [x] 新增 `apps/web/src/api/crlf-injection-lab.ts`，接入 `POST /api/labs/web/crlf-injection/:variant/preview`。
- [x] 新增 `apps/web/src/labs/crlf-injection.ts`，提供漏洞版 / 修复版配置、正常样例、受控样例、学习进度和验证记录载荷。
- [x] 新增 `apps/web/src/views/CrlfInjectionLabView.vue`，提供下载响应头预览工作台、受控样例填充、后端判定、学习信号、虚拟头部预览和日志摘要说明。
- [x] 新增 `/labs/web/crlf-injection/vuln` 与 `/labs/web/crlf-injection/fixed` 路由。
- [x] 新增 `tools/lab-scripts/web/crlf-injection/exploit.py` 与 `verify.ts`，脚本仅允许本机受控目标。
- [x] 更新 `labs/web/crlf-injection/meta.json` 为 `ready`，补齐 web / api / scripts / docs / verification 入口。
- [x] 更新 CRLF 实验 README、漏洞版 / 修复版 / mock 说明、攻击步骤、手动验证文档和脚本目录说明。
- [x] 补齐前端 API/helper/router 测试、共享元数据测试和服务端 registry/health 状态断言。
- [x] 已在后续切片中为 `web/xpath-injection` 编写实现执行文档并进入目录、元数据和文档切片。

验证记录：

- `pnpm --filter @network-safe/web exec vitest run tests/crlf-injection-api.test.ts tests/crlf-injection-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、7 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/crlf-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该脚本实际运行服务端全量测试，140 项通过。
- `pnpm --filter @network-safe/shared test` 通过，21 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/crlf-injection/verify.ts` 通过并输出本机验证计划。
- `python -m py_compile tools/lab-scripts/web/crlf-injection/exploit.py` 通过，生成的 `__pycache__` 已清理。

# 2026-06-30 最新进展：CRLF 注入后端切片

- [x] 新增 `apps/server/src/services/crlf-injection-lab.ts`，使用内存虚拟响应头预览器模拟 `Content-Disposition` 头部构造差异。
- [x] 新增 `POST /api/labs/web/crlf-injection/:variant/preview`，支持 `vuln` / `fixed` 两个受控变体。
- [x] 漏洞版固定受控样例触发 `crlf-injection-virtual-header-injected`，只返回虚拟教学头部，不设置真实响应头。
- [x] 修复版同样样例触发 `crlf-injection-control-chars-blocked`，在进入虚拟头部构造器前阻断。
- [x] CRLF 事件已接入 `lab_event_logs`，日志只写入模板、下载方式、文件名长度、脱敏预览、控制字符类别、虚拟头部数量和学习信号。
- [x] 更新 `labs/web/crlf-injection/meta.json` 为 `in-progress`，当前只登记后端 API 和 API 测试，web / scripts 入口仍为空。
- [x] 更新 CRLF 实验 README、漏洞版 / 修复版 / mock 说明、手动验证文档和脚本目录说明。
- [x] 补齐服务端测试、共享元数据测试和服务端 registry/health 数量断言。
- [x] 后续已补齐前端 API client、实验 helper、工作台页面、路由和脚本入口。

验证记录：

- `pnpm --filter @network-safe/server test -- tests/crlf-injection-lab.test.ts` 通过；该脚本实际运行服务端全量测试，140 项通过。
- `pnpm --filter @network-safe/shared test` 通过，21 项测试通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。

# 2026-06-30 最新进展：CRLF 注入目录与文档切片

- [x] 建立 `labs/web/crlf-injection/` 标准实验目录结构。
- [x] 新增 `labs/web/crlf-injection/meta.json`，当前状态为 `planned`，web / api / scripts 入口暂为空，避免误标为可运行实验。
- [x] 新增实验总说明、漏洞版规划、修复版规划、mock 说明、攻击步骤、修复说明和手动验证计划。
- [x] 新增 `tools/lab-scripts/web/crlf-injection/README.md`，预留本机受控脚本入口并明确安全边界。
- [x] 补充共享元数据测试，确认 CRLF 当前为 docs-only planned 元数据。
- [x] `pnpm --filter @network-safe/shared test` 通过，21 项测试通过。
- [x] 后续已实现后端虚拟响应头预览 service、受控 API 和服务端测试。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，21 项测试通过。
- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-crlf-injection-lab.md labs/web/crlf-injection tools/lab-scripts/web/crlf-injection packages/shared/tests/lab-metadata.test.mjs` 未发现空白错误，仅有 `docs/TODO.md` 与 `packages/shared/tests/lab-metadata.test.mjs` 的既有 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-crlf-injection-lab.md labs/web/crlf-injection tools/lab-scripts/web/crlf-injection packages/shared/tests/lab-metadata.test.mjs` 未发现目标文件行尾空白。
- CRLF 目录、脚本 README 与执行文档安全关键词扫描未命中危险 API、外部请求、文件读取或原始输入摘要暴露。

# 2026-06-30 最新进展：CRLF 注入实现执行文档

- [x] 新增 `docs/execution/2026-06-30-web-crlf-injection-lab.md`。
- [x] 明确业务包装为“下载响应头预览”。
- [x] 明确后续实现只使用虚拟响应头预览器，不构造真实 HTTP 响应拆分。
- [x] 明确后端 API 计划为 `POST /api/labs/web/crlf-injection/:variant/preview`。
- [x] 明确固定受控样例只用于虚拟预览，不写入真实响应头。
- [x] 明确日志 `inputSummary` 只记录模板、下载方式、文件名长度与脱敏预览、控制字符类别、虚拟头部数量和学习信号。
- [x] 明确禁止真实缓存投毒、Cookie 注入、代理链路影响、外部目标访问和通用 payload 库。
- [x] 后续已完成 `web/crlf-injection` 目录、元数据和文档切片。

验证记录：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-crlf-injection-lab.md` 未发现空白错误，仅有 `docs/TODO.md` 的 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-crlf-injection-lab.md` 未发现目标文档行尾空白。
- `rg -n "真实响应拆分|缓存投毒|Cookie 注入|代理链路|外部目标|payload 库" docs/execution/2026-06-30-web-crlf-injection-lab.md` 确认文档已明确安全边界。

# 2026-06-30 最新进展：NoSQL 注入实验 ready 收口

- [x] 新增 `apps/web/src/api/nosql-injection-lab.ts`，接入 `POST /api/labs/web/nosql-injection/:variant/search`。
- [x] 新增 `apps/web/src/labs/nosql-injection.ts`，提供漏洞版 / 修复版配置、正常样例、受控样例、学习进度和验证记录载荷。
- [x] 新增 `apps/web/src/views/NosqlInjectionLabView.vue`，提供优惠券检索工作台、受控样例填充、后端判定、学习信号、风险摘要和虚拟文档结果展示。
- [x] 新增 `/labs/web/nosql-injection/vuln` 与 `/labs/web/nosql-injection/fixed` 路由。
- [x] 新增 `tools/lab-scripts/web/nosql-injection/exploit.py` 与 `verify.ts`，脚本仅允许本机受控目标。
- [x] 更新 `labs/web/nosql-injection/meta.json` 为 `ready`，补齐 web / api / scripts / docs / verification 入口。
- [x] 更新 NoSQL 实验 README、漏洞版 / 修复版 / mock 说明、攻击步骤、修复说明和手动验证文档。
- [x] 补齐前端 API/helper/router 测试、共享元数据测试和服务端 registry/health 状态断言。
- [x] CRLF 注入实现执行文档与安全边界规划已在后续完成。

验证记录：

- `pnpm --filter @network-safe/web exec vitest run tests/nosql-injection-api.test.ts tests/nosql-injection-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、7 项测试通过。
- `pnpm --filter @network-safe/shared test` 通过，20 项通过。
- `pnpm --filter @network-safe/server test -- tests/nosql-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该脚本实际运行服务端全量测试，133 项通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/nosql-injection/verify.ts` 通过并输出本机验证计划。
- `python -m py_compile tools/lab-scripts/web/nosql-injection/exploit.py` 通过，生成的 `__pycache__` 已清理。
- 目标文件 `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- 目标文件行尾空白扫描未命中。
- 安全关键词扫描仅命中 `readFileUploadVariantKey` 函数名误报，未发现 NoSQL 链路使用真实危险 API。

# 2026-06-30 最新进展：NoSQL 注入后端切片收口

- [x] 新增 `apps/server/src/services/nosql-injection-lab.ts`，使用内存虚拟优惠券文档查询器，不引入 MongoDB、Redis、Elasticsearch 或外部 NoSQL 服务。
- [x] 新增 `POST /api/labs/web/nosql-injection/:variant/search`，支持 `vuln` / `fixed` 两个受控变体。
- [x] 漏洞版可通过固定受控样例触发 `nosql-injection-query-expanded`，修复版同样样例返回 `nosql-injection-operator-blocked`。
- [x] NoSQL 实验事件已接入 `lab_event_logs` 统一日志，`inputSummary` 只记录查询模式、关键词长度与脱敏预览、筛选文本长度、风险类别、结果范围、文档数量和学习信号，不保存完整 `filterText` 或查询结构。
- [x] 更新 `labs/web/nosql-injection/meta.json` 为 `in-progress`，仅登记已实现的后端 API，web / scripts 入口仍保持未登记。
- [x] `pnpm --filter @network-safe/server test -- tests/nosql-injection-lab.test.ts` 通过；该脚本实际运行服务端全量测试，133 项通过。
- [x] `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- [x] 后端切片收口检查通过：目标文件无行尾空白；安全关键词扫描仅命中 `readFileUploadVariantKey` 函数名误报。
- [x] NoSQL 前端 API/helper/page/router、脚本与测试切片已在后续完成。

验证记录：

- `git diff --check -- apps/server/src/app.ts apps/server/src/services/nosql-injection-lab.ts apps/server/tests/nosql-injection-lab.test.ts apps/server/tests/health.test.ts apps/server/tests/lab-registry.test.ts labs/web/nosql-injection packages/shared/tests/lab-metadata.test.mjs docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-nosql-injection-lab.md` 未发现空白错误，仅有既有 LF/CRLF 提示。
- `rg -n "[ \t]+$" apps/server/src/app.ts apps/server/src/services/nosql-injection-lab.ts apps/server/tests/nosql-injection-lab.test.ts apps/server/tests/health.test.ts apps/server/tests/lab-registry.test.ts labs/web/nosql-injection packages/shared/tests/lab-metadata.test.mjs docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-nosql-injection-lab.md` 未发现目标文件行尾空白。
- `rg -n "mongodb|mongoose|eval\(|new Function|vm\.|child_process|readFile|createReadStream|http\.request|https\.request|process\.env|inputSummaryJson" apps/server/src/services/nosql-injection-lab.ts apps/server/src/app.ts apps/server/tests/nosql-injection-lab.test.ts labs/web/nosql-injection tools/lab-scripts/web/nosql-injection` 仅命中 `readFileUploadVariantKey` 函数名误报，未发现 NoSQL 后端切片使用真实危险 API。

# 2026-06-30 最新进展：NoSQL 注入目录与文档切片

- [x] 建立 `web/nosql-injection` 实验目录骨架。
- [x] 新增 `labs/web/nosql-injection/meta.json`，当前状态为 `planned`，避免误标为可运行实验。
- [x] 新增实验总说明、漏洞版规划、修复版规划、mock 说明、攻击步骤、修复说明和手动验证计划。
- [x] 新增脚本目录说明：`tools/lab-scripts/web/nosql-injection/README.md`。
- [x] 补充共享元数据测试，明确 NoSQL 当前为 docs-only planned 元数据，web / api / scripts 入口暂为空。
- [x] `pnpm --filter @network-safe/shared test` 通过，20 项通过。
- [x] NoSQL 后端虚拟文档查询器与受控 API 切片已在后续完成。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，20 项通过。
- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-nosql-injection-lab.md labs/web/nosql-injection tools/lab-scripts/web/nosql-injection packages/shared/tests/lab-metadata.test.mjs` 未发现空白错误，仅有 `docs/TODO.md` 与 `packages/shared/tests/lab-metadata.test.mjs` 的 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-nosql-injection-lab.md labs/web/nosql-injection tools/lab-scripts/web/nosql-injection packages/shared/tests/lab-metadata.test.mjs` 未发现目标文件行尾空白。

# 2026-06-30 最新进展：NoSQL 注入实现执行文档

- [x] 完成 `web/nosql-injection` 实现执行文档。
- [x] 新增执行文档：`docs/execution/2026-06-30-web-nosql-injection-lab.md`。
- [x] 明确业务包装为“优惠券文档检索”。
- [x] 明确后续实现使用内存虚拟文档查询器，不引入 MongoDB、Redis、Elasticsearch 或其他 NoSQL 服务。
- [x] 明确后端 API 计划为 `POST /api/labs/web/nosql-injection/:variant/search`。
- [x] 明确建议请求体字段为 `queryMode`、`keyword` 与 `filterText`，其中 `filterText` 只用于受控风险分类，不作为真实查询结构执行。
- [x] 明确事件日志 `inputSummary` 只记录查询模式、关键词长度、筛选文本长度、风险类别、是否命中受控样例和结果范围，不保存完整查询结构。
- [x] 明确后续需要补齐实验目录、元数据、文档、脚本、后端 service / API、前端页面和测试。
- [x] `web/nosql-injection` 实验目录、元数据和文档切片已在后续落地。

验证记录：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-nosql-injection-lab.md` 未发现空白错误，仅有 `docs/TODO.md` 的 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-nosql-injection-lab.md` 未发现目标文档行尾空白。

# 2026-06-30 最新进展：注入类一期剩余清单规划

- [x] 完成注入类一期剩余清单规划。
- [x] 新增执行文档：`docs/execution/2026-06-30-injection-remaining-planning.md`。
- [x] 新增设计文档：`docs/design/injection-remaining-labs.md`。
- [x] 明确 `web/nosql-injection` 作为下一项优先实验，但使用内存虚拟文档查询器，不引入 MongoDB 或外部服务。
- [x] 明确 `web/crlf-injection` 可做虚拟响应头构造预览，不做真实响应拆分、缓存投毒或代理链路影响。
- [x] 明确 `web/xpath-injection` 一期先做模拟实验，不读取真实 XML 文件，不执行任意 XPath 表达式。
- [x] 明确 `web/ldap-injection` 一期先做案例化，不连接真实 LDAP 服务，不保存目录凭据。
- [x] 明确后续每个具体实验仍需单独编写实现执行文档，再进入代码实现。
- [x] `web/nosql-injection` 实现执行文档已在后续切片落地。

验证记录：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-injection-remaining-planning.md docs/design/injection-remaining-labs.md` 未发现空白错误，仅有 `docs/TODO.md` 的 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-injection-remaining-planning.md docs/design/injection-remaining-labs.md` 未发现目标文档行尾空白。

# 2026-06-30 最新进展：Web 扩展注入实验统一回归收口

- [x] 完成 `web/command-injection`、`web/ssti`、`web/xxe` 三个扩展注入实验统一回归验证与收口。
- [x] 新增并执行收口文档：`docs/execution/2026-06-30-web-injection-regression-closeout.md`。
- [x] 服务端三项回归通过；该命令实际运行服务端全量测试，126 项通过。
- [x] 前端三项 API / helper / 路由回归通过，7 个测试文件、19 项测试通过。
- [x] 前端 `vue-tsc` 与服务端 `tsc` 类型检查通过。
- [x] 共享元数据测试通过，19 项通过。
- [x] 三个 `verify.ts` 均可输出本机验证计划，三个 `exploit.py` 均通过 Python 语法检查。
- [x] 已清理 Python 语法检查生成的三个 `__pycache__` 目录。
- [x] 安全关键词扫描未发现真实危险 API，三项实验仍保持本机受控边界。
- [x] `git diff --check` 未发现空白错误，仅有当前工作区既有 LF/CRLF 提示；目标文件行尾空白扫描未命中。
- [x] 注入类一期剩余清单规划已在后续切片落地。

验证记录：

- `pnpm --filter @network-safe/server test -- tests/command-injection-lab.test.ts tests/ssti-lab.test.ts tests/xxe-lab.test.ts` 通过；该脚本实际运行服务端全量测试，126 项通过。
- `pnpm --filter @network-safe/web exec vitest run tests/command-injection-api.test.ts tests/command-injection-lab.test.ts tests/ssti-api.test.ts tests/ssti-lab.test.ts tests/xxe-api.test.ts tests/xxe-lab.test.ts tests/router.test.ts` 通过，7 个测试文件、19 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/shared test` 通过，19 项通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/command-injection/verify.ts` 通过并输出本机验证计划。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ssti/verify.ts` 通过并输出本机验证计划。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/xxe/verify.ts` 通过并输出本机验证计划。
- `python -m py_compile tools/lab-scripts/web/command-injection/exploit.py tools/lab-scripts/web/ssti/exploit.py tools/lab-scripts/web/xxe/exploit.py` 通过。
- `rg -n "child_process|exec\(|spawn\(|eval\(|new Function|readFile|createReadStream|http\.request|https\.request|process\.env|inputSummaryJson" ...` 未命中三项实验实现与脚本中的真实危险 API。
- `rg -n "[ \t]+$" ...` 未发现本轮目标文件行尾空白。

# 2026-06-29 最新进展：XXE 实验落地

- [x] 落地 `web/xxe` 漏洞版 / 修复版纵向实验。
- [x] 新增后端虚拟 XML 资源解析器 service：`apps/server/src/services/xxe-lab.ts`。
- [x] 新增受控 API：`POST /api/labs/web/xxe/:variant/import`。
- [x] 新增前端 API、实验 helper、工作台页面和路由入口。
- [x] 更新 `labs/web/xxe/meta.json`，补齐 web / api / scripts / docs / verification / safeBoundaries。
- [x] 补充攻击步骤、修复说明、手动验证、漏洞版 / 修复版 / mock 说明。
- [x] 新增本机受控 `exploit.py` 与 `verify.ts`，脚本只允许 localhost / 127.0.0.1 / ::1。
- [x] XXE 事件已接入统一实验事件日志，日志不保存完整 XML 文档、完整实体声明或虚拟资源内容。
- [x] 本实验不读取真实本机文件、不请求真实外部 URL、不解析真实外部实体。
- [x] 已完成 `web/command-injection`、`web/ssti`、`web/xxe` 三个扩展注入实验的统一回归验证与收口。

验证记录：

- `pnpm --filter @network-safe/server test -- tests/xxe-lab.test.ts` 通过；该脚本实际运行服务端全量测试，126 项通过。
- `pnpm --filter @network-safe/web exec vitest run tests/xxe-api.test.ts tests/xxe-lab.test.ts tests/router.test.ts` 通过。
- `pnpm --filter @network-safe/shared test` 通过，19 项通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/xxe/verify.ts` 通过并输出本机验证计划。
- `python -m py_compile tools/lab-scripts/web/xxe/exploit.py` 通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。

# 2026-06-29 最新进展：XXE 实现执行文档

- [x] 新增 `web/xxe` 实现执行文档。
- [x] 新增执行文档：`docs/execution/2026-06-29-web-xxe-lab.md`。
- [x] 明确 XXE 业务包装为“XML 发票 / 配置导入预览”。
- [x] 明确后续实现只允许使用虚拟 XML 资源解析器，不读取真实本机文件、不请求真实外部 URL、不解析真实外部实体。
- [x] 明确后端 API 计划为 `POST /api/labs/web/xxe/:variant/import`。
- [x] 明确请求体字段为 `importKind` 与 `xmlDocument`，其中导入类型使用固定允许列表。
- [x] 明确 `file:///virtual/lab/internal-note` 只作为教学标识，不映射到真实文件系统。
- [x] 明确事件日志 `inputSummary` 只记录 XML 长度、是否包含 DOCTYPE、实体名、是否命中受控样例和学习信号，不保存完整 XML 文档。
- [x] 明确后续需要补齐后端 service、前端 API / helper / 页面、路由、元数据、文档、脚本和测试。
- [x] `web/xxe` 前后端、元数据、文档、脚本和测试已在后续切片落地。

验证记录：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-web-xxe-lab.md` 未发现空白错误，仅有 `docs/TODO.md` 的 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-web-xxe-lab.md` 未发现目标文档行尾空白。
- 安全边界关键字检查确认文档明确禁止真实文件读取、真实网络请求和真实外部实体解析。

# 2026-06-29 最新进展：SSTI 实验落地

- [x] 落地 `web/ssti` 漏洞版 / 修复版纵向实验。
- [x] 新增后端教学用模板模拟器 service：`apps/server/src/services/ssti-lab.ts`。
- [x] 新增受控 API：`POST /api/labs/web/ssti/:variant/preview`。
- [x] 新增前端 API、实验 helper、工作台页面和路由入口。
- [x] 更新 `labs/web/ssti/meta.json`，补齐 web / api / scripts / docs / verification / safeBoundaries。
- [x] 补充攻击步骤、修复说明、手动验证、漏洞版 / 修复版 / mock 说明。
- [x] 新增本机受控 `exploit.py` 与 `verify.ts`，脚本只允许 localhost / 127.0.0.1 / ::1。
- [x] SSTI 事件已接入统一实验事件日志，日志不保存完整模板、完整表达式或完整变量值。
- [x] 本实验不使用 `eval`、`Function`、Node VM 或真实危险模板表达式执行。
- [x] `web/xxe` 实现执行文档已在后续切片落地。

验证记录：

- `pnpm --filter @network-safe/server test -- tests/ssti-lab.test.ts` 通过；该脚本实际运行服务端全量测试，118 项通过。
- `pnpm --filter @network-safe/web exec vitest run tests/ssti-api.test.ts tests/ssti-lab.test.ts tests/router.test.ts` 通过。
- `pnpm --filter @network-safe/shared test` 通过，18 项通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ssti/verify.ts` 通过并输出本机验证计划。
- `python -m py_compile tools/lab-scripts/web/ssti/exploit.py` 通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。

# 2026-06-29 最新进展：SSTI 实现执行文档

- [x] 新增 `web/ssti` 实现执行文档。
- [x] 新增执行文档：`docs/execution/2026-06-29-web-ssti-lab.md`。
- [x] 明确 SSTI 业务包装为“通知模板预览”。
- [x] 明确后续实现只允许使用教学用模板模拟器，不使用 `eval`、`Function`、Node VM 或可访问运行时对象的真实模板表达式。
- [x] 明确后端 API 计划为 `POST /api/labs/web/ssti/:variant/preview`。
- [x] 明确请求体字段为 `templateKey`、`templateText` 与 `variables`，其中模板 key 和变量名都使用固定允许列表。
- [x] 明确事件日志 `inputSummary` 只记录模板长度、变量名、表达式类别、是否命中受控样例和学习信号，不保存完整模板、完整表达式或完整变量值。
- [x] 明确后续需要补齐后端 service、前端 API / helper / 页面、路由、元数据、文档、脚本和测试。
- [x] `web/ssti` 前后端、元数据、文档、脚本和测试已在后续切片落地。
- [x] `web/xxe` 实现执行文档已在后续切片落地。

验证记录：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-web-ssti-lab.md` 未发现空白错误，仅有 `docs/TODO.md` 的 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-web-ssti-lab.md` 未发现目标文档行尾空白。

# 2026-06-29 最新进展：命令注入实验落地

- [x] 落地 `web/command-injection` 漏洞版 / 修复版纵向实验。
- [x] 新增后端虚拟命令运行器 service：`apps/server/src/services/command-injection-lab.ts`。
- [x] 新增受控 API：`POST /api/labs/web/command-injection/:variant/run`。
- [x] 新增前端 API、实验 helper、工作台页面和路由入口。
- [x] 更新 `labs/web/command-injection/meta.json`，补齐 web / api / scripts / docs / verification / safeBoundaries。
- [x] 补充攻击步骤、修复说明、手动验证、漏洞版 / 修复版 / mock 说明。
- [x] 新增本机受控 `exploit.py` 与 `verify.ts`，脚本只允许 localhost / 127.0.0.1 / ::1。
- [x] 命令注入事件已接入统一实验事件日志，日志不保存完整 `target`。
- [x] 本实验不调用真实 shell、PowerShell、`cmd.exe`、`child_process` 或系统命令。
- [x] `web/ssti` 实现执行文档已在后续切片落地。

验证记录：

- `pnpm --filter @network-safe/server test -- tests/command-injection-lab.test.ts` 通过；该脚本实际运行服务端全量测试，110 项通过。
- `pnpm --filter @network-safe/web exec vitest run tests/command-injection-api.test.ts tests/command-injection-lab.test.ts tests/router.test.ts` 通过。
- `pnpm --filter @network-safe/shared test` 通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/web exec vitest run` 通过，35 个测试文件、121 项测试通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/command-injection/verify.ts` 通过并输出本机验证计划。
- `python -m py_compile tools/lab-scripts/web/command-injection/exploit.py` 通过。
- `git diff --check` 未发现空白错误，仅有当前工作区既有 LF/CRLF 提示。
- `rg -n "[ \t]+$" ...` 未发现本轮目标文件行尾空白。

# 2026-06-29 最新进展：命令注入实现执行文档

- [x] 新增 `web/command-injection` 实现执行文档。
- [x] 新增执行文档：`docs/execution/2026-06-29-web-command-injection-lab.md`。
- [x] 明确命令注入业务包装为“诊断任务运行器”。
- [x] 明确后续实现只允许使用虚拟命令运行器，不调用真实 shell、PowerShell、`cmd.exe`、`child_process` 或系统命令。
- [x] 明确后端 API 计划为 `POST /api/labs/web/command-injection/:variant/run`。
- [x] 明确请求体字段为 `taskKey` 与 `target`，其中 `taskKey` 使用固定允许列表。
- [x] 明确事件日志 `inputSummary` 只记录任务、长度、操作符类型、是否命中受控样例和学习信号，不保存完整 `target`。
- [x] 明确后续需要补齐后端 service、前端 API / helper / 页面、路由、元数据、文档、脚本和测试。
- [x] `web/command-injection` 前后端、元数据、文档、脚本和测试已在后续切片落地。
- [x] `web/ssti` 实现执行文档已在后续切片落地。

验证记录：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-web-command-injection-lab.md` 未发现空白错误，仅有 `docs/TODO.md` 的 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-web-command-injection-lab.md` 未发现目标文档行尾空白。

# 2026-06-29 最新进展：下一批 Web 注入类扩展实验设计

- [x] 新增下一批 Web 注入类扩展实验设计。
- [x] 新增执行文档：`docs/execution/2026-06-29-next-wave-web-injection-labs.md`。
- [x] 新增设计文档：`docs/design/next-wave-web-injection-labs.md`。
- [x] 明确下一批优先顺序为 `web/command-injection`、`web/ssti`、`web/xxe`。
- [x] 明确命令注入必须使用虚拟命令运行器，不调用真实 shell、PowerShell、`cmd.exe`、`child_process` 或系统命令。
- [x] 明确 SSTI 必须使用教学用模板模拟器，不使用 `eval`、`Function` 或可访问运行时对象的真实模板表达式。
- [x] 明确 XXE 必须使用虚拟 XML 资源解析，不读取真实本机文件、不请求真实外部 URL、不解析真实外部实体。
- [x] 明确三个实验后续都要补齐元数据入口、工作台页面、受控 API、统一事件日志、文档、脚本和最小测试。
- [x] 明确脚本仍只允许访问 localhost / 127.0.0.1 / ::1，不扫描网络、不访问外部目标、不生成通用攻击 payload 库。
- [x] `web/command-injection` 实现执行文档已在后续切片落地。
- [x] `web/command-injection` 前后端、元数据、文档、脚本和测试已在后续切片落地。
- [x] `web/ssti` 实现执行文档已在后续切片落地。

验证记录：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-next-wave-web-injection-labs.md docs/design/next-wave-web-injection-labs.md` 未发现空白错误，仅有 `docs/TODO.md` 的 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-next-wave-web-injection-labs.md docs/design/next-wave-web-injection-labs.md` 未发现目标文档行尾空白。

# 2026-06-29 最新进展：复盘统计说明文档

- [x] 阶段 D 新增学习复盘统计说明文档。
- [x] 新增执行文档：`docs/execution/2026-06-29-learning-recap-statistics-guide.md`。
- [x] 新增设计文档：`docs/design/learning-recap-statistics.md`。
- [x] 明确账号中心复盘完成度只代表当前筛选范围内最近事件的复盘问题完成情况。
- [x] 明确该统计不代表全量历史学习完成率、漏洞掌握度、攻击成功率或安全能力评分。
- [x] 明确统计按 `labKey` 聚合，分母来自当前事件生成的固定引导式问题数量。
- [x] 明确只统计当前问题范围内 `completed: true` 的完成记录，越界 `questionIndex` 不计入完成数。
- [x] 明确筛选实验、阶段或风险后，当前事件列表、分子、分母和百分比都会随之变化。
- [x] 明确统计区域仍不展示 `inputSummaryJson`、真实密码、真实 token、真实 Cookie、完整 payload 或外部目标信息。
- [x] 下一批 Web 注入类扩展实验设计已在后续切片落地。
- [x] `web/command-injection` 实现执行文档已在后续切片落地。
- [x] `web/command-injection` 前后端、元数据、文档、脚本和测试已在后续切片落地。
- [x] `web/ssti` 实现执行文档已在后续切片落地。

验证记录：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-learning-recap-statistics-guide.md docs/design/learning-recap-statistics.md` 未发现空白错误，仅有 `docs/TODO.md` 的 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-learning-recap-statistics-guide.md docs/design/learning-recap-statistics.md` 未发现目标文档行尾空白。

# 2026-06-29 最新进展：详情页复用模式规划

- [x] 阶段 D 新增后续实验复用详情页模式规划。
- [x] 新增执行文档：`docs/execution/2026-06-29-lab-detail-reuse-pattern.md`。
- [x] 新增设计文档：`docs/design/lab-detail-reuse-pattern.md`。
- [x] 明确通用详情页负责元数据、变体入口、验证方式、当前实验记录、最近事件复盘和复盘问题完成状态。
- [x] 明确实验工作台页面负责具体攻击 / 防御交互，详情页不承载实验专属表单。
- [x] 明确后续实验必须通过 `variant.entryKey -> entrypoints.web[].key` 精确匹配入口，不猜测路由。
- [x] 明确详情页使用 `lab.id` 作为 `labKey`，学习记录、事件日志和复盘完成状态均按已确认字段关联。
- [x] 明确最近事件复盘仍不展示 `inputSummaryJson`、真实密码、真实 token、真实 Cookie、完整 payload 或外部目标信息。
- [x] 明确新增实验接入详情页的检查清单，为后续命令注入、SSTI、XXE 等扩展实验预留复用路径。
- [x] 复盘统计说明文档已在后续切片落地。
- [x] 下一批 Web 注入类扩展实验设计已在后续切片落地。
- [x] `web/command-injection` 实现执行文档已在后续切片落地。
- [x] `web/command-injection` 前后端、元数据、文档、脚本和测试已在后续切片落地。
- [x] `web/ssti` 实现执行文档已在后续切片落地。

验证记录：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-lab-detail-reuse-pattern.md docs/design/lab-detail-reuse-pattern.md` 未发现空白错误，仅有 `docs/TODO.md` 的 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-lab-detail-reuse-pattern.md docs/design/lab-detail-reuse-pattern.md` 未发现目标文档行尾空白。

# 2026-06-29 最新进展：账号中心复盘完成度统计

- [x] 阶段 D 新增账号中心复盘完成度统计视图。
- [x] 复用当前用户事件日志接口和复盘问题完成记录接口，未新增后端接口或数据库字段。
- [x] 账号中心刷新最近事件复盘时，同步按 `traceId` 拉取复盘问题完成记录。
- [x] 新增按实验聚合的复盘统计：最近事件数、已完成问题数 / 问题总数、完成百分比。
- [x] 统计口径限定为当前筛选范围内的最近事件，不作为全量历史完成率。
- [x] 完成数只统计当前问题数量范围内的 `completed: true` 记录。
- [x] 本轮仍不展示 `inputSummaryJson`，不保存或展示真实密码、真实 token、真实 Cookie、完整 payload 或外部目标信息。
- [x] 已补充账号中心复盘统计 helper 测试。
- [x] 后续实验复用详情页模式规划已在后续切片落地。
- [x] 复盘统计说明文档已在后续切片落地。
- [x] 下一批 Web 注入类扩展实验设计已在后续切片落地。
- [x] `web/command-injection` 实现执行文档已在后续切片落地。
- [x] `web/command-injection` 前后端、元数据、文档、脚本和测试已在后续切片落地。
- [x] `web/ssti` 实现执行文档已在后续切片落地。

验证记录：

- `pnpm --filter @network-safe/web exec vitest run tests/account-recap.test.ts tests/lab-records-api.test.ts` 通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。

# 2026-06-29 最新进展：复盘问题持久化

- [x] 阶段 D 新增学习复盘问题完成记录持久化能力。
- [x] 新增 `lab_recap_question_completions` 表、Prisma schema 与 SQL 迁移文件。
- [x] 新增 `GET /api/lab-recap-question-completions/me` 当前用户完成记录查询接口。
- [x] 新增 `PUT /api/lab-recap-question-completions/me` 当前用户完成记录写入接口。
- [x] 实验详情页加载事件复盘后按 `traceId` 拉取已完成问题状态。
- [x] 实验详情页勾选 / 取消勾选复盘问题时写回后端，失败时回滚本地状态。
- [x] 本轮仍不展示 `inputSummaryJson`，不保存真实密码、真实 token、真实 Cookie 或完整 payload。
- [x] 已补充服务端 service / API 测试、前端 API / helper 测试，并完成最小必要验证。
- [x] 账号中心复盘完成度统计视图已在后续切片落地。

验证记录：

- `pnpm --filter @network-safe/server test` 通过。
- `pnpm --filter @network-safe/web exec vitest run` 通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/server prisma:validate` 通过。
- `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- `pnpm --filter @network-safe/server prisma:generate` 因 Windows Prisma engine DLL 文件锁失败；Prisma 类型已刷新且测试通过，后续释放相关 Node 进程后可重试该命令。

# 项目进度 TODO

> 本文件既记录项目级工作进度，也记录每一种攻击类型 / 安全内容是否已纳入、当前做到哪一步、后续准备落到哪里。

## 1. 使用说明

后续更新本文件时，优先回答三个问题：

1. 这项内容做了没有
2. 现在做到哪一步
3. 文档、脚本、代码将来落在哪里

状态建议统一使用以下值：

- `未开始`
- `规划中`
- `进行中`
- `已完成`
- `仅案例化`
- `仅模拟化`
- `不做真实复现`

## 2. 项目级进度

### 2.1 当前阶段

当前处于：**65 个安全学习实验全量 ready 收口后的持续维护阶段**

当前目标是在既有平台和 65 个实验闭环基础上保持元数据、页面、API、日志、脚本、文档和验证证据一致；新增范围必须先写独立执行文档。

### 2.2 已完成

- [x] 明确项目目标：Windows 本机、Node + MySQL + Vue、monorepo
- [x] 明确约束：暂不使用 Docker，前端可挂 nginx，后端独立运行
- [x] 明确总体方向：个人学习优先
- [x] 明确场景模式：同一场景尽量提供漏洞版与修复版
- [x] 明确脚本目录方向：以场景组织，主要使用 Python 与 TypeScript
- [x] 落地根目录 `README.md`
- [x] 落地项目级 `AGENTS.md`
- [x] 落地执行文档
- [x] 落地项目范围与安全内容清单文档
- [x] 落地当前 TODO 进度文档
- [x] 落地一期落地实施计划文档
- [x] 落地平台最小运行约定文档
- [x] 落地 `web/xss` 样板实验规格文档
- [x] 落地 `apps/server` 第一个最小接口 `GET /api/health`
- [x] 落地 Prisma 基础 schema、Prisma Client 生成脚本与数据库健康检查接口骨架
- [x] 建立元数据扫描、实验注册与列表接口
- [x] 将前端 `/labs` 页面接入真实实验元数据接口
- [x] 落地 `web/xss` 客服留言纵向样板实验
- [x] 连接本机 MySQL 并完成登录账号 seed
- [x] 落地登录与账户中心动态业务链路
- [x] 建立学习进度与验证记录写入接口
- [x] 将 `web/xss` 样板实验接入学习进度与验证记录写入
- [x] 建立实验元数据同步至数据库实验主表的 seed 入口
- [x] 已同步 65 个实验与 130 个实验变体到本机数据库
- [x] 账户中心展示学习进度与最近验证记录
- [x] 补充登录到 XSS 再到账户中心记录可见的 Playwright 闭环用例
- [x] 完善 `web/xss` 文档、脚本入口、元数据自动化入口和漏洞版 / 修复版差异验证
- [x] 建立单个实验详情页，展示元数据、变体入口、验证方式和当前实验记录
- [x] 落地 `web/csrf` 前端页面、后端受控业务接口、文档、脚本入口和差异验证
- [x] 落地阶段 A 统一实验事件日志表、Prisma schema、日志服务与 CSRF 首个接入
- [x] 落地 `web/sql-injection` 前端页面、后端受控查询接口、场景数据表、文档、脚本入口和统一事件日志
- [x] 落地 `web/file-upload` 前端页面、后端受控模拟上传接口、文档、脚本入口和统一事件日志
- [x] 落地 `web/path-traversal` 前端页面、后端受控虚拟文档读取接口、文档、脚本入口和统一事件日志
- [x] 落地 `web/ssrf` 前端页面、后端受控虚拟资源抓取接口、文档、脚本入口和统一事件日志
- [x] 落地 `web/info-disclosure` 前端页面、后端受控虚拟诊断报告接口、文档、脚本入口和统一事件日志
- [x] 落地 `auth/jwt` 前端页面、后端受控 JWT 验证接口、文档、脚本入口和统一事件日志
- [x] 落地 `auth/idor` 前端页面、后端受控订单对象读取接口、文档、脚本入口和统一事件日志
- [x] 落地 `auth/privilege-escalation` 前端页面、后端受控管理操作接口、文档、脚本入口和统一事件日志
- [x] 落地 `auth/session-fixation` 前端页面、后端受控教学登录会话接口、文档、脚本入口和统一事件日志
- [x] 落地 `auth/brute-force` 前端页面、后端受控候选口令检查接口、文档、脚本入口和统一事件日志
- [x] 落地 `web/command-injection` 前端页面、后端虚拟命令运行器接口、文档、脚本入口和统一事件日志
- [x] 落地阶段 D 最近实验事件日志复盘：账户中心时间线、实验详情页复盘卡片与当前用户事件日志接口
- [x] 落地阶段 D 事件日志阶段 / 风险筛选与引导式复盘问题
- [x] 落地阶段 D 账户中心按实验筛选事件复盘
- [x] 落地阶段 D 复盘卡片展开 / 收起状态
- [x] 落地阶段 D 实验详情页复盘问题本地完成状态
- [x] 落地阶段 D 统一复盘卡片组件
- [x] 落地阶段 D 后续实验复用详情页模式规划
- [x] 落地阶段 D 复盘统计说明文档
- [x] 落地下一批 Web 注入类扩展实验设计
- [x] 落地 `web/command-injection` 实现执行文档
- [x] 落地 `web/command-injection` 前后端、元数据、文档、脚本和测试
- [x] 落地 `web/ssti` 实现执行文档
- [x] 落地 `web/ssti` 前后端、元数据、文档、脚本和测试
- [x] 落地 `web/xxe` 实现执行文档
- [x] 落地 `web/xxe` 前后端、元数据、文档、脚本和测试
- [x] 完成 `web/command-injection`、`web/ssti`、`web/xxe` 三个扩展注入实验统一回归验证与收口
- [x] 完成注入类一期剩余清单规划
- [x] 完成 `web/nosql-injection` 实现执行文档
- [x] 建立 `web/nosql-injection` 实验目录、planned 元数据和基础文档
- [x] 完成 `web/ldap-injection` 案例化执行文档
- [x] 建立 `web/ldap-injection` 实验目录、planned 元数据和基础案例文档
- [x] 补充 `web/ldap-injection` 静态案例页方案与前端入口，后续已升级为前端虚拟目录工作台
- [x] 补充 `web/ldap-injection` 文档与元数据一致性验证脚本
- [x] 补充 `web/ldap-injection` 受控虚拟目录 API、事件日志和服务端测试
- [x] 补充 `web/ldap-injection` 前端虚拟目录工作台、API client 和前端测试

### 2.3 已收口的历史进行项

- [x] `web/nosql-injection` 后端虚拟文档查询器与受控 API
- [x] `web/nosql-injection` 前端 API/helper/page/router、脚本与测试
- [x] `web/crlf-injection` 实现执行文档与安全边界规划
- [x] `web/crlf-injection` 目录、元数据、后端、前端、脚本与测试
- [x] `web/xpath-injection` 目录、元数据、后端、前端、脚本与测试
- [x] `web/ldap-injection` 案例化执行文档
- [x] `web/ldap-injection` 目录、planned 元数据和基础案例文档
- [x] `web/ldap-injection` 静态案例页、路由、元数据和测试，后续已升级为前端虚拟目录工作台
- [x] `web/ldap-injection` 只读一致性验证脚本和元数据自动化入口
- [x] `web/ldap-injection` 虚拟目录 API、事件日志和 API 测试
- [x] `web/ldap-injection` 前端工作台接入、API client 和 helper 测试
- [x] 后续新增实验已接入 `lab_event_logs` 统一事件日志

### 2.4 已完成清单

#### 文档与设计

- [x] 补充技术选型与版本策略文档
- [x] 补充实验元数据结构文档
- [x] 补充数据库基础表设计文档
- [x] 补充自动化测试规划文档
- [x] 补充一期落地实施计划文档
- [x] 补充一期实验清单文档
- [x] 补充后续实验复用详情页模式设计文档
- [x] 补充学习复盘统计说明文档
- [x] 补充下一批 Web 注入类扩展实验设计文档
- [x] 补充 `web/command-injection` 实现执行文档
- [x] 补充 `web/ssti` 实现执行文档
- [x] 补充 `web/xxe` 实现执行文档
- [x] 补充 Web 扩展注入实验统一回归收口执行文档
- [x] 补充注入类一期剩余清单规划执行文档
- [x] 补充注入类一期剩余清单设计文档
- [x] 补充 `web/nosql-injection` 实现执行文档
- [x] 补充 `web/ldap-injection` 案例化执行文档

#### 工程骨架

- [x] 初始化 monorepo 基础目录
- [x] 建立 `apps/web`
- [x] 初始化 `apps/web` 为可运行 Vue 功能型网站骨架
- [x] 将前端 `/labs` 页面接入真实实验元数据接口
- [x] 建立 `apps/server`
- [x] 建立 `apps/server` 最小健康检查接口与可构建入口
- [x] 建立 Prisma schema 与 `GET /api/health/db` 数据库探活接口骨架
- [x] 建立 `packages/shared`
- [x] 建立 `labs/` 目录骨架
- [x] 建立 `tools/lab-scripts/` 目录骨架
- [x] 建立 `database/` 目录骨架
- [x] 建立 `nginx/` 目录骨架
- [x] 建立本机前后端自动化冒烟测试入口
- [x] 建立元数据扫描、实验注册与列表接口
- [x] 建立 MySQL 用户表登录与账户中心读取链路
- [x] 建立学习进度与验证记录写入接口
- [x] 建立实验元数据同步至数据库实验主表入口
- [x] 建立当前用户实验记录摘要接口
- [x] 建立单个实验详情页与当前实验记录展示入口
- [x] 建立统一实验事件日志表、日志服务与控制台结构化日志入口
- [x] 建立当前用户最近实验事件日志查询接口与前端复盘展示入口
- [x] 建立事件日志阶段 / 风险筛选与固定引导式复盘问题
- [x] 建立账户中心按实验筛选最近事件日志入口
- [x] 建立账户中心与实验详情页复盘卡片展开 / 收起入口
- [x] 建立实验详情页复盘问题本地完成状态入口
- [x] 建立统一复盘卡片组件复用账户中心与实验详情页展示

#### 一期实验重点

- [x] Web 层漏洞一期清单
- [x] 将前端 `/labs` 页面接入真实实验元数据接口
- [x] 补充 Playwright 浏览器端到端冒烟测试
- [x] 补充 Playwright 平台闭环测试
- [x] 落地 `web/xss` 漏洞版 / 修复版纵向样板
- [x] 将 `web/xss` 样板接入学习进度与验证记录写入
- [x] 实验元数据同步至数据库实验主表
- [x] 账户中心展示学习进度与最近验证记录
- [x] 登录用户完成 XSS 样例后可在账户中心看到实验记录
- [x] 完善 `web/xss` 攻击步骤、修复说明、手动验证矩阵与脚本验证入口
- [x] 实验详情页记录展示与验证入口
- [x] 落地 `web/csrf` 漏洞版 / 修复版纵向实验、受控业务接口与验证脚本入口
- [x] 将 `web/csrf` 转账动作接入统一实验事件日志
- [x] 落地 `web/sql-injection` 漏洞版 / 修复版纵向实验、受控业务接口、场景数据表与验证脚本入口
- [x] 将 `web/sql-injection` 搜索动作接入统一实验事件日志
- [x] 落地 `web/file-upload` 漏洞版 / 修复版纵向实验、受控模拟上传接口与验证脚本入口
- [x] 将 `web/file-upload` 上传动作接入统一实验事件日志
- [x] 落地 `web/path-traversal` 漏洞版 / 修复版纵向实验、受控虚拟文档读取接口与验证脚本入口
- [x] 将 `web/path-traversal` 文档读取动作接入统一实验事件日志
- [x] 落地 `web/ssrf` 漏洞版 / 修复版纵向实验、受控虚拟资源抓取接口与验证脚本入口
- [x] 将 `web/ssrf` URL 抓取动作接入统一实验事件日志
- [x] 落地 `web/info-disclosure` 漏洞版 / 修复版纵向实验、受控虚拟诊断报告接口与验证脚本入口
- [x] 将 `web/info-disclosure` 诊断报告读取动作接入统一实验事件日志
- [x] 落地 `auth/jwt` 漏洞版 / 修复版纵向实验、受控 JWT 验证接口与验证脚本入口
- [x] 将 `auth/jwt` token 验证动作接入统一实验事件日志
- [x] 落地 `auth/idor` 漏洞版 / 修复版纵向实验、受控订单对象读取接口与验证脚本入口
- [x] 将 `auth/idor` 订单读取动作接入统一实验事件日志
- [x] 落地 `auth/privilege-escalation` 漏洞版 / 修复版纵向实验、受控管理操作接口与验证脚本入口
- [x] 将 `auth/privilege-escalation` 操作执行动作接入统一实验事件日志
- [x] 落地 `auth/session-fixation` 漏洞版 / 修复版纵向实验、受控教学登录会话接口与验证脚本入口
- [x] 将 `auth/session-fixation` 教学登录会话动作接入统一实验事件日志
- [x] 落地 `auth/brute-force` 漏洞版 / 修复版纵向实验、受控候选口令检查接口与验证脚本入口
- [x] 将 `auth/brute-force` 候选口令检查动作接入统一实验事件日志
- [x] 补充 `web/command-injection`、`web/ssti`、`web/xxe` 下一批实现设计
- [x] 补充 `web/command-injection` 实现执行文档
- [x] 落地 `web/command-injection` 漏洞版 / 修复版纵向实验、后端虚拟命令运行器接口与验证脚本入口
- [x] 将 `web/command-injection` 诊断任务运行接入统一实验事件日志
- [x] 补充 `web/ssti` 实现执行文档
- [x] 落地 `web/ssti` 漏洞版 / 修复版纵向实验、后端教学用模板模拟器接口与验证脚本入口
- [x] 将 `web/ssti` 通知模板预览接入统一实验事件日志
- [x] 补充 `web/xxe` 实现执行文档
- [x] 落地 `web/xxe` 漏洞版 / 修复版纵向实验、后端虚拟 XML 资源解析器接口与验证脚本入口
- [x] 将 `web/xxe` XML 导入预览接入统一实验事件日志
- [x] 注入类一期清单
- [x] 认证 / 授权一期清单
- [x] 漏洞版 / 修复版组织规范落地

## 3. 安全内容覆盖跟踪

说明：

- `状态`：是否已纳入项目
- `落地方式`：真实交互靶场 / 脚本实验 / 本机模拟 / 案例化演示
- `当前落点`：当前已经落地的文档或进度位置
- `未来代码位置`：后续计划落到哪个目录

## 4. Web 层

| 内容 | 状态 | 落地方式 | 当前落点 | 未来代码位置 |
|---|---|---|---|---|
| XSS | 已完成 | 真实交互靶场 / 脚本实验 | `labs/web/xss/`、`tools/lab-scripts/web/xss/`、`packages/testing/tests/e2e/platform.spec.mjs` | `labs/web/xss/` |
| CSRF | 已完成 | 真实交互靶场 / 脚本实验 | `labs/web/csrf/`、`apps/web/src/views/CsrfLabView.vue`、`apps/server/tests/csrf-lab.test.ts`、`tools/lab-scripts/web/csrf/verify.ts`、`packages/testing/tests/e2e/platform.spec.mjs` | `labs/web/csrf/` |
| 点击劫持 | ready | 本机受控交互 / 固定案例 / 漏洞版与修复版 / 统一事件日志 / 只读一致性验证 | `labs/web/clickjacking/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/web/clickjacking/verify.ts`、`docs/execution/2026-07-20-web-clickjacking-guided-lab.md` | `labs/web/clickjacking/` |
| SSRF | 已完成 | 真实交互靶场 / 脚本实验 | `labs/web/ssrf/`、`apps/web/src/views/SsrfLabView.vue`、`apps/server/tests/ssrf-lab.test.ts`、`tools/lab-scripts/web/ssrf/verify.ts` | `labs/web/ssrf/` |
| 开放重定向 | ready | 本机受控交互 / 固定案例 / 漏洞版与修复版 / 统一事件日志 / 只读一致性验证 | `labs/web/open-redirect/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/web/open-redirect/verify.ts`、`docs/execution/2026-07-20-web-open-redirect-guided-lab.md` | `labs/web/open-redirect/` |
| 文件上传漏洞 | 已完成 | 真实交互靶场 / 脚本实验 | `labs/web/file-upload/`、`apps/web/src/views/FileUploadLabView.vue`、`apps/server/tests/file-upload-lab.test.ts`、`tools/lab-scripts/web/file-upload/verify.ts` | `labs/web/file-upload/` |
| 目录遍历 | 已完成 | 真实交互靶场 / 脚本实验 | `labs/web/path-traversal/`、`apps/web/src/views/PathTraversalLabView.vue`、`apps/server/tests/path-traversal-lab.test.ts`、`tools/lab-scripts/web/path-traversal/verify.ts` | `labs/web/path-traversal/` |
| 信息泄露 | 已完成 | 真实交互靶场 / 脚本实验 | `labs/web/info-disclosure/`、`apps/web/src/views/InfoDisclosureLabView.vue`、`apps/server/tests/info-disclosure-lab.test.ts`、`tools/lab-scripts/web/info-disclosure/verify.ts` | `labs/web/info-disclosure/` |

## 5. 注入类

| 内容 | 状态 | 落地方式 | 当前落点 | 未来代码位置 |
|---|---|---|---|---|
| SQL 注入 | 已完成 | 真实交互靶场 / 脚本实验 | `labs/web/sql-injection/`、`apps/web/src/views/SqlInjectionLabView.vue`、`apps/server/tests/sql-injection-lab.test.ts`、`tools/lab-scripts/web/sql-injection/verify.ts` | `labs/web/sql-injection/` |
| NoSQL 注入 | 已完成 | 真实交互靶场 / 本机模拟 | `labs/web/nosql-injection/`、`apps/server/src/services/nosql-injection-lab.ts`、`apps/web/src/views/NosqlInjectionLabView.vue`、`apps/web/tests/nosql-injection-lab.test.ts`、`apps/server/tests/nosql-injection-lab.test.ts`、`tools/lab-scripts/web/nosql-injection/verify.ts`、`packages/shared/tests/lab-metadata.test.mjs`、`docs/design/injection-remaining-labs.md`、`docs/execution/2026-06-30-web-nosql-injection-lab.md` | `labs/web/nosql-injection/` |
| 命令注入 | 已完成 | 真实交互靶场 / 脚本实验 | `labs/web/command-injection/`、`apps/web/src/views/CommandInjectionLabView.vue`、`apps/server/tests/command-injection-lab.test.ts`、`tools/lab-scripts/web/command-injection/verify.ts`、`docs/design/next-wave-web-injection-labs.md`、`docs/execution/2026-06-30-web-injection-regression-closeout.md` | `labs/web/command-injection/` |
| LDAP 注入 | ready | 案例化演示 / 前端虚拟目录工作台 / 虚拟目录 API / 只读一致性验证 | `labs/web/ldap-injection/`、`apps/server/src/services/ldap-injection-lab.ts`、`apps/server/tests/ldap-injection-lab.test.ts`、`apps/web/src/api/ldap-injection-lab.ts`、`apps/web/src/views/LdapInjectionLabView.vue`、`apps/web/src/labs/ldap-injection.ts`、`apps/web/tests/ldap-injection-api.test.ts`、`apps/web/tests/ldap-injection-lab.test.ts`、`tools/lab-scripts/web/ldap-injection/verify.ts`、`packages/shared/tests/lab-metadata.test.mjs`、`docs/design/project-scope-and-security-content.md`、`docs/design/injection-remaining-labs.md`、`docs/execution/2026-06-30-injection-remaining-planning.md`、`docs/execution/2026-06-30-web-ldap-injection-lab.md`、`docs/execution/2026-06-30-web-ldap-injection-static-case-page.md`、`docs/execution/2026-06-30-web-ldap-injection-consistency-verify.md`、`docs/execution/2026-06-30-web-ldap-injection-virtual-directory-api.md`、`docs/execution/2026-06-30-web-ldap-injection-frontend-workbench.md`、`docs/execution/2026-06-30-web-ldap-injection-playwright-verification.md`、`docs/execution/2026-06-30-web-ldap-injection-ready-closeout.md` | `labs/web/ldap-injection/` |
| XPath 注入 | 已完成 | 本机模拟 / 脚本实验 | `labs/web/xpath-injection/`、`apps/server/src/services/xpath-injection-lab.ts`、`apps/web/src/views/XpathInjectionLabView.vue`、`apps/web/tests/xpath-injection-lab.test.ts`、`apps/server/tests/xpath-injection-lab.test.ts`、`tools/lab-scripts/web/xpath-injection/verify.ts`、`docs/execution/2026-06-30-web-xpath-injection-lab.md` | `labs/web/xpath-injection/` |
| CRLF 注入 | 已完成 | 真实交互靶场 / 本机模拟 / 脚本实验 | `labs/web/crlf-injection/`、`apps/server/src/services/crlf-injection-lab.ts`、`apps/web/src/views/CrlfInjectionLabView.vue`、`apps/web/tests/crlf-injection-lab.test.ts`、`apps/server/tests/crlf-injection-lab.test.ts`、`tools/lab-scripts/web/crlf-injection/verify.ts`、`docs/execution/2026-06-30-web-crlf-injection-lab.md` | `labs/web/crlf-injection/` |
| 模板注入（SSTI） | 已完成 | 真实交互靶场 / 脚本实验 | `labs/web/ssti/`、`apps/web/src/views/SstiLabView.vue`、`apps/server/tests/ssti-lab.test.ts`、`tools/lab-scripts/web/ssti/verify.ts`、`docs/execution/2026-06-29-web-ssti-lab.md`、`docs/execution/2026-06-30-web-injection-regression-closeout.md` | `labs/web/ssti/` |
| XXE 注入 | 已完成 | 真实交互靶场 / 脚本实验 | `labs/web/xxe/`、`apps/web/src/views/XxeLabView.vue`、`apps/server/tests/xxe-lab.test.ts`、`tools/lab-scripts/web/xxe/verify.ts`、`docs/execution/2026-06-29-web-xxe-lab.md`、`docs/execution/2026-06-30-web-injection-regression-closeout.md` | `labs/web/xxe/` |

## 6. 认证 / 授权

| 内容 | 状态 | 落地方式 | 当前落点 | 未来代码位置 |
|---|---|---|---|---|
| 暴力破解 | 已完成 | 真实交互靶场 / 脚本实验 | `labs/auth/brute-force/`、`apps/web/src/views/BruteForceLabView.vue`、`apps/server/tests/brute-force-lab.test.ts`、`tools/lab-scripts/auth/brute-force/verify.ts` | `labs/auth/brute-force/` |
| 凭据填充 | ready | 本机受控交互 / 固定案例 / 漏洞版与修复版 / 统一事件日志 / 只读一致性验证 | `labs/auth/credential-stuffing/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/auth/credential-stuffing/verify.ts`、`docs/execution/2026-07-20-auth-credential-stuffing-guided-lab.md` | `labs/auth/credential-stuffing/` |
| 会话劫持 | ready | 本机受控交互 / 固定案例 / 漏洞版与修复版 / 统一事件日志 / 只读一致性验证 | `labs/auth/session-hijacking/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/auth/session-hijacking/verify.ts`、`docs/execution/2026-07-20-auth-session-hijacking-guided-lab.md` | `labs/auth/session-hijacking/` |
| 会话固定 | 已完成 | 真实交互靶场 / 脚本实验 | `labs/auth/session-fixation/`、`apps/web/src/views/SessionFixationLabView.vue`、`apps/server/tests/session-fixation-lab.test.ts`、`tools/lab-scripts/auth/session-fixation/verify.ts` | `labs/auth/session-fixation/` |
| JWT 攻击 | 已完成 | 真实交互靶场 / 脚本实验 | `labs/auth/jwt/`、`apps/web/src/views/JwtLabView.vue`、`apps/server/tests/jwt-lab.test.ts`、`tools/lab-scripts/auth/jwt/verify.ts` | `labs/auth/jwt/` |
| OAuth 漏洞 | ready | 本机受控交互 / 固定案例 / 漏洞版与修复版 / 统一事件日志 / 只读一致性验证 | `labs/auth/oauth/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/auth/oauth/verify.ts`、`docs/execution/2026-07-20-auth-oauth-guided-lab.md` | `labs/auth/oauth/` |
| 权限提升 | 已完成 | 真实交互靶场 / 脚本实验 | `labs/auth/privilege-escalation/`、`apps/web/src/views/PrivilegeEscalationLabView.vue`、`apps/server/tests/privilege-escalation-lab.test.ts`、`tools/lab-scripts/auth/privilege-escalation/verify.ts` | `labs/auth/privilege-escalation/` |
| IDOR | 已完成 | 真实交互靶场 / 脚本实验 | `labs/auth/idor/`、`apps/web/src/views/IdorLabView.vue`、`apps/server/tests/idor-lab.test.ts`、`tools/lab-scripts/auth/idor/verify.ts` | `labs/auth/idor/` |

## 7. 网络 / 传输层

| 内容 | 状态 | 落地方式 | 当前落点 | 未来代码位置 |
|---|---|---|---|---|
| DDoS | ready | 本机状态模拟 / 固定案例 / 漏洞版与修复版 / 统一事件日志 / 只读一致性验证 | `labs/network/ddos/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/network/ddos/verify.ts`、`docs/execution/2026-07-20-network-ddos-guided-lab.md` | `labs/network/ddos/` |
| 中间人攻击 | ready | 本机状态模拟 / 固定案例 / 漏洞版与修复版 / 统一事件日志 / 只读一致性验证 | `labs/network/mitm/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/network/mitm/verify.ts`、`docs/execution/2026-07-20-network-mitm-guided-lab.md` | `labs/network/mitm/` |
| DNS 劫持 / 污染 | ready | 内存解析表 / 前端固定选择器 / Playwright 差异验证 / 只读脚本验证 / 本机模拟 / 案例化演示 | `labs/network/dns-hijack/meta.json`、`apps/web/src/views/DnsHijackLabView.vue`、`packages/testing/tests/e2e/platform.spec.mjs`、`tools/lab-scripts/network/dns-hijack/verify.ts`、`apps/server/src/services/dns-hijack-lab.ts`、`docs/execution/2026-07-01-network-dns-hijack-ready-closeout.md` | `labs/network/dns-hijack/` |
| ARP 欺骗 | ready | 本机状态模拟 / 固定案例 / 漏洞版与修复版 / 统一事件日志 / 只读一致性验证 | `labs/network/arp-spoofing/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/network/arp-spoofing/verify.ts`、`docs/execution/2026-07-20-network-arp-spoofing-guided-lab.md` | `labs/network/arp-spoofing/` |
| 窃听攻击 | ready | 本机状态模拟 / 固定案例 / 漏洞版与修复版 / 统一事件日志 / 只读一致性验证 | `labs/network/eavesdropping/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/network/eavesdropping/verify.ts`、`docs/execution/2026-07-20-network-eavesdropping-guided-lab.md` | `labs/network/eavesdropping/` |
| DNS 隧道 | ready | 本机状态模拟 / 固定案例 / 漏洞版与修复版 / 统一事件日志 / 只读一致性验证 | `labs/network/dns-tunneling/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/network/dns-tunneling/verify.ts`、`docs/execution/2026-07-20-network-dns-tunneling-guided-lab.md` | `labs/network/dns-tunneling/` |
| 端口扫描 | ready | 固定虚拟资产 / 受控 API / 只读脚本验证 | `labs/network/port-scan/`、`tools/lab-scripts/network/port-scan/verify.ts` | `labs/network/port-scan/` |
| BGP 劫持 | ready | 本机状态模拟 / 固定案例 / 漏洞版与修复版 / 统一事件日志 / 只读一致性验证 | `labs/network/bgp-hijacking/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/network/bgp-hijacking/verify.ts`、`docs/execution/2026-07-20-network-bgp-hijacking-guided-lab.md` | `labs/network/bgp-hijacking/` |

## 8. 社会工程学

| 内容 | 状态 | 落地方式 | 当前落点 | 未来代码位置 |
|---|---|---|---|---|
| 网络钓鱼 | ready | 案例化演示 / 仿真页面 / 固定线索卡 / 识别训练 / 受控 API / 只读脚本验证 / case-study ready 收口 | `labs/social/phishing/`、`apps/web/src/views/PhishingLabView.vue`、`apps/web/src/api/phishing-lab.ts`、`apps/web/src/labs/phishing.ts`、`tools/lab-scripts/social/phishing/verify.ts`、`apps/server/src/services/phishing-lab.ts`、`apps/server/tests/phishing-lab.test.ts`、`docs/execution/2026-07-02-social-phishing-ready-closeout.md` | `labs/social/phishing/` |
| 鱼叉式钓鱼 | ready | 案例化演示 / 固定线索卡 / 前端固定选择器 / 受控 review API / Playwright 差异验证 / 只读脚本验证 / case-study ready 收口 / 事件日志安全摘要 | `labs/social/spear-phishing/meta.json`、`apps/web/src/views/SpearPhishingLabView.vue`、`apps/web/src/api/spear-phishing-lab.ts`、`apps/server/src/services/spear-phishing-lab.ts`、`packages/testing/tests/e2e/platform.spec.mjs`、`tools/lab-scripts/social/spear-phishing/verify.ts`、`docs/execution/2026-07-03-social-spear-phishing-ready-closeout.md` | `labs/social/spear-phishing/` |
| 捕鲸攻击 | ready | 案例化演示 / 固定高层决策线索 / 前端固定选择器 / Playwright 差异验证 / 固定防御流程复盘 / 受控 review API / 只读一致性验证 / 事件日志安全摘要 | `labs/social/whaling/meta.json`、`labs/social/whaling/docs/fixed-cases.md`、`apps/web/src/views/WhalingLabView.vue`、`apps/web/src/api/whaling-lab.ts`、`apps/web/src/labs/whaling.ts`、`apps/server/src/services/whaling-lab.ts`、`apps/server/tests/whaling-lab.test.ts`、`packages/testing/tests/e2e/platform.spec.mjs`、`tools/lab-scripts/social/whaling/verify.ts`、`docs/execution/2026-07-09-social-whaling-playwright-verification.md`、`docs/execution/2026-07-09-social-whaling-readonly-verification.md`、`docs/execution/2026-07-09-social-whaling-ready-closeout.md` | `labs/social/whaling/` |
| 短信钓鱼 | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/social/smishing/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/social/smishing/verify.ts`、`docs/execution/2026-07-20-social-smishing-guided-lab.md` | `labs/social/smishing/` |
| 商业邮件诈骗 | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/social/bec/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/social/bec/verify.ts`、`docs/execution/2026-07-20-social-bec-guided-lab.md` | `labs/social/bec/` |
| 水坑攻击 | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/social/watering-hole/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/social/watering-hole/verify.ts`、`docs/execution/2026-07-20-social-watering-hole-guided-lab.md` | `labs/social/watering-hole/` |
| 钓鱼 WiFi | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/social/rogue-wifi/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/social/rogue-wifi/verify.ts`、`docs/execution/2026-07-20-social-rogue-wifi-guided-lab.md` | `labs/social/rogue-wifi/` |
| 尾随 / 物理入侵 | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/social/physical-intrusion/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/social/physical-intrusion/verify.ts`、`docs/execution/2026-07-20-social-physical-intrusion-guided-lab.md` | `labs/social/physical-intrusion/` |

## 9. 恶意软件

| 内容 | 状态 | 落地方式 | 当前落点 | 未来代码位置 |
|---|---|---|---|---|
| 勒索软件 | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/malware/ransomware/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/malware/ransomware/verify.ts`、`docs/execution/2026-07-20-malware-ransomware-guided-lab.md` | `labs/malware/ransomware/` |
| 木马 | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/malware/trojan/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/malware/trojan/verify.ts`、`docs/execution/2026-07-20-malware-trojan-guided-lab.md` | `labs/malware/trojan/` |
| 蠕虫 | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/malware/worm/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/malware/worm/verify.ts`、`docs/execution/2026-07-20-malware-worm-guided-lab.md` | `labs/malware/worm/` |
| 间谍软件 | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/malware/spyware/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/malware/spyware/verify.ts`、`docs/execution/2026-07-20-malware-spyware-guided-lab.md` | `labs/malware/spyware/` |
| 键盘记录器 | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/malware/keylogger/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/malware/keylogger/verify.ts`、`docs/execution/2026-07-20-malware-keylogger-guided-lab.md` | `labs/malware/keylogger/` |
| Rootkit | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/malware/rootkit/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/malware/rootkit/verify.ts`、`docs/execution/2026-07-20-malware-rootkit-guided-lab.md` | `labs/malware/rootkit/` |

## 10. 供应链

| 内容 | 状态 | 落地方式 | 当前落点 | 未来代码位置 |
|---|---|---|---|---|
| 依赖混淆 | ready | 本机模拟 / 案例化演示 / 固定 manifest / 伪 registry 元数据 / 前端固定选择器 / 受控 resolve API / Playwright 页面差异验证 / 只读验证 / 事件日志安全摘要 | `apps/web/src/views/DependencyConfusionLabView.vue`、`apps/web/src/api/dependency-confusion-lab.ts`、`apps/web/src/labs/dependency-confusion.ts`、`apps/server/src/services/dependency-confusion-lab.ts`、`apps/server/tests/dependency-confusion-lab.test.ts`、`packages/testing/tests/e2e/platform.spec.mjs`、`tools/lab-scripts/supply-chain/dependency-confusion/verify.ts`、`labs/supply-chain/dependency-confusion/meta.json`、`docs/execution/2026-07-02-supply-chain-dependency-confusion-ready-closeout.md` | `labs/supply-chain/dependency-confusion/` |
| 恶意包注入 | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/supply-chain/malicious-package/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/supply-chain/malicious-package/verify.ts`、`docs/execution/2026-07-20-supply-chain-malicious-package-guided-lab.md` | `labs/supply-chain/malicious-package/` |
| 更新投毒 | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/supply-chain/update-poisoning/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/supply-chain/update-poisoning/verify.ts`、`docs/execution/2026-07-20-supply-chain-update-poisoning-guided-lab.md` | `labs/supply-chain/update-poisoning/` |
| 硬件供应链 | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/supply-chain/hardware/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/supply-chain/hardware/verify.ts`、`docs/execution/2026-07-20-supply-chain-hardware-guided-lab.md` | `labs/supply-chain/hardware/` |

## 11. AI / 新型攻击

| 内容 | 状态 | 落地方式 | 当前落点 | 未来代码位置 |
|---|---|---|---|---|
| AI 驱动攻击 | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/ai/ai-driven-attacks/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/ai/ai-driven-attacks/verify.ts`、`docs/execution/2026-07-20-ai-ai-driven-attacks-guided-lab.md` | `labs/ai/ai-driven-attacks/` |
| Deepfake | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/ai/deepfake/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/ai/deepfake/verify.ts`、`docs/execution/2026-07-20-ai-deepfake-guided-lab.md` | `labs/ai/deepfake/` |
| 对抗性 AI | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/ai/adversarial-ai/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/ai/adversarial-ai/verify.ts`、`docs/execution/2026-07-20-ai-adversarial-ai-guided-lab.md` | `labs/ai/adversarial-ai/` |
| 加密劫持 | ready | 本机状态模拟 / 固定案例 / 漏洞版与修复版 / 统一事件日志 / 只读一致性验证 | `labs/ai/cryptojacking/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/ai/cryptojacking/verify.ts`、`docs/execution/2026-07-20-ai-cryptojacking-guided-lab.md` | `labs/ai/cryptojacking/` |
| Prompt 注入 | ready | 确定性提示词路由模拟器 / 前端固定选择器 / Playwright 差异验证 / 只读脚本验证 / 可交互演示 / 事件日志安全摘要 | `apps/web/src/views/PromptInjectionLabView.vue`、`apps/web/src/api/prompt-injection-lab.ts`、`apps/web/src/labs/prompt-injection.ts`、`packages/testing/tests/e2e/platform.spec.mjs`、`tools/lab-scripts/ai/prompt-injection/verify.ts`、`apps/server/src/services/prompt-injection-lab.ts`、`apps/server/tests/prompt-injection-lab.test.ts`、`labs/ai/prompt-injection/meta.json`、`docs/execution/2026-07-02-ai-prompt-injection-ready-closeout.md` | `labs/ai/prompt-injection/` |

## 12. 客户端攻击

| 内容 | 状态 | 落地方式 | 当前落点 | 未来代码位置 |
|---|---|---|---|---|
| 驾车式下载 | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/client/drive-by-download/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/client/drive-by-download/verify.ts`、`docs/execution/2026-07-20-client-drive-by-download-guided-lab.md` | `labs/client/drive-by-download/` |
| 恶意浏览器插件 | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/client/malicious-extension/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/client/malicious-extension/verify.ts`、`docs/execution/2026-07-20-client-malicious-extension-guided-lab.md` | `labs/client/malicious-extension/` |
| Formjacking | ready | 本机状态模拟 / 固定案例 / 漏洞版与修复版 / 统一事件日志 / 只读一致性验证 | `labs/client/formjacking/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/client/formjacking/verify.ts`、`docs/execution/2026-07-20-client-formjacking-guided-lab.md` | `labs/client/formjacking/` |
| 恶意广告 | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/client/malvertising/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/client/malvertising/verify.ts`、`docs/execution/2026-07-20-client-malvertising-guided-lab.md` | `labs/client/malvertising/` |
| 浏览器 MITB | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/client/mitb/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/client/mitb/verify.ts`、`docs/execution/2026-07-20-client-mitb-guided-lab.md` | `labs/client/mitb/` |

## 13. 基础设施

| 内容 | 状态 | 落地方式 | 当前落点 | 未来代码位置 |
|---|---|---|---|---|
| 配置错误利用 | ready | 本机模拟 / 静态配置分析 / 固定配置审计样例 / 前端固定选择器 / 受控 audit API / Playwright 页面级差异验证 / 本机只读一致性验证 / simulation ready 收口 / 事件日志安全摘要 | `apps/web/src/views/MisconfigurationLabView.vue`、`apps/server/src/services/misconfiguration-lab.ts`、`apps/server/tests/misconfiguration-lab.test.ts`、`packages/testing/tests/e2e/platform.spec.mjs`、`tools/lab-scripts/infrastructure/misconfiguration/verify.ts`、`labs/infrastructure/misconfiguration/meta.json`、`docs/execution/2026-07-03-infrastructure-misconfiguration-ready-closeout.md` | `labs/infrastructure/misconfiguration/` |
| 容器逃逸 | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/infrastructure/container-escape/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/infrastructure/container-escape/verify.ts`、`docs/execution/2026-07-20-infrastructure-container-escape-guided-lab.md` | `labs/infrastructure/container-escape/` |
| 云安全漏洞 | ready | 本机状态模拟 / 固定案例 / 漏洞版与修复版 / 统一事件日志 / 只读一致性验证 | `labs/infrastructure/cloud-security/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/infrastructure/cloud-security/verify.ts`、`docs/execution/2026-07-20-infrastructure-cloud-security-guided-lab.md` | `labs/infrastructure/cloud-security/` |
| IoT 攻击 | ready | 本机状态模拟 / 固定案例 / 漏洞版与修复版 / 统一事件日志 / 只读一致性验证 | `labs/infrastructure/iot/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/infrastructure/iot/verify.ts`、`docs/execution/2026-07-20-infrastructure-iot-guided-lab.md` | `labs/infrastructure/iot/` |
| 零日漏洞利用 | ready | 固定案例化演示 / 漏洞视角与防御视角 / 统一事件日志 / 只读一致性验证 | `labs/infrastructure/zero-day/meta.json`、`apps/web/src/views/GuidedScenarioLabView.vue`、`apps/web/src/api/guided-scenario-lab.ts`、`apps/server/src/services/guided-scenario-lab.ts`、`apps/server/tests/guided-scenario-lab.test.ts`、`tools/lab-scripts/infrastructure/zero-day/verify.ts`、`docs/execution/2026-07-20-infrastructure-zero-day-guided-lab.md` | `labs/infrastructure/zero-day/` |

## 14. 风险与待确认

- [x] 一期实验优先级已按阶段 B Web、阶段 C 认证授权和后续扩展实验执行文档落地
- [x] 技术版本策略已文档化：`docs/design/tech-stack-and-version-strategy.md`
- [x] 实验元数据结构已文档化：`docs/design/lab-metadata-structure.md`
- [x] 数据库基础表结构已文档化：`docs/design/database-foundation-schema.md`
- [x] 自动化测试边界已文档化：`docs/design/automation-testing-plan.md`

## 15. 2026-06-25 文件上传实验更新

- [x] 落地 `web/file-upload` 漏洞版 / 修复版纵向实验。
- [x] 新增 `POST /api/labs/web/file-upload/:variant/upload` 受控模拟上传接口。
- [x] 新增文件上传实验前端页面、API client、教学模型与路由入口。
- [x] 将文件上传动作接入 `lab_event_logs` 统一事件日志，日志只记录摘要，不保存完整上传内容。
- [x] 补齐 `labs/web/file-upload/` 场景文档、元数据、漏洞版 / 修复版说明和手动验证文档。
- [x] 补齐 `tools/lab-scripts/web/file-upload/` 本机受控脚本入口。
- [x] 补齐服务端、前端 API、前端模型和共享元数据测试。
- [x] 阶段 B 下一项：推进 `web/path-traversal` 路径遍历实验。

## 16. 2026-06-25 目录遍历实验更新

- [x] 落地 `web/path-traversal` 漏洞版 / 修复版纵向实验。
- [x] 新增 `POST /api/labs/web/path-traversal/:variant/read` 受控虚拟文档读取接口。
- [x] 新增目录遍历实验前端页面、API client、教学模型与路由入口。
- [x] 将文档读取动作接入 `lab_event_logs` 统一事件日志，日志只记录路径摘要和规范化结果，不读取真实文件系统。
- [x] 补齐 `labs/web/path-traversal/` 场景文档、元数据、漏洞版 / 修复版说明和手动验证文档。
- [x] 补齐 `tools/lab-scripts/web/path-traversal/` 本机受控脚本入口。
- [x] 补齐服务端、前端 API、前端模型和共享元数据测试。
- [x] 阶段 B 下一项：推进 `web/ssrf` SSRF 实验。

## 17. 2026-06-25 SSRF 实验更新

- [x] 落地 `web/ssrf` 漏洞版 / 修复版纵向实验。
- [x] 新增 `POST /api/labs/web/ssrf/:variant/fetch` 受控虚拟资源抓取接口。
- [x] 新增 SSRF 实验前端页面、API client、教学模型与路由入口。
- [x] 将 URL 抓取动作接入 `lab_event_logs` 统一事件日志，日志只记录 URL 摘要、协议、主机、路径和学习信号，不执行真实网络请求。
- [x] 补齐 `labs/web/ssrf/` 场景文档、元数据、漏洞版 / 修复版说明和手动验证文档。
- [x] 补齐 `tools/lab-scripts/web/ssrf/` 本机受控脚本入口。
- [x] 补齐服务端、前端 API、前端模型和共享元数据测试。
- [x] 阶段 B 下一项：推进 `web/info-disclosure` 信息泄露实验。

## 18. 2026-06-25 信息泄露实验更新

- [x] 落地 `web/info-disclosure` 漏洞版 / 修复版纵向实验。
- [x] 新增 `POST /api/labs/web/info-disclosure/:variant/report` 受控虚拟诊断报告接口。
- [x] 新增信息泄露实验前端页面、API client、教学模型与路由入口。
- [x] 将诊断报告读取动作接入 `lab_event_logs` 统一事件日志，日志只记录报告 key 摘要、敏感报告标记、字段数量和学习信号，不读取真实环境、真实日志或真实文件。
- [x] 补齐 `labs/web/info-disclosure/` 场景文档、元数据、漏洞版 / 修复版说明和手动验证文档。
- [x] 补齐 `tools/lab-scripts/web/info-disclosure/` 本机受控脚本入口。
- [x] 补齐服务端、前端 API、前端模型和共享元数据测试。
- [x] 阶段 B Web 常见漏洞优先清单已完成，下一项进入阶段 C：优先推进 `auth/jwt` JWT 攻击实验。

## 19. 2026-06-25 JWT 攻击实验更新

- [x] 落地 `auth/jwt` 漏洞版 / 修复版纵向实验。
- [x] 新增 `POST /api/labs/auth/jwt/:variant/verify` 受控 JWT 验证接口。
- [x] 新增 JWT 攻击实验前端页面、API client、教学模型与路由入口。
- [x] 将 token 验证动作接入 `lab_event_logs` 统一事件日志，日志只记录 token 长度、段数、算法、角色声明、签名状态和学习信号，不保存完整 token。
- [x] 补齐 `labs/auth/jwt/` 场景文档、元数据、漏洞版 / 修复版说明和手动验证文档。
- [x] 补齐 `tools/lab-scripts/auth/jwt/` 本机受控脚本入口。
- [x] 补齐服务端、前端 API、前端模型和共享元数据测试。
- [x] 阶段 C 下一项：推进 `auth/idor` IDOR 实验。

## 20. 2026-06-25 IDOR 实验更新

- [x] 落地 `auth/idor` 漏洞版 / 修复版纵向实验。
- [x] 新增 `POST /api/labs/auth/idor/:variant/read` 受控订单对象读取接口。
- [x] 新增 IDOR 实验前端页面、API client、教学模型与路由入口。
- [x] 将订单读取动作接入 `lab_event_logs` 统一事件日志，日志只记录 `orderId` 摘要、对象类型、归属判断和学习信号，不保存完整敏感明细。
- [x] 补齐 `labs/auth/idor/` 场景文档、元数据、漏洞版 / 修复版说明和手动验证文档。
- [x] 补齐 `tools/lab-scripts/auth/idor/` 本机受控脚本入口。
- [x] 补齐服务端、前端 API、前端模型和共享元数据测试。
- [x] 阶段 C 下一项：推进 `auth/privilege-escalation` 权限提升实验。

## 21. 2026-06-25 权限提升实验更新

- [x] 落地 `auth/privilege-escalation` 漏洞版 / 修复版纵向实验。
- [x] 新增 `POST /api/labs/auth/privilege-escalation/:variant/execute` 受控管理操作执行接口。
- [x] 新增权限提升实验前端页面、API client、教学模型与路由入口。
- [x] 将操作执行动作接入 `lab_event_logs` 统一事件日志，日志只记录操作 key 摘要、服务端角色、客户端声明角色和学习信号，不修改真实用户角色。
- [x] 补齐 `labs/auth/privilege-escalation/` 场景文档、元数据、漏洞版 / 修复版说明和手动验证文档。
- [x] 补齐 `tools/lab-scripts/auth/privilege-escalation/` 本机受控脚本入口。
- [x] 补齐服务端、前端 API、前端模型和共享元数据测试。
- [x] 阶段 C 下一项：推进 `auth/session-fixation` 会话固定实验。

## 22. 2026-06-25 会话固定实验更新

- [x] 落地 `auth/session-fixation` 漏洞版 / 修复版纵向实验。
- [x] 新增 `POST /api/labs/auth/session-fixation/:variant/login` 受控教学登录会话绑定接口。
- [x] 新增会话固定实验前端页面、API client、教学模型与路由入口。
- [x] 将教学登录会话动作接入 `lab_event_logs` 统一事件日志，日志只记录会话 ID 长度、来源、轮换判断、脱敏摘要和学习信号，不保存真实 token 或 Cookie。
- [x] 补齐 `labs/auth/session-fixation/` 场景文档、元数据、漏洞版 / 修复版说明和手动验证文档。
- [x] 补齐 `tools/lab-scripts/auth/session-fixation/` 本机受控脚本入口。
- [x] 补齐服务端、前端 API、前端模型、路由和共享元数据测试。
- [x] 阶段 C 下一项：推进 `auth/brute-force` 暴力破解实验。

## 23. 2026-06-25 暴力破解实验更新

- [x] 落地 `auth/brute-force` 漏洞版 / 修复版纵向实验。
- [x] 新增 `POST /api/labs/auth/brute-force/:variant/attempt` 受控候选口令检查接口。
- [x] 新增暴力破解实验前端页面、API client、教学模型与路由入口。
- [x] 将候选口令检查动作接入 `lab_event_logs` 统一事件日志，日志只记录候选数量、匹配位置、失败次数、阈值判断、脱敏摘要和学习信号，不保存候选口令明文。
- [x] 补齐 `labs/auth/brute-force/` 场景文档、元数据、漏洞版 / 修复版说明和手动验证文档。
- [x] 补齐 `tools/lab-scripts/auth/brute-force/` 本机受控脚本入口。
- [x] 补齐服务端、前端 API、前端模型、路由和共享元数据测试。
- [x] 阶段 C 认证授权高优先级清单已完成，下一项进入阶段 D：完善学习复盘。

## 24. 2026-06-25 最近事件日志复盘更新

- [x] 新增 `GET /api/lab-event-logs/me` 当前用户最近事件日志接口。
- [x] 支持 `labKey` 查询参数，用于实验详情页只查看当前实验事件。
- [x] 扩展 `lab-event-logs` 服务，按当前用户、可选实验 key 查询最近事件日志摘要。
- [x] 前端新增事件日志 API client 与 session store 加载状态。
- [x] 账户中心新增“最近事件复盘”时间线。
- [x] 单个实验详情页新增“最近事件复盘”卡片。
- [x] 复盘页不展示 `inputSummaryJson`，只展示信号、决策、阶段、风险等级、状态码、说明和时间。
- [x] 补齐服务端查询 / 接口测试、前端 API / 数据整理 / store 测试。
- [x] 阶段 D 已开始，下一项建议继续做更细的日志筛选、复盘卡片展开态或学习问题生成。

## 25. 2026-06-25 事件日志筛选与复盘问题更新

- [x] `GET /api/lab-event-logs/me` 新增 `phase` 与 `riskLevel` 筛选。
- [x] 后端按枚举白名单读取筛选参数，非法值不进入查询条件。
- [x] 账户中心“最近事件复盘”新增阶段 / 风险筛选控件。
- [x] 实验详情页事件复盘卡片新增固定引导式问题。
- [x] 复盘问题基于阶段和后端决策生成，不调用外部服务，不展示输入摘要 JSON。
- [x] 补齐服务端查询 / 接口测试、前端 API / store / helper 测试。
- [x] 下一项建议继续做复盘卡片展开态、按实验筛选的账户中心视图或学习问题完成状态。

## 26. 2026-06-25 账户中心按实验筛选复盘更新

- [x] 账户中心“最近事件复盘”新增实验筛选控件。
- [x] 前端从学习进度、验证记录和事件日志合并实验筛选选项，不猜测字段。
- [x] 切换实验 / 阶段 / 风险时，统一通过 `GET /api/lab-event-logs/me` 查询。
- [x] 筛选仍不展示 `inputSummaryJson`，只查看安全摘要字段。
- [x] 补齐账户复盘 helper 和 store 筛选测试。
- [x] 下一项建议继续做复盘卡片展开态或学习问题完成状态。

## 27. 2026-06-26 复盘卡片展开状态更新

- [x] 账户中心“最近事件复盘”改为摘要默认可见、详情按单条事件展开。
- [x] 实验详情页“最近事件复盘”改为摘要默认可见，展开后查看时间、状态码和引导式复盘问题。
- [x] 新增前端复盘展开状态 helper，以 `traceId` 精确控制单条事件状态。
- [x] 切换筛选条件或重新加载实验详情时重置展开状态，避免旧列表状态干扰新结果。
- [x] 不展示 `inputSummaryJson`，不新增后端字段、数据库字段或日志写入逻辑。
- [x] 补齐展开、收起、独立事件状态和重置状态的前端单元测试。
- [x] 下一项建议继续做学习问题完成状态，或抽出统一复盘卡片组件。

## 28. 2026-06-26 复盘问题完成状态更新

- [x] 实验详情页复盘卡片展开后，支持逐项勾选引导式复盘问题。
- [x] 每条事件展示本地问题完成进度，例如 `问题完成 2 / 4`。
- [x] 新增前端复盘问题完成状态 helper，以 `traceId + 问题序号` 精确控制状态，不依赖问题文案。
- [x] 重新加载实验详情或事件日志时重置本地完成状态，避免旧事件状态污染新列表。
- [x] 本轮不新增后端接口、数据库字段或事件日志字段，不展示 `inputSummaryJson`。
- [x] 补齐问题 key、勾选、取消、跨事件隔离、统计和重置的前端单元测试。
- [x] 下一项建议抽出统一复盘卡片组件，或单独设计可持久化的学习问题完成记录。

## 29. 2026-06-26 统一复盘卡片组件更新

- [x] 新增 `EventRecapCard.vue` 统一展示事件复盘摘要、展开详情与可选复盘问题。
- [x] 账户中心“最近事件复盘”改用统一复盘卡片组件。
- [x] 实验详情页“最近事件复盘”改用统一复盘卡片组件，并保留问题完成状态。
- [x] 新增账户中心版与实验详情页版复盘卡片内容整理 helper，避免页面模板重复拼接字段。
- [x] 本轮不新增后端接口、数据库字段或事件日志字段，不展示 `inputSummaryJson`。
- [x] 补齐复盘卡片内容整理单元测试。
- [x] 下一项建议单独设计可持久化的学习问题完成记录，或继续补充复盘统计视图。

## 30. 更新规则

后续每次有实质进展时，必须同时更新：

1. 项目级进度
2. 对应攻击类型 / 安全内容的状态
3. 当前落点
4. 未来代码位置

只要某一种内容开始写文档、脚本、页面或后端接口，就要在本文件里体现出来。

# 2026-07-01 最新进展：DNS 劫持实验执行文档

本轮已为下一项网络实验 `network/dns-hijack` 补齐单独实现执行文档：

- 新增执行文档：`docs/execution/2026-07-01-network-dns-hijack-lab.md`。
- 将首版定位为“内存 DNS 解析差异模拟器”，用于学习攻击方如何利用错误解析结果引导用户访问错误虚拟地址，以及防御方如何通过可信解析源、证书校验和异常解析审计降低风险。
- 明确后续实现只允许固定 `domainKey` 和固定 `resolverProfile`，不接收任意域名、DNS 服务器、IP、代理、网络接口或端口参数。
- 明确首版不修改本机 DNS、hosts、代理、路由、防火墙或系统网络配置，不请求真实外部 DNS、DoH、DoT 或公共解析服务。
- 明确事件日志只记录域名样例 key、解析结果类别、证书状态、异常审计结论和学习信号，不保存真实域名访问记录、真实 IP、真实证书、Cookie、token 或凭据。
- 更新 `docs/design/next-wave-security-labs.md`，将 `network/dns-hijack` 从规划中推进到已有执行文档，并把下一步切片调整为目录与 planned 元数据。
- 同步 `docs/TODO.md` 顶部进度和旧网络 / 传输层清单中的 DNS 劫持状态。

验证情况：

- `git diff --check -- docs/execution/2026-07-01-network-dns-hijack-lab.md docs/design/next-wave-security-labs.md docs/TODO.md docs/execution/security-lab-master-goal.md` 通过；仅出现 Windows 下 LF 将转换为 CRLF 的提示。
- `rg -n "[ \t]+$" -- docs/execution/2026-07-01-network-dns-hijack-lab.md docs/design/next-wave-security-labs.md docs/TODO.md docs/execution/security-lab-master-goal.md` 无命中。
- 安全关键词扫描仅命中文档中的禁止性说明、边界约束和历史进度记录，未发现真实 DNS 配置改动、外部解析请求、真实投毒链路、隧道通信或可复用攻击脚本实现。
- 下一项建议：进入 `network/dns-hijack` 目录与 planned 元数据切片，先只登记 docs 入口，不创建后端 API、前端页面或 DNS 脚本。

# 2026-07-01 最新进展：端口扫描 ready 收口

本轮已按主计划完成标准对 `network/port-scan` 做 ready 收口审计：

- 新增执行文档：`docs/execution/2026-07-01-network-port-scan-ready-closeout.md`。
- 逐项确认漏洞版可运行、修复版可运行、攻击方触发路径清晰、防御方收敛 / 阻断路径清晰、页面提供引导式交互。
- 确认后端 `POST /api/labs/network/port-scan/:variant/scan` 已写入统一事件日志，日志只记录虚拟目标 key、观察模式、端口统计、暴露面评分和学习信号。
- 确认文档已覆盖攻击步骤、修复说明、安全边界、手动验证和只读脚本验证。
- 确认自动化证据包含服务端 API 测试、前端单元测试、Playwright 页面差异验证和只读一致性验证脚本。
- 将 `labs/network/port-scan/meta.json` 从 `in-progress` 更新为 `ready`，并补充 ready 状态仅代表本项目内虚拟实验闭环完成，不表示提供真实扫描能力。
- 更新只读验证脚本、共享元数据测试、服务端 health / registry 测试、端口扫描页面旧文案和下一波实验规划。
- 当前仍不提供 `exploit.py`、真实端口扫描脚本、真实网络探测、系统探测命令或通用扫描器能力。

验证情况：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/network/port-scan/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，28 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/port-scan-api.test.ts tests/port-scan-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/testing e2e -- --grep "端口扫描"` 通过，1 项 Playwright 用例通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/port-scan-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，161 项通过。
- `git diff --check -- <本轮目标文件>` 通过；仅出现 Windows 下 LF 将转换为 CRLF 的提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 安全关键词扫描仅命中禁止性说明和只读脚本的负向检查列表，未发现真实网络探测、系统命令或通用扫描器实现。
- 下一项建议：进入 `network/dns-hijack` 目录与 planned 元数据切片，继续使用内存解析表，不修改本机 DNS、hosts、代理、路由或防火墙。

# 2026-07-01 最新进展：端口扫描只读一致性验证

本轮已为 `network/port-scan` 补齐本机只读一致性验证脚本：

- 新增执行文档：`docs/execution/2026-07-01-network-port-scan-readonly-verification.md`。
- 新增 `tools/lab-scripts/network/port-scan/verify.ts`，只读取仓库内端口扫描元数据、标准文档、前端工作台、前端 API client、前端模型和后端服务实现。
- 脚本校验 `network.port-scan` 仍保持 `simulation` / `in-progress`，web 入口只包含漏洞版与修复版页面，API 入口只包含漏洞版与修复版 `scan` 接口。
- 脚本确认元数据只登记 `port-scan-verify` 这一只读验证脚本，不存在 `exploit.py` 或真实扫描脚本。
- `labs/network/port-scan/meta.json` 已启用 `verification.automation.scriptVerification`，并保留 Playwright 页面验证和服务端 API 测试证据。
- 更新端口扫描 README、攻击步骤、修复说明、手动验证、脚本目录说明、下一波实验规划和共享元数据测试。
- 首次运行只读脚本时发现标准文档缺少精确边界短语，已补强 README 后重跑通过。

验证情况：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/network/port-scan/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，28 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/port-scan-api.test.ts tests/port-scan-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，161 项通过。
- 本轮未新增 `exploit.py`、真实端口扫描脚本、真实网络探测、系统探测命令或通用扫描器能力。
- 下一项建议：按完成标准对 `network/port-scan` 做 ready 收口审计，确认是否可从 `in-progress` 推进到 `ready`。

# 2026-07-01 最新进展：端口扫描 Playwright 页面级验证

本轮已为 `network/port-scan` 补齐页面级 Playwright 差异验证：

- 新增执行文档：`docs/execution/2026-07-01-network-port-scan-playwright-verification.md`。
- 在 `packages/testing/tests/e2e/platform.spec.mjs` 新增端口扫描漏洞版 / 修复版页面差异验证。
- Playwright 用例登录 `demo_user` 后只操作固定虚拟目标“后台管理节点”和固定观察模式，不输入任意 IP、域名、网段或端口范围。
- 漏洞版断言 `port-scan-management-surface-visible` 对应页面文案、`accepted` 决策、暴露面评分 `155`、高风险端口 `3` 和 `public / critical` 数据库端口。
- 修复版断言 `port-scan-surface-reduced` 对应页面文案、`accepted` 决策、公开端口 `0`、高风险端口 `0`，以及数据库服务收敛为 `internal-only / medium`。
- `labs/network/port-scan/meta.json` 的 Playwright 自动化证据已更新为 `packages/testing/tests/e2e/platform.spec.mjs`。
- 端口扫描 README、手动验证、下一波实验规划和共享元数据测试已同步页面级验证状态。

验证情况：

- `pnpm --filter @network-safe/testing e2e -- --grep "端口扫描"` 通过，1 项 Playwright 用例通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/shared test` 通过，28 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/port-scan-api.test.ts tests/port-scan-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，161 项通过。
- `git diff --check -- <本轮已跟踪目标文件>` 通过；仅出现 Windows 下 LF 将转换为 CRLF 的提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中，已覆盖新增未跟踪文件。
- 端口扫描前端和 Playwright 实现未新增真实网络探测、系统命令、`nmap`、`Test-NetConnection`、`ping`、`tracert`、`netcat` 或独立 `nc` 调用；安全关键词命中均为禁止性说明、边界文案或测试中的反向断言。
- 本轮未新增 `exploit.py`、`verify.ts`、真实端口扫描脚本、真实网络探测或通用扫描器能力。
- 下一项建议补齐 `network/port-scan` 只读一致性验证脚本，或按完成标准做 ready 收口审计。

# 2026-07-01 最新进展：端口扫描前端工作台

本轮已将 `network/port-scan` 从后端受控 API 阶段推进到前端工作台阶段：

- 新增执行文档：`docs/execution/2026-07-01-network-port-scan-frontend-workbench.md`。
- 新增 `apps/web/src/api/port-scan-lab.ts`，前端只提交 `targetKey` 和 `scanProfile`。
- 新增 `apps/web/src/labs/port-scan.ts`，定义固定虚拟目标、固定观察模式、学习信号文案、学习进度和验证记录载荷。
- 新增 `apps/web/src/views/PortScanLabView.vue`，提供漏洞版 / 修复版固定目标观察工作台。
- 新增 `/labs/network/port-scan/vuln` 与 `/labs/network/port-scan/fixed` 路由。
- 页面只提供固定虚拟目标和固定观察模式选择器，不提供任意 IP、域名、网段、端口范围、超时、并发或代理输入框。
- `labs/network/port-scan/meta.json` 已登记 web 入口，状态仍保持 `in-progress`，脚本入口仍为空。
- 端口扫描 README、攻击步骤、修复说明、手动验证、下一波实验规划和共享元数据测试已同步当前状态。

验证情况：

- `pnpm --filter @network-safe/web exec vitest run tests/port-scan-api.test.ts tests/port-scan-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/shared test` 通过，28 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，161 项通过。
- `git diff --check -- <本轮已跟踪目标文件>` 通过；仅出现 Windows 下 LF 将转换为 CRLF 的提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中，已覆盖新增未跟踪文件。
- 端口扫描前端实现代码未命中真实网络探测、系统命令、`nmap`、`Test-NetConnection`、`ping`、`tracert`、`netcat` 或独立 `nc`；宽泛安全关键词扫描命中的内容均为禁止性说明、文档边界或测试中的反向断言。
- 本轮未新增数据库迁移、`exploit.py`、`verify.ts`、真实端口扫描脚本或通用扫描器能力。
- 下一项建议为 `network/port-scan` 补齐页面级 Playwright 差异验证或只读一致性验证脚本，仍不创建真实扫描脚本。

# 2026-06-30 最新进展：端口扫描虚拟资产观察 API

本轮已将 `network/port-scan` 从 planned 文档入口推进到后端受控 API 阶段：

- 新增执行文档：`docs/execution/2026-06-30-network-port-scan-virtual-api.md`。
- 新增 `apps/server/src/services/port-scan-lab.ts`，只使用固定虚拟资产表和虚拟端口状态。
- 新增 `POST /api/labs/network/port-scan/:variant/scan` 后端受控 API，只读取 `targetKey` 和 `scanProfile`。
- API 不接收任意 IP、域名、网段、端口范围、超时、并发、代理、认证、Cookie 或 token 字段。
- 未知虚拟目标或观察模式会返回 `port-scan-target-blocked`，并将响应与事件日志中的原始目标脱敏为 `blocked-target` / `blocked-profile`。
- 事件日志只记录虚拟目标 key、观察模式、虚拟端口数量、公开端口数量、受限端口数量、高风险端口数量、暴露面评分和学习信号。
- 新增 `apps/server/tests/port-scan-lab.test.ts`，覆盖漏洞版管理面暴露、修复版暴露面收敛、未知目标阻断、登录要求和事件日志脱敏摘要。
- `labs/network/port-scan/meta.json` 已更新为 `in-progress`，登记漏洞版 / 修复版 API 入口和 API 测试证据，脚本入口仍为空。
- 端口扫描 README、攻击步骤、修复说明、mock 说明和手动验证文档已同步当前状态：仅接入后端 API，尚未接入页面或脚本。

验证情况：

- `pnpm --filter @network-safe/server test -- tests/port-scan-lab.test.ts` 通过；该命令实际运行服务端全量测试，161 项通过。
- `pnpm --filter @network-safe/shared test` 通过，28 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/port-scan-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，161 项通过。
- `git diff --check -- <本轮目标文件>` 通过；仅出现 Windows 下 LF 将转换为 CRLF 的提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 端口扫描相关代码安全关键词复核通过，未命中真实 socket、系统命令、`nmap`、`Test-NetConnection`、`ping`、`tracert`、`netcat` 或独立 `nc`。
- 本轮未新增前端页面、数据库迁移、`exploit.py`、`verify.ts`、真实端口扫描脚本或通用扫描器能力。
- 下一项建议进入 `network/port-scan` 前端工作台切片，继续使用固定目标选择器和固定观察模式，不提供任意目标输入。

# 2026-06-30 最新进展：端口扫描目录与 planned 元数据

本轮已按端口扫描执行文档建立 `network/port-scan` 的 planned 文档入口：

- 新增执行文档：`docs/execution/2026-06-30-network-port-scan-directory-metadata.md`。
- 建立 `labs/network/port-scan/` 标准目录和 `tools/lab-scripts/network/port-scan/` 脚本目录占位。
- 新增 `labs/network/port-scan/meta.json`，状态为 `planned`，模式为 `simulation`，只登记 docs 入口。
- 新增 README、漏洞版说明、修复版说明、mock 说明、攻击方观察步骤、修复说明和手动验证文档。
- 脚本目录当前只包含 README，不提供 `exploit.py`、`verify.ts`、真实端口扫描脚本或通用扫描器能力。
- 更新共享元数据测试，确认 `network.port-scan` 是 planned/docs-only simulation。
- 更新服务端 health / registry 测试，当前本地元数据总数从 19 增加到 20，并包含 `network.port-scan` planned 条目。

验证情况：

- 本轮未新增页面、API、数据库迁移、事件日志写入实现或扫描脚本。
- `pnpm --filter @network-safe/shared test` 通过，28 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，154 项测试通过。
- `git diff --check -- docs\execution\2026-06-30-network-port-scan-lab.md docs\execution\2026-06-30-network-port-scan-directory-metadata.md docs\design\next-wave-security-labs.md docs\TODO.md docs\execution\security-lab-master-goal.md labs\network\port-scan tools\lab-scripts\network\port-scan packages\shared\tests\lab-metadata.test.mjs apps\server\tests\health.test.ts apps\server\tests\lab-registry.test.ts` 未发现新增空白错误，仅提示 `apps/server/tests/health.test.ts`、`apps/server/tests/lab-registry.test.ts`、`docs/TODO.md`、`packages/shared/tests/lab-metadata.test.mjs` 既有 LF/CRLF 转换。
- `rg -n "[ \t]+$" ...` 未发现目标文件行尾空白。
- 端口扫描安全关键词扫描仅命中文档中的禁止性说明、localhost 测试 URL 和历史验证记录，未发现真实扫描脚本、真实 socket 探测、系统命令探测或通用扫描器实现。
- 下一项建议进入 `network/port-scan` 虚拟资产模型与受控 API 设计切片，仍不创建真实扫描能力。

# 2026-06-30 最新进展：端口扫描暴露面实验执行文档

本轮已为下一波首个网络实验 `network/port-scan` 补齐单独实现执行文档：

- 新增执行文档：`docs/execution/2026-06-30-network-port-scan-lab.md`。
- 将首版定位为“虚拟暴露面观察器”，用于学习攻击方如何从开放端口推断资产暴露面，以及防御方如何通过最小暴露面、访问控制和资产清单收敛降低风险。
- 明确后续实现只允许固定虚拟目标 `targetKey` 和固定观察模式，不接收任意 IP、域名、网段、端口范围、超时、并发或代理参数。
- 明确首版不调用真实 socket、系统命令、PowerShell、`nmap`、`Test-NetConnection`、`ping`、`tracert` 或类似探测工具。
- 明确事件日志只记录虚拟目标 key、虚拟端口数量、开放端口数量、高风险端口数量、暴露面评分和学习信号，不保存真实 IP、主机名、banner、凭据、token 或 Cookie。
- 更新 `docs/design/next-wave-security-labs.md`，将端口扫描状态从规划中推进到已有执行文档。

验证情况：

- 本轮只新增执行文档并更新规划状态，未新增目录、元数据、页面、API、数据库迁移或脚本。
- `git diff --check -- docs\execution\2026-06-30-network-port-scan-lab.md docs\design\next-wave-security-labs.md docs\TODO.md docs\execution\security-lab-master-goal.md` 未发现新增空白错误，仅提示 `docs/TODO.md` 既有 LF/CRLF 转换。
- `rg -n "[ \t]+$" ...` 未发现目标文档行尾空白。
- 端口扫描安全关键词扫描仅命中文档中的禁止性说明、localhost 固定目标说明和历史验证记录，未发现真实目标扫描方案、可执行扫描命令或通用扫描器实现。
- 下一项建议进入 `network/port-scan` 目录与 `planned` 元数据切片，先只登记 docs 入口，不创建扫描脚本。

# 2026-06-30 最新进展：下一波安全实验规划

本轮已在 Web / Auth / 注入类主干和 LDAP case-study ready 规则之后，补齐下一波非 Web/Auth 扩展实验规划：

- 新增执行文档：`docs/execution/2026-06-30-next-wave-security-labs-planning.md`。
- 新增设计文档：`docs/design/next-wave-security-labs.md`。
- 首批推荐顺序为 `network/port-scan`、`network/dns-hijack`、`ai/prompt-injection`、`social/phishing`、`supply-chain/dependency-confusion`、`infrastructure/misconfiguration`。
- 网络方向首版保持虚拟资产、内存解析表和受控 localhost 边界，不扫描真实网段，不修改本机 DNS、hosts、代理、路由或防火墙。
- 社会工程学方向只做仿真页面、固定样例、识别训练和复盘题，不发送真实邮件 / 短信，不收集真实凭据。
- AI 方向优先做确定性 Prompt 注入模拟器，不调用外部 AI 生成攻击内容。
- 供应链、恶意软件、客户端和基础设施方向已分别锁定禁止能力，避免真实投毒、恶意样本、表单外传或真实配置改动。

验证情况：

- 本轮为规划文档切片，未新增页面、API、数据库迁移、实验元数据或脚本。
- `git diff --check -- docs\execution\2026-06-30-next-wave-security-labs-planning.md docs\design\next-wave-security-labs.md docs\TODO.md docs\execution\security-lab-master-goal.md` 未发现新增空白错误，仅提示 `docs/TODO.md` 既有 LF/CRLF 转换。
- `rg -n "[ \t]+$" ...` 未发现目标文档行尾空白。
- 安全关键词扫描命中的内容均为禁止性说明或历史验证记录，未发现外部 URL、真实凭据或可执行外部攻击链。
- 下一项建议进入 `network/port-scan` 实现执行文档，先锁定虚拟资产模型、事件日志摘要字段和 localhost-only 脚本边界。

# 2026-06-30 最新进展：case-study ready 共享元数据规则

本轮已将 LDAP 收口时形成的 `case-study ready` 例外标准抽成共享元数据校验规则，避免后续高风险案例化实验误标为 `ready`：

- 新增执行文档：`docs/execution/2026-06-30-case-study-ready-metadata-rule.md`。
- 更新 `packages/shared/src/lab-metadata.js`，当元数据同时为 `status: "ready"` 与 `mode: "case-study"` 时，额外校验安全边界、notes、变体自动化标记和自动化证据数量。
- 更新 `packages/shared/tests/lab-metadata.test.mjs`，新增合法 case-study ready 样例，以及缺少边界、误标变体自动化、自动化证据不足三类负向测试。
- 当前唯一 `ready + case-study` 实验仍是 `web.ldap-injection`，现有 19 个实验元数据均通过共享校验。

验证情况：

- `pnpm --filter @network-safe/shared test` 通过，27 项测试通过。
- 目标文件 `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- 目标文件行尾空白扫描未命中。
- 当前唯一 `ready + case-study` 元数据仍为 `web.ldap-injection`。

# 2026-06-30 最新进展：LDAP 注入 case-study ready 收口

本轮已将 `web/ldap-injection` 按 case-study 例外标准收口到 `ready`，继续保持不连接真实目录服务、不提供攻击脚本的边界：

- 新增执行文档：`docs/execution/2026-06-30-web-ldap-injection-ready-closeout.md`。
- `labs/web/ldap-injection/meta.json` 更新为 `status: "ready"`，并保留 `mode: "case-study"`。
- `variants[].supportsAutomation` 继续保持 `false`，明确当前没有攻击脚本自动化。
- ready 判定依据为：前端虚拟目录工作台、受控虚拟目录 API、事件日志摘要、服务端 API 测试、Playwright 页面差异验证、只读一致性验证脚本和安全边界文档已经形成完整闭环。
- 更新共享元数据测试、服务端 health / registry 测试和 LDAP 一致性验证脚本，确保 ready 状态和“不提供 `exploit.py` 或 LDAP 查询脚本”的边界同时被校验。
- 更新 LDAP README、手动验证、注入类剩余规划和本总纲，说明当前 ready 不包含真实 LDAP / AD / OpenLDAP 服务、真实凭据、LDAP 查询脚本、payload 库或任意过滤器执行器。

验证情况：

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

本轮已完成 `web/ldap-injection` 页面级 Playwright 验证，并修正 testing smoke 的实验总数前置检查：

- 新增执行文档：`docs/execution/2026-06-30-web-ldap-injection-playwright-verification.md`。
- 在 `packages/testing/tests/e2e/platform.spec.mjs` 中新增 LDAP 工作台浏览器流程验证。
- 用例登录 `demo_user` 后分别进入 `/labs/web/ldap-injection/vuln` 和 `/labs/web/ldap-injection/fixed`。
- 漏洞版提交受控样例后，断言学习信号为“漏洞版虚拟目录结果范围被扩大”、后端决策为 `accepted`、结果范围为 `expanded`，并展示虚拟受限教学记录。
- 修复版提交同样受控样例后，断言学习信号为“修复版阻断受控 LDAP 样例”、后端决策与结果范围均为 `blocked`，并确认虚拟受限教学记录不展示。
- `packages/testing/src/smoke/config.mjs` 改为从本地 `labs/*/*/meta.json` 动态统计实验数量，避免新增实验后 smoke 仍使用旧的固定总数。
- 补充 `packages/testing/tests/smoke-config.test.mjs`，确认 labs API smoke 检查使用当前本地元数据数量。
- 该 Playwright 切片当时仍保持 LDAP `in-progress` / `case-study` 边界；后续已按 case-study ready 标准收口，仍不连接真实 LDAP / AD / OpenLDAP 服务，不创建 LDAP 查询脚本或攻击脚本，不提供过滤器 payload 库。

验证情况：

- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/testing e2e -- --grep "LDAP"` 通过，1 项 Playwright 测试通过。
- `pnpm --filter @network-safe/shared test` 通过，23 项测试通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ldap-injection/verify.ts` 通过，报告 `ok: true`。
- 本轮曾发现并修正 testing smoke 旧实验总数基线，以及 LDAP E2E 短文本状态断言匹配过宽的问题。

# 2026-06-30 最新进展：LDAP 注入前端工作台接入切片

本轮已完成 `web/ldap-injection` 前端引导式工作台接入，继续保持不连接真实目录服务的边界：

- 新增执行文档：`docs/execution/2026-06-30-web-ldap-injection-frontend-workbench.md`。
- 新增 `apps/web/src/api/ldap-injection-lab.ts`，接入受控虚拟目录查询 API。
- 扩展 `apps/web/src/labs/ldap-injection.ts`，补充正常样例、受控样例、学习进度载荷、验证记录载荷和虚拟目录 API 信号文案。
- 改造 `apps/web/src/views/LdapInjectionLabView.vue`，提供场景选择、关键词输入、正常查询、受控样例提交、后端决策、学习信号和虚拟目录条目展示。
- 页面只展示后端已脱敏字段与安全摘要，不展示原始 `inputSummaryJson`、真实目录连接信息或 LDAP 过滤器字符串。
- 更新 `labs/web/ldap-injection/meta.json`、场景文档、手动验证、只读一致性验证脚本、共享元数据测试和注入类剩余规划。
- 当前仍不连接真实 LDAP / AD / OpenLDAP 服务，不创建 LDAP 查询脚本或攻击脚本，不提供过滤器 payload 库。

验证情况：

- `pnpm --filter @network-safe/web exec vitest run tests/ldap-injection-api.test.ts tests/ldap-injection-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ldap-injection/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，23 项测试通过。
- 目标文件 `git diff --check` 未发现空白错误，仅有 `docs/TODO.md` 与 `packages/shared/tests/lab-metadata.test.mjs` 的既有 LF/CRLF 提示。
- 目标文件行尾空白扫描未命中。
- LDAP 前端、helper、测试、场景文档和脚本聚焦安全扫描未发现真实目录连接、目录命令、动态执行、命令执行、文件读取或 `inputSummaryJson` 暴露；唯一 `fetch(` 为前端调用本项目 API。

# 2026-06-30 最新进展：LDAP 注入虚拟目录 API 切片

本轮已完成 `web/ldap-injection` 受控虚拟目录 API 后端切片，继续保持不连接真实目录服务的边界：

- 新增执行文档：`docs/execution/2026-06-30-web-ldap-injection-virtual-directory-api.md`。
- 新增 `apps/server/src/services/ldap-injection-lab.ts`，只使用内存虚拟目录数据。
- 新增 `POST /api/labs/web/ldap-injection/:variant/search`，支持漏洞版和修复版虚拟目录查询。
- 漏洞版固定受控样例触发 `ldap-injection-scope-expanded`，修复版同样样例触发 `ldap-injection-controlled-sample-blocked`。
- LDAP 事件已接入 `lab_event_logs`，只记录场景、关键词长度、脱敏预览、风险类型、结果范围、条目数量和学习信号。
- 更新 `labs/web/ldap-injection/meta.json`，登记虚拟目录 API 和 API 测试。
- 更新只读一致性验证脚本、共享元数据测试、服务端 health / registry 断言和 LDAP 场景文档。
- 当前仍不连接真实 LDAP / AD / OpenLDAP 服务，不创建 LDAP 查询脚本或攻击脚本，不提供过滤器 payload 库。

验证情况：

- `pnpm --filter @network-safe/server test -- tests/ldap-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该脚本实际运行服务端全量测试，154 项通过。

# 2026-06-30 最新进展：LDAP 注入一致性验证脚本切片

本轮已完成 `web/ldap-injection` 文档与元数据一致性验证脚本切片，继续保持案例化边界：

- 新增执行文档：`docs/execution/2026-06-30-web-ldap-injection-consistency-verify.md`。
- 新增 `tools/lab-scripts/web/ldap-injection/README.md`。
- 新增 `tools/lab-scripts/web/ldap-injection/verify.ts`，只读取本仓库内固定 LDAP 元数据和案例文档，输出一致性验证报告。
- 更新 `labs/web/ldap-injection/meta.json`，登记 `ldap-injection-verify` 脚本入口；后续虚拟目录 API 切片已补齐 api 入口。
- `verification.automation.supported` 调整为 `true`，仅表示接入文档一致性验证脚本；`variants[].supportsAutomation` 仍为 `false`。
- 更新 LDAP README、手动验证文档和共享元数据测试。
- 当前仍不连接真实 LDAP / AD / OpenLDAP 服务，不创建 LDAP 查询脚本，不创建攻击脚本，不写入事件日志。

验证情况：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ldap-injection/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，23 项测试通过。
- 目标文件 `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- 目标文件行尾空白扫描未命中。
- LDAP 脚本目录与场景文档安全关键词扫描未命中。

# 2026-06-30 最新进展：LDAP 注入静态案例页切片

本轮已完成 `web/ldap-injection` 静态案例页切片，实验仍保持案例化边界：

- 新增执行文档：`docs/execution/2026-06-30-web-ldap-injection-static-case-page.md`。
- 新增 `apps/web/src/labs/ldap-injection.ts`，集中维护静态案例、变体配置、复盘清单和学习信号文案。
- 新增 `apps/web/src/views/LdapInjectionLabView.vue`，提供漏洞案例 / 修复案例静态学习页面。
- 新增 `/labs/web/ldap-injection/vuln` 与 `/labs/web/ldap-injection/fixed` 路由。
- 更新 `labs/web/ldap-injection/meta.json` 为 `in-progress`，该静态页切片当时仅登记 web 与 docs 入口；后续已补齐脚本和虚拟目录 API 入口。
- 更新 LDAP README、攻击步骤、修复案例说明和手动验证文档。
- 补充前端 helper 测试、路由测试和共享元数据测试。
- 当前仍不连接真实 LDAP / AD / OpenLDAP 服务，不创建 LDAP 查询脚本，不提供过滤器 payload 库，不写入事件日志。

验证情况：

- `pnpm --filter @network-safe/web exec vitest run tests/ldap-injection-lab.test.ts tests/router.test.ts` 通过，2 个测试文件、5 项测试通过。
- `pnpm --filter @network-safe/shared test` 通过，23 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- 目标文件 `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- 目标文件行尾空白扫描未命中。
- LDAP 静态页、helper 与场景文档安全关键词扫描未命中。
- `Test-Path -LiteralPath tools\lab-scripts\web\ldap-injection` 返回 `False`，确认本轮未创建 LDAP 脚本目录。

# 2026-06-30 最新进展：LDAP 注入目录与案例文档切片

本轮已完成 `web/ldap-injection` 目录、planned 元数据和基础案例文档切片：

- 建立 `labs/web/ldap-injection/` 标准实验目录结构。
- 新增 `labs/web/ldap-injection/meta.json`，当前状态为 `planned`，模式为 `case-study`。
- 元数据只登记 docs 入口，不登记尚未实现的 web / api / scripts 入口。
- 新增实验总说明、漏洞案例、修复案例、mock 说明、攻击方观察步骤、修复说明和手动验证文档。
- 补充共享元数据测试，确认 LDAP 当前为 planned/docs-only/case-study 元数据。
- 当前仍不创建后端 API、前端页面或 LDAP 查询脚本。

验证情况：

- `pnpm --filter @network-safe/shared test` 通过，23 项测试通过。
- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/design/injection-remaining-labs.md labs/web/ldap-injection packages/shared/tests/lab-metadata.test.mjs` 未发现空白错误，仅有 `docs/TODO.md` 与 `packages/shared/tests/lab-metadata.test.mjs` 的既有 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/design/injection-remaining-labs.md labs/web/ldap-injection packages/shared/tests/lab-metadata.test.mjs` 未发现目标文件行尾空白。
- `rg -n "ldap://|ldaps://|ldapsearch|ldapmodify|ldapdelete|ldapadd|bindDN|password|process\\.env|createReadStream|readFile|http\\.request|https\\.request|eval\\(|new Function|child_process" labs/web/ldap-injection` 未命中。
- `Test-Path -LiteralPath tools\\lab-scripts\\web\\ldap-injection` 返回 `False`，确认本轮未创建 LDAP 脚本目录。

# 2026-06-30 最新进展：LDAP 注入案例化执行文档

本轮已完成 `web/ldap-injection` 案例化实验执行文档，先锁定一期不接真实目录服务的安全边界：

- 新增执行文档：`docs/execution/2026-06-30-web-ldap-injection-lab.md`。
- 明确 `web/ldap-injection` 一期落地方式为 `case-study`，状态先保持 `planned`。
- 明确不连接真实 LDAP / AD / OpenLDAP 服务，不进行真实 bind、search、modify 或 delete 操作。
- 明确不保存目录账号、组织结构、DN、邮箱、手机号、凭据或外部目标信息。
- 明确不提供对外 LDAP 查询脚本、不生成过滤器 payload 库、不实现任意 LDAP 过滤器执行器。
- 规划后续目录为 `labs/web/ldap-injection/`，初始只登记 docs 入口，不登记未实现的 web / api / scripts 入口。
- 规划案例内容为组织成员搜索、权限组查询和登录筛选三个固定案例。

验证情况：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/design/injection-remaining-labs.md` 未发现空白错误，仅有 `docs/TODO.md` 的既有 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/design/injection-remaining-labs.md` 未发现目标文档行尾空白。
- LDAP 执行文档安全边界关键词检查确认已明确 `case-study`、`planned`、不连接真实 LDAP、不保存目录账号、不提供对外 LDAP 查询脚本、不生成过滤器 payload 库和不实现任意 LDAP 过滤器执行器。
- LDAP 执行文档风险关键词扫描仅命中禁止展示原始 `inputSummaryJson` 的说明，未发现真实 LDAP URL、ldapsearch / ldapmodify / bindDN、文件读取、外部请求、动态执行或命令执行内容。

后续已进入 `web/ldap-injection` 目录与文档切片，创建 planned/case-study 元数据和基础案例文档，暂不创建后端 API、前端页面或 LDAP 查询脚本。

# 2026-06-30 最新进展：XPath 注入实验 ready 收口

本轮已完成 `web/xpath-injection` 前端、脚本、元数据、文档和测试切片，XPath 注入实验推进到 `ready`：

- 新增前端 API client：`apps/web/src/api/xpath-injection-lab.ts`。
- 新增实验 helper：`apps/web/src/labs/xpath-injection.ts`。
- 新增引导式工作台页面：`apps/web/src/views/XpathInjectionLabView.vue`。
- 新增漏洞版 / 修复版路由：`/labs/web/xpath-injection/vuln`、`/labs/web/xpath-injection/fixed`。
- 新增本机受控脚本：`tools/lab-scripts/web/xpath-injection/exploit.py`、`verify.ts`。
- 更新 `labs/web/xpath-injection/meta.json` 为 `ready`，补齐 web / api / scripts / docs / verification 入口。
- 更新实验 README、漏洞版 / 修复版 / mock 说明、攻击步骤、修复说明、手动验证文档和脚本目录说明。
- 已清理 Python 语法检查生成的 `__pycache__` 目录。

验证情况：

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

后续已完成 `web/ldap-injection` 案例化执行文档，下一步进入目录与文档切片。

# 2026-06-30 最新进展：XPath 注入后端切片

本轮已完成 `web/xpath-injection` 后端虚拟 XML 产品目录查询模拟器与受控 API 切片，实验进入 `in-progress`：

- 新增 `apps/server/src/services/xpath-injection-lab.ts`，使用内存虚拟产品目录数据集合和固定查询路径模拟器。
- 新增 `POST /api/labs/web/xpath-injection/:variant/search`，支持 `vuln` / `fixed` 两个受控变体。
- 漏洞版固定受控样例触发 `xpath-injection-result-scope-expanded`，只扩大虚拟教学结果范围，不读取真实 XML 文件，不执行任意 XPath 表达式。
- 修复版同样样例触发 `xpath-injection-controlled-sample-blocked`，在进入虚拟查询前阻断。
- 事件日志已接入 `lab_event_logs`，只写入模板、范围、关键词长度、脱敏预览、风险类别、结果范围、文档数量和学习信号。
- 更新 `labs/web/xpath-injection/meta.json` 为 `in-progress`，当前只登记后端 API 和 API 测试，web / scripts 入口仍未登记。
- 更新 XPath 场景文档与手动验证说明。

验证情况：

- `pnpm --filter @network-safe/server test -- tests/xpath-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该脚本实际运行服务端全量测试，147 项通过。
- `pnpm --filter @network-safe/shared test` 通过，22 项测试通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- 目标文件 `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- 目标文件行尾空白扫描未命中。
- XPath 后端切片安全关键词扫描仅命中测试中的本机 `fetch` 和既有 `readFileUploadVariantKey` 函数名；`apps/server/src/services/xpath-injection-lab.ts` 单独扫描未命中危险 API、文件读取、外部请求、XPath 执行器或原始输入摘要暴露。

下一步建议补齐前端 API client、实验 helper、工作台页面、路由和本机受控脚本入口。

# 2026-06-30 最新进展：XPath 注入目录与文档切片

本轮已完成 `web/xpath-injection` 实现执行文档、实验目录、planned 元数据和基础文档切片，为后续后端虚拟 XML 产品目录查询模拟器建立注册点：

- 新增执行文档：`docs/execution/2026-06-30-web-xpath-injection-lab.md`。
- 建立 `labs/web/xpath-injection/` 标准实验目录结构。
- 新增 `labs/web/xpath-injection/meta.json`，当前状态为 `planned`，模式为 `simulation`。
- 当前仅登记 docs 入口，web / api / scripts 暂不登记，避免误标为可运行实验。
- 新增实验 README、漏洞版 / 修复版 / mock 说明、攻击步骤、修复说明和手动验证计划。
- 新增 `tools/lab-scripts/web/xpath-injection/README.md`，预留本机受控脚本入口并明确 localhost 边界。
- 补充共享元数据测试，确认 XPath planned/docs-only 元数据通过校验。

验证情况：

- `pnpm --filter @network-safe/shared test` 通过，22 项测试通过。
- 目标文件 `git diff --check` 未发现空白错误，仅有 `docs/TODO.md` 与 `packages/shared/tests/lab-metadata.test.mjs` 的既有 LF/CRLF 提示。
- 目标文件行尾空白扫描未命中。
- XPath 目录、脚本 README 与执行文档安全关键词扫描未命中危险 API、外部请求、文件读取或原始输入摘要暴露。
- XPath 安全边界扫描确认文档明确包含“不读取真实 XML 文件、不执行任意 XPath 表达式、不接入外部 XML 数据源、不访问外部目标”等约束。

后续已进入后端切片：实现 `apps/server/src/services/xpath-injection-lab.ts`、`POST /api/labs/web/xpath-injection/:variant/search` 和服务端差异测试。

# 2026-06-30 最新进展：CRLF 注入实验 ready 收口

本轮已完成 `web/crlf-injection` 前端、脚本、元数据、文档和测试切片，CRLF 注入实验推进到 `ready`：

- 新增前端 API client：`apps/web/src/api/crlf-injection-lab.ts`。
- 新增实验 helper：`apps/web/src/labs/crlf-injection.ts`。
- 新增引导式工作台页面：`apps/web/src/views/CrlfInjectionLabView.vue`。
- 新增漏洞版 / 修复版路由：`/labs/web/crlf-injection/vuln`、`/labs/web/crlf-injection/fixed`。
- 新增本机受控脚本：`tools/lab-scripts/web/crlf-injection/exploit.py`、`verify.ts`。
- 更新 `labs/web/crlf-injection/meta.json` 为 `ready`，补齐 web / api / scripts / docs / verification 入口。
- 更新实验 README、漏洞版 / 修复版 / mock 说明、攻击步骤、手动验证文档和脚本目录说明。

验证情况：

- `pnpm --filter @network-safe/web exec vitest run tests/crlf-injection-api.test.ts tests/crlf-injection-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、7 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/crlf-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该脚本实际运行服务端全量测试，140 项通过。
- `pnpm --filter @network-safe/shared test` 通过，21 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/crlf-injection/verify.ts` 通过并输出本机验证计划。
- `python -m py_compile tools/lab-scripts/web/crlf-injection/exploit.py` 通过，生成的 `__pycache__` 已清理。

后续已进入 `web/xpath-injection` 实现执行文档与目录切片，继续沿用“模拟实验、不读取真实 XML 文件、不执行任意 XPath 表达式”的安全边界。

# 2026-06-30 最新进展：CRLF 注入后端切片

本轮已完成 `web/crlf-injection` 后端虚拟响应头预览器与受控 API 切片，实验进入 `in-progress`：

- 新增 `apps/server/src/services/crlf-injection-lab.ts`，使用内存虚拟响应头预览器模拟下载响应头构造。
- 新增 `POST /api/labs/web/crlf-injection/:variant/preview`，支持 `vuln` / `fixed` 两个受控变体。
- 漏洞版固定受控样例触发 `crlf-injection-virtual-header-injected`，只展示 `virtual-injected` 教学头部，不设置真实响应头。
- 修复版同样样例触发 `crlf-injection-control-chars-blocked`，在进入虚拟头部构造器前阻断。
- 事件日志已接入 `lab_event_logs`，只写入模板、下载方式、文件名长度、脱敏预览、控制字符类别、虚拟头部数量和学习信号。
- 更新 `labs/web/crlf-injection/meta.json` 为 `in-progress`，当前只登记后端 API 和 API 测试，web / scripts 入口仍未登记。
- 更新 CRLF 场景文档与脚本目录说明。

验证情况：

- `pnpm --filter @network-safe/server test -- tests/crlf-injection-lab.test.ts` 通过；该脚本实际运行服务端全量测试，140 项通过。
- `pnpm --filter @network-safe/shared test` 通过，21 项测试通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。

下一步建议补齐前端 API client、实验 helper、工作台页面、路由和本机受控脚本入口。

# 2026-06-30 最新进展：CRLF 注入目录与文档切片

本轮已完成 `web/crlf-injection` 目录、元数据和文档切片，为后续后端虚拟响应头预览器与受控 API 实现建立注册点：

- 建立 `labs/web/crlf-injection/` 标准实验目录结构。
- 新增 `labs/web/crlf-injection/meta.json`，当前状态为 `planned`，仅登记 docs 入口，web / api / scripts 暂不登记。
- 新增实验总说明、漏洞版规划、修复版规划、mock 说明、攻击步骤、修复说明和手动验证计划。
- 新增 `tools/lab-scripts/web/crlf-injection/README.md`，预留本机受控脚本入口并明确 localhost 边界。
- 补充共享元数据测试，确认 CRLF planned/docs-only 元数据通过校验。

验证情况：

- `pnpm --filter @network-safe/shared test` 通过，21 项测试通过。
- 目标文件 `git diff --check` 未发现空白错误，仅有 `docs/TODO.md` 与 `packages/shared/tests/lab-metadata.test.mjs` 的既有 LF/CRLF 提示。
- 目标文件行尾空白扫描未命中。
- CRLF 目录、脚本 README 与执行文档安全关键词扫描未命中危险 API、外部请求、文件读取或原始输入摘要暴露。

下一步建议进入后端切片：实现 `apps/server/src/services/crlf-injection-lab.ts`、`POST /api/labs/web/crlf-injection/:variant/preview` 和服务端差异测试。

# 2026-06-30 最新进展：CRLF 注入实现执行文档

本轮已完成 `web/crlf-injection` 实现执行文档，为后续虚拟响应头预览实验锁定边界：

- 新增执行文档：`docs/execution/2026-06-30-web-crlf-injection-lab.md`。
- 明确业务包装为“下载响应头预览”。
- 明确后续实现只使用虚拟响应头预览器，不构造真实 HTTP 响应拆分。
- 明确后端 API 计划为 `POST /api/labs/web/crlf-injection/:variant/preview`。
- 明确固定受控样例只用于虚拟预览，不写入真实响应头。
- 明确日志 `inputSummary` 只记录模板、下载方式、文件名长度与脱敏预览、控制字符类别、虚拟头部数量和学习信号。
- 明确禁止真实缓存投毒、Cookie 注入、代理链路影响、外部目标访问和通用 payload 库。

验证情况：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-crlf-injection-lab.md` 未发现空白错误，仅有 `docs/TODO.md` 的 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-crlf-injection-lab.md` 未发现目标文档行尾空白。
- `rg -n "真实响应拆分|缓存投毒|Cookie 注入|代理链路|外部目标|payload 库" docs/execution/2026-06-30-web-crlf-injection-lab.md` 确认文档已明确安全边界。

# 2026-06-30 最新进展：NoSQL 注入实验 ready 收口

本轮已完成 `web/nosql-injection` 前端、脚本、元数据、文档和测试切片，NoSQL 注入实验推进到 `ready`：

- 新增前端 API client：`apps/web/src/api/nosql-injection-lab.ts`。
- 新增实验 helper：`apps/web/src/labs/nosql-injection.ts`。
- 新增引导式工作台页面：`apps/web/src/views/NosqlInjectionLabView.vue`。
- 新增漏洞版 / 修复版路由：`/labs/web/nosql-injection/vuln`、`/labs/web/nosql-injection/fixed`。
- 新增本机受控脚本：`tools/lab-scripts/web/nosql-injection/exploit.py`、`verify.ts`。
- 更新 `labs/web/nosql-injection/meta.json` 为 `ready`，补齐 web / api / scripts / docs / verification 入口。
- 更新实验 README、漏洞版 / 修复版 / mock 说明、攻击步骤、修复说明和手动验证文档。

验证情况：

- `pnpm --filter @network-safe/web exec vitest run tests/nosql-injection-api.test.ts tests/nosql-injection-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、7 项测试通过。
- `pnpm --filter @network-safe/shared test` 通过，20 项通过。
- `pnpm --filter @network-safe/server test -- tests/nosql-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该脚本实际运行服务端全量测试，133 项通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/nosql-injection/verify.ts` 通过并输出本机验证计划。
- `python -m py_compile tools/lab-scripts/web/nosql-injection/exploit.py` 通过，生成的 `__pycache__` 已清理。
- 目标文件空白检查未发现新问题；安全关键词扫描仅命中 `readFileUploadVariantKey` 函数名误报。

# 2026-06-30 最新进展：NoSQL 注入后端切片收口

本轮已完成 `web/nosql-injection` 后端虚拟文档查询器与受控 API 切片，实验仍保持 `in-progress`，等待前端页面和脚本补齐后再标记为 ready：

- 新增 `apps/server/src/services/nosql-injection-lab.ts`，使用内存虚拟优惠券文档集合模拟查询语义变化。
- 新增 `POST /api/labs/web/nosql-injection/:variant/search`，支持 `vuln` / `fixed` 两个受控变体。
- 漏洞版固定样例触发 `nosql-injection-query-expanded`，修复版同样样例触发 `nosql-injection-operator-blocked`。
- 事件日志已接入 `lab_event_logs`，只写入查询模式、关键词长度与脱敏预览、筛选文本长度、风险类型、结果范围、文档数量和学习信号，不保存完整 `filterText` 或查询结构。
- `labs/web/nosql-injection/meta.json` 已进入 `in-progress`，当前只登记后端 API，web / scripts 入口保持未登记。

验证情况：

- `pnpm --filter @network-safe/server test -- tests/nosql-injection-lab.test.ts` 通过；该脚本实际运行服务端全量测试，133 项通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- NoSQL 后端切片目标文件未发现行尾空白。
- 安全关键词扫描仅命中 `readFileUploadVariantKey` 函数名误报，未发现 NoSQL service 使用真实 NoSQL 连接、动态代码执行、文件读取、外部请求或 `inputSummaryJson` 暴露。

# 2026-06-30 最新进展：NoSQL 注入目录与文档切片

本轮已建立 `web/nosql-injection` 的实验目录、planned 元数据和基础文档，为后续后端虚拟查询器与受控 API 实现做准备：

- 建立 `labs/web/nosql-injection/` 标准实验目录结构。
- 新增 `labs/web/nosql-injection/meta.json`，当前状态为 `planned`，web / api / scripts 入口暂为空，避免误标为可运行实验。
- 新增实验总说明、漏洞版规划、修复版规划、mock 说明、攻击步骤、修复说明和手动验证计划。
- 新增脚本目录说明：`tools/lab-scripts/web/nosql-injection/README.md`。
- 补充共享元数据测试，明确 NoSQL 当前为 docs-only planned 元数据。

验证情况：

- `pnpm --filter @network-safe/shared test` 通过，20 项通过。
- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-nosql-injection-lab.md labs/web/nosql-injection tools/lab-scripts/web/nosql-injection packages/shared/tests/lab-metadata.test.mjs` 未发现空白错误，仅有 `docs/TODO.md` 与 `packages/shared/tests/lab-metadata.test.mjs` 的 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-nosql-injection-lab.md labs/web/nosql-injection tools/lab-scripts/web/nosql-injection packages/shared/tests/lab-metadata.test.mjs` 未发现目标文件行尾空白。

# 2026-06-30 最新进展：NoSQL 注入实现执行文档

本轮已完成 `web/nosql-injection` 实现执行文档，为下一步目录、元数据、文档和受控实现切片锁定边界：

- 新增执行文档：`docs/execution/2026-06-30-web-nosql-injection-lab.md`。
- 明确业务包装为“优惠券文档检索”。
- 明确后续实现使用内存虚拟文档查询器，不引入 MongoDB、Redis、Elasticsearch 或其他 NoSQL 服务。
- 明确后端 API 计划为 `POST /api/labs/web/nosql-injection/:variant/search`。
- 明确建议请求体字段为 `queryMode`、`keyword` 与 `filterText`，其中 `filterText` 只用于受控风险分类，不作为真实查询结构执行。
- 明确事件日志 `inputSummary` 只记录查询模式、关键词长度、筛选文本长度、风险类别、是否命中受控样例和结果范围，不保存完整查询结构。
- 明确后续需要补齐实验目录、元数据、文档、脚本、后端 service / API、前端页面和测试。

验证情况：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-nosql-injection-lab.md` 未发现空白错误，仅有 `docs/TODO.md` 的 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-nosql-injection-lab.md` 未发现目标文档行尾空白。

# 2026-06-30 最新进展：注入类一期剩余清单规划

本轮已完成注入类一期剩余清单规划，为 NoSQL、CRLF、XPath 和 LDAP 注入后续推进确定落地边界：

- 新增执行文档：`docs/execution/2026-06-30-injection-remaining-planning.md`。
- 新增设计文档：`docs/design/injection-remaining-labs.md`。
- 明确 `web/nosql-injection` 作为下一项优先实验，但使用内存虚拟文档查询器，不引入 MongoDB 或外部服务。
- 明确 `web/crlf-injection` 可做虚拟响应头构造预览，不做真实响应拆分、缓存投毒或代理链路影响。
- 明确 `web/xpath-injection` 一期先做模拟实验，不读取真实 XML 文件，不执行任意 XPath 表达式。
- 明确 `web/ldap-injection` 一期先做案例化，不连接真实 LDAP 服务，不保存目录凭据。
- 明确后续每个具体实验仍需单独编写实现执行文档，再进入代码实现。

验证情况：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-injection-remaining-planning.md docs/design/injection-remaining-labs.md` 未发现空白错误，仅有 `docs/TODO.md` 的 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-injection-remaining-planning.md docs/design/injection-remaining-labs.md` 未发现目标文档行尾空白。

# 2026-06-30 最新进展：Web 扩展注入实验统一回归收口

本轮已完成 `web/command-injection`、`web/ssti`、`web/xxe` 三个扩展注入实验的统一回归验证与状态收口：

- 新增并执行收口文档：`docs/execution/2026-06-30-web-injection-regression-closeout.md`。
- 服务端三项回归通过；该命令实际运行服务端全量测试，126 项通过。
- 前端三项 API / helper / 路由回归通过，7 个测试文件、19 项测试通过。
- 前端 `vue-tsc` 与服务端 `tsc` 类型检查通过。
- 共享元数据测试通过，19 项通过。
- 三个 `verify.ts` 均可输出本机验证计划，三个 `exploit.py` 均通过 Python 语法检查。
- 已清理 Python 语法检查生成的三个 `__pycache__` 目录。
- 安全关键词扫描未发现真实危险 API，命令注入、SSTI、XXE 仍保持本机受控学习边界。
- `git diff --check` 未发现空白错误，仅有当前工作区既有 LF/CRLF 提示；目标文件行尾空白扫描未命中。

验证情况：

- `pnpm --filter @network-safe/server test -- tests/command-injection-lab.test.ts tests/ssti-lab.test.ts tests/xxe-lab.test.ts` 通过；该脚本实际运行服务端全量测试，126 项通过。
- `pnpm --filter @network-safe/web exec vitest run tests/command-injection-api.test.ts tests/command-injection-lab.test.ts tests/ssti-api.test.ts tests/ssti-lab.test.ts tests/xxe-api.test.ts tests/xxe-lab.test.ts tests/router.test.ts` 通过，7 个测试文件、19 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/shared test` 通过，19 项通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/command-injection/verify.ts`、`pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ssti/verify.ts`、`pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/xxe/verify.ts` 均通过并输出本机验证计划。
- `python -m py_compile tools/lab-scripts/web/command-injection/exploit.py tools/lab-scripts/web/ssti/exploit.py tools/lab-scripts/web/xxe/exploit.py` 通过。
- 安全关键词扫描未命中三项实验实现与脚本中的真实危险 API。

# 2026-06-29 最新进展：XXE 实验落地

本轮已完成 `web/xxe` XML 外部实体注入实验的受控实现：

- 新增后端虚拟 XML 资源解析器 service：`apps/server/src/services/xxe-lab.ts`。
- 新增受控 API：`POST /api/labs/web/xxe/:variant/import`。
- 新增前端 API、实验 helper、工作台页面和路由入口。
- 更新 `labs/web/xxe/meta.json`，补齐 web / api / scripts / docs / verification / safeBoundaries。
- 补充攻击步骤、修复说明、手动验证、漏洞版 / 修复版 / mock 说明。
- 新增本机受控 `exploit.py` 与 `verify.ts`，脚本只允许 localhost / 127.0.0.1 / ::1。
- XXE 事件已接入统一实验事件日志，日志不保存完整 XML 文档、完整实体声明或虚拟资源内容。
- 本实验不读取真实本机文件、不请求真实外部 URL、不解析真实外部实体。

验证情况：

- `pnpm --filter @network-safe/server test -- tests/xxe-lab.test.ts` 通过；该脚本实际运行服务端全量测试，126 项通过。
- `pnpm --filter @network-safe/web exec vitest run tests/xxe-api.test.ts tests/xxe-lab.test.ts tests/router.test.ts` 通过。
- `pnpm --filter @network-safe/shared test` 通过，19 项通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/xxe/verify.ts` 通过并输出本机验证计划。
- `python -m py_compile tools/lab-scripts/web/xxe/exploit.py` 通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。

# 2026-06-29 最新进展：XXE 实现执行文档

本轮已完成 `web/xxe` XML 外部实体注入实验的实现执行文档：

- 新增执行文档：`docs/execution/2026-06-29-web-xxe-lab.md`。
- 明确 XXE 业务包装为“XML 发票 / 配置导入预览”。
- 明确后续实现只允许使用虚拟 XML 资源解析器，不读取真实本机文件、不请求真实外部 URL、不解析真实外部实体。
- 明确后端 API 计划为 `POST /api/labs/web/xxe/:variant/import`。
- 明确请求体字段为 `importKind` 与 `xmlDocument`，其中导入类型使用固定允许列表。
- 明确受控样例中的 `file:///virtual/lab/internal-note` 只是教学标识，永远不映射到真实文件系统。
- 明确事件日志 `inputSummary` 只记录 XML 长度、是否包含 DOCTYPE、实体名、是否命中受控样例和学习信号，不保存完整 XML 文档、完整实体声明或虚拟资源内容。
- 明确后续需要补齐后端 service、前端 API / helper / 页面、路由、元数据、文档、脚本和测试。

验证情况：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-web-xxe-lab.md` 未发现空白错误，仅有 `docs/TODO.md` 的 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-web-xxe-lab.md` 未发现目标文档行尾空白。
- 安全边界关键字检查确认文档明确禁止真实文件读取、真实网络请求和真实外部实体解析。

# 2026-06-29 最新进展：SSTI 实验落地

本轮已完成 `web/ssti` 服务端模板注入实验的受控实现：

- 新增后端教学用模板模拟器 service：`apps/server/src/services/ssti-lab.ts`。
- 新增受控 API：`POST /api/labs/web/ssti/:variant/preview`。
- 新增前端 API、实验 helper、工作台页面和路由入口。
- 更新 `labs/web/ssti/meta.json`，补齐 web / api / scripts / docs / verification / safeBoundaries。
- 补充攻击步骤、修复说明、手动验证、漏洞版 / 修复版 / mock 说明。
- 新增本机受控 `exploit.py` 与 `verify.ts`，脚本只允许 localhost / 127.0.0.1 / ::1。
- SSTI 事件已接入统一实验事件日志，日志不保存完整模板、完整表达式或完整变量值。
- 本实验不使用 `eval`、`Function`、Node VM 或真实危险模板表达式执行。

验证情况：

- `pnpm --filter @network-safe/server test -- tests/ssti-lab.test.ts` 通过；该脚本实际运行服务端全量测试，118 项通过。
- `pnpm --filter @network-safe/web exec vitest run tests/ssti-api.test.ts tests/ssti-lab.test.ts tests/router.test.ts` 通过。
- `pnpm --filter @network-safe/shared test` 通过，18 项通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ssti/verify.ts` 通过并输出本机验证计划。
- `python -m py_compile tools/lab-scripts/web/ssti/exploit.py` 通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。

# 2026-06-29 最新进展：SSTI 实现执行文档

本轮已完成 `web/ssti` 服务端模板注入实验的实现执行文档：

- 新增执行文档：`docs/execution/2026-06-29-web-ssti-lab.md`。
- 明确 SSTI 业务包装为“通知模板预览”。
- 明确后续实现只允许使用教学用模板模拟器，不使用 `eval`、`Function`、Node VM 或可访问运行时对象的真实模板表达式。
- 明确后端 API 计划为 `POST /api/labs/web/ssti/:variant/preview`。
- 明确请求体字段为 `templateKey`、`templateText` 与 `variables`，其中模板 key 和变量名都使用固定允许列表。
- 明确受控样例 `{{ 7 * 7 }}` 与 `{{ debugContext }}` 只能由硬编码教学映射模拟，不得执行真实代码或读取真实运行时上下文。
- 明确事件日志 `inputSummary` 只记录模板长度、变量名、表达式类别、是否命中受控样例和学习信号，不保存完整模板、完整表达式或完整变量值。
- 明确后续需要补齐后端 service、前端 API / helper / 页面、路由、元数据、文档、脚本和测试。

验证情况：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-web-ssti-lab.md` 未发现空白错误，仅有 `docs/TODO.md` 的 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-web-ssti-lab.md` 未发现目标文档行尾空白。

# 2026-06-29 最新进展：命令注入实验落地

本轮已完成 `web/command-injection` 命令注入实验的受控实现：

- 新增后端虚拟命令运行器 service：`apps/server/src/services/command-injection-lab.ts`。
- 新增受控 API：`POST /api/labs/web/command-injection/:variant/run`。
- 新增前端 API、实验 helper、工作台页面和路由入口。
- 更新 `labs/web/command-injection/meta.json`，补齐 web / api / scripts / docs / verification / safeBoundaries。
- 补充攻击步骤、修复说明、手动验证、漏洞版 / 修复版 / mock 说明。
- 新增本机受控 `exploit.py` 与 `verify.ts`，脚本只允许 localhost / 127.0.0.1 / ::1。
- 命令注入事件已接入统一实验事件日志，日志不保存完整 `target`。
- 本实验不调用真实 shell、PowerShell、`cmd.exe`、`child_process` 或系统命令。

验证情况：

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

本轮已完成 `web/command-injection` 命令注入实验的实现执行文档：

- 新增执行文档：`docs/execution/2026-06-29-web-command-injection-lab.md`。
- 明确命令注入业务包装为“诊断任务运行器”。
- 明确后续实现只允许使用虚拟命令运行器，不调用真实 shell、PowerShell、`cmd.exe`、`child_process` 或系统命令。
- 明确后端 API 计划为 `POST /api/labs/web/command-injection/:variant/run`。
- 明确请求体字段为 `taskKey` 与 `target`，其中 `taskKey` 使用固定允许列表。
- 明确事件日志 `inputSummary` 只记录任务、长度、操作符类型、是否命中受控样例和学习信号，不保存完整 `target`。
- 明确后续需要补齐后端 service、前端 API / helper / 页面、路由、元数据、文档、脚本和测试。

验证情况：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-web-command-injection-lab.md` 未发现空白错误，仅有 `docs/TODO.md` 的 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-web-command-injection-lab.md` 未发现目标文档行尾空白。

# 2026-06-29 最新进展：下一批 Web 注入类扩展实验设计

本轮已完成下一批 Web 注入类扩展实验设计，为后续实现命令注入、SSTI 和 XXE 建立受控边界：

- 新增执行文档：`docs/execution/2026-06-29-next-wave-web-injection-labs.md`。
- 新增设计文档：`docs/design/next-wave-web-injection-labs.md`。
- 明确后续实现顺序为 `web/command-injection`、`web/ssti`、`web/xxe`。
- 明确命令注入必须使用虚拟命令运行器，不调用真实 shell、PowerShell、`cmd.exe`、`child_process` 或系统命令。
- 明确 SSTI 必须使用教学用模板模拟器，不使用 `eval`、`Function` 或可访问运行时对象的真实模板表达式。
- 明确 XXE 必须使用虚拟 XML 资源解析，不读取真实本机文件、不请求真实外部 URL、不解析真实外部实体。
- 明确三个实验后续都要补齐元数据入口、工作台页面、受控 API、统一事件日志、文档、脚本和最小测试。
- 明确脚本仍只允许访问 localhost / 127.0.0.1 / ::1，不扫描网络、不访问外部目标、不生成通用攻击 payload 库。

验证情况：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-next-wave-web-injection-labs.md docs/design/next-wave-web-injection-labs.md` 未发现空白错误，仅有 `docs/TODO.md` 的 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-next-wave-web-injection-labs.md docs/design/next-wave-web-injection-labs.md` 未发现目标文档行尾空白。

# 2026-06-29 最新进展：阶段 D 复盘统计说明文档

本轮已补充账号中心复盘完成度的统计口径说明：

- 新增执行文档：`docs/execution/2026-06-29-learning-recap-statistics-guide.md`。
- 新增设计文档：`docs/design/learning-recap-statistics.md`。
- 明确账号中心复盘完成度只表示当前筛选范围内最近事件对应复盘问题的完成情况。
- 明确该统计不代表全量历史学习完成率、漏洞掌握度、攻击成功率或安全能力评分。
- 明确统计按 `labKey` 聚合，事件数量来自当前筛选结果，问题总数来自 `createLabEventRecapQuestions(event)`。
- 明确完成数只统计当前问题范围内 `completed: true` 的记录，越界 `questionIndex` 不计入完成数。
- 明确切换实验、阶段或风险筛选后，当前事件列表、分子、分母和百分比都会重新计算。
- 明确统计区域仍不展示 `inputSummaryJson`，不展示真实密码、真实 token、真实 Cookie、完整 payload 或外部目标信息。

验证情况：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-learning-recap-statistics-guide.md docs/design/learning-recap-statistics.md` 未发现空白错误，仅有 `docs/TODO.md` 的 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-learning-recap-statistics-guide.md docs/design/learning-recap-statistics.md` 未发现目标文档行尾空白。

# 2026-06-29 最新进展：阶段 D 详情页复用模式规划

本轮已完成后续实验复用单个实验详情页的模式规划：

- 新增执行文档：`docs/execution/2026-06-29-lab-detail-reuse-pattern.md`。
- 新增设计文档：`docs/design/lab-detail-reuse-pattern.md`。
- 明确通用详情页继续负责实验元数据、变体入口、验证方式、文档脚本入口、当前实验记录、最近事件复盘和复盘问题完成状态。
- 明确具体实验工作台页面负责漏洞版 / 修复版交互、受控业务接口调用、学习记录写入和统一事件日志写入。
- 明确后续实验入口必须通过 `variant.entryKey -> entrypoints.web[].key` 精确匹配，不根据目录、变体或分类猜测路由。
- 明确详情页使用 `lab.id` 作为 `labKey`，学习记录、事件日志和复盘问题完成状态均按已确认字段关联。
- 明确最近事件复盘不展示 `inputSummaryJson`，不展示真实密码、真实 token、真实 Cookie、完整 payload 或外部目标信息。
- 为后续命令注入、SSTI、XXE 等扩展实验补充了复用详情页的接入检查清单和安全边界。

验证情况：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-lab-detail-reuse-pattern.md docs/design/lab-detail-reuse-pattern.md` 未发现空白错误，仅有 `docs/TODO.md` 的 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-lab-detail-reuse-pattern.md docs/design/lab-detail-reuse-pattern.md` 未发现目标文档行尾空白。

# 2026-06-29 最新进展：阶段 D 账号中心复盘完成度统计

本轮已在账号中心“最近事件复盘”区域新增当前筛选范围内的复盘完成度统计：

- 新增账号中心复盘统计执行文档：`docs/execution/2026-06-29-account-recap-completion-stats.md`。
- 复用 `GET /api/lab-event-logs/me` 与 `GET /api/lab-recap-question-completions/me`，未新增后端接口、数据库表或字段。
- 账号中心加载最近事件日志后，会按当前事件 `traceId` 拉取复盘问题完成记录。
- 新增按实验聚合的统计视图，展示最近事件数、已完成问题数 / 问题总数、完成百分比。
- 统计口径限定为当前账号中心已加载的最近事件与当前筛选条件，不宣称全量历史完成度。
- 完成数只统计当前问题数量范围内的 `completed: true` 记录，避免旧的越界记录污染统计。
- 本轮仍不展示 `inputSummaryJson`，不保存或展示真实密码、真实 token、真实 Cookie、完整 payload 或外部目标信息。

验证情况：

- `pnpm --filter @network-safe/web exec vitest run tests/account-recap.test.ts tests/lab-records-api.test.ts` 通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。

# 2026-06-29 最新进展：阶段 D 复盘问题持久化

本轮已将实验详情页“最近事件复盘”中的引导式问题完成状态从本地临时状态升级为可持久化记录：

- 新增 `lab_recap_question_completions` 数据库表设计、Prisma schema 与 SQL 迁移。
- 新增当前用户复盘问题完成记录服务与 API：`GET /api/lab-recap-question-completions/me`、`PUT /api/lab-recap-question-completions/me`。
- 实验详情页加载当前实验事件日志后，会按 `traceId` 拉取当前用户的问题完成记录。
- 勾选或取消勾选复盘问题时，前端先乐观更新，再写回后端；失败时回滚本地状态并显示错误。
- 复盘问题状态只基于 `traceId + questionIndex`，不依赖问题文案。
- 本轮不展示 `inputSummaryJson`，不新增攻击输入摘要展示，也不保存真实密码、真实 token、真实 Cookie 或完整 payload。

验证情况：

- `pnpm --filter @network-safe/server test` 通过。
- `pnpm --filter @network-safe/web exec vitest run` 通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/server prisma:validate` 通过。
- `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。

注意：`pnpm --filter @network-safe/server prisma:generate` 在当前 Windows 环境中因 Prisma engine DLL 被 Node 进程占用而失败，错误为 `EPERM: operation not permitted, rename ... query_engine-windows.dll.node.tmp...`。本轮生成过程已经刷新到 Prisma 类型，新模型可被服务端测试识别；后续释放相关 Node 进程后可重新执行生成命令清理该环境问题。

# 网络安全攻防学习实验建设总纲

## 1. 文档定位

本文档是后续 Codex goal 的主任务源，用于指导本项目逐步建设网络安全攻防学习实验。

项目目标不是堆砌漏洞 demo，也不是提供通用攻击工具，而是在本机受控环境中帮助学习者按以下顺序理解常见安全问题：

1. 先站在攻击方视角理解问题如何发生。
2. 再站在防御方视角理解系统为什么能挡住。
3. 最后通过日志、数据库记录、脚本验证和自动化测试复盘整个过程。

后续可以直接使用类似目标：

```text
按 docs/execution/security-lab-master-goal.md 逐项推进一期安全实验建设
```

Codex 执行时必须以本文档、项目 `AGENTS.md`、实验元数据规范和现有样板实验为共同依据。

## 2. 总目标

建设一个运行在 Windows 本机环境中的网络安全学习平台，覆盖常见 Web 漏洞、认证授权问题和后续扩展场景。

每个高优先级实验都应具备：

- 攻击方视角说明
- 正常业务流程
- 漏洞版实现
- 攻击触发方式
- 攻击成功信号
- 后端控制台日志
- 数据库实验事件日志
- 修复版实现
- 防御验证
- 页面引导式交互
- 本机受控攻击 / 验证脚本
- 单元测试、API 测试或端到端测试
- 实验文档与元数据

## 3. 安全边界

本项目只允许在以下边界内实现和运行：

- 只面向 `localhost`、`127.0.0.1` 或本项目明确控制的本机服务。
- 不访问外部真实目标。
- 不生成可投递到第三方系统的通用攻击工具。
- 不保存真实密码、真实 token、真实隐私数据或外部目标信息。
- 攻击脚本必须默认限制本机目标。
- 对高风险或不适合真实复现的问题，优先采用模拟、案例化、受控请求或只读验证。

所有实验说明都必须强调：本项目用于学习防御和理解风险，不用于攻击未授权系统。

## 4. 优先级策略

### 4.1 第一优先级：Web 常见漏洞

优先实现能通过前后端交互直接观察的 Web 常见漏洞：

1. XSS
2. CSRF
3. SQL 注入
4. 文件上传漏洞
5. 目录遍历
6. SSRF
7. 信息泄露

### 4.2 第二优先级：认证与授权

认证授权问题也保持高优先级，尤其是：

1. JWT 攻击
2. IDOR
3. 权限提升
4. 会话固定
5. 暴力破解

### 4.3 后续优先级

以下内容后续逐步扩展：

- 命令注入
- SSTI
- XXE
- 网络层实验
- 社会工程学
- AI / 新型攻击
- 供应链安全
- 恶意软件案例化学习

## 5. 攻击方视角学习模型

每个实验必须先从攻击方视角设计学习路径。

页面、文档和脚本需要回答：

1. 攻击者想达成什么目标。
2. 攻击者需要什么前置条件。
3. 攻击者能控制哪些输入。
4. 攻击者会构造什么请求或数据。
5. 系统为什么会接受这个请求。
6. 攻击成功后有哪些可观察信号。
7. 后端日志中能看到什么异常或关键判断。
8. 数据库实验事件日志如何记录这次尝试。
9. 同样请求在修复版为什么失败。

攻击方视角不是为了提供对外攻击能力，而是让学习者理解漏洞成因和防御点。

## 6. 防御方视角学习模型

每个实验在攻击版之后必须提供修复版。

防御方视角需要回答：

1. 漏洞根因是什么。
2. 修复点放在哪一层：前端、后端、数据库、配置、权限或流程。
3. 修复版新增了什么校验。
4. 修复版如何避免被绕过。
5. 修复版日志与漏洞版日志有什么差异。
6. 修复版是否影响正常业务。
7. 自动化测试如何证明防御生效。

## 7. 引导式交互规范

每个实验页面尽量提供引导式学习交互。

页面至少包含：

- 当前实验名称
- 当前视角：攻击者 / 防御者 / 正常用户
- 当前目标
- 漏洞版 / 修复版切换
- 正常业务操作
- 一键填入样例
- 一键触发受控攻击模拟
- 当前请求参数摘要
- 后端判定结果
- 攻击成功或被阻断信号
- 本次实验日志摘要
- 下一步建议

页面不应只给一个输入框和按钮。它要像学习向导一样，让学习者知道自己每一步在观察什么。

## 8. 日志规范

日志必须服务于学习复盘。

每次关键实验动作都应产生结构化日志，至少包括：

- 请求时间
- trace id
- 用户 id
- 实验 key
- 变体 key：`vuln` / `fixed`
- 阶段：`attack` / `defense` / `normal`
- 视角：`attacker` / `user` / `system`
- 请求方法
- 请求路径
- 输入摘要
- 校验结果
- 后端决策：`accepted` / `blocked` / `failed`
- 状态码
- 学习信号
- 风险等级
- 面向学习者的说明

### 8.1 控制台日志

后端必须打印清晰可读的学习日志。

建议格式：

```text
[LAB_EVENT] trace=... lab=web.csrf variant=vuln phase=attack decision=accepted signal=csrf-transfer-accepted message="漏洞版缺少 CSRF token 仍接受请求"
```

控制台日志用于开发时即时观察。

### 8.2 数据库日志

数据库必须记录实验事件日志，便于账户中心、实验详情页和后续复盘展示。

数据库日志不得保存真实敏感值。对密码、token、payload、文件名、路径等敏感内容应保存摘要、脱敏值或学习信号。

## 9. 数据库日志表设计

后续做新实验前，应优先落地统一日志表。

建议新增平台核心表：

```text
lab_event_logs
```

建议字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `bigint unsigned` | 主键 |
| `trace_id` | `varchar(64)` | 单次实验动作追踪 ID |
| `user_id` | `bigint unsigned null` | 当前用户，可为空 |
| `lab_id` | `bigint unsigned null` | 关联 `labs.id`，可为空以支持早期日志 |
| `lab_key` | `varchar(128)` | 元数据实验 key，例如 `web.csrf` |
| `variant_key` | `varchar(32)` | `vuln` / `fixed` |
| `phase` | `varchar(32)` | `attack` / `defense` / `normal` |
| `event_type` | `varchar(64)` | `request` / `validation` / `blocked` / `success` / `failure` |
| `actor_perspective` | `varchar(32)` | `attacker` / `user` / `system` |
| `method` | `varchar(16)` | HTTP 方法或脚本动作 |
| `path` | `varchar(255)` | 请求路径或脚本入口 |
| `input_summary_json` | `json` | 输入摘要，禁止存真实敏感值 |
| `decision` | `varchar(32)` | `accepted` / `blocked` / `failed` |
| `signal` | `varchar(100)` | 学习信号 |
| `status_code` | `int` | HTTP 状态码或脚本退出码 |
| `message` | `varchar(500)` | 面向学习者的说明 |
| `risk_level` | `varchar(32)` | `low` / `medium` / `high` / `critical` |
| `created_at` | `datetime` | 创建时间 |

### 9.1 后端服务建议

建议新增：

```text
apps/server/src/services/lab-event-logs.ts
```

服务接口建议：

```ts
recordLabEvent({
  traceId,
  userId,
  labKey,
  variantKey,
  phase,
  eventType,
  actorPerspective,
  method,
  path,
  inputSummary,
  decision,
  signal,
  statusCode,
  message,
  riskLevel,
});
```

该服务同时负责：

- 打印控制台结构化日志
- 写入 `lab_event_logs`
- 处理数据库不可用时的降级策略

## 10. 攻击脚本规范

攻击脚本要从攻击方视角组织，但必须受控。

每个脚本需要具备：

- 清晰的用途说明
- 本机目标限制
- 输入参数说明
- 预期输出
- 成功信号
- 失败信号
- 禁止行为说明

脚本类型建议：

- `exploit.py`：本机受控攻击模拟脚本。
- `verify.ts`：平台验证配置、样例请求和预期信号。
- `samples/`：只存本机实验样例。
- `artifacts/`：只存本机生成的验证产物。

脚本不得：

- 默认访问外部目标。
- 扫描网段。
- 构造真实投递页面攻击第三方。
- 保存真实凭据。
- 绕过本项目安全边界。

## 11. 单个实验建设模板

每个实验都按以下模板推进。

### 11.1 实验定义

- 实验名称
- 实验 key
- 分类
- 优先级
- 风险等级
- 学习目标
- 安全边界

### 11.2 攻击方设计

- 攻击目标
- 前置条件
- 可控输入
- 攻击请求
- 成功信号
- 失败信号
- 攻击方观察日志

### 11.3 正常业务流程

- 正常用户如何操作
- 正常请求是什么
- 正常响应是什么
- 正常日志是什么

### 11.4 漏洞版实现

- 前端页面
- 后端接口
- 数据库读写
- 漏洞点说明
- 攻击触发按钮
- 日志记录
- 验证方式

### 11.5 修复版实现

- 修复策略
- 新增校验
- 防御成功信号
- 正常业务不受影响的验证
- 日志记录
- 对比说明

### 11.6 文档与脚本

- `README.md`
- `vuln/README.md`
- `fixed/README.md`
- `docs/attack-steps.md`
- `docs/fix-notes.md`
- `docs/manual-verification.md`
- `tools/lab-scripts/<category>/<scene>/README.md`
- `exploit.py`
- `verify.ts`

### 11.7 测试

- 后端 API 测试
- 前端模型测试
- 前端 API client 测试
- 实验元数据测试
- Playwright e2e 测试
- 脚本最小可运行检查

## 12. 棘手问题处理规则

遇到以下情况必须写清楚说明：

- 攻击真实复现风险过高
- 依赖外部目标或第三方服务
- 涉及真实凭据、token、隐私数据
- 涉及破坏性操作
- 涉及文件系统、命令执行、网络扫描
- 修复方式在真实生产中还有更复杂要求

说明至少包括：

1. 为什么棘手。
2. 本项目如何安全模拟。
3. 哪些能力被刻意限制。
4. 学习者应该观察什么。
5. 真实生产还需要补哪些防护。

## 13. Codex 执行规则

后续 Codex 按本文档执行时，必须遵循以下顺序：

1. 读取项目规则、本文档、当前实验元数据和已有样板。
2. 为具体实验写执行文档。
3. 先实现或补齐统一日志能力。
4. 实现正常业务流程。
5. 实现漏洞版。
6. 实现攻击方触发方式。
7. 实现控制台日志和数据库事件日志。
8. 实现修复版。
9. 实现防御验证。
10. 补齐脚本、文档和元数据。
11. 补齐测试。
12. 运行最小必要验证。
13. 更新 `docs/TODO.md`。

如果执行过程中需要偏离本文档，必须说明：

- 偏离原因
- 影响范围
- 替代方案
- 后续补偿措施

## 14. 分阶段落地计划

### 阶段 A：统一日志能力

优先落地：

- `lab_event_logs` 数据库表
- Prisma schema 和迁移 SQL
- `lab-event-logs` 服务
- 控制台结构化日志
- 最小 API / 单元测试

完成该阶段后，后续实验必须写入统一事件日志。

当前状态（2026-06-25）：阶段 A 已落地 `lab_event_logs` 表、Prisma schema、迁移 SQL、`lab-event-logs` 服务、控制台结构化日志、服务单元测试，并已将 `web.csrf` 转账动作作为首个实验接入点。

### 阶段 B：Web 常见漏洞继续推进

按优先级继续：

1. SQL 注入
2. 文件上传漏洞
3. 目录遍历
4. SSRF
5. 信息泄露

XSS 和 CSRF 已作为样板存在，后续实验应复用其结构，但不能硬编码字段或复制不适用的业务逻辑。

当前状态（2026-06-25）：`web.sql-injection` 已落地漏洞版 / 修复版页面、受控商品搜索接口、场景数据表、统一事件日志、文档、脚本入口和自动化测试；`web.file-upload` 已落地漏洞版 / 修复版页面、受控模拟上传接口、统一事件日志、文档、脚本入口和自动化测试；`web.path-traversal` 已落地漏洞版 / 修复版页面、受控虚拟文档读取接口、统一事件日志、文档、脚本入口和自动化测试；`web.ssrf` 已落地漏洞版 / 修复版页面、受控虚拟资源抓取接口、统一事件日志、文档、脚本入口和自动化测试；`web.info-disclosure` 已落地漏洞版 / 修复版页面、受控虚拟诊断报告接口、统一事件日志、文档、脚本入口和自动化测试。阶段 B Web 常见漏洞优先清单已完成，阶段 C 已从 JWT 攻击实验开始推进。

### 阶段 C：认证授权高优先级

按优先级推进：

1. JWT 攻击
2. IDOR
3. 权限提升
4. 会话固定
5. 暴力破解

这些实验必须重点展示权限判断、身份边界和日志审计。

当前状态（2026-06-25）：`auth.jwt` 已落地漏洞版 / 修复版页面、受控 JWT 验证接口、统一事件日志、文档、Python 本机模拟脚本、TypeScript 验证配置和 API 差异验证；`auth.idor` 已落地漏洞版 / 修复版页面、受控订单对象读取接口、统一事件日志、文档、Python 本机模拟脚本、TypeScript 验证配置和 API 差异验证；`auth.privilege-escalation` 已落地漏洞版 / 修复版页面、受控管理操作执行接口、统一事件日志、文档、Python 本机模拟脚本、TypeScript 验证配置和 API 差异验证；`auth.session-fixation` 已落地漏洞版 / 修复版页面、受控教学登录会话绑定接口、统一事件日志、文档、Python 本机模拟脚本、TypeScript 验证配置和 API 差异验证；`auth.brute-force` 已落地漏洞版 / 修复版页面、受控候选口令检查接口、统一事件日志、文档、Python 本机模拟脚本、TypeScript 验证配置和 API 差异验证。阶段 C 认证授权高优先级清单已完成，下一项建议进入阶段 D：完善学习复盘。

### 阶段 D：完善学习复盘

后续可增加：

- 实验详情页日志查看
- 账户中心学习时间线
- 每次攻击 / 防御尝试的复盘卡片
- 自动生成学习问题
- 按实验筛选日志

当前状态（2026-06-26）：已落地阶段 D 第一个最小闭环，新增 `GET /api/lab-event-logs/me` 当前用户最近事件日志接口，账户中心展示跨实验最近事件时间线，单个实验详情页展示当前实验最近事件复盘卡片。本轮不展示 `inputSummaryJson`，仅展示学习信号、决策、阶段、风险等级、状态码、说明和时间。随后已补充阶段 / 风险筛选、账户中心按实验筛选、基于事件阶段和后端决策的固定引导式复盘问题、账户中心和实验详情页复盘卡片展开 / 收起状态、实验详情页复盘问题本地完成状态，以及统一复盘卡片组件。

## 15. 完成标准

当一个实验满足以下条件时，才可标记为完成：

- 漏洞版可运行。
- 修复版可运行。
- 攻击方触发路径清晰。
- 防御方阻断路径清晰。
- 页面提供引导式交互。
- 后端打印结构化日志。
- 数据库记录实验事件日志。
- 文档说明攻击步骤、修复说明和安全边界。
- 攻击脚本只面向本机受控目标。
- 元数据与实际入口一致。
- 自动化测试或脚本验证覆盖关键差异。
- `docs/TODO.md` 已同步。

未满足以上条件时，不能只因为页面能打开或测试局部通过就标记完成。

### 15.1 case-study ready 例外

对于高风险或不适合真实复现的实验，可以不提供攻击脚本，但必须显式满足 case-study ready 例外标准：

- 元数据必须保持 `mode: "case-study"`，并在 `safeBoundaries` 或 `notes` 中说明不提供攻击脚本的原因。
- 漏洞版和修复版必须都有可访问的学习入口，且能观察到差异。
- 若提供 API，API 必须只使用受控虚拟数据或案例数据，不连接真实外部目标。
- 自动化验证必须至少覆盖页面差异、API 差异或只读一致性验证中的两类。
- 文档必须明确禁止真实服务连接、真实凭据、对外攻击脚本、payload 库和任意执行器。
- `variants[].supportsAutomation` 不得因为存在 Playwright、API 测试或只读验证脚本而误标为攻击脚本自动化。

`web/ldap-injection` 当前按该例外标准收口到 `ready`。

## 16. 当前基线

当前已有样板：

- `web/xss`
  - 已具备漏洞版 / 修复版页面、元数据、文档、脚本入口和 e2e 差异验证。
- `web/csrf`
  - 已具备前端页面、后端受控业务接口、文档、Python 本机模拟脚本、TypeScript 验证配置和 e2e 差异验证。
- `web/sql-injection`
  - 已具备漏洞版 / 修复版页面、后端受控商品搜索接口、场景数据表、统一事件日志、文档、Python 本机模拟脚本、TypeScript 验证配置和 API 差异验证。
- `web/command-injection`
  - 已具备漏洞版 / 修复版页面、后端虚拟命令运行器接口、统一事件日志、文档、Python 本机模拟脚本、TypeScript 验证配置和 API 差异验证，并已通过扩展注入统一回归收口。
- `web/ssti`
  - 已具备漏洞版 / 修复版页面、后端教学用模板模拟器接口、统一事件日志、文档、Python 本机模拟脚本、TypeScript 验证配置和 API 差异验证，并已通过扩展注入统一回归收口。
- `web/xxe`
  - 已具备漏洞版 / 修复版页面、后端虚拟 XML 资源解析器接口、统一事件日志、文档、Python 本机模拟脚本、TypeScript 验证配置和 API 差异验证，并已通过扩展注入统一回归收口。
- `web/file-upload`
  - 已具备漏洞版 / 修复版页面、后端受控模拟上传接口、统一事件日志、文档、Python 本机模拟脚本、TypeScript 验证配置和 API 差异验证。
- `web/path-traversal`
  - 已具备漏洞版 / 修复版页面、后端受控虚拟文档读取接口、统一事件日志、文档、Python 本机模拟脚本、TypeScript 验证配置和 API 差异验证。
- `web/ssrf`
  - 已具备漏洞版 / 修复版页面、后端受控虚拟资源抓取接口、统一事件日志、文档、Python 本机模拟脚本、TypeScript 验证配置和 API 差异验证。
- `web/info-disclosure`
  - 已具备漏洞版 / 修复版页面、后端受控虚拟诊断报告接口、统一事件日志、文档、Python 本机模拟脚本、TypeScript 验证配置和 API 差异验证。
- `web/nosql-injection`
  - 已具备漏洞版 / 修复版页面、后端内存虚拟文档查询器接口、统一事件日志、文档、Python 本机模拟脚本、TypeScript 验证配置和 API 差异验证。
- `web/crlf-injection`
  - 已具备漏洞版 / 修复版页面、后端虚拟响应头预览器接口、统一事件日志、文档、Python 本机模拟脚本、TypeScript 验证配置和 API 差异验证。
- `web/xpath-injection`
  - 已具备漏洞版 / 修复版页面、后端虚拟 XML 产品目录查询接口、统一事件日志、文档、Python 本机模拟脚本、TypeScript 验证配置和 API 差异验证。
- `web/ldap-injection`
  - 已按 case-study ready 标准收口，具备漏洞版 / 修复版前端虚拟目录工作台、受控虚拟目录 API、统一事件日志、案例化文档、元数据入口、只读文档一致性验证脚本和 Playwright 页面差异验证；当前仍不具备 LDAP 查询脚本、攻击脚本或真实目录服务。
- `auth/jwt`
  - 已具备漏洞版 / 修复版页面、后端受控 JWT 验证接口、统一事件日志、文档、Python 本机模拟脚本、TypeScript 验证配置和 API 差异验证。
- `auth/idor`
  - 已具备漏洞版 / 修复版页面、后端受控订单对象读取接口、统一事件日志、文档、Python 本机模拟脚本、TypeScript 验证配置和 API 差异验证。
- `auth/privilege-escalation`
  - 已具备漏洞版 / 修复版页面、后端受控管理操作执行接口、统一事件日志、文档、Python 本机模拟脚本、TypeScript 验证配置和 API 差异验证。
- `auth/session-fixation`
  - 已具备漏洞版 / 修复版页面、后端受控教学登录会话绑定接口、统一事件日志、文档、Python 本机模拟脚本、TypeScript 验证配置和 API 差异验证。
- `auth/brute-force`
  - 已具备漏洞版 / 修复版页面、后端受控候选口令检查接口、统一事件日志、文档、Python 本机模拟脚本、TypeScript 验证配置和 API 差异验证。

下一步建议进入下一批网络 / 社会工程学 / AI 等扩展实验规划；若继续扩展 LDAP，必须先写新的执行文档，并保持不连接真实 LDAP 服务、不提供对外 LDAP 查询脚本的边界。

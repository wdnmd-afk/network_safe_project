# 配置错误利用目录与 planned 元数据执行文档

## 1. 目标

本轮目标是在 `docs/execution/2026-07-02-infrastructure-misconfiguration-lab.md` 的约束下，建立 `infrastructure/misconfiguration` 的标准实验目录、`planned` 元数据和基础文档入口。

本轮只建立文档和元数据入口，不实现页面、API、数据库写入、事件日志写入、真实配置读取、真实服务扫描、配置修改、管理接口连接或攻击脚本。

## 2. 范围

本轮新增：

- `labs/infrastructure/misconfiguration/meta.json`
- `labs/infrastructure/misconfiguration/README.md`
- `labs/infrastructure/misconfiguration/vuln/README.md`
- `labs/infrastructure/misconfiguration/fixed/README.md`
- `labs/infrastructure/misconfiguration/mock/README.md`
- `labs/infrastructure/misconfiguration/docs/attack-steps.md`
- `labs/infrastructure/misconfiguration/docs/fix-notes.md`
- `labs/infrastructure/misconfiguration/docs/manual-verification.md`
- `tools/lab-scripts/infrastructure/misconfiguration/README.md`

本轮同步：

- `packages/shared/tests/lab-metadata.test.mjs`
- `apps/server/tests/health.test.ts`
- `apps/server/tests/lab-registry.test.ts`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

## 3. 实施建议

- 元数据状态保持 `planned`。
- 模式使用 `simulation`，表示首版只做固定静态配置片段和确定性审计结果。
- `entrypoints.docs` 只登记真实存在的文档入口。
- `entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 保持空数组。
- `verification.automation.supported` 保持 `false`。
- `variants[].supportsAutomation` 保持 `false`。
- 文档必须明确当前不修改真实 nginx、MySQL、Node、Windows 服务、系统网络、证书或云账号配置。
- 文档必须明确当前不读取真实 `.env`、服务配置、云凭据、数据库连接串、token、Cookie 或密码。
- 文档必须明确当前不提供 `exploit.py`、扫描器、弱口令测试、服务枚举或可复用利用流程。

## 4. 潜在风险

- 如果登记未实现页面或 API，平台会误以为配置错误实验已经可运行。
- 如果允许输入主机、端口、URL、路径或配置文本，实验可能变成真实扫描、枚举或配置审计工具。
- 如果读取真实配置文件、`.env`、服务配置或云凭据，会引入真实敏感信息风险。
- 如果提供配置修改、重载、部署或系统命令，可能误操作用户本机服务。
- 如果创建 `exploit.py` 或扫描脚本，容易让学习场景变成可复用攻击入口。

## 5. 优化方案

- 使用固定 `configCaseKey` 和 `auditPolicyKey` 描述后续学习样例，但实现前仍需再次按共享类型和服务设计确认字段。
- 使用静态配置摘要、暴露面类别和风险标签替代真实配置文件。
- 使用文档说明攻击方观察路径，避免提供真实扫描、弱口令测试或配置修改流程。
- 后续 API 只接受固定 key，并将日志摘要限制为风险标签、审计动作和学习信号。
- 后续只读验证脚本只检查仓库内元数据、文档和边界，不读取真实配置或连接外部服务。

## 6. 验证方式

- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- `rg --files labs/infrastructure/misconfiguration tools/lab-scripts/infrastructure/misconfiguration`
- 配置错误安全关键词扫描，确认命中内容只属于禁止性说明、边界约束、历史进度或字段 / 路径名。

## 7. 本轮完成条件

- `infrastructure/misconfiguration` 标准目录和 planned 元数据存在。
- 元数据只登记 docs 入口，不登记 web、api 或 scripts 入口。
- README、漏洞版说明、修复版说明、mock 说明、攻击方观察步骤、修复说明和手动验证文档存在。
- 脚本目录只提供 README，不提供 `exploit.py` 或 `verify.ts`。
- 共享元数据测试和服务端索引测试同步新增场景总数与 planned 条目。
- 进度文档同步 `infrastructure/misconfiguration` 已进入 planned 元数据阶段。

## 8. 本轮执行结果

本轮已完成目录与 planned 元数据切片：

- 新增 `labs/infrastructure/misconfiguration/meta.json`，状态为 `planned`，模式为 `simulation`。
- 新增 README、配置风险观察版说明、配置审计复盘版说明、固定配置样例说明、攻击方观察步骤、修复说明和手动验证文档。
- 新增 `tools/lab-scripts/infrastructure/misconfiguration/README.md`，当前只说明脚本边界，不提供 `exploit.py` 或 `verify.ts`。
- 元数据当前只登记 docs 入口，`entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 均为空数组。
- `verification.automation.supported` 为 `false`，`variants[].supportsAutomation` 均为 `false`。
- 更新共享元数据测试，确认配置错误利用 planned/docs-only 元数据合法。
- 更新服务端 health / registry 测试，本地元数据总数从 24 增加到 25，并确认 `infrastructure.misconfiguration` 为 planned 条目。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，33 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，195 项通过。
- `git diff --check -- <本轮目标文件>` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- `rg --files labs/infrastructure/misconfiguration tools/lab-scripts/infrastructure/misconfiguration` 确认当前脚本目录只包含 README，场景目录只包含元数据和文档。
- 配置错误危险命令窄扫描无命中；宽泛安全关键词扫描仅命中禁止性说明、历史进度和本轮安全边界说明，未发现真实配置读取、真实配置修改、真实服务扫描、真实管理接口连接、扫描器、弱口令测试或可复用利用流程。

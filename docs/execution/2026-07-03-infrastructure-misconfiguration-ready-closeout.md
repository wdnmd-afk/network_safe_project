# 配置错误 simulation ready 收口执行文档

## 1. 目标

本轮目标是在 `infrastructure/misconfiguration` 已完成标准目录、元数据、前端固定配置审计工作台、后端受控 `audit` API、统一事件日志安全摘要、服务端 API 差异测试、Playwright 页面级差异验证和本机只读一致性验证脚本之后，按主计划完成 simulation ready 收口审计。

若审计证据完整，则将 `labs/infrastructure/misconfiguration/meta.json` 从 `in-progress` 推进到 `ready`，并同步只读验证脚本、共享元数据测试、服务端目录测试、场景文档、主进度和下一波实验规划。

本轮仍不创建 `exploit.py`，不读取真实配置，不修改真实 nginx、MySQL、Node、Windows 服务、系统防火墙、代理、hosts、证书或云账号配置，不扫描本机端口、局域网、外部 IP、域名、云资源或服务指纹，不连接真实管理接口，不发起真实基础设施探测请求。

## 2. 范围

本轮新增：

- `docs/execution/2026-07-03-infrastructure-misconfiguration-ready-closeout.md`

本轮可能同步：

- `labs/infrastructure/misconfiguration/meta.json`
- `tools/lab-scripts/infrastructure/misconfiguration/verify.ts`
- `packages/shared/tests/lab-metadata.test.mjs`
- `apps/server/tests/health.test.ts`
- `apps/server/tests/lab-registry.test.ts`
- `labs/infrastructure/misconfiguration/README.md`
- `labs/infrastructure/misconfiguration/vuln/README.md`
- `labs/infrastructure/misconfiguration/fixed/README.md`
- `labs/infrastructure/misconfiguration/mock/README.md`
- `labs/infrastructure/misconfiguration/docs/attack-steps.md`
- `labs/infrastructure/misconfiguration/docs/fix-notes.md`
- `labs/infrastructure/misconfiguration/docs/manual-verification.md`
- `tools/lab-scripts/infrastructure/misconfiguration/README.md`
- `docs/design/next-wave-security-labs.md`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`

本轮不包含：

- 不新增真实配置文件、真实配置读取、配置修改、部署、重载、回滚或系统命令能力。
- 不新增任意配置文本、主机、IP、域名、端口、URL、路径、账号、密码、token、Cookie、证书、上传、下载、扫描或连接入口。
- 不新增数据库迁移或前后端业务字段。
- 不把 Playwright、API 测试或只读验证脚本标记为攻击脚本自动化。

## 3. 操作步骤

1. 对照主计划完成标准审计配置错误当前证据。
2. 确认漏洞版可运行：前端配置风险观察版页面、后端 `vuln/audit` 和服务端 API 测试均覆盖固定调试入口、目录索引、过宽 CORS、公开管理状态页、详细错误信息和默认凭据提示样例。
3. 确认修复版可运行：前端配置审计复盘版页面、后端 `fixed/audit` 和服务端 API 测试均覆盖最小暴露面、管理入口认证、严格 CORS 和安全错误信息策略。
4. 确认攻击方观察路径清晰：文档和页面展示固定配置样例下的可见风险信号，但不提供真实扫描、弱口令测试、服务枚举或管理接口连接流程。
5. 确认防御方阻断路径清晰：文档和页面展示默认关闭、认证授权、来源限制、CORS 收敛、错误信息分层和配置审计清单。
6. 确认后端统一事件日志只记录固定 key、暴露面类别、风险标签、审计动作和学习信号，不保存完整配置、真实路径、真实服务地址、真实凭据或真实端口清单。
7. 确认元数据入口、文档入口、web 入口、api 入口、scripts 入口和自动化证据一致。
8. 确认 Playwright 覆盖漏洞版 / 修复版页面差异，并断言页面没有文本输入框。
9. 确认只读验证脚本能校验 `ready` 状态、安全边界和不提供 `exploit.py`。
10. 若以上证据完整，则更新元数据状态为 `ready`，并补充 ready 状态边界说明。
11. 同步文档、共享测试、服务端目录测试、规划和主进度记录。
12. 运行最小必要验证并记录结果。

## 4. 实施建议

- 只把 `ready` 理解为本项目内固定配置样例学习闭环完成，不代表具备真实配置审计、真实扫描、真实服务连接或攻击脚本能力。
- `entrypoints.scripts` 继续只登记 `verify.ts`，该脚本只读仓库文件，不发起 HTTP 请求，不读取 `.env` 或真实配置，不扫描或连接真实基础设施。
- `variants[].supportsAutomation` 必须继续保持 `false`，避免把 Playwright、服务端 API 测试或只读脚本误标为攻击脚本自动化。
- 共享元数据测试应断言 `status: "ready"`、只读脚本入口、Playwright / API / 只读脚本三类自动化证据、安全边界和 `notes` 中的 ready 收口说明。
- 文档中需要把“下一步 ready 收口审计”改为“已完成 ready 收口审计”，同时保留禁止 `exploit.py`、真实配置读取、真实配置修改、真实服务扫描、真实管理接口连接和弱口令测试的边界。

## 5. 潜在风险

- 如果只因测试通过就标记 `ready`，可能漏掉文档、安全边界或入口一致性缺口。
- 如果把只读脚本误写成请求脚本，会让配置错误实验变成真实配置审计器或基础设施探测器。
- 如果文档只强调攻击方视角而弱化固定样例边界，可能被误解为对真实服务的扫描或枚举指导。
- 如果日志保存完整配置、真实主机、端口、路径、凭据、token 或 Cookie，会违背平台日志安全摘要规则。
- 如果 `ready` 文案未解释安全边界，后续扩展时可能错误加入真实配置读取、配置修改、服务重载、弱口令测试或真实管理接口连接能力。

## 6. 优化方案

- 通过 ready 收口审计把完成标准逐项固化到文档和元数据中。
- 让只读验证脚本从 `in-progress` 断言切换为 `ready` 断言，防止后续状态和验证逻辑脱节。
- 在主进度、下一波规划和场景文档中同步 ready 证据，减少后续继续任务时的歧义。
- 保留后续扩展口径：若未来要加入更多基础设施案例或新的验证方式，必须另写执行文档并重新评估安全边界。

## 7. 验证方式

本轮最小必要验证：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/infrastructure/misconfiguration/verify.ts`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/testing test`
- `pnpm --filter @network-safe/testing e2e -- --grep "配置错误"`
- `pnpm --filter @network-safe/web exec vitest run tests/misconfiguration-api.test.ts tests/misconfiguration-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/server test -- tests/misconfiguration-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- 配置错误安全关键词扫描，确认未新增真实配置读取、真实配置修改、真实服务扫描、真实管理接口连接、命令执行、弱口令测试、服务枚举、自由输入控件或攻击脚本实现。

本轮实际验证结果：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/infrastructure/misconfiguration/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，33 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/misconfiguration-api.test.ts tests/misconfiguration-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、10 项测试通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/testing e2e -- --grep "配置错误"` 通过，1 项 Playwright 测试通过。
- `pnpm --filter @network-safe/server test -- tests/misconfiguration-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，203 项通过。
- `git diff --check` 通过，仅提示工作区 LF 后续会按 Git 设置转换为 CRLF，无格式错误。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中，目标文件未发现尾随空白。
- `rg --files tools/lab-scripts/infrastructure/misconfiguration` 输出仅包含 `README.md` 和 `verify.ts`，未发现 `exploit.py`。
- 配置错误实现文件安全关键词扫描无命中，未发现真实配置读取、真实服务扫描、真实管理接口连接、命令执行、自由输入控件、真实主机 / 端口 / 凭据字段或外部 URL 能力。
- 配置错误当前状态回扫无旧 `in-progress` 状态命中；剩余 `in-progress` 命中仅为共享状态枚举和其他场景历史记录。

## 8. 本轮完成条件

- 主计划完成标准对 `infrastructure/misconfiguration` 均有明确证据。
- `labs/infrastructure/misconfiguration/meta.json` 状态更新为 `ready`，并说明 ready 只代表本项目内固定样例学习闭环完成。
- 只读验证脚本校验 ready 状态并输出 `ok: true`。
- 共享元数据测试、服务端目录测试、场景文档、脚本目录说明、主进度和下一波规划均同步 ready 状态。
- `variants[].supportsAutomation` 仍为 `false`。
- 最小必要验证通过后再提交。

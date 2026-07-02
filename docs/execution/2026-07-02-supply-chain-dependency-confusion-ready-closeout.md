# 依赖混淆 simulation ready 收口执行文档

## 1. 目标

本轮目标是在 `supply-chain/dependency-confusion` 已完成标准目录、元数据、前端固定选择器工作台、后端受控 `resolve` API、统一事件日志安全摘要、服务端 API 差异测试、Playwright 页面级差异验证和本机只读一致性验证脚本之后，按主计划完成标准做 ready 收口审计。

若审计证据完整，则将 `labs/supply-chain/dependency-confusion/meta.json` 从 `in-progress` 推进到 `ready`，并同步只读验证脚本、共享元数据测试、服务端目录测试、场景文档、主进度和下一波实验规划。

本轮仍不创建 `exploit.py`，不运行真实依赖安装、登录、下载、打包或发布命令，不访问真实 npm、pnpm、PyPI、Maven、私有 registry 或镜像源，不读取 `.npmrc`、`.yarnrc`、`.pypirc`、环境变量 token、registry 凭据、CI 凭据或真实依赖缓存，不生成真实投毒包、包归档、发布脚本或生命周期脚本。

## 2. 范围

本轮新增：

- `docs/execution/2026-07-02-supply-chain-dependency-confusion-ready-closeout.md`

本轮可能同步：

- `labs/supply-chain/dependency-confusion/meta.json`
- `tools/lab-scripts/supply-chain/dependency-confusion/verify.ts`
- `packages/shared/tests/lab-metadata.test.mjs`
- `apps/server/tests/health.test.ts`
- `apps/server/tests/lab-registry.test.ts`
- `apps/web/src/views/DependencyConfusionLabView.vue`
- `labs/supply-chain/dependency-confusion/README.md`
- `labs/supply-chain/dependency-confusion/vuln/README.md`
- `labs/supply-chain/dependency-confusion/fixed/README.md`
- `labs/supply-chain/dependency-confusion/docs/attack-steps.md`
- `labs/supply-chain/dependency-confusion/docs/fix-notes.md`
- `labs/supply-chain/dependency-confusion/docs/manual-verification.md`
- `tools/lab-scripts/supply-chain/dependency-confusion/README.md`
- `docs/design/next-wave-security-labs.md`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`

## 3. 操作步骤

1. 对照主计划完成标准审计依赖混淆当前证据。
2. 确认漏洞版可运行：前端解析风险观察版页面、后端 `vuln/resolve` 和服务端 API 测试均覆盖固定公共同名碰撞样例。
3. 确认修复版可运行：前端来源审计复盘版页面、后端 `fixed/resolve` 和服务端 API 测试均覆盖私有 scope 固定、完整性阻断和正常公开依赖审计放行。
4. 确认攻击方观察路径清晰：文档和页面展示固定 manifest、固定伪 registry 场景、错误来源选择和 scope 缺失信号，但不提供真实投毒流程。
5. 确认防御方阻断路径清晰：文档和页面展示 scope 绑定、来源审计、lockfile 完整性审计和阻断动作。
6. 确认后端统一事件日志只记录固定 key、来源类别、风险标签、审计动作和学习信号，不保存完整 manifest、真实包名、真实 registry 地址、`.npmrc`、token、Cookie、凭据、内部组织名或本机路径。
7. 确认元数据入口、文档入口、web 入口、api 入口、scripts 入口和自动化证据一致。
8. 确认 Playwright 覆盖漏洞版 / 修复版页面差异，并断言页面没有文本输入框。
9. 确认只读验证脚本能校验 `ready` 状态、安全边界和不提供 `exploit.py`。
10. 确认页面状态文案不再误称脚本入口不存在，而是说明只读验证脚本已登记。
11. 若以上证据完整，则更新元数据状态为 `ready`，并补充 ready 状态边界说明。
12. 同步文档、共享测试、服务端目录测试、规划和主进度记录。
13. 运行最小必要验证并记录结果。

## 4. 实施建议

- 只把 `ready` 理解为本项目内固定样例学习闭环完成，不代表具备真实供应链攻击、真实依赖解析或真实包生态连接能力。
- `entrypoints.scripts` 继续只登记 `verify.ts`，该脚本只读仓库文件，不发起 HTTP 请求，不读取 `.env`，不安装依赖，不连接 registry。
- `variants[].supportsAutomation` 必须继续保持 `false`，避免把 Playwright、服务端 API 测试或只读脚本误标为攻击脚本自动化。
- 共享元数据测试应断言 `status: "ready"`、只读脚本入口、Playwright / API / 只读脚本三类自动化证据、安全边界和 `notes` 中的 ready 收口说明。
- 文档中需要把“下一步 ready 收口审计”改为“已完成 ready 收口审计”，同时保留禁止 `exploit.py`、真实安装、真实发布、registry 连接、凭据读取和生命周期脚本的边界。

## 5. 潜在风险

- 如果只因测试通过就标记 `ready`，可能漏掉文档、安全边界或入口一致性缺口。
- 如果把只读脚本误写成请求脚本，会让依赖混淆实验变成真实依赖解析器或 registry 探测器。
- 如果文档只强调攻击方视角而弱化固定样例边界，可能被误解为对外供应链攻击指导。
- 如果日志保存完整 manifest、真实包名、registry 地址、token 或凭据，会违背平台日志安全摘要规则。
- 如果 `ready` 文案未解释安全边界，后续扩展时可能错误加入安装器、发布器、生命周期脚本或真实 registry 连接。

## 6. 优化方案

- 通过 ready 收口审计把完成标准逐项固化到文档和元数据中。
- 让只读验证脚本从 `in-progress` 断言切换为 `ready` 断言，防止后续状态和验证逻辑脱节。
- 在主进度、下一波规划和场景文档中同步 ready 证据，减少后续继续任务时的歧义。
- 保留后续扩展口径：若未来要加入更多供应链案例或新的验证方式，必须另写执行文档并重新评估安全边界。

## 7. 验证方式

本轮最小必要验证：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/supply-chain/dependency-confusion/verify.ts`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/testing test`
- `pnpm --filter @network-safe/testing e2e -- --grep "依赖混淆"`
- `pnpm --filter @network-safe/web exec vitest run tests/dependency-confusion-api.test.ts tests/dependency-confusion-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/server test -- tests/dependency-confusion-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- 依赖混淆安全关键词扫描，确认未新增真实安装、真实发布、registry 连接、凭据读取、生命周期脚本、包归档、命令执行、任意包名输入或攻击脚本实现。

本轮实际验证结果：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/supply-chain/dependency-confusion/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，32 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/dependency-confusion-api.test.ts tests/dependency-confusion-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/dependency-confusion-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，195 项通过。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/testing e2e -- --grep "依赖混淆"` 通过，1 项 Playwright 测试通过。
- `git diff --check` 通过，仅提示工作区 LF 后续会按 Git 设置转换为 CRLF，无格式错误。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中，目标文件未发现尾随空白。
- `rg --files tools/lab-scripts/supply-chain/dependency-confusion` 输出仅包含 `README.md` 和 `verify.ts`，未发现 `exploit.py`。
- 依赖混淆实现文件安全关键词扫描无命中，未发现真实安装、真实发布、registry URL、任意包名输入、命令执行、文本输入框、生命周期脚本或包归档能力。
- 文档和脚本目录安全关键词宽扫描仅命中禁止性说明、固定字段、验证脚本反向检查片段和安全边界说明，未发现本轮新增真实攻击能力。

## 8. 本轮完成条件

- 主计划完成标准对 `supply-chain/dependency-confusion` 均有明确证据。
- `labs/supply-chain/dependency-confusion/meta.json` 状态更新为 `ready`，并说明 ready 只代表本项目内固定样例学习闭环完成。
- 只读验证脚本校验 ready 状态并输出 `ok: true`。
- 共享元数据测试、服务端目录测试、场景文档、脚本目录说明、主进度和下一波规划均同步 ready 状态。
- `variants[].supportsAutomation` 仍为 `false`。
- 最小必要验证通过后再提交。

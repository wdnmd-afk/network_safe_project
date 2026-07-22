# 捕鲸攻击只读一致性验证执行文档

## 1. 目标

本轮目标是在 `social/whaling` 已具备前端固定案例工作台、后端受控 review API 和 Playwright 页面差异验证的基础上，新增本机只读一致性验证脚本，检查元数据、文档、前端、后端、测试和安全边界是否保持一致。

本轮只实现 `tools/lab-scripts/social/whaling/verify.ts` 只读验证入口、元数据登记、文档同步和测试同步。不实现 `exploit.py`、真实高管画像采集、真实组织结构收集、真实投递、凭据收集、模板生成、会议邀请、付款指令、第三方平台连接或攻击脚本能力。

## 2. 范围

本轮新增：

- `tools/lab-scripts/social/whaling/verify.ts`
- `docs/execution/2026-07-09-social-whaling-readonly-verification.md`

本轮修改：

- `tools/lab-scripts/social/whaling/README.md`
- `labs/social/whaling/meta.json`
- `packages/shared/tests/lab-metadata.test.mjs`
- `labs/social/whaling/README.md`
- `labs/social/whaling/docs/manual-verification.md`
- `docs/design/next-wave-security-labs.md`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`

本轮不修改：

- 后端 API 行为
- 前端页面行为
- 数据库结构
- Playwright 用例逻辑
- `tools/lab-scripts/social/whaling/exploit.py`

## 3. 操作步骤

1. 参考 `tools/lab-scripts/social/spear-phishing/verify.ts` 的本机只读验证结构。
2. 新增 `tools/lab-scripts/social/whaling/verify.ts`，只读取仓库内文件并输出 JSON 报告。
3. 校验 `labs/social/whaling/meta.json` 可解析、通过共享元数据结构校验、状态仍为 `in-progress`、模式仍为 `case-study`。
4. 校验 web、api、docs、scripts 入口与当前阶段一致。
5. 校验 Playwright、服务端 API 测试和脚本验证证据存在，但 `variants[].supportsAutomation` 仍为 `false`。
6. 校验固定 `caseKey`、固定 `verificationPolicyKey`、固定学习信号、前端请求体、服务端路由、事件日志安全摘要和页面差异验证证据。
7. 校验不存在 `exploit.py`，且实现文件没有真实投递、外部平台连接、自由正文输入、画像采集或模板生成能力。
8. 更新元数据 scripts 入口与 `verification.automation.scriptVerification`。
9. 同步 README、手动验证、共享元数据测试、TODO、下一波规划和主目标文档。

## 4. 实施建议

- 脚本只能使用 `readFileSync`、`existsSync` 等本地文件读取能力。
- 脚本不得发起 HTTP 请求，不得读取 `.env`、Cookie、token、验证码、凭据、付款信息、真实人员资料或真实业务材料。
- 脚本报告使用稳定 key，便于后续自动化读取。
- `entrypoints.scripts` 只登记 `whaling-verify`，不得登记 `exploit.py` 或投递脚本。
- `variants[].supportsAutomation` 继续保持 `false`，避免把只读验证误标为攻击自动化。

## 5. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 只读脚本误发 HTTP 请求 | 可能偏离本机只读边界 | 脚本不导入网络库，不使用 fetch/http/axios |
| 脚本读取敏感环境文件 | 可能触碰真实凭据 | 只读取白名单仓库文件，不读取 `.env`、Cookie、token |
| 元数据误登记为攻击自动化 | 可能突破 case-study 边界 | 只登记 scriptVerification，`variants[].supportsAutomation` 仍为 `false` |
| 脚本检查过宽 | 不能证明一致性 | 同时校验元数据、文档、前端、后端、测试和安全边界 |

## 6. 优化方案

- 后续 ready 收口前，可让只读脚本增加 ready 审计项，但必须单独写执行文档。
- 后续若 whaling 进入 ready，应继续保持 case-study ready 语义，只代表本项目内固定案例学习闭环完成。

## 7. 验证方式

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/social/whaling/verify.ts`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/testing test`
- `pnpm --filter @network-safe/testing e2e -- --grep "捕鲸攻击"`
- `pnpm --filter @network-safe/web exec vitest run tests/whaling-api.test.ts tests/whaling-lab.test.ts tests/router.test.ts`
- `git diff --check`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- `Test-Path tools/lab-scripts/social/whaling/exploit.py`
- 安全关键词扫描，确认真实投递、画像采集、凭据收集、模板生成、第三方平台调用、会议邀请、付款指令和攻击脚本相关命中均为禁止性说明、测试反向断言或安全边界说明。

## 8. 完成条件

- `tools/lab-scripts/social/whaling/verify.ts` 只读取仓库内文件并输出 JSON 一致性报告。
- 元数据 scripts 入口只登记 `whaling-verify`。
- `verification.automation.scriptVerification.scriptKeys` 只包含 `whaling-verify`。
- `entrypoints.web`、`entrypoints.api`、Playwright 证据、API 测试证据和文档入口保持一致。
- `variants[].supportsAutomation` 仍为 `false`。
- `exploit.py` 不存在。
- 最小必要验证通过。

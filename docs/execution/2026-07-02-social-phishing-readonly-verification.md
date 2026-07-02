# 网络钓鱼识别只读一致性验证执行文档

## 1. 目标

本轮目标是在 `social/phishing` 已具备后端固定案例 `review` API 和前端仿真收件箱工作台的基础上，补齐本机只读一致性验证脚本。

该脚本只读取仓库内元数据、文档、前端和后端实现文件，用于确认网络钓鱼识别实验的入口、自动化证据、固定 key 边界和禁止能力保持一致。本轮不创建 `exploit.py`，不发送真实邮件，不连接第三方平台，不收集凭据，不生成可投递模板，也不将实验标记为 `ready`。

## 2. 范围

本轮新增：

- `tools/lab-scripts/social/phishing/verify.ts`
- `docs/execution/2026-07-02-social-phishing-readonly-verification.md`

本轮同步：

- `tools/lab-scripts/social/phishing/README.md`
- `labs/social/phishing/meta.json`
- `labs/social/phishing/README.md`
- `labs/social/phishing/docs/attack-steps.md`
- `labs/social/phishing/docs/fix-notes.md`
- `labs/social/phishing/docs/manual-verification.md`
- `packages/shared/tests/lab-metadata.test.mjs`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

## 3. 操作步骤

1. 新增 `verify.ts`，读取 `labs/social/phishing/meta.json` 并调用共享元数据解析与校验函数。
2. 校验元数据保持 `social.phishing` / `case-study` / `in-progress`。
3. 校验 web 入口只包含误判观察版和识别复盘版工作台。
4. 校验 API 入口只包含漏洞版和修复版 `review` 接口。
5. 校验 scripts 入口只登记 `phishing-verify` 这一只读一致性验证脚本。
6. 校验自动化证据包含服务端 API 测试和只读脚本验证，Playwright 页面验证仍保持未启用。
7. 校验标准文档和脚本说明存在，并持续声明固定线索卡、固定 key、无真实投递、无凭据收集、无第三方平台连接、无模板生成和无 `exploit.py` 边界。
8. 扫描网络钓鱼相关实现文件，确认没有引入邮件发送库、第三方消息平台、外部 URL、任意邮件正文输入、凭据收集或模板生成能力。
9. 更新元数据、共享测试和场景文档。
10. 运行最小必要验证与安全扫描。

## 4. 实施建议

- 复用 `tools/lab-scripts/ai/prompt-injection/verify.ts` 的报告结构和只读检查方式。
- 脚本输出 JSON 报告，失败时设置 `process.exitCode = 1`，便于后续人工和 CI 复用。
- 脚本只读取仓库内固定文件，不发起 HTTP 请求，不读取 `.env`，不调用邮件、短信、社交、收件箱或第三方投递服务。
- `entrypoints.scripts` 只登记 `verify.ts`，仍不得创建 `exploit.py` 或攻击脚本。
- `variants[].supportsAutomation` 继续保持 `false`，表示当前 case-study 不提供攻击脚本自动化。

## 5. 潜在风险

- 如果脚本发起 API 请求、邮件请求或第三方平台请求，会被误解为网络钓鱼验证器，突破当前 case-study 边界。
- 如果脚本接收任意邮箱、正文、链接、附件、凭据、模板或外部目标，会把只读验证变成危险入口。
- 如果元数据提前标记 `ready`，会跳过最终完成标准审计。
- 如果只校验文档存在而不校验实现片段，无法发现后续误加邮件发送、凭据收集或模板生成能力。
- 如果 scripts 入口登记多个脚本，后续自动化可能误认为存在攻击脚本或投递脚本。

## 6. 优化方案

- 本轮只补齐只读一致性验证，保持 `status: "in-progress"`。
- 脚本同时检查元数据、文档、前端、后端和测试证据，形成跨层一致性证据。
- 后续 ready 收口审计可以复用该脚本作为自动化证据之一，但不得仅因脚本存在就标记完成。

## 7. 验证方式

本轮最小必要验证：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/social/phishing/verify.ts`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/web exec vitest run tests/phishing-api.test.ts tests/phishing-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/server test -- tests/phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- 网络钓鱼安全关键词扫描，确认未新增真实邮件发送、短信 / 社交投递、凭据收集、可投递模板生成、第三方平台调用或攻击脚本实现。

本轮实际验证结果：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/social/phishing/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，31 项测试通过。
- `pnpm --filter @network-safe/web exec vitest run tests/phishing-api.test.ts tests/phishing-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、9 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过，实际执行服务端测试 186 项通过。
- `git diff --check` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- 网络钓鱼安全关键词扫描仅命中禁止性说明、脚本检查片段、测试反向断言、`local-session-token`、API client `token` 参数、学习信号 `credential-request` 和历史记录，未发现真实投递、凭据收集、模板生成或第三方平台调用实现。

## 8. 本轮完成条件

- 只读验证脚本能输出 `ok: true`。
- 元数据登记 `phishing-verify` 只读脚本入口和 `scriptVerification` 自动化证据。
- 场景文档说明当前已有只读一致性验证脚本，但仍不提供 `exploit.py`、真实投递、凭据收集、模板生成或第三方平台调用。
- 共享元数据测试覆盖网络钓鱼识别脚本入口和自动化证据。
- 主进度文档和下一波实验规划同步到只读验证状态。
- 最小必要验证通过后再提交。

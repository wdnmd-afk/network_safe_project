# 网络钓鱼识别手动验证

## 1. 当前验证目标

当前切片验证前端固定案例工作台、后端固定案例 API、本机只读一致性验证脚本、元数据、文档入口和安全边界是否一致，并确认 case-study ready 只代表本项目内固定案例学习闭环完成。

## 2. 元数据检查

确认 `labs/social/phishing/meta.json` 满足：

- `id` 为 `social.phishing`。
- `category` 为 `social`。
- `subcategory` 为 `phishing`。
- `mode` 为 `case-study`。
- `status` 为 `ready`。
- `entrypoints.web` 包含 `/labs/social/phishing/vuln` 和 `/labs/social/phishing/fixed`。
- `entrypoints.scripts` 只包含 `tools/lab-scripts/social/phishing/verify.ts`。
- `entrypoints.api` 包含 `/api/labs/social/phishing/vuln/review` 和 `/api/labs/social/phishing/fixed/review`。
- `entrypoints.docs` 指向真实存在的文档。
- `verification.manual.supported` 为 `true`。
- `verification.automation.supported` 为 `true`。
- `verification.automation.apiTest.specPath` 为 `apps/server/tests/phishing-lab.test.ts`。
- `verification.automation.playwright.enabled` 为 `false`。
- `verification.automation.scriptVerification.scriptKeys` 为 `["phishing-verify"]`。
- 两个 `variants[].supportsAutomation` 均为 `false`。
- `safeBoundaries` 至少包含同时说明 `case-study` 和 `ready` 的边界。
- `notes` 说明当前不提供 `exploit.py` 或攻击脚本，并包含只读一致性验证证据。

## 3. 文档检查

确认以下文件存在：

- `labs/social/phishing/README.md`
- `labs/social/phishing/vuln/README.md`
- `labs/social/phishing/fixed/README.md`
- `labs/social/phishing/mock/README.md`
- `labs/social/phishing/docs/attack-steps.md`
- `labs/social/phishing/docs/fix-notes.md`
- `labs/social/phishing/docs/manual-verification.md`
- `tools/lab-scripts/social/phishing/README.md`
- `tools/lab-scripts/social/phishing/verify.ts`

## 4. 边界检查

确认当前不存在：

- `tools/lab-scripts/social/phishing/exploit.py`
- 邮件发送、短信发送、消息投递、凭据收集或模板生成代码。

确认当前只读脚本：

- 只读取仓库内元数据、文档、前端、后端和测试文件。
- 不发起 HTTP 请求。
- 不发送真实邮件、短信或消息。
- 不连接第三方平台或收件箱服务。
- 不读取 `.env`、Cookie、token、验证码或凭据。

确认当前前端页面：

- 只通过固定选择器提交 `caseKey`、`reviewModeKey` 和 `defenseChecklistKey`。
- 不提供任意邮件正文、真实邮箱、真实链接、真实附件、验证码、Cookie、token 或凭据输入。
- 漏洞版和修复版页面均可从路由访问。

确认当前后端 API：

- 只读取 `caseKey`、`reviewModeKey` 和 `defenseChecklistKey`。
- 未知 key 返回阻断结果，并且不回显原始未知输入。
- 事件日志只记录固定 key、风险标签、建议动作和学习信号。

## 5. 建议命令

```bash
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/social/phishing/verify.ts
pnpm --filter @network-safe/web exec vitest run tests/phishing-api.test.ts tests/phishing-lab.test.ts tests/router.test.ts
pnpm --filter @network-safe/shared test
pnpm --filter @network-safe/server test -- tests/phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts
git diff --check -- labs/social/phishing tools/lab-scripts/social/phishing packages/shared/tests/lab-metadata.test.mjs docs/execution/2026-07-02-social-phishing-ready-closeout.md docs/TODO.md docs/design/next-wave-security-labs.md docs/execution/security-lab-master-goal.md
rg -n "[ \t]+$" -- labs/social/phishing tools/lab-scripts/social/phishing packages/shared/tests/lab-metadata.test.mjs docs/execution/2026-07-02-social-phishing-ready-closeout.md docs/TODO.md docs/design/next-wave-security-labs.md docs/execution/security-lab-master-goal.md
```

## 6. 通过标准

- 共享元数据校验通过。
- 服务端实验索引能扫描到 `social.phishing`，状态为 `ready`。
- 前端路由包含漏洞版 / 修复版工作台入口。
- 前端测试覆盖 API client 只发送固定 key、实验模型和路由入口。
- 服务端 API 测试覆盖漏洞版误判、修复版阻断、安全消息放行和未知 key 边界。
- 只读一致性验证脚本输出 `ok: true`。
- ready 证据明确来自服务端 API 差异测试和只读一致性验证，不把 `variants[].supportsAutomation` 标为攻击脚本自动化。
- 安全关键词扫描只命中禁止性说明、边界约束或字段名。
- 当前目录中没有攻击脚本、真实投递能力、凭据收集能力或第三方平台调用。

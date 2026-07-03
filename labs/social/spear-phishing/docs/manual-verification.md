# 鱼叉式钓鱼手动验证

## 1. 当前验证目标

当前切片验证 `social/spear-phishing` 前端固定案例工作台、后端固定案例 API、Playwright 页面差异验证、本机只读一致性验证、`in-progress` 元数据、文档入口、目录结构和安全边界是否一致。

本轮验证前端固定选择器、后端 API、Playwright 页面差异、本机只读一致性验证和事件日志安全摘要。只读脚本只读取仓库文件，不验证真实投递、真实画像采集、凭据收集、模板生成或第三方平台调用能力。

## 2. 元数据检查

确认 `labs/social/spear-phishing/meta.json` 满足：

- `id` 为 `social.spear-phishing`。
- `category` 为 `social`。
- `subcategory` 为 `spear-phishing`。
- `mode` 为 `case-study`。
- `status` 为 `in-progress`。
- `entrypoints.web` 包含 `/labs/social/spear-phishing/vuln` 和 `/labs/social/spear-phishing/fixed`。
- `entrypoints.api` 包含 `/api/labs/social/spear-phishing/vuln/review` 和 `/api/labs/social/spear-phishing/fixed/review`。
- `entrypoints.scripts` 只包含 `tools/lab-scripts/social/spear-phishing/verify.ts`。
- `entrypoints.docs` 只指向真实存在的文档入口，并包含 `labs/social/spear-phishing/docs/fixed-cases.md`。
- `verification.manual.supported` 为 `true`。
- `verification.manual.stepsDocPath` 为 `labs/social/spear-phishing/docs/manual-verification.md`。
- `verification.automation.supported` 为 `true`。
- `verification.automation.playwright.enabled` 为 `true`。
- `verification.automation.playwright.specPath` 为 `packages/testing/tests/e2e/platform.spec.mjs`。
- `verification.automation.apiTest.enabled` 为 `true`。
- `verification.automation.apiTest.specPath` 为 `apps/server/tests/spear-phishing-lab.test.ts`。
- `verification.automation.scriptVerification.enabled` 为 `true`。
- `verification.automation.scriptVerification.scriptKeys` 只包含 `spear-phishing-verify`。
- 两个 `variants[].supportsAutomation` 均为 `false`。
- `safeBoundaries` 明确不提供真实画像采集、真实投递、凭据收集、模板生成、第三方平台调用或攻击脚本。

## 3. 文档检查

确认以下文件存在：

- `labs/social/spear-phishing/README.md`
- `labs/social/spear-phishing/vuln/README.md`
- `labs/social/spear-phishing/fixed/README.md`
- `labs/social/spear-phishing/mock/README.md`
- `labs/social/spear-phishing/docs/fixed-cases.md`
- `labs/social/spear-phishing/docs/attack-steps.md`
- `labs/social/spear-phishing/docs/fix-notes.md`
- `labs/social/spear-phishing/docs/manual-verification.md`
- `tools/lab-scripts/social/spear-phishing/README.md`
- `tools/lab-scripts/social/spear-phishing/verify.ts`

## 4. 边界检查

确认当前不存在：

- `tools/lab-scripts/social/spear-phishing/exploit.py`
- 真实投递、画像采集、凭据收集、模板生成或第三方平台调用实现。

确认当前文档：

- 只使用固定虚构案例方向。
- 固定案例文档只包含案例 key、虚构角色标签、误判线索、防御动作和学习信号。
- 不提供完整邮件正文、完整 IM 对话、可复制标题、可投递附件名或真实链接。
- 不要求用户输入真实姓名、邮箱、手机号、公司、部门、职位、社交账号、组织关系或公开资料。
- 前端页面只提供固定 `caseKey` 和 `verificationPolicyKey` 选择器，不提供任意正文、真实人员、真实邮箱、真实链接、附件、凭据或投递参数输入。
- Playwright 页面差异验证只登录本机演示账号、访问固定漏洞版 / 修复版路由、点击固定按钮，并断言页面无文本输入框。
- 后端 API 只读取固定 `caseKey` 和 `verificationPolicyKey`，未知 key 被阻断且不回显原始输入。
- 事件日志只保存固定 key、风险类别、决策、建议动作和学习信号。
- `verify.ts` 只读取仓库内元数据、文档、前端、后端和测试文件，不发起 HTTP 请求，不读取 `.env`、Cookie、token、验证码、凭据、付款信息或真实业务材料。

## 5. 建议命令

```bash
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/social/spear-phishing/verify.ts
pnpm --filter @network-safe/testing e2e -- --grep "鱼叉式钓鱼"
pnpm --filter @network-safe/testing test
pnpm --filter @network-safe/web exec vitest run tests/spear-phishing-api.test.ts tests/spear-phishing-lab.test.ts tests/router.test.ts
pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit
pnpm --filter @network-safe/shared test
pnpm --filter @network-safe/server test -- tests/spear-phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts
git diff --check -- <本轮目标文件>
rg -n "[ \t]+$" -- <本轮目标文件>
rg --files labs/social/spear-phishing tools/lab-scripts/social/spear-phishing
```

## 6. 通过标准

- 共享元数据校验通过。
- 服务端实验索引能扫描到 `social.spear-phishing`，状态为 `in-progress`。
- 本地元数据总数同步更新。
- 元数据登记 docs、web、api 和只读 scripts 入口，Playwright 页面差异验证、API 测试和 scriptVerification 均已启用。
- 脚本目录只包含 README 和 `verify.ts`。
- 当前没有 `exploit.py`、真实投递、画像采集、凭据收集、模板生成或第三方平台调用能力。

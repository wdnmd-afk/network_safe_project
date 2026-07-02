# 网络钓鱼识别手动验证

## 1. 当前验证目标

当前切片验证前端固定案例工作台、后端固定案例 API、元数据、文档入口和安全边界是否一致，不验证脚本执行。

## 2. 元数据检查

确认 `labs/social/phishing/meta.json` 满足：

- `id` 为 `social.phishing`。
- `category` 为 `social`。
- `subcategory` 为 `phishing`。
- `mode` 为 `case-study`。
- `status` 为 `in-progress`。
- `entrypoints.web` 包含 `/labs/social/phishing/vuln` 和 `/labs/social/phishing/fixed`。
- `entrypoints.scripts` 为空数组。
- `entrypoints.api` 包含 `/api/labs/social/phishing/vuln/review` 和 `/api/labs/social/phishing/fixed/review`。
- `entrypoints.docs` 指向真实存在的文档。
- `verification.manual.supported` 为 `true`。
- `verification.automation.supported` 为 `true`。
- `verification.automation.apiTest.specPath` 为 `apps/server/tests/phishing-lab.test.ts`。
- 两个 `variants[].supportsAutomation` 均为 `false`。

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

## 4. 边界检查

确认当前不存在：

- `tools/lab-scripts/social/phishing/exploit.py`
- `tools/lab-scripts/social/phishing/verify.ts`
- 邮件发送、短信发送、消息投递、凭据收集或模板生成代码。

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
pnpm --filter @network-safe/web exec vitest run tests/phishing-api.test.ts tests/phishing-lab.test.ts tests/router.test.ts
pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit
pnpm --filter @network-safe/shared test
pnpm --filter @network-safe/server test -- tests/phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts
git diff --check -- apps/web/src/api/phishing-lab.ts apps/web/src/labs/phishing.ts apps/web/src/views/PhishingLabView.vue labs/social/phishing docs/execution/2026-07-02-social-phishing-frontend-workbench.md
rg -n "[ \t]+$" -- apps/web/src/api/phishing-lab.ts apps/web/src/labs/phishing.ts apps/web/src/views/PhishingLabView.vue labs/social/phishing docs/execution/2026-07-02-social-phishing-frontend-workbench.md
```

## 6. 通过标准

- 共享元数据校验通过。
- 服务端实验索引能扫描到 `social.phishing`，状态为 `in-progress`。
- 前端路由包含漏洞版 / 修复版工作台入口。
- 前端测试覆盖 API client 只发送固定 key、实验模型和路由入口。
- 服务端 API 测试覆盖漏洞版误判、修复版阻断、安全消息放行和未知 key 边界。
- 安全关键词扫描只命中禁止性说明、边界约束或字段名。
- 当前目录中没有攻击脚本、真实投递能力、凭据收集能力或第三方平台调用。

# 捕鲸攻击手动验证

## 验证目标

确认 `social.whaling` 当前为 case-study ready 前端固定案例工作台、Playwright 页面差异验证、本机只读一致性验证和后端受控 API 学习闭环，不提供攻击脚本、真实投递、画像采集、凭据收集、模板生成、第三方平台调用或攻击能力。

## 元数据验证

检查 `labs/social/whaling/meta.json`：

- `id` 为 `social.whaling`。
- `status` 为 `ready`。
- `mode` 为 `case-study`。
- `entrypoints.docs` 只登记真实存在的文档入口。
- `entrypoints.api` 只登记：
  - `/api/labs/social/whaling/vuln/review`
  - `/api/labs/social/whaling/fixed/review`
- `entrypoints.web` 只登记：
  - `/labs/social/whaling/vuln`
  - `/labs/social/whaling/fixed`
- `entrypoints.scripts` 只登记 `whaling-verify`：
  - `tools/lab-scripts/social/whaling/verify.ts`
- `verification.automation.supported` 为 `true`。
- `verification.automation.playwright.specPath` 为 `packages/testing/tests/e2e/platform.spec.mjs`。
- `verification.automation.apiTest.specPath` 为 `apps/server/tests/whaling-lab.test.ts`。
- `verification.automation.scriptVerification.scriptKeys` 只包含 `whaling-verify`。
- `variants[].supportsAutomation` 均为 `false`。
- `safeBoundaries` 明确当前页面只提供固定案例工作台，`verify.ts` 只作为本机只读一致性验证入口，不提供 `exploit.py` 或攻击脚本。

## 目录验证

确认以下文件存在：

- `labs/social/whaling/README.md`
- `labs/social/whaling/vuln/README.md`
- `labs/social/whaling/fixed/README.md`
- `labs/social/whaling/mock/README.md`
- `labs/social/whaling/docs/attack-steps.md`
- `labs/social/whaling/docs/fixed-cases.md`
- `labs/social/whaling/docs/fix-notes.md`
- `labs/social/whaling/docs/manual-verification.md`
- `tools/lab-scripts/social/whaling/README.md`
- `tools/lab-scripts/social/whaling/verify.ts`
- `apps/web/src/api/whaling-lab.ts`
- `apps/web/src/labs/whaling.ts`
- `apps/web/src/views/WhalingLabView.vue`
- `apps/web/tests/whaling-api.test.ts`
- `apps/web/tests/whaling-lab.test.ts`
- `packages/testing/tests/e2e/platform.spec.mjs`

确认 `labs/social/whaling/docs/fixed-cases.md` 只包含固定虚构案例卡、虚构角色标签、误判线索、防御动作和学习信号，不包含完整邮件正文、IM 对话、会议邀请模板、可复制标题、真实链接、付款指令或可投递素材。

确认以下文件不存在：

- `tools/lab-scripts/social/whaling/exploit.py`

## 前端验证

确认前端只提供以下固定页面：

- `/labs/social/whaling/vuln`
- `/labs/social/whaling/fixed`

页面只允许选择固定 `caseKey` 与固定 `verificationPolicyKey`，不得提供任意正文、真实人员、邮箱、链接、附件、付款信息、会议邀请、凭据或第三方平台参数输入。

## 页面差异验证

确认 `packages/testing/tests/e2e/platform.spec.mjs` 中的捕鲸攻击用例只执行以下行为：

- 登录本机 demo 用户。
- 访问 `/labs/social/whaling/vuln` 与 `/labs/social/whaling/fixed`。
- 断言页面没有文本输入框，并且只有固定选择器。
- 点击固定按钮“高层付款”“双人复核”和“观察核验结果”。
- 断言漏洞版 `accepted`、修复版 `blocked`、固定学习信号和固定风险标签。

## API 验证

确认服务端只提供以下受控 API：

- `POST /api/labs/social/whaling/vuln/review`
- `POST /api/labs/social/whaling/fixed/review`

请求体只应读取：

- `caseKey`
- `verificationPolicyKey`

额外传入的正文、邮箱、链接、人员、组织结构、付款账号、附件、凭据、token、会议邀请等字段不得出现在响应或事件日志摘要中。

## 只读一致性验证

确认 `tools/lab-scripts/social/whaling/verify.ts` 只读取仓库内元数据、文档、前端、后端和测试文件，并输出 JSON 一致性报告。

运行方式：

```bash
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/social/whaling/verify.ts
```

该脚本不得发起 HTTP 请求，不得连接网络，不得读取 `.env`、Cookie、token、验证码、凭据、付款信息、真实人员资料或真实业务材料。

## 安全边界验证

文档允许出现“投递、画像、凭据、模板、会议邀请、付款指令、脚本”等词，但必须只用于禁止性说明、边界说明或风险控制说明。

当前不应存在：

- `exploit.py`。
- 真实高管画像采集。
- 真实组织结构收集。
- 真实投递、凭据收集、模板生成、第三方平台调用或攻击脚本。

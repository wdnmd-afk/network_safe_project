# 网络钓鱼识别后端固定案例 API 执行文档

## 1. 目标

本轮目标是在 `social/phishing` planned 元数据基础上，新增后端固定案例评估服务和受控 API，将网络钓鱼识别实验从文档入口推进到后端 API 阶段。

本轮只实现固定案例评估 API 和统一事件日志安全摘要，不实现前端页面、数据库迁移、脚本、真实邮件发送、凭据收集、模板生成或第三方平台连接。

## 2. 范围

本轮新增：

- `apps/server/src/services/phishing-lab.ts`
- `apps/server/tests/phishing-lab.test.ts`

本轮修改：

- `apps/server/src/app.ts`
- `labs/social/phishing/meta.json`
- `labs/social/phishing/README.md`
- `labs/social/phishing/vuln/README.md`
- `labs/social/phishing/fixed/README.md`
- `labs/social/phishing/mock/README.md`
- `labs/social/phishing/docs/attack-steps.md`
- `labs/social/phishing/docs/fix-notes.md`
- `labs/social/phishing/docs/manual-verification.md`
- `packages/shared/tests/lab-metadata.test.mjs`
- `apps/server/tests/health.test.ts`
- `apps/server/tests/lab-registry.test.ts`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

## 3. 实施建议

- API 路径固定为 `POST /api/labs/social/phishing/:variant/review`。
- `variant` 只允许 `vuln` 或 `fixed`。
- 请求体只读取固定字段：
  - `caseKey`
  - `reviewModeKey`
  - `defenseChecklistKey`
- 服务层只允许固定案例 key、固定观察模式 key 和固定检查清单 key。
- 未知 key 返回阻断结果，并且响应中不得回显原始未知输入。
- 统一事件日志只记录固定 key、风险标签、风险数量、建议动作、是否命中固定案例和学习信号。
- `meta.json` 状态更新为 `in-progress`，只登记 docs 和 api 入口，不登记 web 或 scripts 入口。
- `variants[].supportsAutomation` 继续保持 `false`，避免把 API 测试误解为攻击脚本自动化。

## 4. 潜在风险

- 如果读取任意邮件正文、真实邮箱、真实链接或真实附件名，会突破 planned 阶段设定的安全边界。
- 如果响应中输出完整邮件模板、标题库或正文片段，可能被误用为可投递素材。
- 如果日志保存邮箱、链接、凭据、验证码、Cookie 或 token，会违反事件日志脱敏约束。
- 如果 API 连接邮件服务器、短信网关、收件箱或第三方平台，会把识别训练变成真实投递链路。

## 5. 优化方案

- 使用固定案例摘要、风险标签和建议动作替代完整邮件正文。
- 使用固定学习信号表达漏洞版误判和修复版阻断差异。
- 使用固定安全样例证明正常消息识别流程仍可用。
- 日志摘要中只保留 `caseKey`、`reviewModeKey`、`defenseChecklistKey`、`indicatorCount`、`riskIndicators`、`recommendedAction`、`matchedControlledCase` 和 `signal`。

## 6. 验证方式

- `pnpm --filter @network-safe/server test -- tests/phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `pnpm --filter @network-safe/shared test`
- `git diff --check`
- 行尾空白检查。
- 网络钓鱼安全关键词扫描，确认命中内容只属于禁止性说明、字段名、测试中的本地 URL、历史进度或学习信号。

## 7. 本轮完成条件

- 后端服务只处理固定案例 key，不读取任意邮件正文。
- API 需要登录，缺少登录返回 401。
- 漏洞版固定风险案例返回错误放行倾向和攻击方观察信号。
- 修复版固定风险案例返回阻断 / 举报 / 隔离建议。
- 固定安全案例在修复版保持可接受。
- 未知 key 被阻断且不回显原始输入。
- 事件日志只包含安全摘要，不包含真实邮箱、真实链接、凭据或任意邮件正文。
- 元数据、文档、共享测试、服务端测试和进度文档同步。

## 8. 验证记录

- `pnpm --filter @network-safe/shared test` 通过，31 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，186 项测试通过。
- `git diff --check` 未发现空白错误，仅有 Windows 下 LF 将转换为 CRLF 的提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 未发现目标文件行尾空白。
- 网络钓鱼安全关键词扫描仅命中禁止性说明、字段名 / 学习信号、既有认证与 JWT 代码、测试中的本地 `127.0.0.1` URL 和脱敏反向断言，未发现真实邮件发送、凭据收集、可投递模板包或第三方平台调用实现。

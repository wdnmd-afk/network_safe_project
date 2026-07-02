# 网络钓鱼识别目录与 planned 元数据执行文档

## 1. 目标

本轮目标是在 `docs/execution/2026-07-02-social-phishing-lab.md` 的约束下，建立 `social/phishing` 的标准实验目录、`planned` 元数据和基础文档入口。

本轮只建立文档和元数据入口，不实现页面、API、数据库写入、事件日志写入、邮件发送、凭据收集、模板生成或攻击脚本。

## 2. 范围

本轮新增：

- `labs/social/phishing/meta.json`
- `labs/social/phishing/README.md`
- `labs/social/phishing/vuln/README.md`
- `labs/social/phishing/fixed/README.md`
- `labs/social/phishing/mock/README.md`
- `labs/social/phishing/docs/attack-steps.md`
- `labs/social/phishing/docs/fix-notes.md`
- `labs/social/phishing/docs/manual-verification.md`
- `tools/lab-scripts/social/phishing/README.md`

本轮同步：

- `packages/shared/tests/lab-metadata.test.mjs`
- `apps/server/tests/health.test.ts`
- `apps/server/tests/lab-registry.test.ts`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

## 3. 实施建议

- 元数据状态保持 `planned`。
- 模式使用 `case-study`，表示首版只做固定案例识别训练。
- `entrypoints.docs` 只登记真实存在的文档入口。
- `entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 保持空数组。
- `verification.automation.supported` 保持 `false`。
- `variants[].supportsAutomation` 保持 `false`。
- 文档必须明确当前不发送真实邮件、不收集真实凭据、不连接第三方平台、不生成可投递模板包、不提供 `exploit.py`。

## 4. 潜在风险

- 如果登记未实现页面或 API，平台会误以为网络钓鱼识别实验已经可运行。
- 如果提供完整邮件正文、标题库或模板包，可能被误用为可投递素材。
- 如果提供发送、转发、群发、链接生成、附件上传或凭据输入能力，会突破本项目安全边界。
- 如果保存真实邮箱、凭据、验证码、Cookie 或 token，会违反日志与隐私约束。
- 如果创建 `exploit.py`，容易让案例化识别训练变成攻击脚本入口。

## 5. 优化方案

- 使用固定案例 key、风险标签、线索摘要和检查清单替代完整邮件模板。
- 使用“举报 / 隔离 / 二次确认 / 放行”固定动作替代真实投递流程。
- 后续 API 只接受固定 `caseKey`、`reviewModeKey` 和 `defenseChecklistKey`。
- 后续日志只记录案例 key、风险标签、建议动作和学习信号，不记录完整邮件内容或真实目标。
- 后续只读验证脚本只检查仓库内元数据、文档和边界，不连接外部服务。

## 6. 验证方式

- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check` 目标文件检查。
- 行尾空白检查。
- 网络钓鱼安全关键词扫描，确认命中内容只属于禁止性说明、边界约束、历史进度或字段 / 路径名。

## 7. 本轮完成条件

- `social/phishing` 标准目录和 planned 元数据存在。
- 元数据只登记 docs 入口，不登记 web、api 或 scripts 入口。
- README、漏洞版说明、修复版说明、mock 说明、攻击方观察步骤、修复说明和手动验证文档存在。
- 脚本目录只提供 README，不提供 `exploit.py` 或 `verify.ts`。
- 共享元数据测试和服务端索引测试同步新增场景总数与 planned 条目。
- 进度文档同步 `social/phishing` 已进入 planned 元数据阶段。

## 8. 本轮执行结果

本轮已完成目录与 planned 元数据切片：

- 新增 `labs/social/phishing/meta.json`，状态为 `planned`，模式为 `case-study`。
- 新增 README、误判观察版说明、识别复盘版说明、固定案例说明、攻击方观察步骤、修复说明和手动验证文档。
- 新增 `tools/lab-scripts/social/phishing/README.md`，当前只说明脚本边界，不提供 `exploit.py` 或 `verify.ts`。
- 元数据当前只登记 docs 入口，`entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 均为空数组。
- `verification.automation.supported` 为 `false`，`variants[].supportsAutomation` 均为 `false`。
- 更新共享元数据测试，确认网络钓鱼识别 planned/docs-only 元数据合法。
- 更新服务端 health / registry 测试，本地元数据总数从 22 增加到 23，并确认 `social.phishing` 为 planned 条目。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，31 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令实际运行服务端全量测试，178 项通过。
- `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 未发现目标文件行尾空白。
- 网络钓鱼识别安全关键词扫描仅命中禁止性说明、历史进度和本地 `127.0.0.1` 测试 URL，未发现真实邮件发送、凭据收集、可投递模板包或第三方平台调用实现。
- `rg --files tools/lab-scripts/social/phishing labs/social/phishing` 确认当前脚本目录只包含 README，场景目录只包含元数据和文档。

# 网络钓鱼识别实验执行文档

## 1. 目标

本轮目标是为下一项社会工程学实验 `social/phishing` 编写实现执行文档，锁定首版范围、安全边界、目录结构、后端 / 前端设计方向、日志摘要字段、验证方式和后续切片顺序。

`social/phishing` 首版定位为“仿真收件箱识别训练”：学习者从防御和识别视角观察固定邮件线索卡，判断相似域名、紧急语气、凭据请求、附件诱导和品牌仿冒等风险信号，并在修复版 / 防御视角中复盘检查步骤。

本实验不发送真实邮件、短信或链接，不收集真实凭据，不连接第三方邮件、短信、社交平台或钓鱼基础设施，不生成可投递邮件模板包，不提供攻击脚本。

## 2. 范围

本轮只新增执行文档：

- `docs/execution/2026-07-02-social-phishing-lab.md`

后续切片建议依次新增：

- `labs/social/phishing/` 标准目录
- `labs/social/phishing/meta.json`
- `labs/social/phishing/README.md`
- `labs/social/phishing/vuln/README.md`
- `labs/social/phishing/fixed/README.md`
- `labs/social/phishing/mock/README.md`
- `labs/social/phishing/docs/attack-steps.md`
- `labs/social/phishing/docs/fix-notes.md`
- `labs/social/phishing/docs/manual-verification.md`
- `tools/lab-scripts/social/phishing/README.md`

首版后续实现范围建议：

- 后端固定案例评估服务：`apps/server/src/services/phishing-lab.ts`
- 后端受控 API：`POST /api/labs/social/phishing/:variant/review`
- 前端 API client：`apps/web/src/api/phishing-lab.ts`
- 前端固定案例模型：`apps/web/src/labs/phishing.ts`
- 前端仿真收件箱工作台：`apps/web/src/views/PhishingLabView.vue`
- 路由：`/labs/social/phishing/vuln`、`/labs/social/phishing/fixed`
- 自动化测试：服务端 API 测试、前端模型 / API 测试、Playwright 页面差异验证、只读一致性验证脚本

## 3. 场景定位

建议元数据初始值：

- 实验 key：`social.phishing`
- 分类：`social`
- 子分类：`phishing`
- 模式：`case-study`
- 初始状态：`planned`
- 风险等级：`high`
- 难度：`beginner`

采用 `case-study` 的原因：

- 网络钓鱼涉及真实投递、仿冒、凭据诱导和外部目标风险。
- 本项目只做固定案例识别训练，不提供发送、采集、投递或模板生成能力。
- 后续若标记 `ready`，必须满足 case-study ready 例外标准。

## 4. 学习目标

攻击方视角只用于理解风险，不用于构造真实投递素材：

- 攻击者通常利用紧急语气、相似域名、品牌仿冒、附件诱导或凭据请求制造误判。
- 攻击者希望让用户忽略发件人、链接目标、附件类型、收件场景和异常请求。
- 学习者需要观察固定案例中哪些线索组合会提高风险。

防御方视角需要训练：

- 检查发件人显示名和实际域名是否一致。
- 检查链接展示文本和目标域名是否一致。
- 检查是否存在凭据、付款、下载、扫码或远程协助诱导。
- 检查附件类型和业务上下文是否匹配。
- 使用举报、隔离、二次确认和安全通道复核流程。

## 5. 固定案例模型

首版只允许固定案例 key，不接收任意邮件正文、真实邮箱、真实链接或附件文件。

建议固定案例：

- `invoice-urgent-review`：固定“发票复核”线索卡，只展示摘要、风险标签和识别点。
- `account-security-alert`：固定“账号安全提醒”线索卡，只展示摘要、域名差异和凭据请求风险。
- `hr-benefit-update`：固定“人事福利更新”线索卡，只展示业务上下文、附件诱导和安全确认点。

建议固定观察维度：

- `senderAlignment`：发件人显示名与域名一致性。
- `domainLookalike`：是否存在相似域名风险。
- `urgencySignal`：是否使用紧急语气。
- `credentialRequest`：是否请求凭据或一次性验证码。
- `attachmentRisk`：是否诱导下载或打开附件。
- `businessContext`：是否符合业务上下文。
- `recommendedAction`：举报、隔离、二次确认或放行。

## 6. 漏洞版设计

漏洞版不是钓鱼发送器，而是“容易误判的收件箱观察模式”：

- 页面展示固定邮件线索卡，但默认突出显示诱导性表面信息。
- 学习者可以点击固定案例，观察系统如何因为只看显示名、主题或紧急程度而给出错误放行倾向。
- 后端返回固定评估结果，例如 `decision: accepted`、`signal: phishing-lookalike-domain-overlooked`。
- 事件日志只记录案例 key、线索数量、命中风险标签、判定结果和学习信号。

禁止：

- 不展示完整可投递邮件正文。
- 不提供真实品牌素材、真实登录页、真实链接或附件。
- 不生成邮件标题库、正文模板库、群发脚本或投递参数。

## 7. 修复版设计

修复版作为“安全识别与举报复盘模式”：

- 页面展示同一固定案例，但引导学习者逐项检查风险线索。
- 后端根据固定案例和固定检查策略返回阻断、举报或二次确认建议。
- 固定安全案例可返回 `accepted`，用于证明正常邮件识别流程仍可用。
- 日志记录固定检查项完成情况、风险等级、建议动作和学习信号。

建议学习信号：

- `phishing-lookalike-domain-overlooked`
- `phishing-credential-request-visible`
- `phishing-attachment-risk-visible`
- `phishing-reporting-flow-applied`
- `phishing-safe-message-accepted`
- `phishing-case-boundary-verified`

## 8. 后端与日志设计

后端服务建议：

```text
apps/server/src/services/phishing-lab.ts
```

API 建议：

```text
POST /api/labs/social/phishing/:variant/review
```

请求体只允许：

- `caseKey`
- `reviewModeKey`
- `defenseChecklistKey`

禁止读取或保存：

- 任意邮件正文
- 真实邮箱地址
- 真实 URL
- 真实附件
- 真实凭据
- Cookie、token 或验证码
- 第三方平台账号信息

统一事件日志摘要建议：

- `caseKey`
- `reviewModeKey`
- `defenseChecklistKey`
- `indicatorCount`
- `riskIndicators`
- `recommendedAction`
- `matchedControlledCase`
- `signal`

不得记录完整邮件内容、真实邮箱、真实 URL、真实附件名、凭据或外部目标。

## 9. 前端设计

前端建议使用仿真收件箱工作台，但必须保持固定样例：

- 左侧固定案例列表。
- 中间固定线索卡摘要。
- 右侧检查清单和判定结果。
- 漏洞版突出“为什么容易误判”。
- 修复版突出“如何逐项检查和举报”。
- 展示最近事件复盘卡片，继续复用统一事件日志。

页面不得提供：

- 任意邮件正文输入框。
- 收件人、发件人或目标邮箱输入。
- URL、域名、附件上传或二维码输入。
- 发送、转发、群发、复制模板、下载模板按钮。
- 真实登录页或凭据输入框。

## 10. 脚本与验证边界

首版不创建 `exploit.py`。

后续脚本目录只允许：

- `README.md`：说明脚本边界。
- `verify.ts`：只读一致性验证脚本，校验元数据、文档、固定案例、前端、后端和测试入口。

`verify.ts` 不得：

- 发送邮件、短信或消息。
- 请求外部 URL。
- 调用第三方邮件、短信或社交平台 API。
- 生成钓鱼模板。
- 读取 `.env`、Cookie、token 或凭据。

## 11. 操作步骤

后续实施按以下切片推进：

1. 建立 `labs/social/phishing/` 标准目录和 planned 元数据，只登记 docs 入口。
2. 编写场景 README、漏洞版说明、修复版说明、mock 固定案例说明、攻击方观察步骤、修复说明和手动验证文档。
3. 建立后端固定案例评估服务和受控 `review` API，接入统一事件日志安全摘要。
4. 补齐服务端 API 测试，覆盖漏洞版误判、修复版举报 / 阻断、正常固定案例和未知 key 脱敏阻断。
5. 建立前端 API client、固定案例模型、仿真收件箱工作台和路由。
6. 补齐前端模型 / API / 路由测试。
7. 补齐 Playwright 页面差异验证，确认漏洞版 / 修复版差异和无任意输入框。
8. 补齐本机只读一致性验证脚本。
9. 按 case-study ready 标准做收口审计。

## 12. 潜在风险

- 如果输出完整邮件正文或标题库，可能被误用为可投递钓鱼素材。
- 如果提供发送、群发、链接生成或附件上传能力，会突破本项目安全边界。
- 如果收集真实邮箱、凭据、验证码或 token，会违反日志与隐私约束。
- 如果页面像真实登录页，会让仿真识别训练变成仿冒页面生成器。
- 如果 ready 时未满足 case-study ready 规则，可能误把高风险案例化实验标记为完成。

## 13. 优化方案

- 使用线索卡、风险标签、摘要字段和固定案例 key 替代完整邮件模板。
- 使用“举报 / 隔离 / 二次确认 / 放行”固定动作替代真实投递流程。
- 使用固定域名类别和相似域名风险标签，不展示真实可点击外部链接。
- 后端只做确定性评估，不连接邮件服务器、短信网关或第三方平台。
- Playwright 和只读脚本都要检查页面没有任意邮件正文、URL、邮箱或凭据输入框。

## 14. 验证方式

本执行文档切片的最小验证：

- `git diff --check -- docs/execution/2026-07-02-social-phishing-lab.md docs/design/next-wave-security-labs.md docs/TODO.md docs/execution/security-lab-master-goal.md`
- `rg -n "[ \t]+$" -- docs/execution/2026-07-02-social-phishing-lab.md docs/design/next-wave-security-labs.md docs/TODO.md docs/execution/security-lab-master-goal.md`
- 安全关键词扫描，确认未新增可投递钓鱼模板、真实邮件发送能力、凭据收集能力或第三方平台调用说明。

后续实现切片的最小验证应包括：

- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/phishing-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `pnpm --filter @network-safe/web exec vitest run tests/phishing-api.test.ts tests/phishing-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/testing e2e -- --grep "网络钓鱼"`
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/social/phishing/verify.ts`

## 15. 本轮完成条件

- 执行文档明确首版定位、固定案例模型、安全边界、后端 / 前端建议和后续切片顺序。
- 文档明确不发送真实邮件、不收集真实凭据、不生成可投递模板包、不调用第三方邮件 / 短信 / 社交平台。
- `docs/design/next-wave-security-labs.md`、`docs/TODO.md` 和 `docs/execution/security-lab-master-goal.md` 同步 `social/phishing` 已进入执行文档阶段。
- 文档级验证通过后再提交。

# 鱼叉式钓鱼

## 场景目标

本实验用于学习鱼叉式钓鱼中更具针对性的误判风险：针对性上下文、角色权威、紧急压力、审批链绕过、供应商或人事流程变更、工程临时访问请求和二次确认缺失。

当前状态为 `case-study` / `ready`。ready 仅表示本项目内固定虚构案例、前端固定案例工作台、后端受控 `review` API、统一事件日志安全摘要、Playwright 页面差异验证、服务端 API 测试和本机只读一致性验证已经形成学习闭环，不提供攻击脚本或 `exploit.py`。

## 当前范围

- 已建立 `social.spear-phishing` ready 元数据。
- 已建立漏洞版 / 修复版说明目录。
- 已建立攻击方观察、修复说明和手动验证文档。
- 已补充固定虚构案例卡文档。
- 已建立脚本目录边界说明。
- 已实现前端固定案例工作台：`apps/web/src/views/SpearPhishingLabView.vue`。
- 已接入后端受控固定案例 API：`POST /api/labs/social/spear-phishing/:variant/review`。
- 已接入 Playwright 页面差异验证：`packages/testing/tests/e2e/platform.spec.mjs`。
- 已接入本机只读一致性验证：`tools/lab-scripts/social/spear-phishing/verify.ts`。
- 已完成 case-study ready 收口审计：`docs/execution/2026-07-03-social-spear-phishing-ready-closeout.md`。
- 元数据当前登记 docs、web、api 和只读 scripts 入口。

当前未实现：

- `exploit.py`。
- 任何真实投递、画像采集、凭据收集、模板生成或第三方平台调用能力。

## 固定案例方向

当前已在 `docs/fixed-cases.md` 固化四个虚构案例方向：

- `executive-invoice-approval`：观察角色权威与紧急付款审批压力。
- `vendor-payment-change`：观察供应商付款信息变更带来的业务熟悉感。
- `engineering-access-request`：观察工程协作语境下的临时访问请求。
- `hr-benefit-personalized`：观察人事福利语境中的个性化诱导。

这些案例只作为固定线索卡、流程节点、风险标签和复盘问题使用，不提供完整邮件正文、IM 对话、可复制标题、可投递附件名或真实链接。

## 固定核验策略

当前前端和后端只允许以下固定 `verificationPolicyKey`：

- `context-only`
- `out-of-band-confirmation`
- `approval-chain-review`
- `least-privilege-review`
- `report-and-isolate`

当前核心学习信号为：

- `spear-phishing-context-trust-overweighted`
- `spear-phishing-approval-chain-bypassed`
- `spear-phishing-out-of-band-confirmation-required`
- `spear-phishing-boundary-verified`

## 后续扩展边界

后续若扩展更多社会工程学案例、跨案例复盘或持久化学习记录，必须单独编写执行文档，并继续保持固定虚构案例、固定 key、只读验证和不提供攻击脚本的边界。

## 当前页面边界

当前前端页面只提供：

- 固定 `caseKey` 选择器。
- 固定 `verificationPolicyKey` 选择器。
- 固定样例按钮。
- 后端决策、学习信号、风险标签和流程核验摘要。

页面不提供任意正文、真实姓名、邮箱、手机号、公司、部门、职位、社交账号、组织关系、链接、附件、凭据、token、付款信息或投递参数输入。

## 当前 API 边界

当前后端 API 只读取：

- `caseKey`
- `verificationPolicyKey`

`caseKey` 只允许本文档中的四个固定虚构案例。`verificationPolicyKey` 只允许后端服务内定义的固定核验策略。未知 key 会被阻断，且不会回显原始输入。

事件日志只记录固定 key、风险类别、建议动作、后端决策和学习信号，不保存真实人员、邮箱、手机号、组织、链接、附件、凭据或正文。

## 当前只读验证边界

当前 `tools/lab-scripts/social/spear-phishing/verify.ts` 只读取仓库内元数据、文档、前端、后端和测试文件，并输出 JSON 一致性报告。

该脚本不发起 HTTP 请求，不连接网络，不读取 `.env`、Cookie、token、验证码、凭据、付款信息、真实人员资料或真实业务材料。该脚本不是 `exploit.py`、投递器、画像采集器、模板生成器或攻击脚本。

## 安全边界

- 不发送真实邮件、短信、消息或链接。
- 不采集真实姓名、邮箱、手机号、公司、部门、职位、社交账号、组织关系或公开资料。
- 不收集真实凭据、验证码、Cookie、token、付款信息、附件或业务材料。
- 不连接第三方邮件、短信、社交平台、CRM、HR、IM、企业通讯录、投递服务或收件箱服务。
- 不生成可投递标题库、正文模板库、IM 话术库、附件诱导文案、跟踪链接或群发脚本。
- 不提供 `exploit.py`、投递脚本、画像采集脚本、模板生成脚本或攻击脚本。

## 后续切片

鱼叉式钓鱼已按 case-study ready 标准收口。后续若继续扩展，只能在新的执行文档中评估固定案例复盘、学习统计或防御流程强化，不创建真实投递、凭据收集、模板生成或第三方平台调用能力。

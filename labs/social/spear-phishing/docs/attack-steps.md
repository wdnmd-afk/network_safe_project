# 鱼叉式钓鱼攻击方观察步骤

## 1. 观察目标

本文件只用于帮助学习者理解鱼叉式钓鱼常见误判机制，不提供真实画像采集、真实投递、凭据收集、模板生成或攻击脚本。

攻击方视角的核心问题是：针对性上下文、角色权威、紧急压力、业务熟悉感和审批链例外为什么会让学习者忽略二次确认。

## 2. 当前 in-progress 观察范围

当前已建立目录、元数据、文档入口、固定虚构案例卡、前端固定案例工作台和后端受控 `review` API。当前页面和后端 API 只能使用以下固定案例 key：

- `executive-invoice-approval`
- `vendor-payment-change`
- `engineering-access-request`
- `hr-benefit-personalized`

这些案例的详细边界见 `labs/social/spear-phishing/docs/fixed-cases.md`。它们只能展示线索卡、风险标签、流程节点和复盘问题，不能展示完整邮件正文、IM 对话、可复制标题、可投递附件名或真实链接。

当前页面和 API 字段只包括 `caseKey` 和 `verificationPolicyKey`。页面不提供正文、收件人、凭据、token 或链接输入；额外传入这些字段也不会进入服务结果或事件日志摘要。

## 3. 当前允许的观察步骤

当前页面可按以下学习路径观察：

1. 选择固定虚构案例 key。
2. 观察案例中的角色压力、业务语境和流程例外。
3. 标注可能被忽略的审批链、二次确认和最小授权问题。
4. 通过漏洞版固定案例工作台调用受控 API，查看误判观察版为什么会倾向错误放行。
5. 切换到流程核验复盘版，观察可信通道确认、审批链和隔离举报如何改变决策。

## 4. 成功观察信号

当前使用固定学习信号表达观察结果：

- `spear-phishing-context-trust-overweighted`
- `spear-phishing-approval-chain-bypassed`
- `spear-phishing-out-of-band-confirmation-required`
- `spear-phishing-boundary-verified`

这些信号只用于学习复盘。当前已有前端固定案例工作台和后端受控 API，尚未提供脚本实现。

## 5. 明确禁止

- 不展示真实目标画像采集方法。
- 不展示真实组织结构挖掘方法。
- 不构造真实投递链路。
- 不发送真实邮件、短信、消息或链接。
- 不收集真实邮箱、手机号、凭据、验证码、Cookie、token、付款信息或附件。
- 不生成可投递标题库、正文模板库、IM 话术库、附件诱导文案、跟踪链接或群发脚本。
- 不连接第三方邮件、短信、社交平台、CRM、HR、IM、企业通讯录、投递服务或收件箱服务。
- 不提供 `exploit.py`、投递脚本、模板生成脚本或攻击脚本。

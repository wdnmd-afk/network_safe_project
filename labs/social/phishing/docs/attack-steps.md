# 网络钓鱼识别攻击方观察步骤

## 1. 观察目标

本文件只用于帮助学习者理解攻击方常利用的误判路径，不提供真实投递流程、邮件模板、群发脚本或凭据收集方式。

攻击方视角的核心问题是：哪些线索会让用户忽略真实来源、目标域名、凭据请求、附件风险和业务上下文。

## 2. 固定观察步骤

1. 选择固定案例 key，例如 `invoice-urgent-review`、`account-security-alert`、`hr-benefit-update` 或 `internal-security-newsletter`。
2. 观察线索卡中的诱导因素：紧急语气、相似域名、凭据请求、附件诱导或品牌仿冒。
3. 在误判观察版中确认系统为什么可能只看表面信息。
4. 记录学习信号，例如 `phishing-lookalike-domain-overlooked` 或 `phishing-credential-request-visible`。
5. 切换到识别复盘版，逐项检查同一案例中的防御线索。

## 3. 当前后端观察入口

当前已实现受控 API：

```text
POST /api/labs/social/phishing/:variant/review
```

请求体只允许固定字段：

- `caseKey`
- `reviewModeKey`
- `defenseChecklistKey`

漏洞版可使用固定组合观察误判倾向：

- `caseKey: "account-security-alert"`
- `reviewModeKey: "surface-only"`
- `defenseChecklistKey: "none"`

修复版可使用固定组合观察举报 / 隔离流程：

- `caseKey: "account-security-alert"`
- `reviewModeKey: "reporting-flow"`
- `defenseChecklistKey: "report-isolate-confirm"`

## 4. 成功观察信号

- 能指出至少一个被忽略的域名或来源一致性问题。
- 能指出至少一个凭据、验证码、付款、下载或远程协助诱导。
- 能说明为什么紧急语气会压缩用户的正常核验流程。
- 能说明应当使用举报、隔离或二次确认动作，而不是直接继续操作。

## 5. 明确禁止

- 不发送真实邮件、短信、消息或链接。
- 不构造真实投递链路。
- 不收集真实邮箱、凭据、验证码、Cookie 或 token。
- 不生成可投递邮件模板包、标题库、正文模板库或群发脚本。
- 不连接第三方邮件、短信、社交平台或收件箱服务。
- 不提供 `exploit.py`。

# 鱼叉式钓鱼脚本目录

## 当前状态

当前目录用于 `social/spear-phishing` 的脚本边界说明和本机只读一致性验证。

`social/spear-phishing` 当前为 `case-study` / `in-progress`，已建立标准目录、基础文档、docs 元数据入口、前端固定案例工作台、后端受控 `review` API、Playwright 页面差异验证和本机只读一致性验证。当前只登记 `verify.ts` 只读验证入口，不提供 `exploit.py`、投递脚本、画像采集脚本、模板生成脚本或第三方平台连接脚本。

## 当前脚本

- `verify.ts`：只读取仓库内鱼叉式钓鱼元数据、文档、前端、后端和测试文件，输出 JSON 一致性报告。

运行方式：

```bash
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/social/spear-phishing/verify.ts
```

`verify.ts` 不是攻击脚本，不发起 HTTP 请求，不发送邮件、短信或消息，不连接第三方平台、通讯录、CRM、HR、IM 或收件箱服务。

## 禁止能力

- 不发送真实邮件、短信、消息或链接。
- 不请求外部 URL。
- 不连接第三方邮件、短信、社交平台、CRM、HR、IM、企业通讯录、投递服务或收件箱服务。
- 不采集真实姓名、邮箱、手机号、公司、部门、职位、社交账号、组织关系或公开资料。
- 不生成可投递标题库、正文模板库、IM 话术库、附件诱导文案、跟踪链接或群发脚本。
- 不读取 `.env`、Cookie、token、验证码、凭据、付款信息或真实业务材料。
- 不提供鱼叉式钓鱼攻击脚本。
- 不将 `verify.ts` 用作投递器、画像采集器、模板生成器或攻击脚本。

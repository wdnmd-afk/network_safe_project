# 捕鲸攻击手动验证

## 验证目标

确认 `social.whaling` 当前仅为 planned 文档和元数据切片，不提供页面、API、脚本、真实投递、画像采集、凭据收集、模板生成、第三方平台调用或攻击能力。

## 元数据验证

检查 `labs/social/whaling/meta.json`：

- `id` 为 `social.whaling`。
- `status` 为 `planned`。
- `mode` 为 `case-study`。
- `entrypoints.docs` 只登记真实存在的文档入口。
- `entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 均为空数组。
- `verification.automation.supported` 为 `false`。
- `variants[].supportsAutomation` 均为 `false`。
- `safeBoundaries` 明确当前不提供页面、API、数据库写入、事件日志写入、`verify.ts`、`exploit.py` 或攻击脚本。

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

确认 `labs/social/whaling/docs/fixed-cases.md` 只包含固定虚构案例卡、虚构角色标签、误判线索、防御动作和学习信号，不包含完整邮件正文、IM 对话、会议邀请模板、可复制标题、真实链接、付款指令或可投递素材。

确认以下文件不存在：

- `tools/lab-scripts/social/whaling/exploit.py`
- `tools/lab-scripts/social/whaling/verify.ts`

## 安全边界验证

文档允许出现“投递、画像、凭据、模板、会议邀请、付款指令、脚本”等词，但必须只用于禁止性说明、边界说明或风险控制说明。

当前不应存在：

- 前端路由或页面。
- 后端 API 或 service。
- 数据库写入或事件日志写入。
- 真实高管画像采集。
- 真实组织结构收集。
- 真实投递、凭据收集、模板生成、第三方平台调用或攻击脚本。

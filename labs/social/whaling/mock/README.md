# 捕鲸攻击固定虚构案例

## 当前状态

当前目录记录 in-progress 阶段的固定案例边界，尚未提供结构化 mock 数据文件。固定案例卡已记录在 `../docs/fixed-cases.md`，这里只说明后续 mock 数据必须遵守的边界。

## 允许的固定案例方向

- `executive-wire-approval`
- `board-confidential-request`
- `legal-settlement-transfer`
- `ma-data-room-access`

后续若补充 mock 数据，只能使用 `../docs/fixed-cases.md` 中的固定案例 key、虚构角色标签、风险标签、流程节点、防御动作和学习信号。

## 不允许的 mock 数据

- 真实姓名、真实公司、真实部门、真实职位、真实邮箱、真实手机号或真实组织结构。
- 真实董事会、外部顾问、供应商、客户、案件编号、付款账户或资料室链接。
- 完整邮件正文、IM 对话、会议邀请模板、付款指令、附件诱导文案或可投递标题。
- 第三方平台 token、Cookie、验证码、凭据或配置。

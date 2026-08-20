# 风险观察步骤

1. 登录本机学习平台并打开云 IAM 策略风险观察版。
2. 确认固定 scenarioKey 为 `fixed-cloud-iam-policy-audit`。
3. 第一阶段选择 `accept-wildcard-admin-policy`，观察 `virtual-admin-wildcard-policy` 的 4 项发现与 2 项关键组合风险。
4. 第二阶段选择 `approve-overbroad-policy-grant`。
5. 运行固定审计，确认服务端返回 `infrastructure-iam-policy-audit-risk-accepted`。
6. 复盘事件摘要，只应看到固定案例 / 策略 key、三项计数、步数、终止结果和 signal。

该流程只读取服务端固定虚构策略，不提交真实账号、ARN、角色名、密钥或策略正文，不连接任何云账户，也不执行策略变更、角色绑定或提权操作，更不输出可复用的越权策略模板。

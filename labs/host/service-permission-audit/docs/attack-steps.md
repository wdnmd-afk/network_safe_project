# 风险观察步骤

1. 登录本机学习平台并打开服务权限审计风险观察版。
2. 确认固定 scenarioKey 为 `fixed-windows-service-permission-audit`。
3. 第一阶段选择 `accept-user-writable-unquoted-path`，观察 `virtual-update-service-risky` 的 4 项发现与 3 项关键发现。
4. 第二阶段选择 `allow-unprivileged-service-replacement`。
5. 运行固定审计，确认服务端返回 `host-service-permission-audit-risk-accepted`。
6. 复盘事件摘要，只应看到固定案例 / 配置 key、三项计数、步数、终止结果和 signal。

该流程只读取服务端固定虚构配置，不提交真实服务名、路径、ACL、SID、账号或凭据，不执行任何服务替换、权限修改或系统命令，也不描述可复用的提权操作步骤。

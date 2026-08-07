# 风险观察步骤

1. 登录本机学习平台并打开不安全随机数风险观察版。
2. 确认固定 scenarioKey 为 `predictable-session-token-sequence`。
3. 第一阶段选择 optionKey `trust-timestamp-counter-pattern`。
4. 第二阶段选择 optionKey `keep-predictable-token-source`。
5. 运行固定评估，确认服务端返回 `crypto-insecure-randomness-risk-accepted`。
6. 复盘事件摘要，只应看到固定 key、步数、结果计数、终止结果和 signal。

该流程不提交或生成 token、secret、seed、时间戳、计数器、用户或随机材料，不访问外部接口，也不修改真实认证状态。

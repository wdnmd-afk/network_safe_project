# 风险观察步骤

1. 登录本机学习平台并打开业务流程跳步风险观察版。
2. 确认固定 scenarioKey 为 `pending-order-shipping-request`。
3. 第一阶段选择 optionKey `trust-client-stage-request`。
4. 第二阶段选择 optionKey `ship-pending-order`。
5. 运行固定评估，确认服务端返回 `business-logic-workflow-bypass-risk-accepted`。
6. 复盘事件摘要，只应看到固定 key、步数、结果计数、终止结果和 signal。

该流程不提交订单 ID、阶段、金额、用户或支付字段，不访问外部接口，也不改变真实订单状态。

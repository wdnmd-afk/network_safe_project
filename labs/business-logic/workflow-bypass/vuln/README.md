# 漏洞版：信任客户端订单阶段

漏洞版固定路径：

1. 选择 `trust-client-stage-request`，模拟服务端直接信任客户端请求的目标阶段。
2. 选择 `ship-pending-order`，模拟待支付订单直接进入发货阶段。
3. 预期学习信号为 `business-logic-workflow-bypass-risk-accepted`。

该路径只改变内存状态机的学习判定，不修改订单、支付、库存或物流数据。

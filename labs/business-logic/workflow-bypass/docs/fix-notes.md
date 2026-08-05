# 修复说明

## 根因

只依赖前端页面控制业务步骤，或让服务端直接信任客户端提交的目标阶段，会使调用方绕过支付等中间阶段。客户端流程不是安全边界。

## 固定修复策略

- 服务端保存并识别当前业务阶段。
- 服务端维护允许迁移表，本实验固定为 `pending -> paid -> shipping`。
- 对 `pending -> shipping` 乱序迁移返回 `business-logic-workflow-bypass-defense-blocked`。
- 对 `paid -> shipping` 合法迁移返回 `business-logic-workflow-bypass-normal-verified`。
- 未登记 scenarioKey / optionKey 统一脱敏阻断，不回显原始输入。
- 事件日志只记录固定决策摘要，不记录订单、用户、金额、支付或物流信息。

本实验只模拟确定性状态判定，不实现真实订单状态更新、支付确认、事务锁或物流调用。

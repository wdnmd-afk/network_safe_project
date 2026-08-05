# 修复版：服务端校验阶段顺序

修复版固定防御路径：

1. 选择 `enforce-server-side-sequence`，由服务端校验当前阶段与允许迁移表。
2. 选择 `block-out-of-order-transition`，阻断 pending -> shipping 乱序迁移。
3. 预期学习信号为 `business-logic-workflow-bypass-defense-blocked`。

正常流程使用同一服务端策略后选择 `ship-paid-order`，预期 `business-logic-workflow-bypass-normal-verified`，证明 paid -> shipping 合法迁移未被破坏。

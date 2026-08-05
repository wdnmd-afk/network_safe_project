# 业务流程跳步

## 场景目标

通过固定待支付订单观察缺少服务端阶段顺序校验与启用服务端状态机后的行为差异。

本实验只使用固定案例 `pending-order-shipping-request`，展示订单 `SM-20260608-1099` 从 `pending` 请求直接进入 `shipping` 的两步决策过程。合法固定顺序为 `pending -> paid -> shipping`，不连接真实订单、支付或物流系统。

本实验已按 LT-022 完成专用两步交互链路（阶段顺序校验策略 -> 订单阶段迁移处置），评估请求只接受固定 `scenarioKey` 和有序 `decisions`。元数据为 `ready`，仅表示本机固定订单阶段学习闭环已通过验证。

## 固定决策

- 第一阶段：`trust-client-stage-request` 或 `enforce-server-side-sequence`。
- 第二阶段：`ship-pending-order`、`block-out-of-order-transition` 或 `ship-paid-order`。
- 风险信号：`business-logic-workflow-bypass-risk-accepted`。
- 防御信号：`business-logic-workflow-bypass-defense-blocked`。
- 正常信号：`business-logic-workflow-bypass-normal-verified`。

## 前置条件

- 本机前端与后端服务已启动。
- 使用本项目本机演示账号登录。
- 不需要外部目标、第三方服务、真实订单、支付凭据或物流数据。

## 使用方式

1. 访问 `/labs/business-logic/workflow-bypass/vuln`。
2. 载入推荐路径，观察待支付订单跳过 paid 阶段进入发货流程。
3. 切换到 `/labs/business-logic/workflow-bypass/fixed`，观察乱序迁移被服务端状态机阻断。
4. 载入正常订单流程，验证 paid -> shipping 合法迁移仍可继续。
5. 在实验详情或账户中心复盘统一事件日志的安全摘要。

## 安全边界

- 页面和 API 只接受本实验声明的 scenarioKey 与决策 optionKey。
- 不接受订单 ID、当前阶段、目标阶段、金额、用户、支付信息或自由文本。
- 未知 key 会被脱敏阻断，不回显原始输入，也不写入事件日志。
- 本实验不提供 `exploit.py`、批量请求、真实发货、支付或流程绕过能力。

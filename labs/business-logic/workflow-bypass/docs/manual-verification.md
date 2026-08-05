# 手工验证矩阵

## 固定契约

- scenarioKey：`pending-order-shipping-request`。
- 第一阶段 optionKey：`trust-client-stage-request`、`enforce-server-side-sequence`。
- 第二阶段 optionKey：`ship-pending-order`、`block-out-of-order-transition`、`ship-paid-order`。

## 路径一：漏洞版风险接受

1. 打开 `/labs/business-logic/workflow-bypass/vuln`。
2. 选择 `trust-client-stage-request`。
3. 选择 `ship-pending-order`。
4. 预期 HTTP 200、decision 为 `accepted`、signal 为 `business-logic-workflow-bypass-risk-accepted`。

## 路径二：修复版防御阻断

1. 打开 `/labs/business-logic/workflow-bypass/fixed`。
2. 选择 `enforce-server-side-sequence`。
3. 选择 `block-out-of-order-transition`。
4. 预期 HTTP 403、decision 为 `blocked`、signal 为 `business-logic-workflow-bypass-defense-blocked`。

## 路径三：修复版正常流程

1. 保持 `enforce-server-side-sequence`。
2. 选择 `ship-paid-order`。
3. 预期 HTTP 200、decision 为 `accepted`、signal 为 `business-logic-workflow-bypass-normal-verified`。

## 路径四：边界阻断

1. 提交未登记的 scenarioKey / optionKey、只提交第一阶段，或在终止步骤后追加多余决策。
2. 预期返回 `business-logic-workflow-bypass-boundary-blocked` 或 `path-incomplete` 对应的脱敏阻断结果。
3. 响应与事件日志不得包含原始未知 key、订单、用户、金额、支付信息或外部目标。

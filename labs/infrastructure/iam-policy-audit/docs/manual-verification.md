# 手工验证矩阵

## 固定契约

- scenarioKey：`fixed-cloud-iam-policy-audit`。
- 第一阶段 optionKey：`accept-wildcard-admin-policy`、`scope-policy-to-least-privilege`。
- 第二阶段 optionKey：`approve-overbroad-policy-grant`、`block-overbroad-policy-grant`、`verify-least-privilege-baseline`。

## 路径一：漏洞版风险接受

1. 打开 `/labs/infrastructure/iam-policy-audit/vuln`。
2. 选择 `accept-wildcard-admin-policy` 和 `approve-overbroad-policy-grant`。
3. 预期 HTTP 200、decision 为 `accepted`、signal 为 `infrastructure-iam-policy-audit-risk-accepted`。
4. 预期策略摘要为 `virtual-admin-wildcard-policy`：4 项发现、2 项关键组合风险、0 项最小权限控制。

## 路径二：修复版防御阻断

1. 打开 `/labs/infrastructure/iam-policy-audit/fixed`。
2. 选择 `scope-policy-to-least-privilege` 和 `block-overbroad-policy-grant`。
3. 预期 HTTP 403、decision 为 `blocked`、signal 为 `infrastructure-iam-policy-audit-defense-blocked`。
4. 预期策略摘要为 `virtual-scoped-least-privilege-policy`：0 项发现、0 项关键风险、4 项最小权限控制。

## 路径三：修复版正常复核

1. 保持 `scope-policy-to-least-privilege`。
2. 选择 `verify-least-privilege-baseline`。
3. 预期 HTTP 200、decision 为 `accepted`、signal 为 `infrastructure-iam-policy-audit-normal-verified`。
4. 预期 disposition 为 `least-privilege-baseline-verified`，证明收敛后正常运维复核仍可完成。

## 路径四：边界阻断

1. 提交未登记 scenarioKey / optionKey、只提交第一阶段，或在终止步骤后追加多余决策。
2. 预期返回 `infrastructure-iam-policy-audit-boundary-blocked` 或 `path-incomplete` 对应的脱敏阻断结果。
3. 响应与事件日志不得包含原始未知 key、策略正文、JSON、YAML、ARN、账号、角色名、密钥或区域端点。

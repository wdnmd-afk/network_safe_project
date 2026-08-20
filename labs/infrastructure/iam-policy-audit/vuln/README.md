# 风险观察版

风险观察版推荐固定路径：

1. `accept-wildcard-admin-policy`：接受 `virtual-admin-wildcard-policy` 的通配符主体、通配符动作、通配符资源和缺失条件约束。
2. `approve-overbroad-policy-grant`：批准过宽授权继续生效，不做范围收敛。

终止信号为 `infrastructure-iam-policy-audit-risk-accepted`，固定计数为 4 项发现、2 项关键组合风险、0 项最小权限控制。该结果只描述教学审计结论，不读取真实云策略，也不执行任何授权或提权操作。

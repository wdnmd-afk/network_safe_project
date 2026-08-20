# 防御复盘版

防御复盘版使用同一固定案例，先选择 `scope-policy-to-least-privilege`，再对比两条处置路径：

- `block-overbroad-policy-grant`：阻断通配符授权申请，返回 `infrastructure-iam-policy-audit-defense-blocked`（HTTP 403）。
- `verify-least-privilege-baseline`：依据具名主体、显式动作资源和来源条件复核基线，返回 `infrastructure-iam-policy-audit-normal-verified`（HTTP 200）。

两条路径共同说明范围收敛只阻断过宽授权，不影响正常运维复核。所有结论都基于固定虚构策略快照，不修改真实云策略、角色、绑定或密钥。

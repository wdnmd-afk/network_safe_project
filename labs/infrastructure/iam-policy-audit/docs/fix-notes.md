# 修复说明

## 根因

单一通配符本身未必致命，风险来自四要素同时失去边界：主体不限定身份、动作不限定操作、资源不限定范围，且缺少条件约束。此时策略的实际授权面远超业务需要，并使提权路径可达；如果处置阶段再批准该授权，风险不会被拦下。

## 固定修复策略

- 主体从 `wildcard-all` 收敛为 `named-role`，只允许具名角色使用该策略。
- 动作从 `wildcard-all` 收敛为 `explicit-actions`，显式列出允许操作，避免未来新增高危动作被自动授予。
- 资源从 `wildcard-all` 收敛为 `explicit-resources`，限定策略作用的虚构资源范围。
- 条件从 `none` 收敛为 `source-restricted`，在范围收敛之外增加第二道上下文边界。
- 过宽授权申请返回 `infrastructure-iam-policy-audit-defense-blocked`。
- 最小权限基线复核返回 `infrastructure-iam-policy-audit-normal-verified`，证明范围收敛只阻断过宽授权，不影响正常运维复核。
- 未登记 scenarioKey / optionKey、不完整路径和终止后追加决策统一脱敏阻断。
- 事件日志只记录固定 key、三项计数、步数、终止结果和 signal。

本实验不修改真实云策略、角色、绑定或密钥，也不调用云 SDK、CLI、Terraform 或 Kubernetes API。

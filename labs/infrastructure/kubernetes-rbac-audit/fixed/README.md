# Kubernetes RBAC 绑定防御复盘版

## 定位

本变体把固定虚构绑定收敛到 `virtual-namespaced-readonly-binding`，对比 `namespace-scoped` 角色范围、`read-only-verbs` 动词、`explicit-resources` 资源、`named-service-account` 主体且禁用提权动词后的审计结论，并复核收敛后的正常基线仍可通过。

## 固定路径

- 防御路径：`scope-binding-to-namespace` → `block-overbroad-binding`，终止信号 `infrastructure-kubernetes-rbac-audit-defense-blocked`。
- 正常路径：`scope-binding-to-namespace` → `verify-namespaced-baseline`，终止信号 `infrastructure-kubernetes-rbac-audit-normal-verified`。

## 固定审计摘要

加固绑定登记 0 项发现、0 项关键组合风险和 5 项最小权限控制。五项控制分别为：命名空间级范围、只读动词、显式资源列表、具名 ServiceAccount 主体、禁用提权动词。

## 修复要点

- 优先使用 `RoleBinding` 而不是 `ClusterRoleBinding`，让授权范围停留在单一命名空间。
- 动词按需显式列出，避免 `*` 覆盖未来新增操作。
- 资源显式列举，不使用资源通配符。
- 主体绑定到具名 ServiceAccount，而不是宽泛用户组。
- 明确排除 `escalate` 与 `bind`，否则主体可自行提升权限并绕过前四项收敛。

## 正常流程验证

收敛后的只读绑定仍应满足其预期用途。防御措施生效不等于业务不可用，正常路径用于证明最小权限基线可以通过复核。

## 安全边界

- 只读取服务端内存中的固定虚构绑定快照，不连接真实集群或 API server。
- 不调用 Kubernetes API、`kubectl`、Helm、云 SDK 或 Terraform，也不读取本机 kubeconfig。
- 页面与 API 只接受已登记 `fixed-kubernetes-rbac-audit` 与固定 optionKey，未知输入会被脱敏阻断。
- 本变体不下发任何真实 RBAC 清单，也不提供 `exploit.py`。

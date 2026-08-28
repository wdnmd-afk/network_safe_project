# Kubernetes RBAC 绑定风险观察版

## 定位

本变体展示固定虚构绑定 `virtual-cluster-admin-broad-binding` 在 `cluster-wide` 角色范围、`wildcard-all` 动词、`wildcard-all` 资源、`broad-group` 主体叠加提权动词时的组合风险，并观察过宽绑定被批准的固定结果。

## 固定路径

1. `rbac-scope-assessment` 阶段选择 `accept-cluster-admin-binding`。
2. `rbac-binding-decision` 阶段选择 `approve-overbroad-binding`。
3. 终止学习信号为 `infrastructure-kubernetes-rbac-audit-risk-accepted`。

## 固定审计摘要

风险绑定登记 4 项发现、3 项关键组合风险和 0 项最小权限控制。三项关键风险分别对应动词与资源同为通配符、集群级范围叠加宽泛主体、以及允许 `escalate`/`bind` 提权动词。

## 观察要点

- 通配符动词会把未来新增的资源类型和高危操作一并授予。
- `ClusterRoleBinding` 的作用域跨越全部命名空间，命名空间隔离在此失效。
- `escalate` 与 `bind` 允许主体自行提升权限，使后续收敛措施可被绕过。
- 宽泛主体（如 `system:authenticated` 类语义的 `broad-group`）让任意已认证身份获得该绑定。

## 安全边界

- 只读取服务端内存中的固定虚构绑定快照，不连接真实集群或 API server。
- 不调用 Kubernetes API、`kubectl`、Helm、云 SDK 或 Terraform，也不读取本机 kubeconfig。
- 页面与 API 只接受已登记 `fixed-kubernetes-rbac-audit` 与固定 optionKey，未知输入会被脱敏阻断。
- 本变体不输出可用于真实集群的提权清单，也不提供 `exploit.py`。

# Kubernetes RBAC 固定数据说明

## 数据位置

本实验不在本目录存放可执行清单或数据文件。两份固定虚构绑定快照以冻结常量形式定义在：

```text
apps/server/src/services/kubernetes-rbac-audit-lab.ts
```

常量为 `fixedRbacBindingSnapshots`，通过 `Object.freeze` 冻结，工作台只返回其只读副本。

## 为什么不放真实 YAML

放置可直接 `kubectl apply` 的 RBAC 清单会让本实验从"只读审计学习"退化为"可下发的提权配置模板"。因此固定数据只使用语义枚举字段，不保留可执行清单正文：

- `roleScope`：`cluster-wide` 或 `namespace-scoped`
- `verbScope`：`wildcard-all`、`write-verbs` 或 `read-only-verbs`
- `resourceScope`：`wildcard-all` 或 `explicit-resources`
- `subjectScope`：`broad-group` 或 `named-service-account`
- `escalationVerbsAllowed`：布尔值，表示是否允许 `escalate` / `bind`

页面展示的是这些枚举的中文标签，不是 YAML 正文。

## 虚构标识

两份快照的 `bindingKey` 统一使用 `virtual-` 前缀：

- `virtual-cluster-admin-broad-binding`
- `virtual-namespaced-readonly-binding`

标识不映射任何真实集群、命名空间、角色、ServiceAccount 或用户组。

## 安全边界

- 本目录不提供集群连接配置、kubeconfig 样例或凭据。
- 本目录不提供可下发的 Role、ClusterRole、RoleBinding 或 ClusterRoleBinding 清单。
- 固定审计计数完全由上述语义枚举确定性推导，不解析真实 YAML。

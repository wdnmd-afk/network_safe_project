# Kubernetes RBAC 固定配置审计

## 场景目标

对比两份虚构 Kubernetes RBAC 绑定快照，观察角色范围、动词范围、资源范围、主体范围和 `escalate`/`bind` 提权动词五要素的组合影响，并完成两步授权处置决策。

固定案例为 `fixed-kubernetes-rbac-audit`。所有绑定标识、角色、命名空间与主体名都是服务端内存冻结常量，统一使用 `virtual-*` 前缀，不映射真实集群资源，也不读取任何 kubeconfig 或集群配置。

## 固定绑定快照

- `virtual-cluster-admin-broad-binding`：角色 `cluster-wide`、动词 `wildcard-all`、资源 `wildcard-all`、主体 `broad-group`，允许提权动词且提权可达；固定 4 项发现、3 项关键组合风险、0 项最小权限控制。
- `virtual-namespaced-readonly-binding`：角色 `namespace-scoped`、动词 `read-only-verbs`、资源 `explicit-resources`、主体 `named-service-account`，不含提权动词且提权不可达；固定 0 项发现、0 项关键风险、5 项最小权限控制。

关键组合风险只统计三类：动词与资源同为通配符、集群级范围叠加宽泛主体、以及允许 `escalate`/`bind` 提权动词。

## 固定决策

- 第一阶段 `rbac-scope-assessment`：`accept-cluster-admin-binding` 或 `scope-binding-to-namespace`。
- 第二阶段 `rbac-binding-decision`：`approve-overbroad-binding`、`block-overbroad-binding` 或 `verify-namespaced-baseline`。
- 风险信号：`infrastructure-kubernetes-rbac-audit-risk-accepted`。
- 防御信号：`infrastructure-kubernetes-rbac-audit-defense-blocked`。
- 正常信号：`infrastructure-kubernetes-rbac-audit-normal-verified`。
- 边界阻断信号：`infrastructure-kubernetes-rbac-audit-boundary-blocked`。

## 前置条件

- 本机前端与后端服务已启动。
- 使用本项目本机演示账号登录。
- 不需要 Kubernetes 集群、kubeconfig、`kubectl`、Helm 或任何云 CLI 工具。

## 使用方式

1. 访问 `/labs/infrastructure/kubernetes-rbac-audit/vuln`，观察 `cluster-wide` 通配符绑定的固定发现计数与过宽绑定被批准的路径。
2. 切换到 `/labs/infrastructure/kubernetes-rbac-audit/fixed`，选择收敛路径并阻断过宽绑定。
3. 载入命名空间只读基线路径，确认收敛后的绑定仍能通过正常复核。
4. 在实验详情或账户中心复盘统一事件日志的安全摘要。

## 与云 IAM 实验的分工

`infrastructure.iam-policy-audit` 覆盖云 IAM 策略的主体、动作、资源、条件四要素。本实验只覆盖 Kubernetes RBAC 特有的语义：`Role` 与 `ClusterRole` 的范围差异、动词集合、`escalate`/`bind` 提权动词和 `ServiceAccount`/`Group` 主体类型。两者不共用固定数据，也不复制字段结构。

## 安全边界

- 固定绑定快照只存在于服务端内存常量，不连接真实集群、控制平面、API server 或云账户。
- 不调用 Kubernetes API、`kubectl`、Helm、云 SDK、CLI 或 Terraform，也不读取本机 kubeconfig、服务账号 token 与 CI 密钥。
- 页面和 API 不接受 YAML、JSON、清单正文、真实命名空间、集群名、主体名、token 或自由文本。
- 未知 key 会被脱敏阻断，不回显原始输入，也不写入事件日志。
- 本实验不提供 `exploit.py`，不输出可直接用于真实集群的提权清单或操作步骤。

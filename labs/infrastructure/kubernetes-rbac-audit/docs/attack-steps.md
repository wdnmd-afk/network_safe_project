# 过宽 RBAC 绑定风险观察步骤

本文档只描述在本机固定虚构快照上的观察路径，不提供可用于真实集群的提权清单或命令。

## 前置条件

- 本机前端与后端服务已启动。
- 使用本项目本机演示账号登录。
- 不需要集群、kubeconfig、`kubectl` 或任何云账户。

## 观察路径

1. 访问 `/labs/infrastructure/kubernetes-rbac-audit/vuln`。
2. 在"虚构 RBAC 绑定对比"面板中观察 `virtual-cluster-admin-broad-binding` 的四要素：
   - 角色范围 `cluster-wide`
   - 动词范围 `wildcard-all`
   - 资源范围 `wildcard-all`
   - 主体范围 `broad-group`
   - 并且 `escalationVerbsAllowed` 为真、提权可达为真。
3. 第一阶段 `rbac-scope-assessment` 选择 `accept-cluster-admin-binding`。
4. 第二阶段 `rbac-binding-decision` 选择 `approve-overbroad-binding`。
5. 提交后观察服务端返回：
   - 固定发现数 4
   - 关键组合风险 3
   - 最小权限控制数 0
   - 学习信号 `infrastructure-kubernetes-rbac-audit-risk-accepted`

## 风险为什么成立

关键组合风险只统计三类，全部在该绑定上同时成立：

1. 动词与资源同为通配符（`wildcard-all` + `wildcard-all`）。
2. 集群级角色范围叠加宽泛主体（`cluster-wide` + `broad-group`）。
3. 允许 `escalate` / `bind` 类提权动词。

前两条说明授权面已经越过命名空间边界，第三条说明持有者可以自行扩大权限，因此提权可达。

## 边界说明

- 全过程只读取服务端内存中的固定虚构快照，不连接任何真实集群。
- 页面与 API 不接受 YAML、清单正文、命名空间名、ServiceAccount 名或自由文本。
- 未登记的 `scenarioKey` 或 `optionKey` 会被脱敏阻断，返回 `infrastructure-kubernetes-rbac-audit-boundary-blocked`，不回显原始输入。
- 本实验不提供 `exploit.py`，也不输出可直接应用的提权绑定文本。

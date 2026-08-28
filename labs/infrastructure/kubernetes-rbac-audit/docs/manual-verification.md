# Kubernetes RBAC 固定审计手工验证矩阵

固定案例统一为 `fixed-kubernetes-rbac-audit`。以下路径都只使用工作台返回的固定 `optionKey`，不提交 YAML 正文、命名空间名、角色名或自由文本。

## 前置条件

- 本机后端服务运行于 `http://127.0.0.1:6667`。
- 本机前端已启动，使用本项目演示账号登录。
- 不需要 kubeconfig、集群凭据、`kubectl` 或任何云 CLI。

## 路径 1：风险路径（漏洞版）

1. 访问 `/labs/infrastructure/kubernetes-rbac-audit/vuln`。
2. 第一步选择 `accept-cluster-admin-binding`。
3. 第二步选择 `approve-overbroad-binding`。
4. 运行固定审计。

预期结果：

- HTTP 200，`decision` 为 `accepted`。
- 学习信号为 `infrastructure-kubernetes-rbac-audit-risk-accepted`。
- 绑定摘要为 `virtual-cluster-admin-broad-binding`，固定 4 项发现、3 项关键组合风险、0 项最小权限控制。
- 事件日志记录 `phase=attack`，`actorPerspective=attacker`，`riskLevel=high`。

## 路径 2：防御路径（修复版）

1. 访问 `/labs/infrastructure/kubernetes-rbac-audit/fixed`。
2. 第一步选择 `scope-binding-to-namespace`。
3. 第二步选择 `block-overbroad-binding`。
4. 运行固定审计。

预期结果：

- HTTP 403，`decision` 为 `blocked`。
- 学习信号为 `infrastructure-kubernetes-rbac-audit-defense-blocked`。
- 事件日志记录 `phase=defense`，`eventType=blocked`。

## 路径 3：正常业务路径（修复版）

1. 停留在修复版页面，点击「命名空间只读基线」载入正常路径。
2. 确认决策为 `scope-binding-to-namespace` 与 `verify-namespaced-baseline`。
3. 运行固定审计。

预期结果：

- HTTP 200，`decision` 为 `accepted`。
- 学习信号为 `infrastructure-kubernetes-rbac-audit-normal-verified`。
- 绑定摘要为 `virtual-namespaced-readonly-binding`，固定 0 项发现、0 项关键风险、5 项最小权限控制。
- 事件日志记录 `phase=normal`，证明收敛后正常业务仍可继续。

## 路径 4：边界阻断

分别尝试以下未登记输入：

| 输入 | 预期 |
|---|---|
| 未登记 `scenarioKey` | HTTP 403，`blockedReason` 为 `scenario-not-allowed` |
| 空 `decisions` | HTTP 400 |
| 未登记 `optionKey` | HTTP 403，边界信号 `infrastructure-kubernetes-rbac-audit-boundary-blocked` |
| 终止步骤后追加决策 | HTTP 403，`blockedReason` 为 `decisions-after-terminal` |
| 只提交第一步 | HTTP 403，`blockedReason` 为 `path-incomplete` |

所有阻断响应都不回显原始输入，`scenarioKey` 显示为 `blocked-scenario`，也不写入事件日志原文。

## 路径 5：只读一致性验证

在仓库根目录运行：

```
pnpm --filter @network-safe/server exec tsx ../../tools/lab-scripts/infrastructure/kubernetes-rbac-audit/verify.ts
```

预期输出 `"ok": true`，且全部检查项 `passed` 为真。该脚本只读取仓库文件，不发起 HTTP 请求，也不连接任何集群。

## 边界确认

- 全过程不连接、认证或修改任何真实 Kubernetes 集群、云账户或 IaC 后端。
- 不调用 `kubectl`、Helm、Terraform、云 SDK，也不读取本机 kubeconfig 与云凭据。
- 不启动任何 Pod、容器或工作负载。
- 本实验不提供 `exploit.py`。

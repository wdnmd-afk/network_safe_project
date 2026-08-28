# Kubernetes RBAC 固定审计脚本目录

本目录只包含本机只读一致性验证脚本，不包含任何攻击脚本或集群操作能力。

## 内容

- `verify.ts`：只读一致性验证器。反向核对元数据、Web/API 入口、真实路由注册顺序、固定绑定快照、审计计数、canonical 信号、标准文档与禁用能力。

## 运行方式

在仓库根目录执行：

```
pnpm --filter @network-safe/server exec tsx ../../tools/lab-scripts/infrastructure/kubernetes-rbac-audit/verify.ts
```

输出为 JSON 报告，`ok` 为 `true` 表示全部检查通过；任一检查失败时进程退出码为 1。

## 固定契约

- 固定案例：`fixed-kubernetes-rbac-audit`。
- 第一步 `optionKey`：`accept-cluster-admin-binding`、`scope-binding-to-namespace`。
- 第二步 `optionKey`：`approve-overbroad-binding`、`block-overbroad-binding`、`verify-namespaced-baseline`。
- canonical 信号：`infrastructure-kubernetes-rbac-audit-risk-accepted`、`infrastructure-kubernetes-rbac-audit-defense-blocked`、`infrastructure-kubernetes-rbac-audit-normal-verified`。
- 固定绑定：`virtual-cluster-admin-broad-binding`、`virtual-namespaced-readonly-binding`。

## 安全边界

- 脚本只读取仓库内的元数据、文档、实现与测试文件，并复用服务端固定绑定常量。
- 脚本不发起 HTTP 请求，不连接 Kubernetes 集群、云账户、IaC 后端或任何外部目标。
- 脚本不调用 `kubectl`、Helm、Terraform、云 SDK，也不读取本机 kubeconfig 与云凭据。
- 本目录不提供 `exploit.py`，不生成可直接用于真实集群的提权清单或绕过步骤。

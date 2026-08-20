# 云 IAM 策略审计只读验证

## 用途

对 `infrastructure.iam-policy-audit` 做本机只读一致性验证，覆盖元数据结构、固定虚构策略快照、最小权限计数、前后端专用路由顺序、canonical 信号、文档完整性和禁用能力。

## 运行方式

```bash
pnpm --filter @network-safe/server exec tsx ../../tools/lab-scripts/infrastructure/iam-policy-audit/verify.ts
```

必须从 `@network-safe/server` 工作区运行，因为脚本复用服务端固定策略常量，需要该工作区解析 `@network-safe/shared` 依赖。

## 安全边界

- 只读取仓库内元数据、文档、实现和测试文件，并导入服务端固定策略常量。
- 不发起 HTTP 请求，不连接云账户、订阅、项目、集群或 IaC 后端。
- 不调用云 SDK、CLI、Terraform、Kubernetes API 或任何系统命令。
- 不读取本机云凭据、kubeconfig、环境变量或 CI 密钥。
- 不提供 `exploit.py`，不生成可用于真实环境的越权策略文本。
- 最小权限计数只由固定虚构策略的语义枚举确定性推导。

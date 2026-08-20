# 固定策略快照说明

本目录表示服务端内存中的固定虚构 IAM 策略快照，不保存、导出或采集任何真实云配置。

- 固定案例 key：`fixed-cloud-iam-policy-audit`。
- 虚构策略：`virtual-admin-wildcard-policy`、`virtual-scoped-least-privilege-policy`。
- 主体范围枚举：`wildcard-all`、`named-role`。
- 动作范围枚举：`wildcard-all`、`wildcard-service`、`explicit-actions`。
- 资源范围枚举：`wildcard-all`、`explicit-resources`。
- 条件范围枚举：`none`、`source-restricted`。

禁止在本目录加入真实账号 ID、租户 ID、ARN、资源名、区域端点、访问密钥、会话令牌、kubeconfig 或任何可直接用于真实云环境的策略文档。

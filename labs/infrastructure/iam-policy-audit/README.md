# 云 IAM 策略最小权限固定审计

## 场景目标

对比两份虚构 IAM 策略快照，观察主体范围、动作范围、资源范围和条件约束四要素的组合影响，并完成两步授权处置决策。

固定案例为 `fixed-cloud-iam-policy-audit`。所有策略标识、角色与资源名都是服务端内存冻结常量，统一使用 `virtual-*` 前缀，不映射真实云资源，也不读取任何云配置或本机凭据。

## 固定策略快照

- `virtual-admin-wildcard-policy`：主体 `wildcard-all`、动作 `wildcard-all`、资源 `wildcard-all`、条件 `none`，提权可达；固定 4 项发现、2 项关键组合风险、0 项最小权限控制。
- `virtual-scoped-least-privilege-policy`：主体 `named-role`、动作 `explicit-actions`、资源 `explicit-resources`、条件 `source-restricted`，提权不可达；固定 0 项发现、0 项关键风险、4 项最小权限控制。

关键组合风险只统计两类：动作与资源同为通配符且缺失条件约束，以及提权可达。

## 固定决策

- 第一阶段 `iam-policy-scope-assessment`：`accept-wildcard-admin-policy` 或 `scope-policy-to-least-privilege`。
- 第二阶段 `iam-policy-decision`：`approve-overbroad-policy-grant`、`block-overbroad-policy-grant` 或 `verify-least-privilege-baseline`。
- 风险信号：`infrastructure-iam-policy-audit-risk-accepted`。
- 防御信号：`infrastructure-iam-policy-audit-defense-blocked`。
- 正常信号：`infrastructure-iam-policy-audit-normal-verified`。
- 边界阻断信号：`infrastructure-iam-policy-audit-boundary-blocked`。

## 前置条件

- 本机前端与后端服务已启动。
- 使用本项目本机演示账号登录。
- 不需要云账户、访问密钥、kubeconfig 或任何云 CLI 工具。

## 使用方式

1. 访问 `/labs/infrastructure/iam-policy-audit/vuln`，观察通配符策略的固定发现计数与过宽授权被批准的路径。
2. 切换到 `/labs/infrastructure/iam-policy-audit/fixed`，选择收敛路径并阻断过宽授权。
3. 载入最小权限基线路径，确认收敛后的策略仍能通过正常复核。
4. 在实验详情或账户中心复盘统一事件日志的安全摘要。

## 安全边界

- 固定策略快照只存在于服务端内存常量，不连接真实云账户、订阅、项目或集群。
- 不调用 AWS/Azure/GCP/Kubernetes API、CLI、SDK 或 Terraform，也不读取本机云凭据、kubeconfig 与 CI 密钥。
- 页面和 API 不接受策略正文、JSON、YAML、ARN、账号、角色名、密钥、区域或自由文本。
- 未知 key 会被脱敏阻断，不回显原始输入，也不写入事件日志。
- 本实验不提供 `exploit.py`，不输出可直接用于真实环境的越权策略文本或操作步骤。

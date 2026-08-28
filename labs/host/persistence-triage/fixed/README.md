# 自启持久化防御复盘版

## 版本定位

本版本用于对比固定条目 `virtual-signed-managed-task` 在具备发布者签名校验、仅管理员可写映像路径、受控计划窗口触发、最小权限运行账户与变更审计告警时，可疑持久化被阻断、受管自启基线仍可正常复核的固定结果。

## 固定条目

- 条目：`virtual-signed-managed-task`
- 签名范围：`publisher-verified`
- 映像路径 ACL：`admin-only-writable`
- 触发器：`scheduled-window`
- 运行账户：`least-privilege-account`
- 变更审计：`change-audited-and-alerted`
- 标准用户可篡改：否
- 固定审计计数：0 项发现、0 项关键风险、5 项加固控制

## 推荐路径

防御路径：

1. `harden-signature-and-path-acl`
2. `block-and-remove-persistence`

完成后返回 `host-persistence-triage-defense-blocked`，处置结论为 `persistence-retention-blocked`，HTTP 状态为 403。

正常基线路径：

1. `harden-signature-and-path-acl`
2. `verify-managed-autorun-baseline`

完成后返回 `host-persistence-triage-normal-verified`，处置结论为 `managed-autorun-baseline-verified`，HTTP 状态为 200。

## 复盘要点

- 五项加固控制是组合生效的：签名校验、路径 ACL、受控触发窗口、最小权限账户、变更审计告警。
- 仅收敛签名而保留用户可写路径，标准用户仍可替换映像，因此路径 ACL 不可省略。
- 最小权限运行账户把万一发生的持久化限制在低影响范围内。
- 变更审计负责让每次自启项变更可被发现和追溯，是前四项之外的兜底边界。
- 加固后受管自启项仍能按计划窗口正常执行，说明防御没有牺牲正常业务能力。

## 安全边界

- 只读取服务端冻结的固定条目快照，不修改真实计划任务、启动项、注册表或服务配置。
- 不读取真实主机 ACL、注册表、系统凭据或真实 Windows 事件日志。
- 不调用 `schtasks`、注册表编辑接口或任何真实主机持久化管理能力。
- 页面与 API 只接受已登记 `scenarioKey` 与 `optionKey`，未知输入会被脱敏阻断且不回显原值。
- 本版本不提供 `exploit.py`，也不输出可直接用于真实主机的持久化创建或移除脚本。

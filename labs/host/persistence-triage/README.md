# Windows 自启持久化固定研判

## 场景目标

对比两份虚构自启持久化条目快照，观察发布者签名、映像路径 ACL、触发器、运行账户和变更审计五要素的组合影响，并完成两步持久化处置决策。

固定案例为 `fixed-windows-autorun-persistence-timeline`。所有条目标识、路径描述与账户都是服务端内存冻结常量，统一使用 `virtual-*` 前缀，不映射真实主机对象，也不枚举、创建、修改或删除任何真实计划任务、启动项与注册表项。

## 固定条目快照

- `virtual-unsigned-autorun-entry`：签名 `unsigned`、路径 ACL `user-writable`、触发器 `logon-high-frequency`、运行账户 `high-privilege-account`、审计 `none`，标准用户可篡改；固定 4 项发现、2 项关键组合风险、0 项加固控制。
- `virtual-signed-managed-task`：签名 `publisher-verified`、路径 ACL `admin-only-writable`、触发器 `scheduled-window`、运行账户 `least-privilege-account`、审计 `change-audited-and-alerted`，标准用户不可篡改；固定 0 项发现、0 项关键风险、5 项加固控制。

关键组合风险只统计两类：未签名叠加用户可写路径且缺失审计，以及标准用户可篡改。

## 固定决策

- 第一阶段 `persistence-scope-assessment`：`accept-unsigned-autorun-entry` 或 `harden-signature-and-path-acl`。
- 第二阶段 `persistence-disposition-decision`：`approve-persistence-retention`、`block-and-remove-persistence` 或 `verify-managed-autorun-baseline`。
- 风险信号：`host-persistence-triage-risk-accepted`。
- 防御信号：`host-persistence-triage-defense-blocked`。
- 正常信号：`host-persistence-triage-normal-verified`。
- 边界阻断信号：`host-persistence-triage-boundary-blocked`。

## 前置条件

- 本机前端与后端服务已启动。
- 使用本项目本机演示账号登录。
- 不需要管理员权限、真实计划任务、注册表访问或域环境。

## 使用方式

1. 访问 `/labs/host/persistence-triage/vuln`，观察未签名条目的固定发现计数与可疑持久化被保留的路径。
2. 切换到 `/labs/host/persistence-triage/fixed`，选择收敛路径并阻断移除可疑持久化。
3. 载入受管自启基线路径，确认加固后的条目仍能通过正常复核。
4. 在实验详情或账户中心复盘统一事件日志的安全摘要。

## 安全边界

- 固定条目快照只存在于服务端内存常量，不枚举、创建、修改或删除真实计划任务、启动项、服务与注册表。
- 不读取真实主机 ACL、注册表、系统凭据或真实 Windows 事件日志。
- 页面和 API 不接受主机名、文件路径、任务名、账户、签名指纹或自由文本。
- 未知 key 会被脱敏阻断，不回显原始输入，也不写入事件日志。
- 本实验按 case-study ready 例外收口，不提供 `exploit.py`，不输出可直接用于真实主机的持久化创建或提权步骤。

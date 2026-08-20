# 修复说明

## 根因

高权限运行身份本身不是缺陷，风险来自控制组合：可执行路径含空格且未加引号，二进制目录允许低权限写入，服务配置允许低权限修改。三者叠加时，低权限主体就能影响高权限服务加载的内容；如果处置阶段再接受未授权替换，风险不会被阻断。

## 固定修复策略

- 为含空格的可执行路径加引号，消除路径解析歧义。
- 将二进制目录 ACL 从 `users-write` 收敛为 `administrators-write`。
- 将服务配置 ACL 从 `users-change` 收敛为 `system-only`。
- 将运行身份从 `virtual-local-system` 降为 `virtual-service-account`，遵循最小权限。
- 未授权修改返回 `host-service-permission-audit-defense-blocked`。
- 加固基线复核返回 `host-service-permission-audit-normal-verified`，证明权限收敛只阻断未授权变更，不影响正常运维复核。
- 未登记 scenarioKey / optionKey、不完整路径和终止后追加决策统一脱敏阻断。
- 事件日志只记录固定 key、三项计数、步数、终止结果和 signal。

本实验不修改真实服务、注册表、目录 ACL、账号或凭据，也不执行 `sc.exe`、PowerShell、WMI 或任何系统命令。

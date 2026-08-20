# Windows 服务 ACL 与权限固定审计

## 场景目标

对比两组虚构服务配置，观察运行身份、可执行路径引号、二进制目录 ACL 和服务配置 ACL 四项控制的组合影响，并完成两步服务权限处置决策。

固定案例为 `fixed-windows-service-permission-audit`。所有服务名、路径和 ACL 都是服务端内存常量，路径统一使用 `C:\LabVirtual\` 虚构前缀，不映射真实文件，也不读取操作系统状态。

## 固定服务配置

- `virtual-update-service-risky`：以 `virtual-local-system` 运行，路径含空格且未加引号，二进制目录 `users-write`，服务配置 `users-change`；固定 4 项发现、2 项关键发现、0 项加固控制。
- `virtual-update-service-hardened`：以 `virtual-service-account` 运行，路径已加引号，二进制目录 `administrators-write`，服务配置 `system-only`；固定 0 项发现、0 项关键发现、4 项加固控制。

## 固定决策

- 第一阶段 `service-path-acl-assessment`：`accept-user-writable-unquoted-path` 或 `harden-path-and-service-acl`。
- 第二阶段 `service-permission-decision`：`allow-unprivileged-service-replacement`、`block-unprivileged-service-modification` 或 `verify-hardened-service-baseline`。
- 风险信号：`host-service-permission-audit-risk-accepted`。
- 防御信号：`host-service-permission-audit-defense-blocked`。
- 正常信号：`host-service-permission-audit-normal-verified`。
- 边界阻断信号：`host-service-permission-audit-boundary-blocked`。

## 前置条件

- 本机前端与后端服务已启动。
- 使用本项目本机演示账号登录。
- 不需要管理员权限、真实服务、注册表访问或主机加固工具。

## 使用方式

1. 访问 `/labs/host/service-permission-audit/vuln`，观察风险配置的固定发现计数与服务替换风险被接受的路径。
2. 切换到 `/labs/host/service-permission-audit/fixed`，选择加固路径并阻断未授权服务修改。
3. 载入正常复核路径，确认加固基线凭固定控制正常通过。
4. 在实验详情或账户中心复盘统一事件日志的安全摘要。

## 安全边界

- 固定服务配置只存在于服务端内存常量，不调用 Windows API、PowerShell、`sc.exe`、WMI、注册表或文件系统。
- 页面和 API 不接受服务名、路径、ACL、SID、账号、主机、命令、注册表键、凭据或自由文本。
- 未知 key 会被脱敏阻断，不回显原始输入，也不写入事件日志。
- 本实验不提供 `exploit.py`，不描述服务替换操作步骤，也不执行任何真实权限或服务变更。

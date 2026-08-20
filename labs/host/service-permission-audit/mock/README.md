# 固定服务配置说明

本目录表示服务端内存中的固定虚构服务配置，不保存、导出或采集任何真实主机数据。

- 固定案例 key：`fixed-windows-service-permission-audit`。
- 虚构服务：`virtual-update-service-risky`、`virtual-update-service-hardened`。
- 虚构运行身份：`virtual-local-system`、`virtual-service-account`。
- 路径前缀统一为 `C:\LabVirtual\`，不映射真实文件或目录。
- ACL 只使用语义枚举：`users-write`、`administrators-write`、`system-only`、`users-change`、`administrators-change`。

禁止在本目录加入真实主机名、服务名、账号、SID、SDDL、ACE、注册表键、文件路径、凭据或可执行文件。

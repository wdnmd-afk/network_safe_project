# 加固复盘版

加固复盘版使用同一固定案例，先选择 `harden-path-and-service-acl`，再对比两条处置路径：

- `block-unprivileged-service-modification`：阻断低权限目录写入与服务配置修改，返回 `host-service-permission-audit-defense-blocked`（HTTP 403）。
- `verify-hardened-service-baseline`：依据加引号路径、收敛 ACL 和虚构服务账号复核基线，返回 `host-service-permission-audit-normal-verified`（HTTP 200）。

两条路径共同说明权限收敛只阻断未授权变更，不影响正常运维复核。所有结论都基于固定虚构配置，不修改真实服务、注册表、ACL 或凭据。

# 风险观察版

风险观察版推荐固定路径：

1. `accept-user-writable-unquoted-path`：接受 `virtual-update-service-risky` 的高权限运行身份、未加引号路径和两处低权限可写 ACL。
2. `allow-unprivileged-service-replacement`：接受未授权服务替换风险，不做权限收敛。

终止信号为 `host-service-permission-audit-risk-accepted`，固定计数为 4 项发现、2 项关键发现、0 项加固控制。该结果只描述教学审计结论，不读取真实服务配置，也不执行任何替换或权限修改动作。

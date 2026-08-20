# 手工验证矩阵

## 固定契约

- scenarioKey：`fixed-windows-service-permission-audit`。
- 第一阶段 optionKey：`accept-user-writable-unquoted-path`、`harden-path-and-service-acl`。
- 第二阶段 optionKey：`allow-unprivileged-service-replacement`、`block-unprivileged-service-modification`、`verify-hardened-service-baseline`。

## 路径一：漏洞版风险接受

1. 打开 `/labs/host/service-permission-audit/vuln`。
2. 选择 `accept-user-writable-unquoted-path` 和 `allow-unprivileged-service-replacement`。
3. 预期 HTTP 200、decision 为 `accepted`、signal 为 `host-service-permission-audit-risk-accepted`。
4. 预期配置摘要为 `virtual-update-service-risky`：4 项发现、2 项关键发现、0 项加固控制。

## 路径二：修复版防御阻断

1. 打开 `/labs/host/service-permission-audit/fixed`。
2. 选择 `harden-path-and-service-acl` 和 `block-unprivileged-service-modification`。
3. 预期 HTTP 403、decision 为 `blocked`、signal 为 `host-service-permission-audit-defense-blocked`。
4. 预期配置摘要为 `virtual-update-service-hardened`：0 项发现、0 项关键发现、4 项加固控制。

## 路径三：修复版正常复核

1. 保持 `harden-path-and-service-acl`。
2. 选择 `verify-hardened-service-baseline`。
3. 预期 HTTP 200、decision 为 `accepted`、signal 为 `host-service-permission-audit-normal-verified`。
4. 预期 disposition 为 `hardened-baseline-verified`，证明加固后正常运维复核仍可完成。

## 路径四：边界阻断

1. 提交未登记 scenarioKey / optionKey、只提交第一阶段，或在终止步骤后追加多余决策。
2. 预期返回 `host-service-permission-audit-boundary-blocked` 或 `path-incomplete` 对应的脱敏阻断结果。
3. 响应与事件日志不得包含原始未知 key、真实服务名、路径、ACL、SDDL、SID、账号、主机、注册表键或凭据。

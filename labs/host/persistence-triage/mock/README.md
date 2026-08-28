# 固定持久化条目教学数据说明

## 数据定位

本目录说明本实验使用的固定教学数据来源与边界。实验运行时不读取本目录文件，两份条目快照以冻结常量形式存在于服务端 `apps/server/src/services/persistence-triage-lab.ts`。

## 固定条目快照

| 条目 | 姿态 | 签名 | 映像路径 ACL | 触发器 | 运行账户 | 变更审计 | 可篡改 |
|---|---|---|---|---|---|---|---|
| `virtual-unsigned-autorun-entry` | vulnerable | `unsigned` | `user-writable` | `logon-high-frequency` | `high-privilege-account` | `none` | 是 |
| `virtual-signed-managed-task` | hardened | `publisher-verified` | `admin-only-writable` | `scheduled-window` | `least-privilege-account` | `change-audited-and-alerted` | 否 |

## 计数口径

审计计数由固定语义枚举确定性推导，不做概率或随机计算：

- 关键风险计数：`未签名 + 用户可写路径` 组合算 1 项，`标准用户可篡改` 算 1 项。
- 加固控制计数：签名校验、仅管理员可写路径、受控计划窗口、最小权限账户、变更审计各算 1 项。

实测锁定值：风险条目 4 项发现 / 2 项关键风险 / 0 项加固控制；加固条目 0 / 0 / 5。

## 数据边界

- 所有标识统一使用 `virtual-` 前缀，不含真实主机名、真实任务名、真实注册表路径、账户名或 SID。
- 触发器、账户与审计范围只使用语义枚举，不含真实命令行、映像路径或计划任务 XML。
- 不含任何可直接导入真实系统的计划任务定义、注册表脚本或启动项清单。
- 教学数据只用于固定研判与决策复盘，不构成真实持久化操作指引。

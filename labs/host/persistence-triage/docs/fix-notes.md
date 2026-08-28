# 持久化加固修复思路

> 本文档只说明固定教学数据上的加固语义，不涉及对真实主机的任何变更操作。

## 修复目标

把"任何人都能悄悄新增并替换一个高权限自启项"变成"发布者可验证、路径不可被普通用户写、触发受控、账户最小权限、变更可审计"。

## 五项加固控制

固定加固条目 `virtual-signed-managed-task` 登记的五项控制，逐项对应风险条目的一处弱点：

| 控制 | 风险侧取值 | 加固侧取值 | 作用 |
|---|---|---|---|
| 签名校验 | `unsigned` | `publisher-verified` | 发布者可验证，替换映像会破坏签名 |
| 映像路径 ACL | `user-writable` | `admin-only-writable` | 标准用户无法写入被高权限执行的映像 |
| 触发范围 | `logon-high-frequency` | `scheduled-window` | 触发收敛到受控窗口，减少重复执行机会 |
| 运行账户 | `high-privilege-account` | `least-privilege-account` | 即使被利用，影响面也被限制 |
| 变更审计 | `none` | `change-audited-and-alerted` | 新增或修改会留下审计与告警 |

五项同时成立后，`tamperableByStandardUser` 为 `false`，固定审计摘要变为 0 项发现、0 项关键风险、5 项加固控制。

## 为什么五项要一起看

单独一项都不足以消除持久化风险：

- 只加签名校验，但映像路径仍可写：攻击者可替换为另一个已签名但恶意的可执行体，或利用加载顺序问题。
- 只收敛路径 ACL，但仍未签名且无审计：合法变更与非法变更无法区分。
- 只降低运行账户权限，但触发频率高且无审计：驻留能力依然存在，只是影响面变小。

所以修复版把五项作为一个整体基线，而不是可选项清单。

## 三条固定路径

- 风险路径：`accept-unsigned-autorun-entry` → `approve-persistence-retention`，信号 `host-persistence-triage-risk-accepted`。
- 防御路径：`harden-signature-and-path-acl` → `block-and-remove-persistence`，信号 `host-persistence-triage-defense-blocked`，HTTP 403。
- 正常路径：`harden-signature-and-path-acl` → `verify-managed-autorun-baseline`，信号 `host-persistence-triage-normal-verified`。

正常路径的意义在于证明加固不是"把功能一律禁掉"：受控的、已签名的、最小权限的自启项仍然可以通过复核继续运行。

## 边界

- 所有加固语义只作用于服务端内存中的固定条目快照，不修改真实主机的任务、启动项、ACL 或审计策略。
- 页面与 API 只接受已登记的 `scenarioKey` 与 `optionKey`，未知输入被脱敏阻断且不回显原始值。
- 事件日志只记录固定条目 key、审计计数、步骤数、终止结果和学习信号。
- 不提供 `exploit.py`、持久化脚本或任何真实主机变更能力。

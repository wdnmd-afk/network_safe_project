# 持久化研判实验脚本

本目录只提供本机只读一致性验证脚本，不提供任何持久化创建、修改或提权能力。

## 脚本清单

| 文件 | 语言 | 作用 |
|---|---|---|
| `verify.ts` | TypeScript | 反向核对元数据、路由顺序、固定 key、审计计数、文档与禁用能力 |

## 运行方式

```bash
pnpm --filter @network-safe/server exec tsx ../../tools/lab-scripts/host/persistence-triage/verify.ts
```

该脚本已纳入根级 `pnpm test:controlled`，因此 `pnpm verify` 会一并执行。

## 脚本边界

- 只读取仓库内的元数据、文档、实现与测试文件，并复用服务端固定条目常量。
- 不发起 HTTP 请求，不连接外部目标。
- 不读取真实注册表、计划任务、文件系统 ACL 或系统凭据。
- 不创建、修改或删除任何真实计划任务与启动项。
- 不提供 `exploit.py`，也不提供持久化载荷、驻留脚本或提权步骤。

## 判定口径

审计计数由固定虚构条目的语义枚举确定性推导：

- 关键风险只统计两类：签名缺失叠加镜像路径用户可写，以及标准用户可篡改。
- 加固控制统计五项：发布者签名、仅管理员可写路径、计划窗口触发、最小权限运行账户、变更审计告警。

当前锁定值：`virtual-unsigned-autorun-entry` 为 4 发现 / 2 关键风险 / 0 加固控制；`virtual-signed-managed-task` 为 0 / 0 / 5。

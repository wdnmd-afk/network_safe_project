# 固定批次快照数据说明

## 数据来源

本实验的两份 Webhook 批次快照是 `apps/server/src/services/rate-limit-idempotency-lab.ts` 中的内存冻结常量，通过 `Object.freeze` 锁定，不从磁盘、数据库或外部服务加载。

本目录只做数据说明，不存放可执行样本、真实签名密钥或可迁移的请求器脚本。

## 固定批次

| batchKey | 姿态 | quotaScope | idempotencyScope | timestampScope | degradeScope | 重放被重复处理 |
|---|---|---|---|---|---|---|
| `virtual-unthrottled-replayable-batch` | vulnerable | `unlimited` | `none` | `none` | `none` | 是 |
| `virtual-quota-idempotent-batch` | hardened | `windowed-quota` | `idempotency-key-required` | `signed-window` | `throttle-then-degrade` | 否 |

## 确定性计数规则

- 发现总数：直接取快照 `findings` 数组长度。
- 关键组合风险：`quotaScope === "unlimited" && degradeScope === "none"` 计 1，`replayProcessedTwice === true` 计 1。
- 资源控制数：`windowed-quota`、`idempotency-key-required`、`signed-window`、`throttle-then-degrade` 各计 1。

固定值为风险批次 4 / 2 / 0，加固批次 0 / 0 / 4。这些值同时被服务端测试与只读验证器锁定。

## 边界

- 所有标识使用 `virtual-` 前缀，不含真实端点、域名、密钥或客户端 ID。
- 范围字段只使用语义枚举，不承载真实限流配置或签名算法参数。
- 不发起真实并发请求，不做压测，不连接外部 Webhook 服务。

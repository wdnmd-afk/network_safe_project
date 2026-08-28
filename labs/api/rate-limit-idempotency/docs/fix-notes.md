# 配额与幂等收敛修复思路

本文件说明修复版如何在固定 Webhook 批次快照上收敛资源与重放边界。所有判定都由固定语义枚举确定性推导，不修改真实服务、不调整真实限流器，也不重放真实 Webhook。

## 修复目标

把 `virtual-unthrottled-replayable-batch` 的四要素收敛为 `virtual-quota-idempotent-batch` 的加固基线，使关键组合风险归零，并保证正常业务批次仍可通过复核。

## 四项资源控制

修复版要求以下四项同时成立，计为 4 项资源控制：

- `quotaScope` 由 `unlimited` 收敛为 `windowed-quota`：在固定时间窗内约束请求量上限。
- `idempotencyScope` 由 `none` 收敛为 `idempotency-key-required`：同一幂等键只产生一次副作用。
- `timestampScope` 由 `none` 收敛为 `signed-window`：超出签名时间窗的陈旧请求被拒绝。
- `degradeScope` 由 `none` 收敛为 `throttle-then-degrade`：超载时先节流再降级，而不是整体失败。

四项同时成立后，`replayProcessedTwice` 变为 `false`，固定加固批次的发现数与关键组合风险均为 0。

## 为什么修复有效

- 配额与降级组合解决容量问题：配额限制入口速率，降级保证超限时仍有可控的服务退化路径，而不是资源耗尽后全局不可用。
- 幂等键与签名时间窗组合解决重放问题：幂等键使重复投递收敛为一次副作用，时间窗使陈旧请求无法被无限期重放。缺任一项都留有绕过空间——只有幂等键时陈旧请求仍可长期滞留，只有时间窗时窗口内的重复投递仍会双花。
- 关键组合风险只在"无配额且无降级"或"重放被重复处理"时计数，因此这四项是消除关键风险的最小充分集合。

## 正常流程仍然可用

修复版第二步提供 `verify-throttled-baseline` 正常路径：确认四项资源控制均已登记后，固定正常批次仍可通过复核并返回 `api-rate-limit-idempotency-normal-verified`。这证明收敛配额与幂等不会阻断合法业务批次，只阻断超载与重放。

## 边界

- 修复判定只作用于固定虚构批次快照，不调整真实限流配置、网关策略或消息队列。
- 不调用真实 Webhook 端点、消息队列或外部 API，也不读取本机签名密钥与端点配置。
- 页面与 API 只接受已登记 `scenarioKey` 与 `optionKey`，未知输入被脱敏阻断。
- 事件日志只记录固定批次 key、三项计数、步骤数、终止结果与学习信号。
- 本实验不提供 `exploit.py`、批量请求器或真实并发压测能力。

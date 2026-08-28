# 漏洞版：API 过载与重放风险观察

## 版本定位

本版本用于观察固定批次 `virtual-unthrottled-replayable-batch` 在缺失四项资源控制时的组合风险。

## 固定风险要素

- 配额范围 `unlimited`：单客户端在固定时间窗内不受请求数量限制。
- 幂等范围 `none`：相同业务事件重复投递时被重复处理。
- 时间窗范围 `none`：过期或超前时间戳的请求同样被接受。
- 降级范围 `none`：过载时没有节流或降级路径，资源被直接耗尽。

固定统计：4 项发现、2 项关键组合风险、0 项资源控制。关键风险为"无配额且无降级"与"重放被重复处理"。

## 推荐路径

1. `accept-unthrottled-replayable-batch`
2. `approve-overload-and-replay`

完成后应出现 `api-rate-limit-idempotency-risk-accepted` 学习信号。

## 安全边界

- 只显示 `virtual-*` 虚构标识与语义枚举，不含真实端点、签名或密钥。
- 不发起真实并发请求，不进行压测，也不提供重放工具。
- 未知 scenarioKey 与 optionKey 会被脱敏阻断，不回显原始输入。
- 本版本不提供 `exploit.py`。

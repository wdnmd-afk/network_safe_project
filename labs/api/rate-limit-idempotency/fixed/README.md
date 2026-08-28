# 修复版：配额、幂等与降级复盘

## 版本定位

本版本用于对比固定批次 `virtual-quota-idempotent-batch` 在四项资源控制同时成立后的审计结果，并验证受控正常基线仍可继续。

## 固定加固要素

- 配额范围 `windowed-quota`：固定时间窗内限制单客户端请求数量。
- 幂等范围 `idempotency-key-required`：相同业务事件重复投递只被处理一次。
- 时间窗范围 `signed-window`：超出签名时间窗的请求被拒绝。
- 降级范围 `throttle-then-degrade`：过载时先节流再降级，而不是耗尽资源。

固定统计：0 项发现、0 项关键风险、4 项资源控制，重放不会被重复处理。

## 推荐路径

- 防御路径：`enforce-quota-and-idempotency` → `block-overload-and-replay`，出现 `api-rate-limit-idempotency-defense-blocked`。
- 正常路径：`enforce-quota-and-idempotency` → `verify-throttled-baseline`，出现 `api-rate-limit-idempotency-normal-verified`。

正常路径用于证明施加配额与幂等后，受控业务请求依旧能被正常受理，不是"一律拒绝"。

## 安全边界

- 只验证固定资源控制摘要，不调用真实网关、消息队列、限流中间件或外部 Webhook 服务。
- 不读取真实签名密钥、Webhook secret 或本机凭据。
- 页面与 API 只接受已登记 scenarioKey 与 optionKey，未知输入脱敏阻断。
- 本版本不提供 `exploit.py`。

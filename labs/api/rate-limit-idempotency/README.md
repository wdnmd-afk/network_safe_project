# API 配额限流与 Webhook 幂等固定审计

## 场景目标

对比两份虚构 Webhook 请求批次快照，观察窗口配额、幂等键、签名时间窗和过载降级四要素的组合影响，并完成两步资源消耗处置决策。

固定案例为 `fixed-webhook-batch-quota-audit`。所有批次标识、请求摘要与端点名都是服务端内存冻结常量，统一使用 `virtual-*` 前缀，不映射真实端点，也不发起任何真实请求。

## 固定批次快照

- `virtual-unthrottled-replayable-batch`：配额 `unlimited`、幂等 `none`、时间窗 `none`、降级 `none`，重放被重复处理；固定 4 项发现、2 项关键组合风险、0 项资源控制。
- `virtual-quota-idempotent-batch`：配额 `windowed-quota`、幂等 `idempotency-key-required`、时间窗 `signed-window`、降级 `throttle-then-degrade`，重放不被重复处理；固定 0 项发现、0 项关键风险、4 项资源控制。

关键组合风险只统计两类：无配额且无降级导致的资源耗尽，以及重放被重复处理。

## 固定决策

- 第一阶段 `webhook-batch-scope-assessment`：`accept-unthrottled-replayable-batch` 或 `enforce-quota-and-idempotency`。
- 第二阶段 `webhook-batch-decision`：`approve-overload-and-replay`、`block-overload-and-replay` 或 `verify-throttled-baseline`。
- 风险信号：`api-rate-limit-idempotency-risk-accepted`。
- 防御信号：`api-rate-limit-idempotency-defense-blocked`。
- 正常信号：`api-rate-limit-idempotency-normal-verified`。
- 边界阻断信号：`api-rate-limit-idempotency-boundary-blocked`。

## 前置条件

- 本机前端与后端服务已启动。
- 使用本项目本机演示账号登录。
- 不需要真实 Webhook 端点、签名密钥或任何外部服务。

## 使用方式

1. 访问 `/labs/api/rate-limit-idempotency/vuln`，观察无配额批次的固定发现计数与过载重放被批准的路径。
2. 切换到 `/labs/api/rate-limit-idempotency/fixed`，选择收敛路径并阻断过载重放。
3. 载入受控基线路径，确认施加配额与幂等后正常批次仍能通过复核。
4. 在实验详情或账户中心复盘统一事件日志的安全摘要。

## 安全边界

- 固定批次快照只存在于服务端内存常量，不连接真实 Webhook 端点、消息队列或上游服务。
- 不发起真实并发请求，不进行压测，也不提供批量请求器或重放工具。
- 页面和 API 不接受端点 URL、签名、密钥、请求正文或自由文本。
- 未知 key 会被脱敏阻断，不回显原始输入，也不写入事件日志。
- 本实验不提供 `exploit.py`，不输出可直接用于真实环境的重放载荷或压测脚本。

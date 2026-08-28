# API 配额与幂等审计手工验证矩阵

本文件记录三条 canonical 固定路径的手工验证方式。全部验证只在本机进行，只使用固定虚构批次快照，不发起真实并发请求，也不重放真实 Webhook。

## 前置条件

- 本机后端服务运行于 `http://127.0.0.1:6667`。
- 本机前端已启动，或已通过 nginx 托管构建产物。
- 使用本项目本机演示账号登录。
- 不需要真实 Webhook 端点、签名密钥、消息队列或网关配置。

## 固定案例

- `scenarioKey`：`fixed-webhook-batch-quota-audit`
- 风险批次：`virtual-unthrottled-replayable-batch`（4 项发现、2 项关键组合风险、0 项资源控制）
- 加固批次：`virtual-quota-idempotent-batch`（0 项发现、0 项关键风险、4 项资源控制）

## 验证矩阵

| 编号 | 路径 | 决策序列 | 期望 HTTP | 期望信号 |
|---|---|---|---|---|
| V1 | 风险 | `accept-unthrottled-replayable-batch` → `approve-overload-and-replay` | 200 | `api-rate-limit-idempotency-risk-accepted` |
| V2 | 防御 | `enforce-quota-and-idempotency` → `block-overload-and-replay` | 403 | `api-rate-limit-idempotency-defense-blocked` |
| V3 | 正常 | `enforce-quota-and-idempotency` → `verify-throttled-baseline` | 200 | `api-rate-limit-idempotency-normal-verified` |

## V1 风险路径

1. 访问 `/labs/api/rate-limit-idempotency/vuln`。
2. 确认页面显示两份 `virtual-*` 批次快照与四要素语义枚举。
3. 载入推荐路径，运行固定审计。
4. 期望：HTTP 200，决策 `accepted`，信号 `api-rate-limit-idempotency-risk-accepted`，关键组合风险计数为 2，处置为 `overload-and-replay-approved`。

## V2 防御路径

1. 访问 `/labs/api/rate-limit-idempotency/fixed`。
2. 载入推荐路径（收敛配额与幂等 → 阻断超载与重放）。
3. 运行固定审计。
4. 期望：HTTP 403，决策 `blocked`，信号 `api-rate-limit-idempotency-defense-blocked`，资源控制计数为 4，`blockedReason` 为 `overload-and-replay-blocked`。

## V3 正常路径

1. 停留在修复版页面，点击「节流正常基线」载入正常路径。
2. 运行固定审计。
3. 期望：HTTP 200，决策 `accepted`，信号 `api-rate-limit-idempotency-normal-verified`，处置为 `throttled-baseline-verified`，证明收敛后合法批次仍可通过。

## 边界阻断验证

1. 直接向 `/api/labs/api/rate-limit-idempotency/vuln/evaluate` 提交未登记的 `scenarioKey` 或 `optionKey`。
2. 期望：HTTP 403，信号 `api-rate-limit-idempotency-boundary-blocked`，`scenarioKey` 返回 `blocked-scenario`，响应与事件日志都不回显原始输入。
3. 只提交一个决策（路径未完成）时，期望 `blockedReason` 为 `path-incomplete`；在终止步骤后追加决策时，期望 `blockedReason` 为 `decisions-after-terminal`。

## 事件日志复核

1. 在实验详情或账户中心查看统一事件日志。
2. 确认只记录固定批次 key、发现数、关键组合风险数、资源控制数、步骤数、终止结果与学习信号。
3. 确认日志不含真实端点 URL、签名密钥、幂等键原值、队列名或任何原始请求体。

## 自动化对照

- 只读一致性验证：`tools/lab-scripts/api/rate-limit-idempotency/verify.ts`
- 服务端 API 测试：`apps/server/tests/rate-limit-idempotency-lab.test.ts`
- 本实验不提供 `exploit.py`，不提供批量请求器或真实并发压测脚本。

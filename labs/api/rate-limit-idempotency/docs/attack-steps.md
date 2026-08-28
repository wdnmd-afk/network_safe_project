# 资源耗尽与重放风险观察步骤

本文件描述在固定 Webhook 批次快照上观察风险的步骤。全部操作只作用于服务端内存中的虚构批次，不发起真实并发请求，不重放真实 Webhook，也不连接任何外部端点。

## 前置条件

- 本机前端与后端服务已启动。
- 使用本项目本机演示账号登录。
- 不需要真实 Webhook 端点、签名密钥或压测工具。

## 观察步骤

1. 访问 `/labs/api/rate-limit-idempotency/vuln`。
2. 观察工作台返回的两份固定批次：`virtual-unthrottled-replayable-batch` 与 `virtual-quota-idempotent-batch`。
3. 在第一步 `webhook-batch-scope-assessment` 选择 `accept-unthrottled-replayable-batch`，表示接受 `unlimited` 配额、`none` 幂等、`none` 时间戳与 `none` 降级的组合。
4. 在第二步 `webhook-batch-decision` 选择 `approve-overload-and-replay`。
5. 观察服务端返回 `api-rate-limit-idempotency-risk-accepted` 与 `overload-and-replay-approved`。

## 观察到的组合风险

固定风险批次同时具备四项发现，其中两项被计为关键组合风险：

- 无配额上限叠加无降级策略：请求量可无约束增长，直至资源耗尽。
- 重放请求被重复处理：缺少幂等键使同一业务事件被执行两次。

另外两项发现是缺少幂等键要求与缺少签名时间窗，它们是上述两类关键风险的根因条件。

## 根因

- 配额缺失使单一客户端可占满共享容量，其他调用方被动降级。
- 降级策略缺失使超载时没有可控的退化路径，只能整体失败。
- 幂等键缺失使网络重试与恶意重放无法区分，副作用被重复施加。
- 签名时间窗缺失使陈旧请求可被无限期重放。

## 边界

- 本步骤只读取固定快照并做确定性计数，不执行真实请求。
- 页面与 API 不接受端点 URL、签名密钥、客户端 ID 或请求正文。
- 未知 `scenarioKey` 与 `optionKey` 会被脱敏阻断，不回显原始输入。
- 本实验不提供 `exploit.py`、批量请求器或压测脚本。

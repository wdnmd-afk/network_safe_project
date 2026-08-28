# API 配额与幂等审计脚本目录

本目录只包含本机只读一致性验证脚本，服务于 `api.rate-limit-idempotency` 受控学习场景。

## 内容

- `verify.ts`：本机只读一致性验证。核对元数据、路由注册顺序、固定 key、审计计数、文档与禁用能力。

## 使用方式

```bash
pnpm --filter @network-safe/server exec tsx ../../tools/lab-scripts/api/rate-limit-idempotency/verify.ts
```

该脚本已纳入根级 `pnpm test:controlled` 与 `pnpm verify` 门禁。

## 边界

- 脚本只读取仓库内元数据、文档、实现与测试文件，并复用服务端固定批次常量。
- 不发起 HTTP 请求，不连接真实 Webhook 端点、消息队列、API 网关或外部目标。
- 不发起真实并发请求，不重放真实签名事件，不读取本机签名密钥或网关配置。
- 本目录不提供 `exploit.py`，也不提供批量请求器、压测器或重放工具。
- 审计计数只由固定虚构批次的语义枚举确定性推导。

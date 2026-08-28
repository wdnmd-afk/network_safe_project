# LT-037 业务竞态与幂等固定实验执行文档

## 1. 目标

新增 `business-logic.race-condition` 专用 D3 模拟，使用固定单库存、双请求快照学习无锁读写、幂等键和版本校验。

## 2. 固定模型与状态机

- 固定资源：`virtual-limited-stock-item`，初始库存 1。
- 固定请求：两个请求共享同一业务动作摘要；漏洞路径均基于版本 7 读取库存 1。
- 请求只接受 `scenarioKey: fixed-single-stock-double-request` 和有序 `decisions`。

两步决策：

1. `read-then-write-without-version` / `enforce-idempotency-and-version-check`。
2. `accept-both-stock-decrements` / `block-duplicate-or-stale-request` / `allow-single-unique-request`。

不接收商品 ID、库存、金额、幂等值、时间或自由文本，不执行真实并发或数据库事务。

## 3. 范围、风险与验证

- 交付专用服务/API、页面、路由、元数据、事件摘要、标准文档、测试和只读验证器。
- 页面只展示两个固定请求和库存/版本结果，不提供压测或并发请求工具。
- 验证专项脚本、服务/API/前端测试、entrypoints、coverage、`pnpm verify`。

## 4. 完成条件

- 风险路径展示超卖/双扣摘要，防御路径阻断重复或陈旧请求，正常路径完成单次合法扣减。

## 5. 验证结果（2026-08-27）

- 专项只读验证 `ok: true`，含 canonical 路径、混合路径阻断、变体绑定、未知 key 脱敏和标准文件检查。
- API/前端测试、Web/API 入口门禁、覆盖矩阵、根级 `pnpm verify` 和 Playwright 三向回归均通过。
- 元数据已推进为 `ready` 并启用 E6。

# LT-032 API 路由与元数据入口一致性执行文档

## 1. 目标

建立 `meta.json entrypoints.api` 与 Express 实际路由的双向一致性检查，并纳入根级 `verify` 与 CI。

## 2. 范围与步骤

1. 通过 Express 5 `app.router.stack[].route` 读取结构化路由和 HTTP method。
2. 按静态段、`:param` 和参数正则匹配具体元数据路径。
3. 校验 API 入口 key、variant、method、path 和首个匹配路由。
4. 反向确认实验运行时路由至少被一个元数据 API 入口覆盖。
5. 明确排除平台共享入口：实验列表/详情、学习进度和验证记录。
6. 增加缺失、重复、method 错配、variant 错配和孤立路由测试。
7. 接入 `pnpm verify` 与 CI。

## 3. 实施建议与风险

- 不解析 `app.ts` 源码字符串；以 Express 已注册路由结构为事实来源。
- 动态 `:variant` 路由必须按真实参数语义匹配，不能用包含判断。
- 通用引导式路由可覆盖多个具体元数据入口，但专用路由必须保持声明顺序优先。

## 4. 优化与验证

- 复用 LT-028 的路径段匹配思想，API method 单独归一化。
- 验证：`pnpm test:api-entrypoints`、相关单元测试、`pnpm verify`、`git diff --check`。

## 5. 完成条件

- 全部元数据 API 入口均匹配真实路由，全部实验运行时路由均有元数据证据。
- 报告错误为 0，并纳入根级门禁和 CI。


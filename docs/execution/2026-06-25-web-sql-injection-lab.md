# 阶段 B：SQL 注入纵向实验执行文档

## 1. 目标

按 `docs/execution/security-lab-master-goal.md` 的阶段 B 优先级，落地 `web.sql-injection` 纵向实验。实验需要从攻击方视角开始，让学习者观察 SQL 注入如何把普通商品搜索变成越权数据读取；随后通过修复版理解参数化查询为什么能阻断同样输入。

本实验完成后应具备：

- 正常业务搜索流程。
- 漏洞版搜索接口与页面。
- 修复版搜索接口与页面。
- 受控攻击样例与成功 / 阻断信号。
- 后端控制台结构化日志。
- `lab_event_logs` 数据库实验事件日志。
- 本机受控验证脚本。
- API / 前端模型 / API client / 元数据测试。
- 实验文档、攻击步骤、修复说明和手动验证说明。

## 2. 范围

本次包含：

- 新增 SQL 注入场景表 `sql_injection_lab_products` 与本机样例数据。
- 新增 `apps/server/src/services/sql-injection-lab.ts`。
- 新增后端接口：
  - `POST /api/labs/web/sql-injection/:variant/search`
- 新增前端 API、实验模型、页面与路由：
  - `/labs/web/sql-injection/vuln`
  - `/labs/web/sql-injection/fixed`
- 更新 `labs/web/sql-injection/meta.json` 和相关 README / docs。
- 新增 `tools/lab-scripts/web/sql-injection/exploit.py` 与 `verify.ts`。
- 补充服务端、前端和元数据测试。
- 同步 `docs/TODO.md`。

本次不包含：

- 对外部数据库或真实业务系统的扫描、攻击或探测。
- UNION、报错注入、时间盲注、文件读写等高风险能力。
- 通用 SQL 注入攻击工具。
- 管理后台、权限体系或复杂数据库教学全覆盖。

## 3. 实验设计

### 3.1 正常业务

业务场景为“商品安全库存搜索”：

- 正常用户输入关键词，例如 `router`。
- 后端返回公开商品列表。
- 隐藏商品和内部备注不应对普通搜索暴露。

### 3.2 漏洞版

漏洞版后端使用受控的 `$queryRawUnsafe` 字符串拼接查询：

```sql
SELECT ...
FROM sql_injection_lab_products
WHERE is_deleted = 0
  AND name LIKE '%<keyword>%'
  AND is_hidden = 0
```

攻击样例使用本机固定 payload：

```text
%' OR 1=1 #
```

预期观察：

- 漏洞版返回隐藏商品。
- 后端信号为 `sql-injection-data-exposed`。
- 事件日志记录攻击阶段、攻击者视角、被接受的后端决策和结果摘要。

### 3.3 修复版

修复版使用参数化查询：

```sql
WHERE is_deleted = 0
  AND is_hidden = 0
  AND name LIKE ?
```

同样 payload 在修复版中只会被当作普通搜索关键词，不会改变 SQL 结构。

预期观察：

- 修复版阻断 SQL 注入语义。
- 后端信号为 `sql-injection-parameterized-blocked`。
- 事件日志记录防御阶段、攻击者视角、阻断决策和说明。

### 3.4 安全边界

为避免实验变成通用攻击能力：

- 接口必须要求登录。
- 脚本默认只允许访问 `localhost` / `127.0.0.1`。
- 漏洞版只允许演示受控读取类差异。
- 对 `;`、`DROP`、`DELETE`、`UPDATE`、`INSERT`、`ALTER`、`UNION`、`SLEEP`、`BENCHMARK`、`INFORMATION_SCHEMA` 等危险输入进行实验边界阻断。
- 日志只保存输入摘要、payload 类型和结果信号，不保存完整任意 payload。

## 4. 操作步骤

1. 新增场景表迁移 SQL，并写入固定样例商品。
2. 实现 SQL 注入实验服务：
   - variant 校验。
   - 正常搜索。
   - 漏洞版受控 `$queryRawUnsafe`。
   - 修复版参数化查询。
   - 攻击检测与危险输入边界阻断。
   - 输出 query preview、结果、信号和教学说明。
3. 在 `createApp` 注入 `sqlInjectionLabService` 并新增搜索接口。
4. 接口调用统一 `recordLabEvent` 写入控制台和数据库事件日志。
5. 新增前端 API client。
6. 新增前端实验模型与引导式页面。
7. 更新路由和元数据入口。
8. 补齐实验文档、攻击步骤、修复说明、手动验证说明。
9. 新增本机受控脚本和验证入口。
10. 补充测试并运行最小必要验证。
11. 应用迁移 SQL 到本机 MySQL。
12. 更新 `docs/TODO.md` 和主目标阶段状态。

## 5. 实施建议

- API 响应保留 `queryPreview`，但不要返回真实数据库连接信息。
- 漏洞版返回 `isHidden = true` 的记录时，明确标记“攻击成功信号”。
- 修复版遇到攻击样例时使用 403 和 `status: "blocked"`，让前端能直观看到阻断。
- 前端页面提供：
  - 正常关键词按钮。
  - 攻击样例按钮。
  - 后端决策摘要。
  - SQL 结构预览。
  - 返回结果表格。
  - 下一步观察提示。
- 文档必须说明真实生产还需要权限隔离、最小权限账号、错误信息收敛和审计告警。

## 6. 潜在风险分析

- **真实数据库受影响**：迁移只创建本项目场景表，漏洞查询只读该表，危险关键字会被边界阻断。
- **脚本被误用**：脚本默认只面向本机，并拒绝外部 host。
- **日志保存敏感 payload**：统一日志只保存摘要，不保存完整攻击字符串。
- **Prisma 引擎占用**：如生成客户端遇到 Windows DLL 锁，需要先确认并处理本仓库后端 watch 进程。
- **现有工作区改动较多**：只追加 SQL 注入链路，不回滚已有 CSRF、详情页和阶段 A 改动。

## 7. 验证方式

最小必要验证：

- `pnpm --filter @network-safe/server test`
- `pnpm --filter @network-safe/web exec vitest run`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `python tools/lab-scripts/web/sql-injection/exploit.py --help`
- `pnpm --filter @network-safe/server exec prisma db execute --schema ../../database/schema/platform/schema.prisma --file ../../database/migrations/20260625_add_sql_injection_lab_products.sql`

可选验证：

- 运行 `tools/lab-scripts/web/sql-injection/verify.ts`。
- 后续补充 Playwright 闭环后再运行 `pnpm test:e2e`。

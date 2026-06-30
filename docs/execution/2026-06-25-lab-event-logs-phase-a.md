# 阶段 A：统一实验事件日志能力执行文档

## 1. 目标

按 `docs/execution/security-lab-master-goal.md` 的阶段 A 要求，优先落地统一实验事件日志能力，让后续 Web 常见漏洞、JWT、IDOR、权限提升等实验都能复用同一套日志入口。

本阶段完成后，关键实验动作需要同时具备：

- 后端控制台结构化日志，便于开发时即时观察。
- `lab_event_logs` 数据库事件日志，便于后续实验详情页、账号中心和复盘能力读取。
- 明确的脱敏输入摘要，避免保存真实敏感值。
- 最小 API / 单元测试覆盖，证明服务与至少一个实验链路可用。

## 2. 范围

本阶段包含：

- 新增平台核心表 `lab_event_logs`。
- 同步 Prisma schema 与迁移 SQL。
- 新增 `apps/server/src/services/lab-event-logs.ts`。
- 将 `web.csrf` 转账动作作为首个接入样例。
- 补充服务单元测试与 CSRF API 集成断言。
- 同步数据库设计文档与 `docs/TODO.md`。

本阶段不包含：

- 新增日志查询接口或前端日志列表。
- 改造所有历史实验的前端展示。
- 重新设计账号中心或实验详情页。
- 引入外部日志系统。

## 3. 操作步骤

1. 在 Prisma schema 中新增 `LabEventLog` 模型，并与 `User`、`Lab` 建立可选关系。
2. 在数据库迁移 SQL 中新增 `lab_event_logs` 表、常用索引和外键约束。
3. 新增 `lab-event-logs` 服务，提供 `recordLabEvent(input)`。
4. 服务内部统一完成控制台 `[LAB_EVENT]` 输出、数据库写入和数据库异常降级。
5. 修改 `createApp` 支持注入 `labEventLogsService`。
6. 在 CSRF 转账接口中根据漏洞版 / 修复版结果记录事件日志。
7. 补充测试：
   - 服务层：确认控制台日志、仓储写入、数据库异常降级。
   - API 层：确认 CSRF 漏洞版接受、修复版阻断时调用统一日志服务。
8. 同步 `docs/design/database-foundation-schema.md` 与 `docs/TODO.md`。
9. 运行最小必要验证：
   - `pnpm --filter @network-safe/server test`
   - `pnpm --filter @network-safe/server run prisma:validate`
   - `pnpm --filter @network-safe/server run prisma:generate`
   - `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`

## 4. 实施建议

- `lab_event_logs.lab_id` 允许为空，但服务应优先通过 `lab_key` 查找实验主表 ID；查不到时仍保留日志写入能力。
- 输入摘要只保存学习所需信息，例如 `amount`、`targetAccountMasked`、`hasCsrfToken`，不保存真实 token。
- 控制台日志保持单行，格式固定为：

```text
[LAB_EVENT] trace=... lab=... variant=... phase=... decision=... signal=... message="..."
```

- 数据库不可用时，不能影响实验主流程；服务应打印降级日志并返回 `persisted: false`。
- CSRF 首次接入只记录关键转账动作，不把读状态和发 token 的每一步都扩展成日志，避免阶段 A 过度扩张。

## 5. 潜在风险分析

- **Prisma 客户端未生成**：新增模型后旧客户端没有 `labEventLog` 类型，需要运行 `prisma:generate`。
- **数据库迁移未执行**：本地数据库若未应用新 SQL，服务写入会失败；阶段 A 服务应降级，不阻断实验请求。
- **日志保存敏感值**：CSRF token、真实密码、原始 payload 等不得写入日志表；只能保存布尔值、摘要或脱敏值。
- **接口测试受真实数据库影响**：API 测试应通过依赖注入假日志服务验证调用，不依赖真实 MySQL。
- **历史未提交改动较多**：只追加阶段 A 必需文件和最小集成，避免回滚或重写既有 CSRF / 详情页改动。

## 6. 优化方案

后续阶段可以在本能力上继续扩展：

- 增加 `GET /api/lab-events` 查询接口，按实验、用户、trace id、风险等级筛选。
- 在实验详情页展示最近事件日志摘要。
- 将 XSS、SQL 注入、JWT、IDOR 等实验逐步接入统一日志服务。
- 增加日志清理策略，避免本机学习环境长期积累过多数据。
- 为脚本验证增加统一 `script` 事件类型。

## 7. 验证方式

本阶段完成标准：

- Prisma schema 存在 `LabEventLog` 模型。
- 迁移 SQL 存在 `lab_event_logs` 表。
- `recordLabEvent` 同时具备控制台输出、数据库写入和异常降级。
- CSRF 转账接口在漏洞版接受、修复版阻断、修复版通过时记录统一日志。
- 测试覆盖服务层和 CSRF API 日志调用。
- 数据库设计文档与 TODO 已同步阶段 A 状态。
- 最小必要验证命令通过；如因本机数据库连接等环境问题失败，需要明确说明失败原因和影响范围。

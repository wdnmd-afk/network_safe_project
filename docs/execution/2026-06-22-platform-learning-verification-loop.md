# 平台学习与验证闭环执行文档

## 1. 目标

在现有平台骨架、MySQL 登录链路和 `web/xss` 前端样板实验基础上，优先打通平台闭环能力：

- 用户进入实验变体时，可写入学习进度。
- 用户完成受控验证动作时，可写入验证记录。
- 用户可在账户中心查看学习进度与最近验证记录。
- 实验页面可复用统一前端 API 调用后端记录接口。
- `web/xss` 作为第一条闭环样板，为后续 CSRF、SQL 注入、IDOR 等实验复用。

本阶段不扩展新的漏洞场景，不改造数据库表结构，不把 XSS 留言持久化。

## 2. 范围

本次修改范围预计包括：

- `apps/server`
  - 新增平台实验记录服务。
  - 新增学习进度写入接口。
  - 新增验证记录写入接口。
  - 新增当前用户实验记录摘要接口。
  - 新增实验元数据同步至数据库主表的 seed 入口。
  - 必要时新增实验运行记录写入逻辑。
  - 补充后端测试。
- `apps/web`
  - 新增实验记录 API client。
  - 在 `XssLabView.vue` 中接入学习进度和验证记录写入。
  - 在账户中心展示当前用户学习进度与最近验证记录。
  - 补充前端测试。
- `labs/web/xss`
  - 根据实际接口更新元数据或验证说明。
- `docs/TODO.md`
  - 同步平台闭环进度。

本次不修改：

- Prisma schema 和数据库迁移 SQL。
- 登录账号 seed 逻辑。
- 新的实验业务表。
- `tools/lab-scripts/*`。
- nginx 配置。
- 真实攻击脚本或外部目标访问逻辑。

## 3. 字段与接口来源

字段来源以 `database/schema/platform/schema.prisma` 和 `docs/design/database-foundation-schema.md` 为准。

已确认字段如下：

- `learning_progress`
  - `user_id`
  - `lab_id`
  - `current_variant_key`
  - `status`
  - `started_at`
  - `last_viewed_at`
  - `completed_at`
  - `notes`
- `verification_records`
  - `user_id`
  - `lab_id`
  - `variant_key`
  - `verification_type`
  - `result`
  - `summary`
  - `details_json`
  - `triggered_by`
- `lab_run_records`
  - `user_id`
  - `lab_id`
  - `variant_key`
  - `run_type`
  - `entry_key`
  - `status`
  - `started_at`
  - `ended_at`
  - `extra_json`

状态值沿用既有设计文档：

- `learning_progress.status`：`in-progress`、`completed`
- `verification_records.verification_type`：`manual`
- `verification_records.result`：`passed`、`failed`、`blocked`
- `verification_records.triggered_by`：`user`
- `lab_run_records.run_type`：`web`
- `lab_run_records.status`：`started`、`finished`、`error`

## 4. 接口设计

### 4.1 写入学习进度

```text
POST /api/labs/:category/:scene/learning-progress
```

请求体：

```json
{
  "variantKey": "vuln",
  "status": "in-progress",
  "notes": "进入 XSS 漏洞版"
}
```

请求头：

```text
Authorization: Bearer <session-token>
```

行为：

- 必须登录；未登录返回 `401`。
- 根据 `category` 和 `scene` 定位实验元数据。
- 根据元数据 `id` 定位数据库 `labs.lab_key`。
- 对同一 `user_id + lab_id` 执行 upsert。
- 首次进入时写入 `started_at` 和 `last_viewed_at`。
- 再次进入时更新 `current_variant_key`、`status`、`last_viewed_at` 和 `notes`。

响应：

```json
{
  "status": "ok",
  "progress": {
    "labKey": "web.xss",
    "variantKey": "vuln",
    "status": "in-progress"
  }
}
```

### 4.2 写入验证记录

```text
POST /api/labs/:category/:scene/verification-records
```

请求头：

```text
Authorization: Bearer <session-token>
```

请求体：

```json
{
  "variantKey": "vuln",
  "result": "passed",
  "summary": "漏洞版出现 XSS 模拟信号",
  "details": {
    "signal": "data-xss-lab-signal"
  }
}
```

行为：

- 必须登录；未登录返回 `401`。
- 根据 `category` 和 `scene` 定位实验元数据。
- 根据元数据 `id` 定位数据库 `labs.lab_key`。
- 新增一条 `verification_records` 记录。
- 本阶段固定 `verification_type = manual`、`triggered_by = user`。
- 验证记录写入成功后，将学习进度更新为 `completed`，并写入 `completed_at`。

响应：

```json
{
  "status": "ok",
  "record": {
    "labKey": "web.xss",
    "variantKey": "vuln",
    "result": "passed"
  }
}
```

### 4.3 查询当前用户实验记录摘要

```text
GET /api/lab-records/me
```

请求头：

```text
Authorization: Bearer <session-token>
```

行为：

- 必须登录；未登录返回 `401`。
- 返回当前用户最近学习进度和最近验证记录。

响应：

```json
{
  "status": "ok",
  "records": {
    "progress": [],
    "verifications": []
  }
}
```

## 5. 操作步骤

1. 后端先写失败测试：
   - 未登录写学习进度返回 `401`。
   - 登录后写学习进度调用记录服务并返回 `status: ok`。
   - 登录后写验证记录调用记录服务并返回 `status: ok`。
   - 未知实验返回 `404`。
2. 实现后端记录服务：
   - 通过 `labRegistry.getLab(category, scene)` 读取元数据。
   - 通过 `labs.lab_key` 查询数据库实验。
   - 写入 `learning_progress` 和 `verification_records`。
   - 保持服务可注入，便于测试使用假实现，不强依赖真实 MySQL。
3. 接入 Express 路由：
   - 复用现有 `authService.getCurrentUser(token)`。
   - 统一解析 Bearer token。
   - 对请求体做最小字段校验，不猜测额外字段。
4. 前端先写失败测试：
   - API client 发送学习进度请求时带 Bearer token。
   - API client 发送验证记录请求时带 Bearer token。
5. 实现前端 API client。
6. 接入 `XssLabView.vue`：
   - 页面变体加载或切换时，如果存在登录 token，写学习进度。
   - 用户提交样例 payload 后，根据当前变体写验证记录。
   - 未登录时不阻断实验页面，只跳过记录写入。
7. 接入账户中心：
   - 登录后读取 `/api/lab-records/me`。
   - 展示学习进度和最近验证记录。
   - 记录读取失败不影响账户基础资料展示。
8. 更新 XSS 文档和 TODO：
   - 明确 XSS 已接入学习与验证记录闭环。
   - 保留“留言不持久化”的边界说明。
9. 执行最小验证。

## 6. 实施建议

- 后端新增 `lab-records` 服务，避免把 Prisma 写入逻辑堆进 `app.ts`。
- `app.ts` 只负责 HTTP 解析、鉴权、状态码和服务调用。
- 前端新增 `apps/web/src/api/lab-records.ts`，不要把记录逻辑塞进 `labs.ts` 的元数据读取逻辑。
- `XssLabView.vue` 只负责在明确动作点触发记录，不展示复杂记录状态。
- 本阶段新增 `seed:labs` 同步入口；记录接口依赖数据库中存在对应 `labs.lab_key`。

## 7. 潜在风险分析

- 当前后端 `/api/labs` 来自文件系统元数据，但记录表依赖数据库 `labs` 主表。新环境需要先执行 `seed:labs` 同步实验主数据。
- 认证账号与实验主数据使用不同 seed：`seed:auth` 创建演示用户，`seed:labs` 同步 `lab_categories`、`labs` 和 `lab_variants`。
- 若为了绕过数据库缺口直接写字符串记录，会破坏当前强外键设计，因此本阶段不这样做。
- `XssLabView.vue` 未登录时应继续可学习，不能因记录接口失败阻断实验。
- 验证记录本阶段属于“用户手动确认式记录”，不是安全扫描或自动化判定。

## 8. 优化方案

本轮已新增元数据同步 seed，将 `labs/*/*/meta.json` 同步到 `lab_categories`、`labs`、`lab_variants`。

后续优化方向：

1. 将学习记录与验证记录进一步展示到实验详情页，并补充更明确的验证入口。
2. 增加实验主数据同步的独立文档。
3. 后续按场景扩展实验业务表时，继续保持平台核心表与场景表分离。

## 9. 验证方式

最小验证：

```powershell
pnpm --filter @network-safe/server test
pnpm --filter @network-safe/web run test -- --run
```

补充验证：

```powershell
pnpm --filter @network-safe/shared test
pnpm --filter @network-safe/testing test
```

端到端闭环验证：

```powershell
pnpm test:e2e
```

该命令会先执行 `seed:auth` 和 `seed:labs`，再验证登录演示用户、进入 `web/xss` 修复版、提交样例、到账户中心查看学习进度与最近验证记录。

本机数据库同步：

```powershell
pnpm --filter @network-safe/server seed:labs
```

如本机 MySQL 已完成实验主数据同步，可追加手动接口验证：

```powershell
pnpm dev:server
pnpm dev:web
```

然后登录 `demo_user / Demo@123456`，访问：

```text
http://localhost:6670/labs/web/xss/vuln
```

## 10. 完成标准

本阶段完成标准：

- 后端提供学习进度和验证记录写入接口。
- 接口具备未登录、未知实验、成功写入的测试覆盖。
- 前端具备记录 API client 测试。
- XSS 页面进入和提交验证时会尝试写入记录。
- `seed:labs` 可将一期实验元数据同步到数据库主表。
- 账户中心可展示学习进度与最近验证记录。
- 未登录或记录失败不会阻断 XSS 实验本身。
- TODO 与 XSS 文档同步当前边界。

# 单个实验详情页执行文档

## 1. 目标

新增单个实验自己的详情页，让用户可以从实验列表进入 `/labs/:category/:scene`，查看实验元数据、知识点、变体入口、文档入口、验证方式，以及当前登录用户在该实验下的学习进度和最近验证记录。

本阶段以 `web/xss` 作为首个可验证样板，但页面必须按通用实验元数据实现，后续 CSRF、SQL 注入、IDOR 等场景可直接复用。

## 2. 范围

本次修改范围：

- `apps/web`
  - 扩展实验元数据前端类型。
  - 新增实验详情页工具函数。
  - 新增 `LabDetailView.vue`。
  - 新增 `/labs/:category/:scene` 路由。
  - 将 `/labs` 列表卡片接入详情页入口，同时保留变体直达入口。
  - 补充详情页样式。
  - 补充前端测试。
- `packages/testing`
  - 增加 Playwright 端到端用例，验证 XSS 详情页展示元数据、变体入口和登录后的实验记录。
- `docs/TODO.md`
  - 同步实验详情页进度。

本次不修改：

- 数据库 schema。
- 后端接口结构。
- XSS 漏洞页面行为。
- 其他实验的业务实现。

## 3. 字段来源

详情页字段以以下来源为准：

- `packages/shared/src/lab-metadata.d.ts`
- `docs/design/lab-metadata-structure.md`
- `labs/web/xss/meta.json`
- 现有 `/api/labs/:category/:scene` 返回完整实验元数据。
- 现有 `/api/lab-records/me` 返回当前用户学习记录和验证记录。

已确认详情页使用字段：

- `LabMetadata`
  - `id`
  - `title`
  - `category`
  - `subcategory`
  - `summary`
  - `status`
  - `severity`
  - `difficulty`
  - `mode`
  - `tags`
  - `knowledgePoints`
  - `variants`
  - `entrypoints.web`
  - `entrypoints.docs`
  - `entrypoints.scripts`
  - `verification.manual`
  - `verification.automation`
- `CurrentUserLabRecordsResponse.records`
  - `progress[].labKey`
  - `verifications[].labKey`

## 4. 页面设计

详情页采用工作台式布局：

- 顶部显示实验标题、分类路径、摘要和状态标签。
- 主区域显示：
  - 变体入口：按 `variant.entryKey` 精确匹配 `entrypoints.web[].key`，生成漏洞版 / 修复版入口。
  - 知识点：展示 `knowledgePoints`。
  - 验证方式：展示手动验证文档、自动化路径和脚本入口。
  - 文档入口：展示 `entrypoints.docs`。
  - 当前记录：登录后按 `lab.id` 过滤学习进度与最近验证；未登录时显示登录入口。

不使用新依赖，不新增全局状态结构；详情页直接调用现有 API 和 session store。

## 5. 操作步骤

1. 写失败测试：
   - 路由测试要求包含 `/labs/:category/:scene`。
   - 工具函数测试要求能按 `variant.entryKey` 找到对应 web 入口，并能按 `labKey` 过滤记录。
   - E2E 要求 XSS 详情页可展示实验信息和变体入口。
2. 运行目标测试，确认失败。
3. 扩展 `apps/web/src/api/labs.ts` 类型，补齐详情页所需字段。
4. 新增 `apps/web/src/labs/lab-detail.ts`，承载可测试的数据整理逻辑。
5. 新增 `apps/web/src/views/LabDetailView.vue`。
6. 更新 `apps/web/src/router/routes.ts`。
7. 更新 `LabsView.vue`，增加“查看详情”入口。
8. 更新 `apps/web/src/styles/main.css`。
9. 更新 `docs/TODO.md`。
10. 运行最小必要验证。

## 6. 风险分析

- 变体入口不得通过路径猜测拼接，应使用 `variant.entryKey` 与 `entrypoints.web[].key` 的确认关系。
- 未登录用户应能查看实验详情，不能因记录接口缺少 token 阻断页面。
- 记录读取失败不影响元数据展示。
- 详情页是通用页面，不能写死 XSS 专属字段或文案。
- `/labs/:category/:scene` 不能影响现有 `/labs/web/xss/vuln` 与 `/labs/web/xss/fixed` 路由。

## 7. 验证方式

最小验证：

```powershell
pnpm --filter @network-safe/web run test -- --run
pnpm --filter @network-safe/web exec vue-tsc --noEmit
pnpm --filter @network-safe/testing test
```

端到端验证：

```powershell
pnpm test:e2e
```

本任务默认不执行全量 build。

## 8. 完成标准

- `/labs/:category/:scene` 可展示单个实验详情。
- `/labs` 列表可进入详情页，并保留变体直达入口。
- 详情页展示实验元数据、知识点、变体、文档、验证方式。
- 登录用户可在详情页看到当前实验学习进度与最近验证记录。
- 未登录用户仍可查看实验详情，并看到登录入口。
- XSS 详情页有前端单元测试和 Playwright 覆盖。
- 最小必要验证通过。

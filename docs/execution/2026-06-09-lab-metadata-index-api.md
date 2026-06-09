# 实验元数据索引接口执行文档

## 1. 目标

完成实验元数据索引链路：

- 后端提供 `GET /api/labs`
- 后端提供 `GET /api/labs/:category/:scene`
- 前端 `/labs` 页面读取真实接口并展示实验列表
- 自动化测试覆盖接口、页面和前端代理链路

本阶段只让平台能扫描和展示 `labs/*/*/meta.json`。不实现具体实验漏洞逻辑，不写数据库同步。

## 2. 范围

本次修改范围：

- `packages/shared`
  - 实验元数据字段常量
  - 实验元数据运行时校验
  - 类型声明
  - 单元测试
- `apps/server`
  - 实验元数据扫描服务
  - `/api/labs` 路由
  - `/api/labs/:category/:scene` 路由
  - API 测试
- `apps/web`
  - 实验 API client
  - `/labs` 页面真实接口展示
  - 前端测试
- `packages/testing`
  - HTTP 冒烟增加 `/api/labs`
  - Playwright 增加 `/labs` 页面测试
- `docs`
  - TODO 与测试文档同步

本次不修改：

- 数据库 schema 和 migration
- `labs/*/*` 实验真实业务代码
- `tools/lab-scripts/*`
- nginx 配置

## 3. 字段来源

字段来源以 `docs/design/lab-metadata-structure.md` 和现有 `labs/*/*/meta.json` 为准。

本阶段接口字段使用现有元数据中的准确字段：

- `id`
- `slug`
- `title`
- `category`
- `subcategory`
- `mode`
- `severity`
- `difficulty`
- `summary`
- `status`
- `phase`
- `tags`
- `knowledgePoints`
- `variants`
- `entrypoints`
- `verification`
- `prerequisites`
- `paths`

禁止猜测不存在字段；推荐字段如 `sortOrder`、`estimatedMinutes` 只在元数据实际存在时透传。

## 4. 接口约定

### 4.1 `GET /api/labs`

返回：

```json
{
  "items": [],
  "total": 0
}
```

说明：

- `items` 按 `category`、`subcategory` 排序。
- 开发阶段返回满足“占位可用”的实验，包括 `planned`。
- 每个 item 为规范化后的实验元数据。

### 4.2 `GET /api/labs/:category/:scene`

返回单个实验元数据。

未找到时：

```json
{
  "status": "error",
  "message": "lab not found"
}
```

HTTP 状态码为 `404`。

## 5. 操作步骤

1. 在 `packages/shared` 先写元数据校验测试。
2. 实现共享校验逻辑和类型声明。
3. 在 `apps/server` 写实验扫描服务测试和 API 测试。
4. 实现扫描 `labs/*/*/meta.json` 与路由。
5. 在 `apps/web` 写 API client 和 `/labs` 页面测试。
6. 修改 `/labs` 页面，从接口读取真实实验列表。
7. 扩展 HTTP 冒烟和 Playwright。
8. 运行完整验证。

## 6. 风险分析

- 现有元数据全部为 `planned`，如果前端严格只展示 `ready` 或 `in-progress`，页面会为空。本阶段按开发索引展示 `planned`，并用状态标识说明。
- `verification.manual.stepsDocPath` 当前多为 `.gitkeep` 占位，不应在本阶段误判为可学习实验。
- 服务端扫描文件系统时必须限制在仓库 `labs` 目录内，不接受用户传入路径。
- `.json` 解析失败或字段缺失时应返回清晰错误，不应静默跳过导致排查困难。

## 7. 验证方式

最小验证：

```powershell
pnpm --filter @network-safe/shared test
pnpm --filter @network-safe/server test
pnpm --filter @network-safe/web test -- --run
pnpm test:smoke
pnpm test:e2e
```

完成验证：

```powershell
pnpm test:automation
pnpm --filter @network-safe/web exec vue-tsc --noEmit
```

# 前后端端口调整与联调执行文档

## 1. 目标

将本地开发端口调整为：

- 前端 Web：`6666`
- 后端 API：`6667`

并完成最小前后端联调，确认前端开发服务的 `/api/*` 代理可以访问后端健康检查接口。

## 2. 范围

本次修改范围：

- `apps/web/vite.config.ts`
- `apps/web/tests/*`
- `apps/web/README.md`
- `apps/server/src/index.ts`
- `apps/server/src/config/runtime.ts`
- `apps/server/tests/*`
- `apps/server/.env.example`
- `docs/execution/2026-06-08-platform-runtime-contract.md`

本次不修改：

- 数据库 schema
- 业务接口结构
- 实验场景真实逻辑
- nginx 配置

## 3. 操作步骤

1. 新增后端运行端口配置函数，并写测试确认默认端口为 `6667`。
2. 新增前端 Vite 配置测试，确认开发端口为 `6666`，`/api` 代理指向 `http://localhost:6667`。
3. 修改后端启动入口使用统一配置函数。
4. 修改前端 Vite server 端口和代理目标。
5. 同步 `.env.example`、Web README 和平台运行约定文档。
6. 运行最小验证：
   - 后端测试
   - 前端测试
   - 启动后端 `6667`
   - 启动前端 `6666`
   - 请求 `http://127.0.0.1:6666/api/health`

## 4. 实施建议

- 后端端口默认值不要继续散落在启动文件中，抽到 `src/config/runtime.ts`，便于测试和后续复用。
- 前端代理目标保持 `/api` 前缀，不改变 API 路由结构。
- 联调只验证健康检查，不引入数据库探活，避免本机 MySQL 状态影响本次端口调整。

## 5. 潜在风险分析

- 本机 `6666` 或 `6667` 可能已被其他进程占用，联调前需要检查端口。
- 若已有旧的前端 dev server 仍在运行，不影响新端口，但最终汇报时需明确新访问地址。
- 后端 `.env` 若存在并仍设置旧端口，会覆盖默认端口；联调前需只同步 `PORT` 与 `WEB_ORIGIN`，不触碰数据库连接等敏感配置。

## 6. 优化方案

后续可以将前后端端口抽到共享配置或根级 `.env`，但当前阶段保持每个应用自己的最小配置即可。

## 7. 验证方式

```powershell
pnpm --filter @network-safe/server test
pnpm --filter @network-safe/web test -- --run
```

联调验证：

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:6666/api/health -UseBasicParsing
```

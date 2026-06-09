# 平台最小运行约定

## 1. 目标

本文档用于补齐一期平台骨架实现时最容易产生分歧的运行约定，确保前后端、数据库和 nginx 的构造口径一致。

## 2. 端口约定

- 前端开发端口：`6666`
- 后端开发端口：`6667`
- MySQL：`3306`
- nginx 本机静态托管端口：`8080`

## 3. API 前缀约定

- 平台 API 统一前缀：`/api`
- 实验相关 API 统一前缀：`/api/labs`
- 健康检查：`/api/health`

## 4. 前端开发代理约定

前端开发环境下：

- 浏览器访问前端：`http://localhost:6666`
- 所有 `/api/*` 请求代理到：`http://localhost:6667`

## 5. nginx 部署约定

build 后部署阶段：

- nginx 提供前端静态资源
- `/api/*` 反向代理到本机 Node 服务
- nginx 不承载实验逻辑，只承载静态资源与反向代理

## 6. 环境变量最小清单

后续至少统一以下变量：

- `PORT`
- `DATABASE_URL`
- `APP_ENV`
- `WEB_ORIGIN`

## 7. 一期最小路由约定

前端最小路由：

- `/`
- `/labs`
- `/labs/:category/:scene`
- `/labs/:category/:scene/:variant`

后端最小接口：

- `GET /api/health`
- `GET /api/labs`
- `GET /api/labs/:category/:scene`

## 8. 当前结论

后续 `apps/web`、`apps/server` 和 `nginx` 的第一轮真实实现，都应默认遵循本文档，不再临时决定端口、代理前缀和基础路由。

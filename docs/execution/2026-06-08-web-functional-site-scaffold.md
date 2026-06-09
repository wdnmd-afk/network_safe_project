# Web 功能型站点骨架执行文档

## 1. 目标

将 `apps/web` 从占位目录初始化为可运行的 Vue 功能型网站骨架。网站定位为本机受控训练平台中的正常业务站点：一个小型电商与账户门户 `SafeMart Training`，用于后续承载 XSS、CSRF、文件上传、IDOR、认证授权等实验场景。

本阶段只实现前端基础项目、页面结构、模拟数据和最小可测试行为，不实现真实漏洞逻辑。

## 2. 范围

本次修改范围限定在：

- `apps/web`
  - Vue / Vite / TypeScript 基础入口
  - Vue Router 路由
  - Pinia 状态入口
  - SafeMart 页面与样式
  - 最小测试
- 根依赖与锁文件
  - 补齐前端运行所需依赖

本次不修改：

- `apps/server` 业务接口
- `database` schema
- `labs/*` 实验真实业务逻辑
- `tools/lab-scripts/*` 脚本
- nginx 配置

## 3. 页面设计

### 3.1 网站类型

采用“电商账户门户”类型，原因是该类型天然具备多种后续实验入口：

- 搜索和评论：适合 XSS、SQL 注入样板
- 登录和账户：适合暴力破解、JWT、会话类问题
- 订单和账户资料：适合 IDOR、权限提升
- 头像和附件：适合文件上传
- 留言与操作按钮：适合 CSRF

### 3.2 页面清单

一期前端骨架提供以下路由：

- `/`：商城首页
- `/products`：商品列表与搜索
- `/login`：登录页
- `/account`：账户中心
- `/orders`：订单列表
- `/support`：客服留言
- `/labs`：实验入口占位

### 3.3 UI/UX 约束

遵循 `ui-ux-pro-max` 与项目规则：

- 使用功能型网站布局，不做纯靶场说明页
- 深色可信底色，琥珀色重点，少量紫色 CTA
- 使用语义化 HTML 与清晰 focus 状态
- 移动端交互目标不低于 44px
- 避免大面积无意义卡片堆叠
- 页面文案面向真实业务操作，不写设计说明

## 4. 操作步骤

1. 补齐前端依赖：
   - `vue`
   - `vue-router`
   - `pinia`
   - `@vitejs/plugin-vue`
   - `vite`
   - `vitest`
   - `typescript`
   - `jsdom`
2. 建立 Vite / TypeScript 配置：
   - `apps/web/index.html`
   - `apps/web/vite.config.ts`
   - `apps/web/tsconfig.json`
3. 先写最小测试：
   - 验证路由清单包含预期路径
   - 验证商品搜索逻辑能按关键字筛选
4. 实现前端结构：
   - `src/main.ts`
   - `src/App.vue`
   - `src/router/index.ts`
   - `src/stores/session.ts`
   - `src/data/catalog.ts`
   - `src/utils/catalog.ts`
   - `src/views/*.vue`
   - `src/styles/main.css`
5. 运行最小验证：
   - `pnpm --filter @network-safe/web test -- --run`
   - 如依赖安装失败，按权限规则请求安装授权

## 5. 实施建议

- 页面先使用本地模拟数据，不新增后端接口，避免范围扩大。
- 所有后续可能成为实验输入的位置先做成正常业务输入，不在本阶段写漏洞行为。
- 路由和页面文件保持简单，后续实验可逐步替换为 `vuln/fixed` 对照入口。
- 与后端联通只保留为后续能力，不在本次强行依赖 `/api/labs`。

## 6. 潜在风险分析

- 当前仓库尚未安装前端依赖，安装依赖会更新 `pnpm-lock.yaml`。
- `docs/design/tech-stack-and-version-strategy.md` 中部分建议版本可能高于当前生态实际可用版本，本次以 pnpm 可解析的稳定版本为准。
- 页面使用模拟数据，不能代表后端、数据库、实验注册链路已打通。
- 本阶段不执行全量 build，除非用户明确要求。

## 7. 优化方案

后续可以分阶段继续推进：

1. 接入后端 `/api/health` 与 `/api/labs`
2. 将 `/labs` 页面改为读取真实实验元数据
3. 以 `/labs/web/xss/vuln` 与 `/labs/web/xss/fixed` 接入第一条样板实验
4. 增加 Playwright 端到端测试

## 8. 验证方式

本次最小验证为：

```powershell
pnpm --filter @network-safe/web test -- --run
```

若用户明确要求可追加：

```powershell
pnpm --filter @network-safe/web build
```

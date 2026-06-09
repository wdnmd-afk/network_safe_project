# web

前端应用目录，当前已初始化为 `Vue + Vite + Vue Router + Pinia + TypeScript` 功能型网站骨架。

## 当前定位

当前前端以 `SafeMart` 小型电商账户门户作为训练样板站点，提供正常业务页面结构，后续用于承载漏洞版 / 修复版实验入口。

已包含页面：

- `/`：商城首页
- `/products`：商品列表与搜索
- `/login`：登录页
- `/account`：账户中心
- `/orders`：订单列表
- `/support`：客服留言
- `/labs`：实验入口占位

## 本地运行

```powershell
pnpm --filter @network-safe/web dev
```

默认访问：

```text
http://localhost:6670/
```

## 最小验证

```powershell
pnpm --filter @network-safe/web test -- --run
pnpm --filter @network-safe/web exec vue-tsc --noEmit
```

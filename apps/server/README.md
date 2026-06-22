# server

后端应用占位目录。

后续用于承载：

- 平台核心 API
- 实验索引与注册服务
- 学习记录与验证记录服务
- 实验场景相关接口

## 本机 seed

创建演示登录账号：

```powershell
pnpm --filter @network-safe/server seed:auth
```

同步一期实验元数据到数据库主表：

```powershell
pnpm --filter @network-safe/server seed:labs
```

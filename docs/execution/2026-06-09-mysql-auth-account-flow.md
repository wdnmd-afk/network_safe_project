# MySQL 登录与账户中心动态化执行文档

## 1. 目标

将当前静态登录页和账户中心改为真实本机 MySQL 用户表驱动的最小业务链路：

- 使用 `users` 表查询用户
- 使用本机 seed 创建可登录账号
- 登录成功后前端保存登录态
- 账户中心从 `/api/auth/me` 读取当前用户资料
- 支持退出登录

## 2. 范围

本次修改范围：

- `apps/server`
  - 新增认证服务、密码校验、签名会话 token、用户仓储
  - 新增 `/api/auth/login`、`/api/auth/me`、`/api/auth/logout`
  - 新增本机 seed 脚本
  - 补充后端测试
- `apps/web`
  - 新增认证 API client
  - 改造 Pinia session store
  - 改造登录页与账户中心
  - 补充前端测试
- `docs/`
  - 记录执行步骤、风险和验证方式

本次不修改：

- 数据库 schema 字段
- JWT 漏洞实验
- 权限绕过实验
- 生产级登录安全策略
- 真实 `.env` 提交

## 3. 当前诊断结论

- MySQL `127.0.0.1:3306` 可连接。
- `root / 123456` 可访问 `network_safe_project` 数据库。
- 平台基础表已存在。
- `users` 表当前为空，需要 seed 用户。
- `apps/server/.env` 是本机忽略文件，已用于保存当前本机连接信息。

## 4. 操作步骤

1. 写后端认证接口测试，先验证缺失行为。
2. 实现密码哈希校验和签名 token。
3. 实现 MySQL 用户仓储，只读取 schema 已确认字段。
4. 接入 Express 认证路由。
5. 新增 seed 脚本，创建 `admin` 与 `demo_user`。
6. 写前端 auth API 与 session store 测试。
7. 改造登录页与账户中心页面。
8. 运行本机 seed。
9. 执行最小必要验证：
   - 后端测试
   - 前端测试
   - 数据库探活
   - 登录接口手动请求

## 5. 实施建议

- 密码哈希使用 Node 原生 `crypto.scrypt`，不新增依赖。
- 会话 token 使用 HMAC 签名的本机学习 token，不声明为 JWT。
- 前端只保存 token 和后端返回的用户资料，不猜测数据库不存在的会员字段。
- 账户中心展示 `displayName`、`username`、`role`、`status`。

## 6. 潜在风险分析

- 本机 MySQL 服务停止时，登录接口会失败。
- seed 脚本会 upsert 指定 demo 用户，重复执行应保持幂等。
- 当前 token 是学习平台最小实现，不覆盖刷新、吊销、过期续签等生产能力。
- 如果后续要做 JWT 攻击实验，应单独新增漏洞版 / 修复版场景，不把本次最小登录链路做复杂。

## 7. 安全边界

本次只实现本机学习平台登录链路，不提供对外攻击能力，不访问外部目标，不生成通用爆破或攻击脚本。

## 8. 验证方式

```powershell
pnpm.cmd --filter @network-safe/server test
pnpm.cmd --filter @network-safe/web test -- --run
pnpm.cmd --filter @network-safe/server seed:auth
```

手动接口验证：

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:6667/api/health/db -UseBasicParsing
```

登录账号：

```text
admin / Admin@123456
demo_user / Demo@123456
```

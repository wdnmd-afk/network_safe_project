# LT-035 本机会话生命周期与吊销执行文档

## 1. 目标

明确并实现本机 token 过期、会话失效和注销吊销策略，使注销后的 token 在服务进程存续期间不可继续使用。

## 2. 已确认契约

- 默认 TTL：8 小时；环境变量 `AUTH_TOKEN_TTL_SECONDS` 可配置正整数秒数。
- token 仍使用 `userId.issuedAt.signature`，读取结果补充 `issuedAt`、`expiresAt`。
- 登录响应补充 ISO 字符串 `expiresAt`。
- 吊销集合只保存 token 的 SHA-256 指纹和过期时间，不保存原 token。
- `POST /api/auth/logout` 必须接收 Bearer token；默认 AuthService 注销后立即拒绝该 token。
- 吊销是单进程本机策略，服务重启后集合清空；长期多实例方案不在本轮范围。

## 3. 操作步骤

1. 扩展 session-token 的 TTL 输入和生命周期解析。
2. 在 AuthService 中加入指纹吊销、过期清理与 logout。
3. 更新 auth API、前端 sessionStorage 到期时间和过期清理。
4. 增加有效、过期、注销后失效和原 token 不落日志/存储测试。
5. 更新 `.env.example` 与认证文档。

## 4. 风险、优化与验证

- 兼容现有测试注入的简化 AuthService：`logout` 与 `expiresAt` 对测试替身保持可选。
- 比较签名继续使用 timing-safe；吊销只比较固定长度指纹。
- 验证：session-token/auth/server/web 测试、类型检查、登录注销 E2E、`pnpm verify`。

## 5. 完成条件

- 过期 token、已注销 token 和非法 token 均返回 401；有效 token 正常工作。
- 前端本地过期状态会自动清理，退出请求携带当前 Bearer token。

## 6. 验证结果（2026-08-27）

- session token 有效期、过期、未来时间、非法签名、TTL 配置和注销后吊销测试通过。
- 前端初始化到期清理、未过期恢复、退出清理测试通过；注销后旧 token E2E 返回 401。
- 前后端类型检查和根级 `pnpm verify` 均通过。

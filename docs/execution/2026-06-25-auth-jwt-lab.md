# 阶段 C：JWT 攻击纵向实验执行文档

## 1. 目标

按 `docs/execution/security-lab-master-goal.md` 的阶段 C 优先级，落地 `auth.jwt` 纵向实验。实验从攻击方视角展示“后端信任 JWT 头部算法并接受 `alg=none` 未签名令牌”会如何导致角色声明被篡改；再通过修复版理解算法白名单、签名校验、声明约束和事件日志审计的作用。

本实验完成后应具备：

- 正常签名教学 token 验证流程。
- 漏洞版 JWT 校验接口与页面。
- 修复版 JWT 校验接口与页面。
- 受控 `alg=none` 管理员声明样例与成功 / 阻断信号。
- 后端控制台结构化日志。
- `lab_event_logs` 数据库实验事件日志。
- 本机受控脚本与验证配置。
- API / 前端模型 / API client / 元数据测试。
- 实验文档、攻击步骤、修复说明和手动验证说明。

## 2. 范围

本次包含：

- 新增 `apps/server/src/services/jwt-lab.ts`。
- 新增后端接口：
  - `POST /api/labs/auth/jwt/:variant/verify`
- 新增前端 API、实验模型、页面与路由：
  - `/labs/auth/jwt/vuln`
  - `/labs/auth/jwt/fixed`
- 更新 `labs/auth/jwt/meta.json` 和相关 README / docs。
- 新增 `tools/lab-scripts/auth/jwt/exploit.py` 与 `verify.ts`。
- 补充服务端、前端和元数据测试。
- 同步 `docs/TODO.md` 和主目标状态。

本次不包含：

- 改造真实登录链路或真实 session token。
- 生成可用于第三方系统的 JWT 利用工具。
- 暴露真实密钥、真实 token、真实用户权限或真实生产 claim。
- 自动爆破 JWT 密钥、扫描接口或访问外部目标。

## 3. 实验设计

### 3.1 正常业务

业务场景为“受控管理区令牌验证”：

- 正常用户提交一个固定的 HS256 教学 token。
- 后端解析 header 和 payload，校验签名。
- 漏洞版和修复版都应允许正常签名 token。

正常 token payload 的教学含义：

```json
{
  "sub": "learner-1001",
  "role": "user",
  "scope": "orders:read",
  "lab": "auth.jwt"
}
```

预期信号：

```text
jwt-valid-user-token-accepted
```

### 3.2 漏洞版

漏洞版模拟以下错误：

- 按 token header 中的 `alg` 决定校验方式。
- 当 `alg=none` 时跳过签名校验。
- 信任 payload 中的 `role=admin` 与 `scope=admin:read`。

受控攻击样例 payload：

```json
{
  "sub": "learner-1001",
  "role": "admin",
  "scope": "admin:read",
  "lab": "auth.jwt"
}
```

预期观察：

- 漏洞版接受未签名管理员声明。
- 后端信号为 `jwt-none-alg-admin-accepted`。
- 事件日志记录攻击阶段、攻击者视角、被接受的后端决策和 token 摘要。

### 3.3 修复版

修复版采用以下策略：

- 只允许 `HS256`。
- 对 header、payload 和 signature 做结构检查。
- 使用固定教学密钥校验签名。
- 不信任未签名 token，不把 payload 里的角色声明当作独立授权依据。

同一 `alg=none` 攻击样例在修复版中应被阻断。

预期观察：

- 修复版返回 `403`。
- 后端信号为 `jwt-none-alg-blocked`。
- 事件日志记录防御阶段、算法、是否存在签名、是否请求管理员声明和阻断原因。

### 3.4 安全边界

- 本实验使用独立教学 JWT，不复用真实登录 token。
- 教学密钥是本地实验常量，不是生产密钥。
- 脚本默认只允许访问 `localhost` / `127.0.0.1`。
- 日志只保存 token 长度、段数、算法、角色声明、是否请求管理员权限和学习信号，不保存完整 token。

## 4. 操作步骤

1. 实现 JWT 实验服务：
   - variant 校验。
   - JWT header / payload / signature 解析。
   - 固定 HS256 教学 token 样例。
   - 固定 `alg=none` 攻击 token 样例。
   - 漏洞版接受 `alg=none` 管理员声明。
   - 修复版强制 HS256 签名校验。
   - 返回 token 检查结果、教学信号和下一步提示。
2. 在 `createApp` 注入 `jwtLabService` 并新增验证接口。
3. 接口调用统一 `recordLabEvent` 写入控制台和数据库事件日志。
4. 新增前端 API client。
5. 新增前端实验模型与引导式页面。
6. 更新路由和元数据入口。
7. 补齐实验文档、攻击步骤、修复说明、手动验证说明。
8. 新增本机受控脚本和验证入口。
9. 补充测试并运行最小必要验证。
10. 更新 `docs/TODO.md` 和主目标阶段状态。

## 5. 实施建议

- API 请求字段固定为 `token`，禁止猜测多个字段。
- API 响应保留 `inspection`，展示段数、算法、是否存在签名、签名是否有效、角色声明和是否请求管理员权限。
- 漏洞版接受 `alg=none` 管理员声明时明确标记 `jwt-none-alg-admin-accepted`。
- 修复版对 `alg=none` 使用 403 和 `status: "blocked"`。
- 页面提供：
  - 正常签名 token 样例按钮。
  - `alg=none` 攻击样例按钮。
  - 后端决策摘要。
  - JWT header / payload 摘要。
  - 当前授权结果。
  - 下一步观察提示。
- 文档必须说明真实生产还需要密钥轮换、issuer/audience 校验、过期时间校验、权限服务端化和审计告警。

## 6. 潜在风险分析

- **真实 token 混淆风险**：本实验不复用平台登录 token，页面和文档必须强调这是教学 JWT。
- **攻击脚本误用风险**：脚本默认只面向本机，并拒绝外部 host。
- **密钥泄露误导风险**：教学密钥只用于本地实验，不代表生产密钥管理方式。
- **日志敏感值风险**：统一事件日志只保存 token 摘要，不保存完整 token。
- **现有工作区改动较多**：只追加 JWT 链路，不回滚已有阶段 A、Web 阶段和详情页改动。

## 7. 验证方式

最小必要验证：

- `pnpm --filter @network-safe/server test`
- `pnpm --filter @network-safe/web exec vitest run`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `python tools/lab-scripts/auth/jwt/exploit.py --help`
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/auth/jwt/verify.ts`

可选验证：

- 后续补充 Playwright 闭环后再运行 `pnpm test:e2e`。

## 8. 完成记录

完成时间：2026-06-25

已落地内容：

- 新增 `auth.jwt` 漏洞版 / 修复版受控实验。
- 新增 `POST /api/labs/auth/jwt/:variant/verify`，请求字段固定为 `token`。
- 漏洞版展示 `alg=none` 未签名管理员声明被接受的风险，信号为 `jwt-none-alg-admin-accepted`。
- 修复版强制 `HS256` 签名校验并阻断同一攻击样例，信号为 `jwt-none-alg-blocked`。
- 前端新增 JWT 引导式实验页面、API client、教学模型和路由入口。
- `lab_event_logs` 只记录 token 摘要、算法、角色声明、签名状态和学习信号，不保存完整 token。
- 补齐 `labs/auth/jwt/` 文档、元数据、漏洞版 / 修复版说明、手动验证说明。
- 补齐 `tools/lab-scripts/auth/jwt/` 本机受控 Python 脚本和 TypeScript 验证配置。
- 补齐服务端、前端 API、前端模型、路由和共享元数据测试。

最小必要验证结果：

- `pnpm --filter @network-safe/server test`：通过，67 个测试通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`：通过。
- `pnpm --filter @network-safe/web exec vitest run`：通过，23 个测试文件、65 个测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`：通过。
- `pnpm --filter @network-safe/shared test`：通过，12 个测试通过。
- `python tools/lab-scripts/auth/jwt/exploit.py --help`：通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/auth/jwt/verify.ts`：通过。
- `git diff --check`：通过，仅有 Windows 下 LF/CRLF 提示。
- 后端运行态冒烟：未登录访问 `POST /api/labs/auth/jwt/vuln/verify` 返回 401。
- 前端运行态冒烟：`/labs/auth/jwt/vuln` 与 `/labs/auth/jwt/fixed` 均返回 200。

未执行内容：

- 未执行全量 build。
- 未执行 Playwright e2e，后续补齐阶段 C 闭环用例后再按需运行。

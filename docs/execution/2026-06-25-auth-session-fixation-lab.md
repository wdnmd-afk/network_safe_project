# 阶段 C：会话固定纵向实验执行文档

## 1. 目标

按 `docs/execution/security-lab-master-goal.md` 的阶段 C 优先级，在 `auth.privilege-escalation` 之后落地 `auth.session-fixation` 会话固定实验。

本实验用于说明攻击者如何尝试让受害者登录后继续使用攻击者提前知道的会话 ID，以及修复版为什么必须在登录完成后轮换会话 ID。实验只使用独立的教学会话字段，不修改真实登录 token、不读取真实浏览器 Cookie、不生成可用于第三方系统的攻击工具。

完成后应具备：

- 正常教学会话绑定流程。
- 漏洞版会话固定触发流程。
- 修复版会话轮换流程。
- 后端控制台结构化日志。
- `lab_event_logs` 数据库事件日志。
- 前端引导式页面、API client、教学模型和路由入口。
- 本地受控 Python 模拟脚本与 TypeScript 验证配置。
- 服务端、前端、共享元数据测试。
- 实验 README、攻击步骤、修复说明和手动验证文档。

## 2. 范围

本次包含：

- 新增 `apps/server/src/services/session-fixation-lab.ts`。
- 新增后端接口：
  - `POST /api/labs/auth/session-fixation/:variant/login`
- 新增前端入口：
  - `/labs/auth/session-fixation/vuln`
  - `/labs/auth/session-fixation/fixed`
- 更新 `labs/auth/session-fixation/meta.json` 和相关 README / docs。
- 新增 `tools/lab-scripts/auth/session-fixation/exploit.py` 与 `verify.ts`。
- 补充服务端、前端 API、前端模型、路由和元数据测试。
- 同步 `docs/TODO.md` 和主目标文档进度。

本次不包含：

- 修改真实登录流程、真实 session token 或真实 Cookie。
- 持久化真实会话 ID。
- 枚举会话、扫描接口、访问外部目标。
- 提供对第三方系统可复用的会话攻击工具。

## 3. 实验设计

### 3.1 受控业务场景

业务场景为“教学登录会话绑定器”。用户已通过平台真实登录，实验接口只模拟登录后会话绑定的安全差异。

请求字段固定为：

```json
{
  "preLoginSessionId": "browser-prelogin-session-1024",
  "sessionSource": "browser"
}
```

字段含义：

- `preLoginSessionId`：登录前已经存在的教学会话 ID。
- `sessionSource`：教学会话来源，固定使用 `browser` 或 `external-link`。

正常样例：

```json
{
  "preLoginSessionId": "browser-prelogin-session-1024",
  "sessionSource": "browser"
}
```

攻击样例：

```json
{
  "preLoginSessionId": "attacker-fixed-session-9001",
  "sessionSource": "external-link"
}
```

### 3.2 漏洞版

漏洞版模拟以下错误：

- 登录完成后继续信任客户端传入的 `preLoginSessionId`。
- 当 `sessionSource=external-link` 时，攻击者提前知道的会话 ID 被绑定到当前用户。
- 页面和日志展示“攻击者已知 ID 被绑定”的学习信号，但不产生真实登录态。

攻击样例在漏洞版中的预期信号：

```text
session-fixed-id-bound
```

### 3.3 修复版

修复版采用以下策略：

- 登录完成后忽略客户端传入的 `preLoginSessionId`。
- 服务端生成新的教学会话 ID。
- 记录轮换动作和来源判断，说明同一个攻击样例无法复用攻击者已知 ID。

攻击样例在修复版中的预期信号：

```text
session-fixed-id-rotated
```

正常样例可用于观察：

```text
session-normal-id-accepted
session-normal-id-rotated
```

### 3.4 日志摘要

统一事件日志只记录摘要，不保存完整真实凭据：

- `preLoginSessionIdLength`
- `preLoginSessionIdPreview`
- `sessionSource`
- `attackerControlled`
- `acceptedClientSessionId`
- `rotatedSessionId`
- `boundSessionIdPreview`
- `currentUserId`
- `signal`

`preLoginSessionIdPreview` 对攻击样例固定写为 `controlled-session-fixation-sample`，正常样例使用脱敏摘要。

### 3.5 安全边界

- 只面向 `localhost` / `127.0.0.1`。
- 只使用教学会话 ID，不修改真实登录 token。
- 不保存真实 Cookie、真实 token、真实密码或外部目标信息。
- 脚本只提交固定样例，不枚举会话 ID。
- 修复说明必须强调真实生产中还需要 `HttpOnly`、`Secure`、`SameSite`、登录后 session rotation、服务端会话失效策略和异常审计。

## 4. 操作步骤

1. 实现 `session-fixation-lab` 服务，包含样例、漏洞版绑定、修复版轮换、检查结果和学习信号。
2. 在 `createApp` 注入服务并新增 `/api/labs/auth/session-fixation/:variant/login`。
3. 将接口结果写入 `lab_event_logs` 统一事件日志，日志只保存摘要。
4. 新增前端 API client。
5. 新增前端教学模型与引导式页面。
6. 新增路由与路由测试。
7. 更新实验元数据、README、vuln / fixed / mock / docs 文档。
8. 新增本地受控脚本与验证配置。
9. 补充服务端、前端 API、前端模型和共享元数据测试。
10. 运行最小必要验证并同步进度文档。

## 5. 实施建议

- API 请求字段只使用 `preLoginSessionId` 和 `sessionSource`，禁止猜测或兜底其他字段。
- `sessionSource` 只接受 `browser`、`external-link`，其他值按 `unknown` 处理并在前端引导中避免使用。
- 漏洞版攻击样例必须明确返回 `session-fixed-id-bound`。
- 修复版攻击样例必须明确返回 `session-fixed-id-rotated`。
- 修复版不应该把防御理解为“拒绝登录”，而是“登录成功但轮换会话 ID”。
- 页面应展示来源、是否攻击者可控、是否接受客户端会话 ID、是否轮换、绑定后的教学会话摘要和下一步建议。

## 6. 潜在风险分析

- **真实会话混用风险**：本实验只使用 `preLoginSessionId` 教学字段，真实认证仍由现有 Bearer token 完成。
- **攻击脚本误用风险**：Python 脚本限制 host 为 `localhost` / `127.0.0.1` / `::1`，且只提交固定样例。
- **敏感日志风险**：统一日志只记录长度、来源、布尔判断和脱敏摘要，不记录完整真实 token。
- **学习误导风险**：文档说明修复版不是简单阻断登录，而是登录后强制轮换会话 ID，并补充生产级 Cookie 和会话失效策略。
- **工作区改动较多风险**：本次只追加 `auth.session-fixation` 链路，不回滚已有阶段 A、B、C 改动。

## 7. 验证方式

最小必要验证：

- `pnpm --filter @network-safe/server test`
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/web exec vitest run`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/shared test`
- `python tools/lab-scripts/auth/session-fixation/exploit.py --help`
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/auth/session-fixation/verify.ts`
- `git diff --check`

可选验证：

- 后端运行态冒烟：未登录访问实验接口应返回 401。
- 前端运行态冒烟：两个会话固定页面应返回 200。

## 8. 完成记录

完成时间：2026-06-25

已落地内容：

- 新增 `auth.session-fixation` 漏洞版 / 修复版受控实验。
- 新增 `POST /api/labs/auth/session-fixation/:variant/login`，请求字段固定为 `preLoginSessionId` 和 `sessionSource`。
- 漏洞版展示外部链接固定教学会话 ID 被绑定给当前用户，信号为 `session-fixed-id-bound`。
- 修复版展示登录后轮换教学会话 ID，信号为 `session-fixed-id-rotated`。
- 前端新增会话固定引导式实验页面、API client、教学模型和路由入口。
- `lab_event_logs` 只记录会话 ID 长度、来源、是否攻击者可控、是否接受客户端 ID、是否轮换、脱敏摘要和学习信号，不保存真实 token 或 Cookie。
- 补齐 `labs/auth/session-fixation/` 元数据、README、漏洞版 / 修复版 / mock 说明、攻击步骤、修复说明和手动验证文档。
- 补齐 `tools/lab-scripts/auth/session-fixation/` 本机受控 Python 脚本和 TypeScript 验证配置。
- 补齐服务端、前端 API、前端模型、路由和共享元数据测试。

最小必要验证结果：

- `pnpm --filter @network-safe/server test`：通过，85 个测试通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`：通过。
- `pnpm --filter @network-safe/web exec vitest run`：通过，29 个测试文件、83 个测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`：通过。
- `pnpm --filter @network-safe/shared test`：通过，15 个测试通过。
- `python tools/lab-scripts/auth/session-fixation/exploit.py --help`：通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/auth/session-fixation/verify.ts`：通过。
- 后端运行态冒烟：未登录访问 `POST /api/labs/auth/session-fixation/vuln/login` 返回 401。
- 前端运行态冒烟：`/labs/auth/session-fixation/vuln` 和 `/labs/auth/session-fixation/fixed` 均返回 200。

未执行内容：

- 未执行全量 build。
- 未执行 Playwright e2e，后续补齐阶段 C 闭环用例后再按需运行。

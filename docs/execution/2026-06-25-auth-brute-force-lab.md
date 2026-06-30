# 阶段 C：暴力破解纵向实验执行文档

## 1. 目标

按 `docs/execution/security-lab-master-goal.md` 的阶段 C 优先级，在 `auth.session-fixation` 之后落地 `auth.brute-force` 暴力破解实验。

本实验用于说明攻击者如何对登录入口连续尝试候选口令，以及修复版为什么需要失败次数阈值、节流和日志审计。实验只使用独立的虚拟教学账号，不调用真实平台登录密码校验，不读取真实密码，不生成可用于第三方系统的通用爆破工具。

完成后应具备：

- 正常教学登录尝试流程。
- 漏洞版连续候选口令尝试流程。
- 修复版失败阈值与节流阻断流程。
- 后端控制台结构化日志。
- `lab_event_logs` 数据库事件日志。
- 前端引导式页面、API client、教学模型和路由入口。
- 本机受控 Python 模拟脚本与 TypeScript 验证配置。
- 服务端、前端、共享元数据测试。
- 实验 README、攻击步骤、修复说明和手动验证文档。

## 2. 范围

本次包含：

- 新增 `apps/server/src/services/brute-force-lab.ts`。
- 新增后端接口：
  - `POST /api/labs/auth/brute-force/:variant/attempt`
- 新增前端入口：
  - `/labs/auth/brute-force/vuln`
  - `/labs/auth/brute-force/fixed`
- 更新 `labs/auth/brute-force/meta.json` 和相关 README / docs。
- 新增 `tools/lab-scripts/auth/brute-force/exploit.py` 与 `verify.ts`。
- 补充服务端、前端 API、前端模型、路由和元数据测试。
- 同步 `docs/TODO.md` 和主目标文档进度。

本次不包含：

- 修改真实 `POST /api/auth/login` 行为。
- 读取真实用户密码、真实密码哈希或真实登录日志。
- 对真实账号、外部目标或第三方系统做口令猜测。
- 提供自定义字典、网段扫描、批量目标或并发爆破能力。

## 3. 实验设计

### 3.1 受控业务场景

业务场景为“虚拟教学登录口令检查器”。用户需要先登录平台演示账号，实验接口只模拟对一个虚拟教学账号的候选口令检查。

请求字段固定为：

```json
{
  "targetUsername": "training-user",
  "passwordCandidates": ["training-login-weak"]
}
```

字段含义：

- `targetUsername`：虚拟教学账号，固定样例为 `training-user`。
- `passwordCandidates`：候选口令列表，最多 5 个，只用于本机教学观察。

正常样例：

```json
{
  "targetUsername": "training-user",
  "passwordCandidates": ["training-login-weak"]
}
```

攻击样例：

```json
{
  "targetUsername": "training-user",
  "passwordCandidates": [
    "summer2024",
    "password123",
    "letmein",
    "training-login-weak"
  ]
}
```

### 3.2 漏洞版

漏洞版模拟以下错误：

- 没有失败次数阈值。
- 没有节流或锁定。
- 对候选列表逐个检查，直到猜中虚拟教学账号口令。

攻击样例在漏洞版中的预期信号：

```text
brute-force-password-guessed
```

### 3.3 修复版

修复版采用以下策略：

- 统计连续失败次数。
- 达到 3 次失败后触发节流阻断。
- 不再继续检查后续候选口令。
- 正常单次正确登录仍可通过。

攻击样例在修复版中的预期信号：

```text
brute-force-rate-limit-blocked
```

正常样例在两个变体中都应返回：

```text
brute-force-normal-login-accepted
```

### 3.4 日志摘要

统一事件日志只记录摘要，不保存候选口令明文：

- `targetUsernameLength`
- `targetUsernamePreview`
- `candidateCount`
- `maxAllowedCandidates`
- `matchedAttemptNumber`
- `failedAttemptsBeforeMatch`
- `thresholdExceeded`
- `rateLimitApplied`
- `acceptedCredential`
- `signal`

攻击样例的用户名预览固定写为 `controlled-brute-force-target`。日志不得保存 `passwordCandidates` 明文。

### 3.5 安全边界

- 只面向 `localhost` / `127.0.0.1`。
- 只使用虚拟教学账号，不调用真实登录密码校验。
- 候选口令列表最多 5 个。
- 脚本只提交固定样例，不支持自定义字典、不支持多目标、不支持并发。
- 生产修复说明必须强调失败计数、节流、账户保护、验证码或 MFA、IP / 设备风险评分、审计和告警。

## 4. 操作步骤

1. 实现 `brute-force-lab` 服务，包含虚拟账号、正常样例、攻击样例、漏洞版遍历和修复版节流。
2. 在 `createApp` 注入服务并新增 `/api/labs/auth/brute-force/:variant/attempt`。
3. 将接口结果写入 `lab_event_logs` 统一事件日志，日志只保存摘要。
4. 新增前端 API client。
5. 新增前端教学模型与引导式页面。
6. 新增路由与路由测试。
7. 更新实验元数据、README、vuln / fixed / mock / docs 文档。
8. 新增本地受控脚本与验证配置。
9. 补充服务端、前端 API、前端模型和共享元数据测试。
10. 运行最小必要验证并同步进度文档。

## 5. 实施建议

- API 请求字段只使用 `targetUsername` 和 `passwordCandidates`，禁止猜测或兜底其他字段。
- `passwordCandidates` 必须是 1 到 5 个非空字符串。
- API 响应保留 `inspection`，展示候选数量、匹配位置、失败次数、是否触发阈值、是否应用节流和学习信号。
- 漏洞版攻击样例必须明确返回 `brute-force-password-guessed`。
- 修复版攻击样例必须明确返回 `brute-force-rate-limit-blocked`。
- 页面提供：
  - 正常单次登录样例按钮。
  - 受控连续猜测样例按钮。
  - 当前候选数量摘要。
  - 后端决策。
  - 失败阈值与节流状态。
  - 下一步观察建议。

## 6. 潜在风险分析

- **真实爆破误用风险**：本实验不触碰真实登录接口，脚本只允许本机目标和固定样例。
- **明文口令日志风险**：统一日志只记录候选数量、长度摘要和学习信号，不保存候选口令明文。
- **攻击脚本扩展风险**：Python 脚本不支持自定义字典、批量目标、并发或外部 host。
- **防御模型简化风险**：修复版只展示失败阈值和节流，真实生产还需要 MFA、验证码、设备指纹、IP 风险评分和告警。
- **工作区改动较多风险**：本次只追加 `auth.brute-force` 链路，不回滚已有阶段 A、B、C 改动。

## 7. 验证方式

最小必要验证：

- `pnpm --filter @network-safe/server test`
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/web exec vitest run`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/shared test`
- `python tools/lab-scripts/auth/brute-force/exploit.py --help`
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/auth/brute-force/verify.ts`
- `git diff --check`

可选验证：

- 后端运行态冒烟：未登录访问实验接口应返回 401。
- 前端运行态冒烟：两个暴力破解页面应返回 200。

## 8. 完成记录

- 已新增 `apps/server/src/services/brute-force-lab.ts`，使用虚拟教学账号 `training-user` 和固定受控候选口令样例。
- 已新增 `POST /api/labs/auth/brute-force/:variant/attempt`，不调用真实 `/api/auth/login`。
- 已将候选口令检查动作接入 `lab_event_logs`，日志只记录候选数量、匹配位置、失败次数、阈值判断、脱敏摘要和学习信号。
- 已新增前端 API client、教学模型、引导式页面和路由入口。
- 已更新 `labs/auth/brute-force/meta.json`，补齐 README、漏洞版、修复版、mock、攻击步骤、修复说明和手动验证文档。
- 已新增 `tools/lab-scripts/auth/brute-force/exploit.py` 与 `verify.ts`，脚本限制本机目标和固定样例。
- 已补充服务端、前端 API、前端模型、路由和共享元数据测试。
- 已完成最小必要验证：
  - `pnpm --filter @network-safe/server test`：91 项通过。
  - `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`：通过。
  - `pnpm --filter @network-safe/web exec vitest run`：31 个测试文件、89 项通过。
  - `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`：通过。
  - `pnpm --filter @network-safe/shared test`：16 项通过。
  - `python tools/lab-scripts/auth/brute-force/exploit.py --help`：通过。
  - `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/auth/brute-force/verify.ts`：通过。
  - `git diff --check`：无空白错误，仅有 Windows 换行提示。
  - 前端运行态冒烟：`/labs/auth/brute-force/vuln` 与 `/labs/auth/brute-force/fixed` 均返回 200。

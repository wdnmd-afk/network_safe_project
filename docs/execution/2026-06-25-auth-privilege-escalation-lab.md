# 阶段 C：权限提升纵向实验执行文档

## 1. 目标

按 `docs/execution/security-lab-master-goal.md` 的阶段 C 优先级，在 `auth.idor` 之后落地 `auth.privilege-escalation` 纵向实验。实验从攻击方视角展示“后端信任客户端传入的角色或权限声明”会如何导致普通用户执行管理操作；再通过修复版理解服务端权限判定、角色来源约束和事件日志审计的作用。

本实验完成后应具备：

- 普通用户执行普通操作的正常业务流程。
- 漏洞版权限提升接口与页面。
- 修复版权限提升接口与页面。
- 受控“客户端请求 admin 角色执行管理操作”的攻击样例。
- 后端控制台结构化日志。
- `lab_event_logs` 数据库实验事件日志。
- 本机受控脚本与验证配置。
- API / 前端模型 / API client / 元数据测试。
- 实验文档、攻击步骤、修复说明和手动验证说明。

## 2. 范围

本次包含：

- 新增 `apps/server/src/services/privilege-escalation-lab.ts`。
- 新增后端接口：
  - `POST /api/labs/auth/privilege-escalation/:variant/execute`
- 新增前端 API、实验模型、页面与路由：
  - `/labs/auth/privilege-escalation/vuln`
  - `/labs/auth/privilege-escalation/fixed`
- 更新 `labs/auth/privilege-escalation/meta.json` 和相关 README / docs。
- 新增 `tools/lab-scripts/auth/privilege-escalation/exploit.py` 与 `verify.ts`。
- 补充服务端、前端和元数据测试。
- 同步 `docs/TODO.md` 和主目标状态。

本次不包含：

- 修改真实用户角色或真实权限表。
- 给当前登录用户真实提权。
- 生成可用于第三方系统的权限提升工具。
- 自动枚举权限、扫描接口或访问外部目标。

## 3. 实验设计

### 3.1 正常业务

业务场景为“受控管理操作执行器”：

- 当前登录用户的服务端角色来自登录态，演示账号为 `member`。
- 普通用户提交普通操作 `view-profile-summary`。
- 漏洞版和修复版都应允许普通操作。

正常样例请求：

```json
{
  "operationKey": "view-profile-summary",
  "requestedRole": "member"
}
```

预期信号：

```text
privilege-normal-operation-accepted
```

### 3.2 漏洞版

漏洞版模拟以下错误：

- 后端信任请求体中的 `requestedRole`。
- 当攻击方提交 `requestedRole=admin` 并请求管理操作时，后端把客户端声明当作授权依据。
- 普通用户因此能执行受控管理操作。

受控攻击样例请求：

```json
{
  "operationKey": "approve-refund",
  "requestedRole": "admin"
}
```

预期观察：

- 漏洞版接受管理操作。
- 后端信号为 `privilege-client-role-admin-accepted`。
- 事件日志记录攻击阶段、攻击者视角、被接受的后端决策和角色声明摘要。

### 3.3 修复版

修复版采用以下策略：

- 请求体中的 `requestedRole` 只作为学习观察字段，不作为授权依据。
- 后端只使用登录态里的 `currentUser.role` 做权限判断。
- 当前用户不是 `admin` 时，请求管理操作返回 `403`。

同一 `approve-refund` 攻击样例在修复版中应被阻断。

预期观察：

- 修复版返回 `403`。
- 后端信号为 `privilege-client-role-admin-blocked`。
- 事件日志记录防御阶段、服务端角色、客户端声明角色和阻断原因。

### 3.4 安全边界

- 本实验使用虚拟管理操作，不修改真实用户角色、订单、退款或配置。
- 脚本默认只允许访问 `localhost` / `127.0.0.1`。
- 不枚举真实权限、真实接口或外部目标。
- 日志只保存操作 key、服务端角色、客户端声明角色、是否请求管理操作和学习信号。

## 4. 操作步骤

1. 实现权限提升实验服务：
   - variant 校验。
   - 虚拟操作定义。
   - 普通操作样例与管理操作样例。
   - 漏洞版信任客户端 `requestedRole`。
   - 修复版只信任服务端 `currentUser.role`。
   - 返回检查结果、教学信号和下一步提示。
2. 在 `createApp` 注入 `privilegeEscalationLabService` 并新增执行接口。
3. 接口调用统一 `recordLabEvent` 写入控制台和数据库事件日志。
4. 新增前端 API client。
5. 新增前端实验模型与引导式页面。
6. 更新路由和元数据入口。
7. 补齐实验文档、攻击步骤、修复说明、手动验证说明。
8. 新增本机受控脚本和验证入口。
9. 补充测试并运行最小必要验证。
10. 更新 `docs/TODO.md` 和主目标阶段状态。

## 5. 实施建议

- API 请求字段固定为 `operationKey` 和 `requestedRole`，禁止猜测多个字段。
- API 响应保留 `inspection`，展示服务端角色、客户端声明角色、有效授权角色、是否请求管理操作、是否信任客户端角色和学习信号。
- 漏洞版接受客户端 admin 声明时明确标记 `privilege-client-role-admin-accepted`。
- 修复版对普通用户执行管理操作使用 403 和 `status: "blocked"`。
- 页面提供：
  - 执行普通操作样例按钮。
  - 填入客户端 admin 声明攻击样例按钮。
  - 后端决策摘要。
  - 角色来源摘要。
  - 当前操作结果。
  - 下一步观察提示。
- 文档必须说明真实生产还需要服务端权限策略、RBAC / ABAC 统一封装、最小权限、敏感操作审计和权限变更审批。

## 6. 潜在风险分析

- **真实提权混淆风险**：本实验不修改真实用户角色，只返回虚拟操作结果。
- **攻击脚本误用风险**：脚本默认只面向本机，并拒绝外部 host。
- **权限模型误导风险**：修复版强调“不要信任客户端角色声明”，但真实生产还需要集中权限策略和审计。
- **日志敏感值风险**：统一事件日志只保存操作和角色摘要，不保存真实业务敏感数据。
- **现有工作区改动较多**：只追加权限提升链路，不回滚已有阶段 A、Web 阶段、JWT、IDOR 和详情页改动。

## 7. 验证方式

最小必要验证：

- `pnpm --filter @network-safe/server test`
- `pnpm --filter @network-safe/web exec vitest run`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `python tools/lab-scripts/auth/privilege-escalation/exploit.py --help`
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/auth/privilege-escalation/verify.ts`

可选验证：

- 后续补充 Playwright 闭环后再运行 `pnpm test:e2e`。

## 8. 完成记录

完成时间：2026-06-25

已落地内容：

- 新增 `auth.privilege-escalation` 漏洞版 / 修复版受控实验。
- 新增 `POST /api/labs/auth/privilege-escalation/:variant/execute`，请求字段固定为 `operationKey` 和 `requestedRole`。
- 漏洞版展示信任客户端 `requestedRole=admin` 导致普通用户执行虚拟管理操作，信号为 `privilege-client-role-admin-accepted`。
- 修复版只信任登录态中的服务端角色并阻断同一攻击样例，信号为 `privilege-client-role-admin-blocked`。
- 前端新增权限提升引导式实验页面、API client、教学模型和路由入口。
- `lab_event_logs` 只记录操作 key 摘要、服务端角色、客户端声明角色、是否信任客户端角色、是否请求管理操作和学习信号，不修改真实用户角色。
- 补齐 `labs/auth/privilege-escalation/` 文档、元数据、漏洞版 / 修复版说明、手动验证说明。
- 补齐 `tools/lab-scripts/auth/privilege-escalation/` 本机受控 Python 脚本和 TypeScript 验证配置。
- 补齐服务端、前端 API、前端模型、路由和共享元数据测试。

最小必要验证结果：

- `pnpm --filter @network-safe/server test`：通过，79 个测试通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`：通过。
- `pnpm --filter @network-safe/web exec vitest run`：通过，27 个测试文件、77 个测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`：通过。
- `pnpm --filter @network-safe/shared test`：通过，14 个测试通过。
- `python tools/lab-scripts/auth/privilege-escalation/exploit.py --help`：通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/auth/privilege-escalation/verify.ts`：通过。
- `git diff --check`：通过，仅有 Windows 下 LF/CRLF 提示。
- 后端运行态冒烟：未登录访问 `POST /api/labs/auth/privilege-escalation/vuln/execute` 返回 401。
- 前端运行态冒烟：`/labs/auth/privilege-escalation/vuln` 与 `/labs/auth/privilege-escalation/fixed` 均返回 200。

未执行内容：

- 未执行全量 build。
- 未执行 Playwright e2e，后续补齐阶段 C 闭环用例后再按需运行。

# 阶段 C：IDOR 纵向实验执行文档

## 1. 目标

按 `docs/execution/security-lab-master-goal.md` 的阶段 C 优先级，在 `auth.jwt` 之后落地 `auth.idor` 纵向实验。实验从攻击方视角展示“后端只根据前端传入的对象 ID 读取资源，而没有校验对象归属”会如何导致越权读取；再通过修复版理解对象级授权、归属校验和事件日志审计的作用。

本实验完成后应具备：

- 正常用户读取自己订单详情的业务流程。
- 漏洞版 IDOR 读取接口与页面。
- 修复版 IDOR 读取接口与页面。
- 受控“替换 orderId 读取他人订单”的攻击样例。
- 后端控制台结构化日志。
- `lab_event_logs` 数据库实验事件日志。
- 本机受控脚本与验证配置。
- API / 前端模型 / API client / 元数据测试。
- 实验文档、攻击步骤、修复说明和手动验证说明。

## 2. 范围

本次包含：

- 新增 `apps/server/src/services/idor-lab.ts`。
- 新增后端接口：
  - `POST /api/labs/auth/idor/:variant/read`
- 新增前端 API、实验模型、页面与路由：
  - `/labs/auth/idor/vuln`
  - `/labs/auth/idor/fixed`
- 更新 `labs/auth/idor/meta.json` 和相关 README / docs。
- 新增 `tools/lab-scripts/auth/idor/exploit.py` 与 `verify.ts`。
- 补充服务端、前端和元数据测试。
- 同步 `docs/TODO.md` 和主目标状态。

本次不包含：

- 改造真实订单表或真实账户中心订单链路。
- 暴露真实用户隐私、真实订单或真实支付信息。
- 生成面向第三方系统的 IDOR 扫描器或批量枚举工具。
- 访问外部目标或扫描对象 ID。

## 3. 实验设计

### 3.1 正常业务

业务场景为“受控订单详情查看”：

- 当前登录用户提交自己的 `orderId`。
- 后端读取虚拟订单详情。
- 漏洞版和修复版都应允许读取当前用户自己的订单。

正常样例请求：

```json
{
  "orderId": "order-1001"
}
```

预期信号：

```text
idor-own-order-accepted
```

### 3.2 漏洞版

漏洞版模拟以下错误：

- 接口只按 `orderId` 查询订单。
- 不校验订单 `ownerUserId` 是否等于当前登录用户。
- 攻击方把自己的 `orderId` 替换为他人的订单 ID 后，后端仍返回详情。

受控攻击样例请求：

```json
{
  "orderId": "order-2001"
}
```

预期观察：

- 漏洞版返回他人订单详情。
- 后端信号为 `idor-cross-user-order-exposed`。
- 事件日志记录攻击阶段、攻击者视角、被接受的后端决策和订单 ID 摘要。

### 3.3 修复版

修复版采用以下策略：

- 仍允许按 `orderId` 查找虚拟订单。
- 查到订单后必须校验 `ownerUserId === currentUser.id`。
- 对不属于当前用户的订单返回 `403`。
- 日志只记录对象归属摘要和学习信号，不记录敏感字段全文。

同一 `order-2001` 攻击样例在修复版中应被阻断。

预期观察：

- 修复版返回 `403`。
- 后端信号为 `idor-cross-user-order-blocked`。
- 事件日志记录防御阶段、对象是否存在、归属是否匹配和阻断原因。

### 3.4 安全边界

- 本实验使用独立虚拟订单数据，不读取真实订单表。
- 脚本默认只允许访问 `localhost` / `127.0.0.1`。
- 不实现批量枚举、扫描或字典爆破对象 ID。
- 日志只保存 `orderId` 摘要、对象类型、是否属于当前用户、是否请求他人对象和学习信号。

## 4. 操作步骤

1. 实现 IDOR 实验服务：
   - variant 校验。
   - 虚拟订单数据。
   - 正常订单样例与他人订单样例。
   - 漏洞版接受跨用户对象读取。
   - 修复版校验对象归属并阻断。
   - 返回检查结果、教学信号和下一步提示。
2. 在 `createApp` 注入 `idorLabService` 并新增读取接口。
3. 接口调用统一 `recordLabEvent` 写入控制台和数据库事件日志。
4. 新增前端 API client。
5. 新增前端实验模型与引导式页面。
6. 更新路由和元数据入口。
7. 补齐实验文档、攻击步骤、修复说明、手动验证说明。
8. 新增本机受控脚本和验证入口。
9. 补充测试并运行最小必要验证。
10. 更新 `docs/TODO.md` 和主目标阶段状态。

## 5. 实施建议

- API 请求字段固定为 `orderId`，禁止猜测多个字段。
- API 响应保留 `inspection`，展示对象是否存在、归属是否匹配、是否请求他人对象、对象类型和学习信号。
- 漏洞版读取他人订单时明确标记 `idor-cross-user-order-exposed`。
- 修复版对他人订单使用 403 和 `status: "blocked"`。
- 页面提供：
  - 读取自己订单样例按钮。
  - 替换为他人订单样例按钮。
  - 后端决策摘要。
  - 对象归属摘要。
  - 当前读取结果。
  - 下一步观察提示。
- 文档必须说明真实生产还需要服务端对象级授权、不可预测对象 ID、审计告警、最小化响应字段和越权访问速率监控。

## 6. 潜在风险分析

- **真实数据混淆风险**：本实验不读取真实订单表，页面和文档必须强调这是虚拟订单。
- **枚举误用风险**：脚本只提交固定受控样例，不做对象 ID 扫描。
- **敏感字段泄露风险**：虚拟订单可展示教学字段，但日志只保存摘要，不保存完整明细。
- **权限模型误导风险**：修复版强调“仅隐藏按钮不够”，核心校验必须在后端对象级授权层完成。
- **现有工作区改动较多**：只追加 IDOR 链路，不回滚已有阶段 A、Web 阶段、JWT 和详情页改动。

## 7. 验证方式

最小必要验证：

- `pnpm --filter @network-safe/server test`
- `pnpm --filter @network-safe/web exec vitest run`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `python tools/lab-scripts/auth/idor/exploit.py --help`
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/auth/idor/verify.ts`

可选验证：

- 后续补充 Playwright 闭环后再运行 `pnpm test:e2e`。

## 8. 完成记录

完成时间：2026-06-25

已落地内容：

- 新增 `auth.idor` 漏洞版 / 修复版受控实验。
- 新增 `POST /api/labs/auth/idor/:variant/read`，请求字段固定为 `orderId`。
- 漏洞版展示只按对象 ID 读取资源导致跨用户订单暴露，信号为 `idor-cross-user-order-exposed`。
- 修复版强制校验 `ownerUserId === currentUser.id` 并阻断同一攻击样例，信号为 `idor-cross-user-order-blocked`。
- 前端新增 IDOR 引导式实验页面、API client、教学模型和路由入口。
- `lab_event_logs` 只记录 `orderId` 摘要、对象类型、归属判断、跨用户请求标记和学习信号，不保存完整敏感明细。
- 补齐 `labs/auth/idor/` 文档、元数据、漏洞版 / 修复版说明、手动验证说明。
- 补齐 `tools/lab-scripts/auth/idor/` 本机受控 Python 脚本和 TypeScript 验证配置。
- 补齐服务端、前端 API、前端模型、路由和共享元数据测试。

最小必要验证结果：

- `pnpm --filter @network-safe/server test`：通过，73 个测试通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`：通过。
- `pnpm --filter @network-safe/web exec vitest run`：通过，25 个测试文件、71 个测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`：通过。
- `pnpm --filter @network-safe/shared test`：通过，13 个测试通过。
- `python tools/lab-scripts/auth/idor/exploit.py --help`：通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/auth/idor/verify.ts`：通过。
- `git diff --check`：通过，仅有 Windows 下 LF/CRLF 提示。
- 后端运行态冒烟：未登录访问 `POST /api/labs/auth/idor/vuln/read` 返回 401。
- 前端运行态冒烟：`/labs/auth/idor/vuln` 与 `/labs/auth/idor/fixed` 均返回 200。

未执行内容：

- 未执行全量 build。
- 未执行 Playwright e2e，后续补齐阶段 C 闭环用例后再按需运行。

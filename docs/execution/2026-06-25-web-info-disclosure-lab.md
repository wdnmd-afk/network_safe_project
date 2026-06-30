# 阶段 B：信息泄露纵向实验执行文档

## 1. 目标

按 `docs/execution/security-lab-master-goal.md` 的阶段 B 优先级，落地 `web.info-disclosure` 纵向实验。实验从攻击方视角展示“业务诊断接口把调试报告、堆栈摘要、内部配置和 token 形态返回给普通用户”会如何帮助攻击者扩大信息收集；再通过修复版理解错误信息收敛、敏感字段脱敏、调试入口隔离和事件日志审计的作用。

本实验完成后应具备：

- 正常公开状态报告查看流程。
- 漏洞版诊断报告接口与页面。
- 修复版诊断报告接口与页面。
- 受控信息泄露样例与成功 / 阻断信号。
- 后端控制台结构化日志。
- `lab_event_logs` 数据库实验事件日志。
- 本机受控脚本与验证配置。
- API / 前端模型 / API client / 元数据测试。
- 实验文档、攻击步骤、修复说明和手动验证说明。

## 2. 范围

本次包含：

- 新增 `apps/server/src/services/info-disclosure-lab.ts`。
- 新增后端接口：
  - `POST /api/labs/web/info-disclosure/:variant/report`
- 新增前端 API、实验模型、页面与路由：
  - `/labs/web/info-disclosure/vuln`
  - `/labs/web/info-disclosure/fixed`
- 更新 `labs/web/info-disclosure/meta.json` 和相关 README / docs。
- 新增 `tools/lab-scripts/web/info-disclosure/exploit.py` 与 `verify.ts`。
- 补充服务端、前端和元数据测试。
- 同步 `docs/TODO.md` 和主目标状态。

本次不包含：

- 真实系统错误堆栈、真实环境变量、真实 token 或真实配置泄露。
- 读取服务器真实文件、真实进程环境、真实日志文件或真实数据库连接串。
- 构造可用于外部系统枚举、爆破或凭据利用的工具。
- 扫描外部目标或访问第三方系统。

## 3. 实验设计

### 3.1 正常业务

业务场景为“服务状态诊断报告查看”：

- 正常用户查看公开状态报告。
- 后端返回服务名称、公开状态、检查项摘要。
- 漏洞版和修复版都应允许正常公开报告。

正常样例：

```text
public-status
```

预期信号：

```text
info-disclosure-public-report-returned
```

### 3.2 漏洞版

漏洞版模拟以下错误：

- 普通用户可通过可控 `reportKey` 请求调试报告。
- 服务端把调试报告中的堆栈摘要、内部配置键名、演示 token 形态和依赖版本直接返回。
- 日志记录攻击阶段、攻击者视角和被接受的后端决策，但不保存完整敏感内容。

受控攻击样例：

```text
debug-diagnostics
```

预期观察：

- 漏洞版返回内部调试报告的教学占位内容。
- 后端信号为 `info-disclosure-debug-data-exposed`。
- 事件日志记录报告 key、是否请求敏感报告、暴露字段类别和风险摘要。

### 3.3 修复版

修复版采用以下策略：

- 普通用户只允许读取公开报告。
- 调试报告在当前学习入口中直接阻断，不返回内部内容。
- 返回面向用户的通用错误说明，不暴露堆栈、配置、token 形态或内部路径。
- 日志只记录摘要和阻断原因。

同一攻击样例在修复版中应被阻断。

预期观察：

- 修复版返回 `403`。
- 后端信号为 `info-disclosure-debug-data-blocked`。
- 事件日志记录防御阶段和阻断原因摘要。

### 3.4 安全边界

- 后端只查询内置虚拟诊断报告表，不读取真实环境变量、文件系统、日志文件或数据库连接信息。
- 调试报告内容全部为教学占位文本，不包含真实凭据。
- 脚本默认只允许访问 `localhost` / `127.0.0.1`。
- 日志只保存报告 key、敏感报告标记、暴露字段类别和学习信号，不保存完整调试内容。

## 4. 操作步骤

1. 实现信息泄露实验服务：
   - variant 校验。
   - 虚拟公开报告。
   - 虚拟调试报告。
   - 漏洞版允许调试报告并返回教学占位内容。
   - 修复版阻断调试报告。
   - 返回报告检查结果、教学信号和下一步提示。
2. 在 `createApp` 注入 `infoDisclosureLabService` 并新增报告接口。
3. 接口调用统一 `recordLabEvent` 写入控制台和数据库事件日志。
4. 新增前端 API client。
5. 新增前端实验模型与引导式页面。
6. 更新路由和元数据入口。
7. 补齐实验文档、攻击步骤、修复说明、手动验证说明。
8. 新增本机受控脚本和验证入口。
9. 补充测试并运行最小必要验证。
10. 更新 `docs/TODO.md` 和主目标阶段状态。

## 5. 实施建议

- API 请求字段固定为 `reportKey`，禁止猜测多个字段。
- API 响应保留 `inspection`，展示报告 key、是否敏感报告、是否允许公开读取、暴露字段类别数量。
- 漏洞版返回调试报告时明确标记 `info-disclosure-debug-data-exposed`。
- 修复版对调试报告使用 403 和 `status: "blocked"`。
- 页面提供：
  - 正常公开报告样例按钮。
  - 调试报告攻击样例按钮。
  - 后端决策摘要。
  - 报告检查摘要。
  - 报告字段预览。
  - 下一步观察提示。
- 文档必须说明真实生产还需要统一错误处理、日志分级、调试入口访问控制、敏感字段脱敏、响应头收敛和依赖版本暴露治理。

## 6. 潜在风险分析

- **真实敏感信息风险**：本实验不读取真实环境变量、真实 token、真实日志或真实配置。
- **脚本误用风险**：脚本默认只面向本机，并拒绝外部 host。
- **错误学习风险**：文档和页面必须明确“泄露内容是教学占位，不是可复用凭据”。
- **日志污染风险**：统一事件日志只保存摘要，不保存完整调试报告内容。
- **现有工作区改动较多**：只追加信息泄露链路，不回滚已有阶段 A、CSRF、SQL 注入、文件上传、目录遍历、SSRF 和详情页改动。

## 7. 验证方式

最小必要验证：

- `pnpm --filter @network-safe/server test`
- `pnpm --filter @network-safe/web exec vitest run`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `python tools/lab-scripts/web/info-disclosure/exploit.py --help`
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/info-disclosure/verify.ts`

可选验证：

- 后续补充 Playwright 闭环后再运行 `pnpm test:e2e`。

## 8. 完成记录

2026-06-25 已按本文档完成 `web.info-disclosure` 纵向实验落地：

- 后端新增受控虚拟诊断报告服务与 `POST /api/labs/web/info-disclosure/:variant/report` 接口。
- 漏洞版可观察 `info-disclosure-debug-data-exposed`，修复版可观察 `info-disclosure-debug-data-blocked`。
- 信息泄露实验动作已接入 `lab_event_logs` 统一事件日志，日志仅记录报告 key 摘要、敏感报告标记、字段数量和学习信号。
- 前端新增信息泄露实验页面、API client、教学模型与 `/labs/web/info-disclosure/vuln`、`/labs/web/info-disclosure/fixed` 路由。
- `labs/web/info-disclosure/` 与 `tools/lab-scripts/web/info-disclosure/` 已补齐元数据、文档、受控脚本和验证入口。
- `docs/TODO.md` 与 `docs/execution/security-lab-master-goal.md` 已同步，阶段 B Web 常见漏洞优先清单完成，下一项进入阶段 C 的 JWT 攻击实验。

本轮最小验证结果：

- `pnpm --filter @network-safe/server test`：通过，61 个测试全部通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`：通过。
- `pnpm --filter @network-safe/web exec vitest run`：通过，21 个测试文件、59 个测试全部通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`：通过。
- `pnpm --filter @network-safe/shared test`：通过，11 个测试全部通过。
- `python tools/lab-scripts/web/info-disclosure/exploit.py --help`：通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/info-disclosure/verify.ts`：通过，输出本机受控验证计划。
- `git diff --check`：无空白错误，仅提示 Windows 换行转换。

运行时冒烟结果：

- `POST http://localhost:6667/api/labs/web/info-disclosure/vuln/report` 在未登录且 JSON 合法时返回 `401`。
- `http://localhost:6670/labs/web/info-disclosure/vuln` 返回 `200`。
- `http://localhost:6670/labs/web/info-disclosure/fixed` 返回 `200`。

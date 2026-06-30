# 阶段 B：目录遍历纵向实验执行文档

## 1. 目标

按 `docs/execution/security-lab-master-goal.md` 的阶段 B 优先级，落地 `web.path-traversal` 纵向实验。实验从攻击方视角展示“下载 / 预览接口把用户传入路径直接拼到公开目录后，没有确认最终路径仍在允许根目录内”时，攻击者如何通过 `../` 访问内部模拟文件；再通过修复版理解路径规范化、根目录约束和日志审计的作用。

本实验完成后应具备：

- 正常公开文档读取流程。
- 漏洞版路径读取接口与页面。
- 修复版路径读取接口与页面。
- 受控路径遍历样例与成功 / 阻断信号。
- 后端控制台结构化日志。
- `lab_event_logs` 数据库实验事件日志。
- 本机受控脚本与验证配置。
- API / 前端模型 / API client / 元数据测试。
- 实验文档、攻击步骤、修复说明和手动验证说明。

## 2. 范围

本次包含：

- 新增 `apps/server/src/services/path-traversal-lab.ts`。
- 新增后端接口：
  - `POST /api/labs/web/path-traversal/:variant/read`
- 新增前端 API、实验模型、页面与路由：
  - `/labs/web/path-traversal/vuln`
  - `/labs/web/path-traversal/fixed`
- 更新 `labs/web/path-traversal/meta.json` 和相关 README / docs。
- 新增 `tools/lab-scripts/web/path-traversal/exploit.py` 与 `verify.ts`。
- 补充服务端、前端和元数据测试。
- 同步 `docs/TODO.md` 和主目标状态。

本次不包含：

- 读取真实文件系统。
- 暴露真实本机路径、系统文件、环境变量或数据库凭据。
- 构造通用任意文件读取工具。
- 对外部目标发起路径遍历请求。
- 演示操作系统特定敏感路径读取。

## 3. 实验设计

### 3.1 正常业务

业务场景为“帮助中心文档预览”：

- 正常用户选择公开文档，例如 `user-guide.md`。
- 后端从虚拟公开目录 `public/` 中读取内置模拟文档。
- 漏洞版和修复版都应允许正常读取。

正常样例：

```text
user-guide.md
```

预期信号：

```text
path-traversal-normal-file-read
```

### 3.2 漏洞版

漏洞版模拟以下错误：

- 将 `public/` 与用户输入拼接。
- 路径归一化后没有确认最终路径仍在 `public/` 内。
- 当输入为 `../internal/admin-note.txt` 时，最终解析到内部模拟文件。

受控攻击样例：

```text
../internal/admin-note.txt
```

预期观察：

- 漏洞版返回内部模拟文档。
- 后端信号为 `path-traversal-sensitive-file-exposed`。
- 事件日志记录攻击阶段、攻击者视角、被接受的后端决策和风险摘要。

### 3.3 修复版

修复版采用以下策略：

- 统一把 `\` 转为 `/`。
- 对 `.`、`..` 和空路径段做规范化。
- 规范化后检查最终路径必须仍位于 `public/` 下。
- 如果路径逃逸公开根目录，返回 403，并记录阻断信号。

同一攻击样例在修复版中应被阻断。

预期观察：

- 修复版返回 `403`。
- 后端信号为 `path-traversal-normalized-blocked`。
- 事件日志记录防御阶段和阻断原因摘要。

### 3.4 安全边界

- 后端只读内置虚拟文档索引，不调用真实 `fs.readFile`。
- 内部文档内容是教学占位文本，不包含真实密钥或真实系统路径。
- 脚本默认只允许访问 `localhost` / `127.0.0.1`。
- 日志只保存路径长度、规范化结果、是否逃逸根目录和学习信号，不保存真实系统路径。

## 4. 操作步骤

1. 实现路径遍历实验服务：
   - variant 校验。
   - 虚拟公开文档。
   - 虚拟内部文档。
   - 漏洞版允许路径逃逸并返回内部模拟文件。
   - 修复版阻断路径逃逸。
   - 返回规范化路径、检测结果、教学信号和下一步提示。
2. 在 `createApp` 注入 `pathTraversalLabService` 并新增读取接口。
3. 接口调用统一 `recordLabEvent` 写入控制台和数据库事件日志。
4. 新增前端 API client。
5. 新增前端实验模型与引导式页面。
6. 更新路由和元数据入口。
7. 补齐实验文档、攻击步骤、修复说明、手动验证说明。
8. 新增本机受控脚本和验证入口。
9. 补充测试并运行最小必要验证。
10. 更新 `docs/TODO.md` 和主目标阶段状态。

## 5. 实施建议

- API 请求字段固定为 `requestedPath`，禁止猜测多个字段。
- API 响应保留 `inspection`，展示原始输入长度、规范化路径、是否逃逸公开根目录。
- 漏洞版暴露内部模拟文件时明确标记 `path-traversal-sensitive-file-exposed`。
- 修复版对路径逃逸使用 403 和 `status: "blocked"`。
- 页面提供：
  - 正常公开文档样例按钮。
  - 路径遍历攻击样例按钮。
  - 后端决策摘要。
  - 路径规范化摘要。
  - 虚拟文档预览。
  - 下一步观察提示。
- 文档必须说明真实生产还需要对象存储隔离、权限校验、路径白名单、下载鉴权、访问审计和错误响应收敛。

## 6. 潜在风险分析

- **真实文件读取风险**：本实验不读取真实文件系统，只使用内置虚拟文档索引。
- **敏感路径泄露风险**：日志和页面只展示受控模拟路径，不展示本机真实路径。
- **脚本误用风险**：脚本默认只面向本机，并拒绝外部 host。
- **前端误导风险**：页面和文档必须明确这是受控模拟，不是通用任意文件读取工具。
- **现有工作区改动较多**：只追加路径遍历链路，不回滚已有阶段 A、CSRF、SQL 注入、文件上传和详情页改动。

## 7. 验证方式

最小必要验证：

- `pnpm --filter @network-safe/server test`
- `pnpm --filter @network-safe/web exec vitest run`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `python tools/lab-scripts/web/path-traversal/exploit.py --help`
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/path-traversal/verify.ts`

可选验证：

- 后续补充 Playwright 闭环后再运行 `pnpm test:e2e`。

## 8. 完成记录

2026-06-25 已按本文档落地 `web.path-traversal` 纵向实验：

- 新增后端受控虚拟文档读取服务与 `POST /api/labs/web/path-traversal/:variant/read`。
- 漏洞版对受控路径遍历样例返回 `path-traversal-sensitive-file-exposed`。
- 修复版对同一路径返回 `path-traversal-normalized-blocked`。
- 正常公开文档在漏洞版和修复版均返回 `path-traversal-normal-file-read`。
- 文档读取动作已接入 `lab_event_logs`，仅记录路径摘要和规范化结果，不读取真实文件系统。
- 新增前端页面、API client、教学模型、路由入口与对应测试。
- 补齐场景元数据、实验文档、本机脚本和共享元数据校验。
- 阶段 B 下一项调整为 `web.ssrf` SSRF 实验。

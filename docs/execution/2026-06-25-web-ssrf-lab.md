# 阶段 B：SSRF 纵向实验执行文档

## 1. 目标

按 `docs/execution/security-lab-master-goal.md` 的阶段 B 优先级，落地 `web.ssrf` 纵向实验。实验从攻击方视角展示“服务端代用户抓取 URL 元数据时，没有限制目标主机”会导致服务端访问内部资源；再通过修复版理解协议限制、主机白名单、私有地址阻断和日志审计的作用。

本实验完成后应具备：

- 正常公开资源预览流程。
- 漏洞版 URL 抓取接口与页面。
- 修复版 URL 抓取接口与页面。
- 受控 SSRF 样例与成功 / 阻断信号。
- 后端控制台结构化日志。
- `lab_event_logs` 数据库实验事件日志。
- 本机受控脚本与验证配置。
- API / 前端模型 / API client / 元数据测试。
- 实验文档、攻击步骤、修复说明和手动验证说明。

## 2. 范围

本次包含：

- 新增 `apps/server/src/services/ssrf-lab.ts`。
- 新增后端接口：
  - `POST /api/labs/web/ssrf/:variant/fetch`
- 新增前端 API、实验模型、页面与路由：
  - `/labs/web/ssrf/vuln`
  - `/labs/web/ssrf/fixed`
- 更新 `labs/web/ssrf/meta.json` 和相关 README / docs。
- 新增 `tools/lab-scripts/web/ssrf/exploit.py` 与 `verify.ts`。
- 补充服务端、前端和元数据测试。
- 同步 `docs/TODO.md` 和主目标状态。

本次不包含：

- 真实 HTTP 请求。
- DNS 解析、端口扫描、网段探测或外部目标访问。
- 真实云元数据、真实凭据、真实内部服务。
- 通用 SSRF 扫描器或探测器。
- 绕过云厂商或内网访问控制的技巧集合。

## 3. 实验设计

### 3.1 正常业务

业务场景为“运营素材 URL 预览”：

- 正常用户输入公开素材 URL。
- 后端返回资源标题、分类和模拟内容摘要。
- 漏洞版和修复版都应允许正常公开资源预览。

正常样例：

```text
https://safe-mart-cdn.local/public/catalog.json
```

预期信号：

```text
ssrf-public-resource-fetched
```

### 3.2 漏洞版

漏洞版模拟以下错误：

- 只检查 URL 格式，不限制目标主机。
- 服务端“代用户请求”内部元数据地址。
- 当输入为受控内部元数据样例时，返回内部模拟资源。

受控攻击样例：

```text
http://169.254.169.254/latest/meta-data/iam/security-credentials/demo
```

预期观察：

- 漏洞版返回内部模拟元数据。
- 后端信号为 `ssrf-internal-metadata-exposed`。
- 事件日志记录攻击阶段、攻击者视角、被接受的后端决策和风险摘要。

### 3.3 修复版

修复版采用以下策略：

- 只允许 `http:` / `https:`。
- 仅允许白名单公开主机。
- 阻断私有地址、回环地址、链路本地地址和内部域名。
- 不执行真实网络请求，只返回受控模拟资源。

同一攻击样例在修复版中应被阻断。

预期观察：

- 修复版返回 `403`。
- 后端信号为 `ssrf-private-target-blocked`。
- 事件日志记录防御阶段和阻断原因摘要。

### 3.4 安全边界

- 后端只查询内置虚拟资源表，不调用 `fetch`、`http.request` 或 DNS 解析。
- 内部元数据内容是教学占位文本，不包含真实凭据。
- 脚本默认只允许访问 `localhost` / `127.0.0.1`。
- 日志只保存 URL 摘要、协议、主机、目标分类和学习信号，不保存真实 token 或真实外部目标信息。

## 4. 操作步骤

1. 实现 SSRF 实验服务：
   - variant 校验。
   - 虚拟公开资源。
   - 虚拟内部元数据资源。
   - 漏洞版允许内部目标并返回模拟资源。
   - 修复版阻断内部 / 私有目标。
   - 返回 URL 检查结果、教学信号和下一步提示。
2. 在 `createApp` 注入 `ssrfLabService` 并新增抓取接口。
3. 接口调用统一 `recordLabEvent` 写入控制台和数据库事件日志。
4. 新增前端 API client。
5. 新增前端实验模型与引导式页面。
6. 更新路由和元数据入口。
7. 补齐实验文档、攻击步骤、修复说明、手动验证说明。
8. 新增本机受控脚本和验证入口。
9. 补充测试并运行最小必要验证。
10. 更新 `docs/TODO.md` 和主目标阶段状态。

## 5. 实施建议

- API 请求字段固定为 `targetUrl`，禁止猜测多个字段。
- API 响应保留 `inspection`，展示协议、主机、路径、是否私有目标、是否白名单公开主机。
- 漏洞版暴露内部模拟元数据时明确标记 `ssrf-internal-metadata-exposed`。
- 修复版对内部目标使用 403 和 `status: "blocked"`。
- 页面提供：
  - 正常公开资源样例按钮。
  - SSRF 攻击样例按钮。
  - 后端决策摘要。
  - URL 检查摘要。
  - 虚拟资源预览。
  - 下一步观察提示。
- 文档必须说明真实生产还需要 DNS 解析后校验、重定向链路校验、出站代理、网络层隔离、超时限制和访问审计。

## 6. 潜在风险分析

- **真实网络请求风险**：本实验不触网，只查询内置虚拟资源表。
- **脚本误用风险**：脚本默认只面向本机，并拒绝外部 host。
- **敏感内容误导风险**：内部元数据只使用教学占位文本，不使用真实云元数据。
- **前端误导风险**：页面和文档必须明确“这是受控模拟，不是通用 SSRF 探测工具”。
- **现有工作区改动较多**：只追加 SSRF 链路，不回滚已有阶段 A、CSRF、SQL 注入、文件上传、目录遍历和详情页改动。

## 7. 验证方式

最小必要验证：

- `pnpm --filter @network-safe/server test`
- `pnpm --filter @network-safe/web exec vitest run`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `python tools/lab-scripts/web/ssrf/exploit.py --help`
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ssrf/verify.ts`

可选验证：

- 后续补充 Playwright 闭环后再运行 `pnpm test:e2e`。

## 8. 完成记录

2026-06-25 已按本文档完成 `web.ssrf` 纵向实验落地：

- 后端新增受控虚拟资源抓取服务与 `POST /api/labs/web/ssrf/:variant/fetch` 接口。
- 漏洞版可观察 `ssrf-internal-metadata-exposed`，修复版可观察 `ssrf-private-target-blocked`。
- SSRF 实验动作已接入 `lab_event_logs` 统一事件日志，日志仅记录 URL 摘要、协议、主机、路径、目标分类和学习信号。
- 前端新增 SSRF 实验页面、API client、教学模型与 `/labs/web/ssrf/vuln`、`/labs/web/ssrf/fixed` 路由。
- `labs/web/ssrf/` 与 `tools/lab-scripts/web/ssrf/` 已补齐元数据、文档、受控脚本和验证入口。
- `docs/TODO.md` 与 `docs/execution/security-lab-master-goal.md` 已同步，阶段 B 下一项切换为 `web/info-disclosure`。

本轮最小验证结果：

- `pnpm --filter @network-safe/server test`：通过，55 个测试全部通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`：通过。
- `pnpm --filter @network-safe/web exec vitest run`：通过，19 个测试文件、53 个测试全部通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`：通过。
- `pnpm --filter @network-safe/shared test`：通过，10 个测试全部通过。
- `python tools/lab-scripts/web/ssrf/exploit.py --help`：通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ssrf/verify.ts`：通过，输出本机受控验证计划。
- `git diff --check`：无空白错误，仅提示 Windows 换行转换。

运行时冒烟结果：

- `POST http://localhost:6667/api/labs/web/ssrf/vuln/fetch` 在未登录且 JSON 合法时返回 `401 missing session token`。
- `http://localhost:6670/labs/web/ssrf/vuln` 返回 `200`。
- `http://localhost:6670/labs/web/ssrf/fixed` 返回 `200`。

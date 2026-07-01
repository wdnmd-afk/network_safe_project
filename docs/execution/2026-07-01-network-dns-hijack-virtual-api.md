# DNS 劫持后端受控内存解析 API 执行文档

## 1. 目标

本轮目标是在 `network/dns-hijack` 已建立 planned 文档入口的基础上，补齐后端受控内存解析 API，使实验从 `planned` 推进到 `in-progress`。

本轮只实现服务端固定样例解析、受控 API、统一事件日志和 API 测试，不实现前端页面、脚本、数据库迁移或真实 DNS 能力。

## 2. 范围

本轮新增：

- `apps/server/src/services/dns-hijack-lab.ts`
- `apps/server/tests/dns-hijack-lab.test.ts`
- `POST /api/labs/network/dns-hijack/:variant/resolve`

本轮同步：

- `apps/server/src/app.ts`
- `labs/network/dns-hijack/meta.json`
- `labs/network/dns-hijack/README.md`
- `labs/network/dns-hijack/docs/attack-steps.md`
- `labs/network/dns-hijack/docs/fix-notes.md`
- `labs/network/dns-hijack/docs/manual-verification.md`
- `labs/network/dns-hijack/mock/README.md`
- `packages/shared/tests/lab-metadata.test.mjs`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

## 3. 操作步骤

1. 新增 `dns-hijack-lab` 服务，使用固定 `domainKey` 与固定 `resolverProfile` 内存表。
2. 在服务层返回虚拟解析结果、证书状态、异常审计摘要、学习信号和下一步引导。
3. 在 `apps/server/src/app.ts` 注册 `resolve` 路由，只读取 `domainKey` 和 `resolverProfile`。
4. 路由层写入 `lab_event_logs`，日志只保存虚拟摘要，不保存真实域名、真实 IP、真实证书或额外请求字段。
5. 更新元数据为 `in-progress`，只登记漏洞版 / 修复版 API 入口和 API 测试证据，web 与 scripts 入口保持空数组。
6. 更新 DNS 劫持文档，说明当前已接入 API，但仍没有页面和脚本。
7. 补齐服务端测试和共享元数据测试。

## 4. 实施建议

- 固定域名样例使用 `customer-portal`、`update-service`、`internal-dashboard`。
- 固定解析视角使用 `public-cache` 与 `trusted-resolver`。
- 漏洞版 `public-cache` 展示错误虚拟地址类别和证书不匹配信号。
- 修复版 `public-cache` 展示异常解析被阻断信号。
- 修复版 `trusted-resolver` 展示可信解析恢复信号。
- 未知 `domainKey` 或 `resolverProfile` 必须返回阻断结果，并将响应和日志中的原始值脱敏为 `blocked-domain` / `blocked-resolver`。

## 5. 潜在风险

- 如果 API 接收 `domain`、`host`、`ip`、`dnsServer` 等字段，容易被误解为真实 DNS 探测入口。
- 如果响应回显未知原始目标，可能把外部域名或 IP 写入日志。
- 如果文档提前登记 web 或 scripts 入口，会让平台误认为实验已具备完整交互闭环。
- 如果修复版只返回失败而没有审计摘要，学习者难以理解防御方观察点。

## 6. 优化方案

- 本轮优先复用端口扫描的服务层、路由层和日志摘要模式，保持网络类实验结构一致。
- API 先覆盖服务端差异和日志脱敏，前端工作台、Playwright 和只读验证脚本留到后续切片。
- 日志字段只保留 `domainKey`、`resolverProfile`、虚拟地址类别、证书状态、异常标记和学习信号。

## 7. 验证方式

- `pnpm --filter @network-safe/server test -- tests/dns-hijack-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `pnpm --filter @network-safe/shared test`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- DNS 安全关键词扫描，确认未新增真实 DNS 查询、系统网络配置修改、外部解析请求、真实投毒链路或可复用攻击脚本。

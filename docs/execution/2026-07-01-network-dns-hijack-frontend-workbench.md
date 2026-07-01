# DNS 劫持前端固定样例观察工作台执行文档

## 1. 目标

本轮目标是在 `network/dns-hijack` 后端受控内存解析 API 已接入的基础上，补齐前端固定样例观察工作台，让学习者能通过页面对比漏洞版和修复版的虚拟解析差异。

本轮只实现前端 API client、实验模型、Vue 工作台、路由、元数据和前端测试，不创建脚本、不接入 Playwright、不标记 `ready`。

## 2. 范围

本轮新增：

- `apps/web/src/api/dns-hijack-lab.ts`
- `apps/web/src/labs/dns-hijack.ts`
- `apps/web/src/views/DnsHijackLabView.vue`
- `apps/web/tests/dns-hijack-api.test.ts`
- `apps/web/tests/dns-hijack-lab.test.ts`

本轮同步：

- `apps/web/src/router/routes.ts`
- `apps/web/tests/router.test.ts`
- `apps/web/src/styles/main.css`
- `labs/network/dns-hijack/meta.json`
- `labs/network/dns-hijack/README.md`
- `labs/network/dns-hijack/docs/attack-steps.md`
- `labs/network/dns-hijack/docs/manual-verification.md`
- `packages/shared/tests/lab-metadata.test.mjs`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

## 3. 操作步骤

1. 新增前端 API client，只向 `/api/labs/network/dns-hijack/:variant/resolve` 提交 `domainKey` 和 `resolverProfile`。
2. 新增实验模型，提供固定域名样例、固定解析视角、变体文案、复盘清单、学习进度和验证记录载荷。
3. 新增 `DnsHijackLabView.vue`，复用端口扫描工作台结构，展示后端决策、学习信号、虚拟解析类别、证书状态和审计摘要。
4. 新增 `/labs/network/dns-hijack/vuln` 与 `/labs/network/dns-hijack/fixed` 路由。
5. 更新元数据登记 web 入口，状态仍保持 `in-progress`，scripts 入口继续为空。
6. 更新文档和规划状态，说明当前已有页面和 API，但仍没有脚本或 ready 收口。
7. 补齐前端 API / helper / router 测试和共享元数据测试。

## 4. 实施建议

- 默认样例使用 `customer-portal` 与 `public-cache`。
- 漏洞版按钮引导观察 `dns-hijack-certificate-mismatch-visible`。
- 修复版按钮引导先观察 `dns-hijack-anomaly-blocked`，再可切换 `trusted-resolver` 观察 `dns-hijack-trusted-resolution-restored`。
- 页面只使用 `<select>` 固定选择器，不提供自由文本输入。
- 学习进度使用 `network` / `dns-hijack` 写入，验证记录只在命中预期学习信号时写入。

## 5. 潜在风险

- 如果页面出现任意域名输入框，学习者可能误以为可以做真实 DNS 探测。
- 如果页面展示真实 DNS 命令或公共解析器示例，会突破当前内存解析表边界。
- 如果元数据提前登记 scripts 入口，会误导后续自动化认为脚本闭环已完成。
- 如果修复版只展示成功状态，学习者会忽略异常解析被审计阻断的防御路径。

## 6. 优化方案

- 复用端口扫描页面的双列布局、状态面板、固定选择器和记录写入模式，减少新交互样式。
- 本轮不新增脚本，把只读一致性验证留到后续切片。
- 本轮不跑全量构建，优先运行前端聚焦 Vitest、类型检查、共享元数据和服务端注册表测试。

## 7. 验证方式

- `pnpm --filter @network-safe/web exec vitest run tests/dns-hijack-api.test.ts tests/dns-hijack-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- 安全关键词扫描，确认前端实现未新增真实 DNS 查询、系统网络配置命令、任意目标输入或脚本入口。

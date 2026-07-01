# DNS 劫持页面级 Playwright 验证执行文档

## 1. 目标

本轮目标是在 `network/dns-hijack` 已具备前端固定样例工作台和后端受控解析 API 的基础上，补齐页面级 Playwright 差异验证。

验证重点是确认学习者登录后可以在漏洞版页面观察错误虚拟解析和证书不匹配信号，并在修复版页面观察异常解析阻断和可信解析恢复信号。

本轮不创建脚本入口，不新增 `exploit.py` 或 `verify.ts`，不标记 `ready`。

## 2. 范围

本轮新增或修改：

- `packages/testing/tests/e2e/platform.spec.mjs`
- `labs/network/dns-hijack/meta.json`
- `packages/shared/tests/lab-metadata.test.mjs`
- `labs/network/dns-hijack/README.md`
- `labs/network/dns-hijack/docs/manual-verification.md`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

## 3. 操作步骤

1. 在 Playwright 平台用例中新增 DNS 劫持漏洞版 / 修复版页面差异验证。
2. 用例登录 `demo_user`，只访问本项目页面和本机后端代理。
3. 漏洞版进入 `/labs/network/dns-hijack/vuln`，点击固定“客户门户”样例并观察解析结果。
4. 断言页面不出现文本框，不提供任意域名、DNS 服务器、IP、代理、网络接口或端口输入。
5. 断言漏洞版出现 `dns-hijack-certificate-mismatch-visible` 对应页面文案、`accepted` 决策、`shadow-customer-portal` 虚拟地址类别和 `mismatch` 证书状态。
6. 修复版进入 `/labs/network/dns-hijack/fixed`，使用默认 `public-cache` 观察异常解析阻断。
7. 断言修复版 public-cache 出现 `dns-hijack-anomaly-blocked` 对应页面文案、`blocked` 决策和策略阻断状态。
8. 在修复版切换固定“可信解析”视角，再次观察结果。
9. 断言修复版 trusted-resolver 出现 `dns-hijack-trusted-resolution-restored` 对应页面文案、`accepted` 决策、`trusted-customer-portal` 虚拟地址类别和 `trusted` 证书状态。
10. 更新元数据 Playwright 自动化证据和共享元数据测试。
11. 同步场景文档与主进度文档。

## 4. 实施建议

- 复用端口扫描页面级验证的登录、状态面板和固定输入断言风格。
- 页面断言优先使用可见文案、状态面板、固定按钮和固定 `<select>` 行为。
- 不引入新的 Playwright 文件，继续放入 `packages/testing/tests/e2e/platform.spec.mjs`，保持平台级页面验证入口集中。
- 元数据只增加 `verification.automation.playwright`，`entrypoints.scripts` 继续保持空数组。

## 5. 潜在风险

- 若页面断言只检查标题，无法证明漏洞版与修复版差异，需要同时断言学习信号、后端决策和虚拟解析结果。
- 若用例加入任意域名、DNS 服务器或 IP 输入，会突破当前内存解析表边界。
- 若元数据登记脚本入口，会误导后续自动化认为脚本闭环已完成。
- 若本轮直接标记 `ready`，会跳过只读一致性验证或最终 ready 审计。

## 6. 优化方案

- 本轮先补页面级验证，后续再补只读一致性验证脚本。
- 通过 Playwright 断言 `getByRole("textbox")` 数量为 0，辅助确认页面未提供任意目标文本输入。
- 通过断言固定虚拟地址类别和证书状态，避免只用宽泛文案证明页面差异。

## 7. 验证方式

- `pnpm --filter @network-safe/testing e2e -- --grep "DNS 劫持"`
- `pnpm --filter @network-safe/testing test`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/web exec vitest run tests/dns-hijack-api.test.ts tests/dns-hijack-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/server test -- tests/dns-hijack-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- 安全关键词扫描，确认本轮未新增真实 DNS 查询、系统网络配置命令、真实投毒链路或脚本入口。

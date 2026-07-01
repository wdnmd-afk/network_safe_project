# DNS 劫持 ready 收口审计执行文档

## 1. 目标

本轮目标是对 `network/dns-hijack` 按主计划完成标准做 ready 收口审计。

如果当前证据能够证明漏洞版、修复版、攻击方观察路径、防御方阻断 / 恢复路径、引导式页面、统一事件日志、文档、元数据和自动化验证已经形成闭环，则将 `labs/network/dns-hijack/meta.json` 从 `in-progress` 更新为 `ready`。

ready 状态只表示本项目内的固定内存解析表学习闭环完成，不表示提供真实 DNS 劫持、真实 DNS 查询、系统网络配置修改或可复用攻击脚本能力。

## 2. 范围

本轮包含：

- 审计 `network/dns-hijack` 是否满足 `docs/execution/security-lab-master-goal.md` 的完成标准。
- 更新 `labs/network/dns-hijack/meta.json` 状态与说明。
- 更新只读一致性验证脚本的 ready 状态断言。
- 更新 DNS 劫持 README、漏洞版 / 修复版 / mock 说明、攻击步骤、修复说明、手动验证和脚本目录说明。
- 更新共享元数据测试、服务端 health / registry 测试和前端页面旧文案。
- 更新下一波实验规划、`docs/TODO.md` 与主 goal 记录。

本轮不包含：

- 不新增 `exploit.py`。
- 不新增真实 DNS 查询脚本。
- 不调用真实 DNS、DoH、DoT、公共解析服务、socket、系统命令、PowerShell 或网络配置命令。
- 不修改本机 DNS、hosts、代理、路由、防火墙或系统网络配置。
- 不接收任意域名、DNS 服务器、IP、代理、网络接口或端口输入。
- 不修改数据库结构。

## 3. 收口判定

| 完成标准 | 当前证据 | 判定 |
|---|---|---|
| 漏洞版可运行 | `/labs/network/dns-hijack/vuln`、`POST /api/labs/network/dns-hijack/vuln/resolve`、服务端测试和 Playwright 用例 | 通过 |
| 修复版可运行 | `/labs/network/dns-hijack/fixed`、`POST /api/labs/network/dns-hijack/fixed/resolve`、服务端测试和 Playwright 用例 | 通过 |
| 攻击方触发路径清晰 | 漏洞版页面固定样例“客户门户”触发 `dns-hijack-certificate-mismatch-visible`，显示错误虚拟地址和证书不匹配 | 通过 |
| 防御方阻断路径清晰 | 修复版 `public-cache` 触发 `dns-hijack-anomaly-blocked`，`trusted-resolver` 触发 `dns-hijack-trusted-resolution-restored` | 通过 |
| 页面提供引导式交互 | 前端工作台提供固定域名样例、固定解析视角、快捷按钮、复盘清单和下一步建议 | 通过 |
| 后端打印结构化日志 | 统一 `recordLabEventSafely` 调用 `lab-event-logs` 服务，沿用结构化日志能力 | 通过 |
| 数据库记录实验事件日志 | `POST /api/labs/network/dns-hijack/:variant/resolve` 写入 `lab_event_logs` 摘要字段，测试校验 `recordLabEvent` 入参 | 通过 |
| 文档说明攻击步骤、修复说明和安全边界 | `README.md`、`docs/attack-steps.md`、`docs/fix-notes.md`、`docs/manual-verification.md` | 通过 |
| 攻击脚本只面向本机受控目标 | 本实验不提供 `exploit.py` 或真实 DNS 查询脚本；唯一脚本为本机只读一致性验证，不发请求、不执行 DNS 查询 | 通过 |
| 元数据与实际入口一致 | `meta.json` 登记 web、API、docs、`dns-hijack-verify`，共享元数据测试覆盖 | 通过 |
| 自动化测试或脚本验证覆盖关键差异 | 服务端 API 测试、前端单元测试、Playwright 页面差异验证、只读一致性验证脚本 | 通过 |
| `docs/TODO.md` 已同步 | 本轮同步 TODO 与主 goal | 通过 |

## 4. 安全边界

ready 状态只表示本项目内的受控学习实验闭环完成，不表示提供真实 DNS 攻击或解析能力。

持续禁止：

- 修改本机 DNS、hosts、代理、路由、防火墙或系统网络配置。
- 请求真实外部 DNS、DoH、DoT 或公共解析服务。
- 实现真实 DNS 投毒、DNS 劫持、DNS 隧道、流量转发或中间人代理。
- 接收任意域名、DNS 服务器、IP、代理、网络接口或端口参数。
- 保存真实域名访问记录、真实 IP、真实证书、Cookie、token 或凭据。
- 输出可复用到外部目标的 DNS 攻击脚本或查询工具。

## 5. 潜在风险

- 如果把 ready 误解为“真实 DNS 攻击可用”，会偏离项目边界；因此元数据、README 和脚本说明必须明确不提供 `exploit.py` 或真实 DNS 查询脚本。
- 如果只更新元数据不更新只读脚本，脚本会继续要求 `in-progress` 并阻断收口；因此本轮同步更新脚本断言。
- 如果页面继续显示“脚本入口尚未接入”，会与元数据矛盾；因此本轮修正为空状态文案。
- 如果文档仍写“尚未提供脚本”或“不能标记 ready”，会削弱完成状态证据；因此本轮同步所有直接状态文档。

## 6. 验证方式

本轮最小必要验证：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/network/dns-hijack/verify.ts`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/web exec vitest run tests/dns-hijack-api.test.ts tests/dns-hijack-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/testing e2e -- --grep "DNS 劫持"`
- `pnpm --filter @network-safe/testing test`
- `pnpm --filter @network-safe/server test -- tests/dns-hijack-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- 安全关键词扫描确认未新增真实 DNS 查询、系统网络配置命令、真实投毒链路、真实隧道通信或可复用攻击脚本。

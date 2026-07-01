# 端口扫描 ready 收口审计执行文档

## 1. 目标

本轮目标是对 `network/port-scan` 按主计划完成标准做 ready 收口审计。

如果当前证据能够证明漏洞版、修复版、攻击方观察路径、防御方收敛路径、引导式页面、统一事件日志、文档、元数据和自动化验证已经形成闭环，则将 `labs/network/port-scan/meta.json` 从 `in-progress` 更新为 `ready`。

## 2. 范围

本轮包含：

- 审计 `network/port-scan` 是否满足 `docs/execution/security-lab-master-goal.md` 的完成标准。
- 更新 `labs/network/port-scan/meta.json` 状态与说明。
- 更新只读一致性验证脚本的 ready 状态断言。
- 更新端口扫描 README、攻击步骤、手动验证、脚本目录说明和下一波实验规划。
- 更新服务端注册表测试、共享元数据测试和前端页面旧文案。
- 更新 `docs/TODO.md` 与主 goal 记录。

本轮不包含：

- 不新增 `exploit.py`。
- 不新增真实端口扫描脚本。
- 不调用真实 socket、系统命令、PowerShell、`nmap`、`Test-NetConnection`、`ping`、`tracert` 或类似工具。
- 不访问外部 IP、域名、网段或用户输入主机。
- 不修改数据库结构。

## 3. 收口判定

| 完成标准 | 当前证据 | 判定 |
|---|---|---|
| 漏洞版可运行 | `/labs/network/port-scan/vuln`、`POST /api/labs/network/port-scan/vuln/scan`、服务端测试和 Playwright 用例 | 通过 |
| 修复版可运行 | `/labs/network/port-scan/fixed`、`POST /api/labs/network/port-scan/fixed/scan`、服务端测试和 Playwright 用例 | 通过 |
| 攻击方触发路径清晰 | 漏洞版页面固定目标“后台管理节点”触发 `port-scan-management-surface-visible` | 通过 |
| 防御方阻断路径清晰 | 未知目标被阻断为 `port-scan-target-blocked`，修复版展示公开端口与高风险端口收敛 | 通过 |
| 页面提供引导式交互 | 前端工作台提供固定虚拟目标、固定观察模式、快捷按钮、复盘清单和下一步建议 | 通过 |
| 后端打印结构化日志 | 统一 `recordLabEventSafely` 调用 `lab-event-logs` 服务，沿用结构化日志能力 | 通过 |
| 数据库记录实验事件日志 | `POST /api/labs/network/port-scan/:variant/scan` 写入 `lab_event_logs` 摘要字段，测试校验 `recordLabEvent` 入参 | 通过 |
| 文档说明攻击步骤、修复说明和安全边界 | `README.md`、`docs/attack-steps.md`、`docs/fix-notes.md`、`docs/manual-verification.md` | 通过 |
| 攻击脚本只面向本机受控目标 | 本实验不提供 `exploit.py` 或真实扫描脚本；唯一脚本为本机只读一致性验证，不发请求、不扫描端口 | 通过 |
| 元数据与实际入口一致 | `meta.json` 登记 web、API、docs、`port-scan-verify`，共享元数据测试覆盖 | 通过 |
| 自动化测试或脚本验证覆盖关键差异 | 服务端 API 测试、前端单元测试、Playwright 页面差异验证、只读一致性验证脚本 | 通过 |
| `docs/TODO.md` 已同步 | 本轮同步 TODO 与主 goal | 通过 |

## 4. 安全边界

ready 状态只表示本项目内的受控学习实验闭环完成，不表示提供真实扫描能力。

持续禁止：

- 输入任意 IP、域名、网段、端口范围、超时、并发或代理参数。
- 扫描局域网、网段、外部 IP、域名或用户输入主机。
- 调用真实 socket、系统命令或扫描工具。
- 保存真实 IP、真实主机名、真实服务 banner、凭据、token 或 Cookie。
- 输出可复用到外部目标的扫描结果。

## 5. 潜在风险

- 如果把 ready 误解为“真实扫描器可用”，会偏离项目边界；因此元数据、README 和脚本说明必须明确不提供 `exploit.py` 或真实扫描脚本。
- 如果只更新元数据不更新只读脚本，脚本会继续要求 `in-progress` 并阻断收口；因此本轮同步更新脚本断言。
- 如果页面继续显示“脚本入口本轮不提供”，会与元数据矛盾；因此本轮修正为空状态文案。

## 6. 验证方式

本轮最小必要验证：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/network/port-scan/verify.ts`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/web exec vitest run tests/port-scan-api.test.ts tests/port-scan-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/testing e2e -- --grep "端口扫描"`
- `pnpm --filter @network-safe/testing test`
- `pnpm --filter @network-safe/server test -- tests/port-scan-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- 安全关键词扫描确认未新增真实网络探测、系统命令、真实扫描脚本或通用扫描器实现。

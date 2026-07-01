# 端口扫描只读一致性验证执行文档

## 1. 目标

本轮目标是为 `network/port-scan` 补齐本机只读一致性验证脚本，让端口扫描实验在页面、后端 API、元数据、文档和自动化证据之间形成更清晰的闭环。

该脚本只读取仓库内固定文件，校验端口扫描实验是否仍保持“固定虚拟资产表 + 受控 API + 前端固定选择器 + 无真实扫描能力”的边界。

## 2. 范围

本轮包含：

- 新增 `tools/lab-scripts/network/port-scan/verify.ts`。
- 更新 `tools/lab-scripts/network/port-scan/README.md`。
- 更新 `labs/network/port-scan/meta.json`，登记只读验证脚本入口。
- 更新共享元数据测试对端口扫描脚本入口和自动化证据的断言。
- 更新端口扫描 README、手动验证文档、规划文档、TODO 和主 goal 记录。

本轮不包含：

- 不新增 `exploit.py`。
- 不新增真实端口扫描脚本。
- 不调用端口扫描 API 发起请求。
- 不访问真实 IP、域名、网段或外部目标。
- 不调用 socket、系统命令、PowerShell、`nmap`、`Test-NetConnection`、`ping`、`tracert` 或类似探测工具。
- 不将 `network.port-scan` 标记为 `ready`。

## 3. 已确认上下文

- `network/port-scan` 当前状态为 `in-progress`。
- 后端已提供 `POST /api/labs/network/port-scan/:variant/scan` 受控 API，只读取 `targetKey` 和 `scanProfile`。
- 前端已提供 `/labs/network/port-scan/vuln` 与 `/labs/network/port-scan/fixed` 固定目标观察工作台。
- Playwright 页面级差异验证已接入 `packages/testing/tests/e2e/platform.spec.mjs`。
- 当前脚本目录只有 README，占位文档明确不提供 `exploit.py` 或真实扫描脚本。

## 4. 验证脚本设计

新增 `verify.ts` 的职责：

1. 解析并校验 `labs/network/port-scan/meta.json`。
2. 确认元数据仍是 `network.port-scan` / `simulation` / `in-progress`。
3. 确认 web 入口只包含漏洞版与修复版页面。
4. 确认 API 入口只包含漏洞版与修复版 `scan` 接口。
5. 确认脚本入口只登记本机只读一致性验证脚本。
6. 确认自动化证据包含 Playwright、服务端 API 测试和脚本验证。
7. 确认标准文档存在。
8. 确认文档持续声明固定虚拟资产、安全边界和不提供真实扫描脚本。
9. 检查端口扫描相关实现文件没有引入真实网络探测、系统命令或通用扫描器片段。

脚本输出 JSON 报告：

- `ok`
- `checkedFiles`
- `checks`
- `notes`

若任一检查失败，脚本设置非 0 退出码。

## 5. 安全边界

脚本必须保持以下边界：

- 只读取本项目仓库文件。
- 不读取 `.env`、凭据、Cookie、token 或本机网络配置。
- 不发起 HTTP 请求。
- 不导入网络探测相关模块。
- 不执行系统命令。
- 不接收任意主机、网段、端口范围、超时或并发参数。
- 不输出可复用到外部目标的扫描结果。

## 6. 潜在风险

- 如果脚本被写成 API 调用器，容易被误解为扫描入口；因此本轮只做仓库一致性检查。
- 如果脚本校验过宽，无法防止后续误加真实扫描能力；因此会检查端口扫描相关实现文件中是否出现网络探测或命令执行片段。
- 如果把只读验证脚本等同于攻击脚本，元数据含义会混乱；因此脚本描述必须明确“只读一致性验证”，并继续不提供 `exploit.py`。

## 7. 优化方案

- 先以只读一致性验证补足脚本入口，避免直接创建攻击脚本。
- 保持 `network.port-scan` 为 `in-progress`，后续单独做 ready 收口审计。
- 后续 ready 审计应逐条核对完成标准，而不是因为脚本存在就自动标记完成。

## 8. 验证方式

本轮最小必要验证：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/network/port-scan/verify.ts`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/web exec vitest run tests/port-scan-api.test.ts tests/port-scan-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/testing test`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- 安全关键词扫描确认新增脚本和端口扫描相关实现未新增真实网络探测、系统命令、网段扫描或通用扫描器实现。

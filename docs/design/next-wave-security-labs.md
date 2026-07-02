# 下一波安全实验规划

## 1. 文档定位

本文档用于承接 Web、注入类、认证授权和学习复盘主干之后的扩展实验规划。

当前规划覆盖：

- 网络 / 传输层
- 社会工程学
- AI / 新型攻击
- 供应链
- 恶意软件
- 客户端攻击
- 基础设施

本文档只定义规划、边界和推荐顺序。进入任一具体实验实现前，仍必须单独编写执行文档。

## 2. 当前基线

当前平台已经具备可复用基础：

- 实验目录结构：`labs/<category>/<scene>/`
- 脚本目录结构：`tools/lab-scripts/<category>/<scene>/`
- 元数据结构：`meta.json`
- 统一事件日志：`lab_event_logs`
- 学习记录、验证记录和复盘题完成记录
- 漏洞版 / 修复版对照页面模式
- `interactive`、`simulation`、`case-study` 三类实验模式
- `case-study ready` 共享元数据校验规则

下一波实验必须继续使用这些基础能力，而不是另起一套学习入口或日志机制。

## 3. 总体安全边界

所有扩展实验必须满足：

- 只面向本机、本项目、受控学习环境。
- 默认使用虚拟数据、固定样例和内存模拟器。
- 默认不访问外部目标。
- 默认不保存真实凭据、token、Cookie、邮箱、手机号、银行卡、目录账号或云账号信息。
- 默认不输出完整攻击 payload、可投递模板、恶意样本、扫描器或可复用攻击脚本。
- 高风险主题优先使用 `case-study` 或 `simulation`，达到 ready 时必须满足 case-study ready 规则。

## 4. 推荐首批清单

| 顺序 | 实验 | 分类 | 推荐模式 | 后续目录 |
|---|---|---|---|---|
| 1 | 端口扫描暴露面 | 网络 / 传输层 | `simulation` | `labs/network/port-scan/` |
| 2 | DNS 劫持 / 污染 | 网络 / 传输层 | `simulation` / `case-study` | `labs/network/dns-hijack/` |
| 3 | Prompt 注入 | AI / 新型攻击 | `interactive` | `labs/ai/prompt-injection/` |
| 4 | 网络钓鱼识别 | 社会工程学 | `case-study` / 仿真页面 | `labs/social/phishing/` |
| 5 | 依赖混淆 | 供应链 | `simulation` / `case-study` | `labs/supply-chain/dependency-confusion/` |
| 6 | 配置错误利用 | 基础设施 | `simulation` | `labs/infrastructure/misconfiguration/` |

首批选择标准：

- 能复用现有平台页面、日志和复盘结构。
- 能通过固定样例讲清攻击方视角。
- 能展示防御方修复思路。
- 不需要真实外部服务、真实网络攻击或危险样本。

## 5. 网络 / 传输层规划

| 实验 | 状态 | 推荐模式 | 当前规划落点 | 后续目录 |
|---|---|---|---|---|
| 端口扫描 | ready | 固定虚拟资产 / 受控 API / 前端固定选择器 / Playwright 差异验证 / 只读脚本验证 | `labs/network/port-scan/meta.json`、`apps/web/src/views/PortScanLabView.vue`、`packages/testing/tests/e2e/platform.spec.mjs`、`apps/server/src/services/port-scan-lab.ts`、`tools/lab-scripts/network/port-scan/verify.ts`、`docs/execution/2026-07-01-network-port-scan-ready-closeout.md` | `labs/network/port-scan/` |
| DNS 劫持 / 污染 | ready | 内存解析表 / 前端固定选择器 / Playwright 差异验证 / 只读脚本验证 / 本机模拟 / 案例化演示 | `labs/network/dns-hijack/meta.json`、`apps/web/src/views/DnsHijackLabView.vue`、`packages/testing/tests/e2e/platform.spec.mjs`、`tools/lab-scripts/network/dns-hijack/verify.ts`、`apps/server/src/services/dns-hijack-lab.ts`、`apps/server/tests/dns-hijack-lab.test.ts`、`docs/execution/2026-07-01-network-dns-hijack-ready-closeout.md` | `labs/network/dns-hijack/` |
| 中间人攻击 | 规划中 | 案例化演示 / 本机模拟 | `docs/design/project-scope-and-security-content.md` | `labs/network/mitm/` |
| ARP 欺骗 | 延后 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/network/arp-spoofing/` |
| DNS 隧道 | 延后 | 案例化演示 / 只读流量图解 | `docs/design/project-scope-and-security-content.md` | `labs/network/dns-tunnel/` |
| DDoS | 不做真实复现 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/network/ddos/` |
| BGP 劫持 | 不做真实复现 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/network/bgp-hijack/` |

### 5.1 端口扫描首版边界

首版使用虚拟资产表：

- 漏洞版：虚拟主机暴露管理端口、调试端口或多余服务。
- 修复版：只保留必要业务端口，并展示访问控制和资产清单收敛。
- 日志：记录虚拟目标 key、端口数量、暴露面等级和学习信号。

禁止：

- 不扫描局域网、网段或外部 IP。
- 不做并发压力探测。
- 不做服务漏洞识别。
- 不做认证绕过。

### 5.2 DNS 劫持首版边界

首版使用内存 DNS 解析表：

- 漏洞版：固定域名被解析到错误虚拟地址。
- 修复版：展示可信解析源、证书校验和异常解析审计。
- 日志：记录域名样例 key、解析结果类别和学习信号。
- 当前已补齐执行文档：`docs/execution/2026-07-01-network-dns-hijack-lab.md`。
- 当前已按 ready 收口：`labs/network/dns-hijack/meta.json`。
- 当前已接入后端受控内存解析 API：`POST /api/labs/network/dns-hijack/:variant/resolve`。
- 当前已接入前端固定样例观察工作台：`/labs/network/dns-hijack/vuln`、`/labs/network/dns-hijack/fixed`。
- 当前已接入 Playwright 页面差异验证：`packages/testing/tests/e2e/platform.spec.mjs`。
- 当前已接入只读一致性验证脚本：`tools/lab-scripts/network/dns-hijack/verify.ts`。
- 当前已完成 ready 收口审计：`docs/execution/2026-07-01-network-dns-hijack-ready-closeout.md`。

禁止：

- 不修改本机 DNS、hosts、代理或路由。
- 不请求真实外部 DNS。
- 不实现真实投毒、劫持或隧道通信。

## 6. 社会工程学规划

| 实验 | 状态 | 推荐模式 | 当前规划落点 | 后续目录 |
|---|---|---|---|---|
| 网络钓鱼 | 执行文档 | 案例化演示 / 仿真页面 / 固定线索卡 / 识别训练 | `docs/execution/2026-07-02-social-phishing-lab.md` | `labs/social/phishing/` |
| 鱼叉式钓鱼 | 延后 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/social/spear-phishing/` |
| 短信钓鱼 | 延后 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/social/smishing/` |
| 商业邮件诈骗 | 延后 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/social/bec/` |
| 水坑攻击 | 延后 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/social/watering-hole/` |
| 钓鱼 WiFi | 延后 | 案例化演示 / 本机模拟 | `docs/design/project-scope-and-security-content.md` | `labs/social/rogue-wifi/` |

`social/phishing` 首版建议做仿真收件箱：

- 攻击方视角：邮件如何利用紧急语气、相似域名和表单诱导。
- 防御方视角：如何检查发件人、链接、证书、域名和凭据请求。
- 复盘：学习者逐项标注风险线索。
- 当前已补齐执行文档：`docs/execution/2026-07-02-social-phishing-lab.md`。
- 下一步切片建议：建立 `labs/social/phishing/` 目录与 `planned` 元数据，先只登记 docs 入口，不创建邮件发送、凭据收集、模板生成或攻击脚本能力。

禁止：

- 不发送真实邮件、短信或链接。
- 不收集真实凭据。
- 不生成可投递模板包。
- 不调用第三方邮件、短信或社交平台。

## 7. AI / 新型攻击规划

| 实验 | 状态 | 推荐模式 | 当前规划落点 | 后续目录 |
|---|---|---|---|---|
| Prompt 注入 | ready | 确定性提示词路由模拟器 / 前端固定选择器 / Playwright 差异验证 / 只读脚本验证 / 可交互演示 / 事件日志安全摘要 | `apps/web/src/views/PromptInjectionLabView.vue`、`apps/web/src/api/prompt-injection-lab.ts`、`apps/web/src/labs/prompt-injection.ts`、`packages/testing/tests/e2e/platform.spec.mjs`、`tools/lab-scripts/ai/prompt-injection/verify.ts`、`apps/server/src/services/prompt-injection-lab.ts`、`apps/server/tests/prompt-injection-lab.test.ts`、`labs/ai/prompt-injection/meta.json`、`docs/execution/2026-07-02-ai-prompt-injection-ready-closeout.md` | `labs/ai/prompt-injection/` |
| AI 驱动攻击 | 延后 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/ai/ai-driven-attacks/` |
| Deepfake | 不做真实生成 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/ai/deepfake/` |
| 对抗性 AI | 延后 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/ai/adversarial-ai/` |
| 加密劫持 | 延后 | 本机模拟 / 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/ai/cryptojacking/` |

`ai/prompt-injection` 首版建议使用确定性提示词路由模拟器：

- 漏洞版：检索片段或用户输入覆盖系统意图，导致输出越界。
- 修复版：指令分层、工具允许列表、检索隔离和输出策略校验。
- 日志：只记录输入长度、风险类别、命中样例和学习信号。
- 当前已补齐执行文档：`docs/execution/2026-07-01-ai-prompt-injection-lab.md`。
- 当前已建立后端受控 API：`POST /api/labs/ai/prompt-injection/:variant/evaluate`。
- 当前已接入前端固定样例观察工作台：`/labs/ai/prompt-injection/vuln`、`/labs/ai/prompt-injection/fixed`。
- 当前已接入 Playwright 页面差异验证：`packages/testing/tests/e2e/platform.spec.mjs`。
- 当前已接入只读一致性验证脚本：`tools/lab-scripts/ai/prompt-injection/verify.ts`。
- 当前已完成 ready 收口审计：`docs/execution/2026-07-02-ai-prompt-injection-ready-closeout.md`。
- 当前页面和 API 仍只接受固定 `scenarioKey`、固定 `instructionSourceKey` 和固定 `defensePolicyKey`。
- 下一步切片建议：进入 `social/phishing` 网络钓鱼识别实验执行文档，优先保持案例化 / 仿真页面边界，不发送真实邮件、不收集真实凭据、不生成可投递模板包。

禁止：

- 不调用外部 AI 生成攻击内容。
- 不生成钓鱼文本、恶意代码、绕过策略或仿冒身份内容。
- 不保存完整敏感提示词。

## 8. 供应链规划

| 实验 | 状态 | 推荐模式 | 当前规划落点 | 后续目录 |
|---|---|---|---|---|
| 依赖混淆 | 规划中 | 本机模拟 / 案例化演示 | `docs/design/next-wave-security-labs.md` | `labs/supply-chain/dependency-confusion/` |
| 恶意包注入 | 延后 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/supply-chain/malicious-package/` |
| 更新投毒 | 延后 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/supply-chain/update-poisoning/` |
| 硬件供应链 | 延后 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/supply-chain/hardware/` |

`supply-chain/dependency-confusion` 首版建议：

- 使用固定 `package.json` 片段和伪 registry 元数据。
- 漏洞版展示私有包名与公共包名冲突的解析风险。
- 修复版展示 scope、私有 registry、lockfile、完整性校验和安装源审计。

禁止：

- 不发布真实包。
- 不安装未知远程依赖。
- 不创建真实投毒包或生命周期脚本。

## 9. 恶意软件规划

| 实验 | 状态 | 推荐模式 | 当前规划落点 | 后续目录 |
|---|---|---|---|---|
| 勒索软件 | 不做真实样本 | 案例化演示 / 安全化状态机 | `docs/design/project-scope-and-security-content.md` | `labs/malware/ransomware/` |
| 木马 | 不做真实样本 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/malware/trojan/` |
| 蠕虫 | 不做真实样本 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/malware/worm/` |
| 间谍软件 | 不做真实样本 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/malware/spyware/` |
| 键盘记录器 | 不做真实样本 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/malware/keylogger/` |
| Rootkit | 不做真实样本 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/malware/rootkit/` |

恶意软件方向只能做：

- 行为时间线。
- 固定日志样本分析。
- 防御策略选择。
- 安全化状态机。

禁止创建可执行恶意样本、持久化、自传播、加密、键盘记录、截屏、凭据窃取、隐藏进程或杀软绕过能力。

## 10. 客户端攻击规划

| 实验 | 状态 | 推荐模式 | 当前规划落点 | 后续目录 |
|---|---|---|---|---|
| Formjacking | 规划中 | 仿真页面 / 案例化演示 | `docs/design/next-wave-security-labs.md` | `labs/client/formjacking/` |
| 驾车式下载 | 不做真实下载 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/client/drive-by-download/` |
| 恶意浏览器插件 | 不做真实插件 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/client/malicious-extension/` |
| 恶意广告 | 延后 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/client/malvertising/` |
| 浏览器 MITB | 延后 | 案例化演示 / 本机模拟 | `docs/design/project-scope-and-security-content.md` | `labs/client/mitb/` |

`client/formjacking` 可作为后续客户端首项：

- 使用仿真结账页和固定输入。
- 漏洞版展示第三方脚本篡改提交目标的风险。
- 修复版展示 CSP、SRI、脚本清单、表单提交目标校验和敏感字段隔离。

禁止采集真实银行卡、身份证、密码、token、Cookie，禁止外发任何表单数据。

## 11. 基础设施规划

| 实验 | 状态 | 推荐模式 | 当前规划落点 | 后续目录 |
|---|---|---|---|---|
| 配置错误利用 | 规划中 | 本机模拟 / 静态配置分析 | `docs/design/next-wave-security-labs.md` | `labs/infrastructure/misconfiguration/` |
| 云安全漏洞 | 延后 | 案例化演示 / 本机模拟 | `docs/design/project-scope-and-security-content.md` | `labs/infrastructure/cloud-security/` |
| IoT 攻击 | 延后 | 案例化演示 / 本机模拟 | `docs/design/project-scope-and-security-content.md` | `labs/infrastructure/iot/` |
| 容器逃逸 | 不做真实复现 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/infrastructure/container-escape/` |
| 零日漏洞利用 | 不做真实复现 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/infrastructure/zero-day/` |

`infrastructure/misconfiguration` 首版建议：

- 使用静态配置片段。
- 漏洞版展示调试端口、默认凭据提示、目录索引、过宽 CORS 等风险信号。
- 修复版展示最小暴露面、默认关闭、认证要求和配置审计。

禁止修改真实 nginx、MySQL、Node、系统服务或云账号配置。

## 12. 后续切片

推荐后续按以下切片推进：

1. `ai/prompt-injection` ready 收口审计。
2. `social/phishing` 案例化执行文档。
3. `supply-chain/dependency-confusion` 模拟实验执行文档。
4. `infrastructure/misconfiguration` 模拟实验执行文档。

每个切片完成后都必须同步 `docs/TODO.md` 和 `docs/execution/security-lab-master-goal.md`。

## 13. 完成判定

某个扩展实验进入 `ready` 前，至少满足：

- 安全边界写入 README、手动验证文档和 `meta.json`。
- 漏洞版与修复版，或案例化攻击视角与防御视角，都有可访问入口。
- 日志写入 `lab_event_logs`，并且不展示原始 `inputSummaryJson`。
- 若是 `case-study`，满足 case-study ready 共享规则。
- 若提供脚本，只允许本机受控目标，且不扩展成通用攻击工具。
- 最小必要测试或只读验证脚本通过。
- `docs/TODO.md` 和主 goal 已同步。

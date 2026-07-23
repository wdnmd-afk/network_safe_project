# 安全覆盖矩阵

> 文档状态：持续维护
>
> 首次建立：2026-07-23
>
> 数据基线：65 个 `ready` 实验、9 个分类、130 个变体

## 1. 使用说明

本矩阵用于回答“平台覆盖了什么、做到多深、下一步补什么”，不等同于公网安全产品能力，也不代表真实攻击能力。

矩阵中的状态、模式和深度是三个不同维度：

- `ready`：当前项目定义的学习闭环已经完成。
- 模式：`interactive`、`simulation` 或 `case-study`。
- 深度：D2 引导式、D3 专用模拟、D4 专用交互；定义见根目录长期目标。

### 1.1 证据代码

| 代码 | 含义 |
|---|---|
| E1 | `meta.json`、README、漏洞/修复说明和手工验证文档 |
| E2 | 页面入口和受控 API 或通用工作台入口 |
| E3 | 统一 `lab_event_logs` 安全摘要 |
| E4 | 服务端、前端或共享目录测试 |
| E5 | 场景独立 `verify.ts` 或等价只读验证 |
| E6 | 代表性 Playwright 页面差异验证 |

当前所有 65 个主题至少具备 E1–E5；标注 `+E6` 的主题还具备页面级验证。

### 1.2 参考体系说明

参考列是学习导航，不是合规认证。使用的体系包括：

- OWASP Web Top 10 / API Security 风险类别。
- CWE 常见弱点类别。
- MITRE ATT&CK Enterprise 的战术或高置信技术名称。
- OWASP LLM 安全类别、供应链安全和云原生安全实践。

当精确编号容易产生歧义时，只记录稳定的类别或技术名称，后续由专项设计文档复核编号。

## 2. 总体统计

| 维度 | 数量 |
|---|---:|
| 实验总数 | 65 |
| 专用实现 | 27 |
| 通用引导式实现 | 38 |
| `interactive` | 23 |
| `simulation` | 15 |
| `case-study` | 27 |
| `critical` | 18 |
| `high` | 42 |
| `medium` | 5 |
| 具备 E6 Playwright | 10 |

## 3. Web 与注入（16）

| 场景 | 模式 | 深度/实现 | 参考体系 | 证据 | 长期动作 |
|---|---|---|---|---|---|
| `web.xss` | interactive | D4 专用 | OWASP A03 Injection；CWE-79 | E1–E6 | 保持纵向样板，补 DOM/上下文映射 |
| `web.csrf` | interactive | D4 专用 | OWASP A01 Broken Access Control；CWE-352 | E1–E6 | 补 SameSite、双重提交和业务流程 |
| `web.sql-injection` | interactive | D4 专用 | OWASP A03；CWE-89 | E1–E5 | 补查询类型、参数化和审计视角 |
| `web.nosql-injection` | interactive | D4 专用 | OWASP A03；CWE-943 | E1–E5 | 补操作符白名单和类型边界 |
| `web.crlf-injection` | interactive | D4 专用 | CWE-113；响应头注入 | E1–E5 | 补响应头规范化和日志注入差异 |
| `web.xpath-injection` | simulation | D3 专用 | CWE-643；OWASP A03 | E1–E5 | 增加多案例查询和策略复盘 |
| `web.ldap-injection` | case-study | D3 专用 | CWE-90；OWASP A03 | E1–E6 | 增加固定目录查询分支 |
| `web.command-injection` | interactive | D4 专用 | OWASP A03；CWE-77 | E1–E5 | 继续使用虚拟命令模型，不执行系统命令 |
| `web.ssti` | interactive | D4 专用 | CWE-1336；OWASP A03 | E1–E5 | 补模板上下文和安全渲染对比 |
| `web.xxe` | interactive | D4 专用 | CWE-611；OWASP A03 | E1–E5 | 补解析器配置和外部资源阻断 |
| `web.file-upload` | interactive | D4 专用 | CWE-434；OWASP A04 Insecure Design | E1–E5 | 补类型、存储隔离和下载策略 |
| `web.path-traversal` | interactive | D4 专用 | CWE-22；OWASP A01 | E1–E5 | 补规范化、根目录和符号链接概念 |
| `web.ssrf` | interactive | D4 专用 | OWASP A10 SSRF；CWE-918 | E1–E5 | 补协议、重定向和云元数据模拟 |
| `web.info-disclosure` | interactive | D4 专用 | CWE-200；OWASP A01/A05 | E1–E5 | 补错误页、日志和响应字段最小化 |
| `web.clickjacking` | interactive | D2 引导式 | CWE-1021；OWASP A05 | E1–E5 | 升级为专用嵌入与确认流程 |
| `web.open-redirect` | interactive | D2 引导式 | CWE-601；OWASP A01 | E1–E5 | 升级为专用 URL 规范化和允许列表 |

**判断：**当前最成熟的领域。主要缺口不是基础注入，而是请求走私、缓存投毒、原型污染、反序列化、WebSocket、CORS 和 GraphQL 等高级 Web/API 边界。

## 4. 认证与授权（8）

| 场景 | 模式 | 深度/实现 | 参考体系 | 证据 | 长期动作 |
|---|---|---|---|---|---|
| `auth.brute-force` | interactive | D4 专用 | OWASP A07；CWE-307 | E1–E5 | 补节流、锁定、设备风险和恢复 |
| `auth.idor` | interactive | D4 专用 | OWASP A01；CWE-639；API BOLA | E1–E5 | 作为 API 对象级授权基础扩展 |
| `auth.jwt` | interactive | D4 专用 | OWASP A02/A07；CWE-347 | E1–E5 | 补 issuer/audience、过期、轮换和吊销 |
| `auth.privilege-escalation` | interactive | D4 专用 | OWASP A01；CWE-269；API BFLA | E1–E5 | 补功能级授权矩阵 |
| `auth.session-fixation` | interactive | D4 专用 | OWASP A07；CWE-384 | E1–E5 | 补会话轮换和 Cookie 生命周期 |
| `auth.credential-stuffing` | interactive | D2 引导式 | OWASP A07；ATT&CK Credential Access | E1–E5 | 升级为专用异常登录实验 |
| `auth.session-hijacking` | interactive | D2 引导式 | OWASP A07；ATT&CK Session Hijacking | E1–E5 | 升级为专用上下文绑定和吊销实验 |
| `auth.oauth` | interactive | D2 引导式 | OWASP A07；OAuth state/PKCE 风险 | E1–E5 | 升级为专用授权码流程实验 |

**判断：**认证主线已经可用，但 MFA、密码找回、SSO/SAML、设备信任、令牌生命周期和 API 功能级授权仍需补强。

## 5. 网络与传输层（8）

| 场景 | 模式 | 深度/实现 | 参考体系 | 证据 | 长期动作 |
|---|---|---|---|---|---|
| `network.port-scan` | simulation | D3 专用 | ATT&CK T1046 Network Service Scanning | E1–E6 | 补资产基线和防火墙策略 |
| `network.dns-hijack` | simulation | D3 专用 | DNS integrity；Adversary-in-the-Middle | E1–E6 | 补证书、可信解析和恢复时间线 |
| `network.ddos` | simulation | D2 引导式 | ATT&CK T1498 Network Denial of Service | E1–E5 | 补容量、限流、降级和恢复 |
| `network.mitm` | simulation | D2 引导式 | ATT&CK T1557 Adversary-in-the-Middle | E1–E5 | 补证书链和协议降级证据 |
| `network.arp-spoofing` | simulation | D2 引导式 | ATT&CK T1557.002 ARP Cache Poisoning | E1–E5 | 补二层绑定和分段策略 |
| `network.eavesdropping` | simulation | D2 引导式 | ATT&CK T1040 Network Sniffing | E1–E5 | 补明文/密文流量摘要 |
| `network.dns-tunneling` | simulation | D2 引导式 | ATT&CK T1071.004 DNS | E1–E5 | 补熵特征和出口控制 |
| `network.bgp-hijacking` | simulation | D2 引导式 | 路由起源、RPKI/ROA、网络完整性 | E1–E5 | 补前缀监控和响应案例 |

**判断：**广度不错，但几乎全部是模拟。TLS 降级、DHCP 欺骗、VPN、IPv6、Wi-Fi、IDS/IPS 和固定 PCAP 分析仍缺少专门学习入口。

## 6. 社会工程学（8）

| 场景 | 模式 | 深度/实现 | 参考体系 | 证据 | 长期动作 |
|---|---|---|---|---|---|
| `social.phishing` | case-study | D3 专用 | ATT&CK T1566 Phishing | E1–E5 | 增加线索评分和举报流程 |
| `social.spear-phishing` | case-study | D3 专用 | ATT&CK T1566 Spearphishing | E1–E6 | 增加角色核验和审批分支 |
| `social.whaling` | case-study | D3 专用 | ATT&CK T1566；Business Email Compromise | E1–E6 | 增加冻结、复核和审计时间线 |
| `social.smishing` | case-study | D2 引导式 | Phishing；移动消息风险 | E1–E5 | 增加短信线索和可信渠道复核 |
| `social.bec` | case-study | D2 引导式 | Business Email Compromise；Fraud | E1–E5 | 增加供应商主数据和付款审批 |
| `social.watering-hole` | case-study | D2 引导式 | ATT&CK T1189 Drive-by Compromise | E1–E5 | 增加第三方脚本和站点信任分析 |
| `social.rogue-wifi` | case-study | D2 引导式 | Evil Twin；Adversary-in-the-Middle | E1–E5 | 增加热点身份和证书判断 |
| `social.physical-intrusion` | case-study | D2 引导式 | Initial Access；Physical Security | E1–E5 | 增加访客管理和尾随决策 |

**判断：**案例覆盖符合安全边界；长期重点应是证据和决策分支，而不是生成真实投递内容。

## 7. 恶意软件（6）

| 场景 | 模式 | 深度/实现 | 参考体系 | 证据 | 长期动作 |
|---|---|---|---|---|---|
| `malware.ransomware` | case-study | D2 引导式 | ATT&CK T1486 Data Encrypted for Impact | E1–E5 | 增加隔离、备份和恢复时间线 |
| `malware.trojan` | case-study | D2 引导式 | User Execution；Masquerading | E1–E5 | 增加进程树和应用控制分析 |
| `malware.worm` | case-study | D2 引导式 | 自传播、横向移动和网络分段 | E1–E5 | 增加虚拟传播图 |
| `malware.spyware` | case-study | D2 引导式 | Collection；Privacy/Endpoint Monitoring | E1–E5 | 增加权限、采集和数据出口证据 |
| `malware.keylogger` | case-study | D2 引导式 | ATT&CK T1056.001 Keylogging | E1–E5 | 增加输入保护和多因素决策 |
| `malware.rootkit` | case-study | D2 引导式 | ATT&CK T1014 Rootkit | E1–E5 | 增加完整性和启动链检查 |

**判断：**当前全为案例化。应使用固定进程树、文件事件、时间线和检测规则，不创建真实样本。

## 8. 供应链（4）

| 场景 | 模式 | 深度/实现 | 参考体系 | 证据 | 长期动作 |
|---|---|---|---|---|---|
| `supply-chain.dependency-confusion` | simulation | D3 专用 | ATT&CK T1195.002；软件来源完整性 | E1–E6 | 作为供应链纵向样板 |
| `supply-chain.malicious-package` | case-study | D2 引导式 | ATT&CK T1195.002；恶意包 | E1–E5 | 增加 SBOM、来源和隔离构建 |
| `supply-chain.update-poisoning` | case-study | D2 引导式 | ATT&CK T1195.002；更新完整性 | E1–E5 | 增加签名、回滚和透明度 |
| `supply-chain.hardware` | case-study | D2 引导式 | ATT&CK T1195.003；硬件供应链 | E1–E5 | 增加固件和来源证明 |

**判断：**数量少但方向正确；缺 SBOM、制品签名、CI/CD 秘密、构建来源和策略门禁。

## 9. AI 与新型攻击（5）

| 场景 | 模式 | 深度/实现 | 参考体系 | 证据 | 长期动作 |
|---|---|---|---|---|---|
| `ai.prompt-injection` | interactive | D4 专用 | OWASP LLM Prompt Injection；LLM 数据边界 | E1–E6 | 补间接注入、RAG 和工具授权 |
| `ai.ai-driven-attacks` | case-study | D2 引导式 | 自动化规模、工具权限和人工复核 | E1–E5 | 增加授权和人工介入分支 |
| `ai.deepfake` | case-study | D2 引导式 | 合成媒体、来源证明和身份核验 | E1–E5 | 增加可信通道和多因素确认 |
| `ai.adversarial-ai` | case-study | D2 引导式 | 模型鲁棒性、对抗样例和人工兜底 | E1–E5 | 增加固定评测集和回归 |
| `ai.cryptojacking` | simulation | D2 引导式 | ATT&CK T1496 Resource Hijacking | E1–E5 | 增加资源、配额和成本监控 |

**判断：**Prompt 注入是强样板，其余主题需要模型供应链、RAG 污染、工具调用权限和输出安全边界。

## 10. 客户端（5）

| 场景 | 模式 | 深度/实现 | 参考体系 | 证据 | 长期动作 |
|---|---|---|---|---|---|
| `client.drive-by-download` | case-study | D2 引导式 | ATT&CK T1189 Drive-by Compromise | E1–E5 | 增加浏览器行为时间线 |
| `client.malicious-extension` | case-study | D2 引导式 | ATT&CK T1176 Browser Extensions | E1–E5 | 增加权限 diff 和发布者来源 |
| `client.formjacking` | simulation | D2 引导式 | Web skimming；CSP/SRI；Input Capture | E1–E5 | 增加固定 DOM 和完整性校验 |
| `client.malvertising` | case-study | D2 引导式 | Drive-by；广告供应链 | E1–E5 | 增加重定向链和内容沙箱 |
| `client.mitb` | case-study | D2 引导式 | ATT&CK T1185 Browser Session Hijacking | E1–E5 | 增加交易签名和带外确认 |

**判断：**当前没有专用客户端实现，是深度最薄的领域之一。

## 11. 基础设施（5）

| 场景 | 模式 | 深度/实现 | 参考体系 | 证据 | 长期动作 |
|---|---|---|---|---|---|
| `infrastructure.misconfiguration` | simulation | D3 专用 | OWASP A05 Security Misconfiguration；CIS 控制 | E1–E6 | 扩展配置类型和策略审计 |
| `infrastructure.cloud-security` | simulation | D2 引导式 | 云 IAM、公开暴露和配置审计 | E1–E5 | 增加 IAM、存储和网络策略 |
| `infrastructure.container-escape` | case-study | D2 引导式 | ATT&CK T1611 Escape to Host | E1–E5 | 增加 capabilities、挂载和运行时策略 |
| `infrastructure.iot` | simulation | D2 引导式 | IoT 身份、固件和网络分区 | E1–E5 | 增加设备生命周期和管理面 |
| `infrastructure.zero-day` | case-study | D2 引导式 | Exploit Public-Facing Application；补偿控制 | E1–E5 | 增加虚拟补丁、隔离和应急响应 |

**判断：**具备安全化边界，但缺少云 IAM、Kubernetes RBAC、IaC 和镜像完整性专用样板。

## 12. 结构性缺口矩阵

这些领域不应伪装成已有 65 个场景的完整覆盖，后续应单独编写执行文档。

| 缺口领域 | 当前状态 | 优先级 | 首批建议 |
|---|---|---|---|
| API 安全 | 没有独立分类；IDOR/权限提升只覆盖部分风险 | P0 | 功能级授权、属性级授权、资源消耗、Webhook 重放 |
| 业务逻辑 | 没有独立主线 | P0 | 竞态、流程跳步、幂等、订单/优惠规则 |
| 密码学与秘密 | 没有独立实验 | P0 | 密码哈希、随机数、密钥轮换、秘密泄露、TLS 校验 |
| Windows 主机/AD | 没有独立分类 | P0 | ACL、服务权限、事件日志、NTLM/Kerberos、横向移动图 |
| 检测与响应 | 有事件日志，但没有 SOC 学习主线 | P1 | 固定数据集、规则匹配、告警研判、隔离和恢复 |
| 云原生/IaC | 目前主要是通用案例 | P1 | IAM、对象存储、K8s RBAC、Pod Security、SBOM |
| 高级 Web/API | 基础 Web 强，高级协议较少 | P1 | 请求走私、缓存投毒、原型污染、WebSocket、GraphQL |
| 客户端深度 | 5 个均为引导式 | P1 | 先把 MITB 或 Formjacking 升级为专用模拟 |
| 恶意软件深度 | 6 个均为引导式 | P1 | 进程树、文件事件、检测和恢复模拟 |
| 移动端 | 当前不在正式范围 | P2 | WebView、Deep Link、存储和证书校验 |

## 13. 优先级结论

### P0：先补应用和主机基础

1. API 功能级/属性级授权。
2. 资源消耗和 Webhook 重放。
3. 竞态与业务流程跳步。
4. 密码学、随机数和秘密生命周期。
5. Windows ACL、服务权限和事件日志。

### P1：提升已有广度的学习深度

1. 专用化 `web.clickjacking`、`web.open-redirect`。
2. 专用化 `auth.credential-stuffing`、`auth.session-hijacking`、`auth.oauth`。
3. 引导式工作台支持多案例、多步骤、证据卡和分支复盘。
4. 客户端、恶意软件和基础设施各选择一个专用模拟样板。

### P2：扩展现代基础设施和可选领域

- 云原生、Kubernetes、IaC、SBOM 和制品签名。
- 检测响应、威胁狩猎和安全运营指标。
- 高级 Web、GraphQL、WebSocket 和移动端。

## 14. 更新规则

- 新增实验必须先进入本矩阵的 `planned` 区域，再编写执行文档。
- 实验从 `planned`、`in-progress` 到 `ready` 时，必须同步模式、深度、证据和长期动作。
- 专用化升级不能删除历史场景 ID，只能增加证据或提升深度。
- 标准体系版本发生变化时，记录复核时间和变更原因。
- 每轮长期任务完成后，执行 65/65 或最新总数反向审计。
- 本矩阵不记录真实目标、凭据、攻击 payload 或外部服务信息。

## 15. 当前审计结论

- 既定 65 个场景全部进入矩阵，当前范围覆盖完整。
- Web/注入和认证授权是成熟度最高的两条主线。
- 客户端、恶意软件、云原生、密码学、API/业务逻辑和检测响应是主要薄弱点。
- 38 个引导式场景已满足当前安全化 `ready` 规则，但不等于 38 个独立深度靶场。
- 后续优先补结构性缺口和专用深度，不以继续增加名称数量为第一目标。

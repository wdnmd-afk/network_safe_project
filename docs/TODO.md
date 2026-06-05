# 项目进度 TODO

> 本文件既记录项目级工作进度，也记录每一种攻击类型 / 安全内容是否已纳入、当前做到哪一步、后续准备落到哪里。

## 1. 使用说明

后续更新本文件时，优先回答三个问题：

1. 这项内容做了没有
2. 现在做到哪一步
3. 文档、脚本、代码将来落在哪里

状态建议统一使用以下值：

- `未开始`
- `规划中`
- `进行中`
- `已完成`
- `仅案例化`
- `仅模拟化`
- `不做真实复现`

## 2. 项目级进度

### 2.1 当前阶段

当前处于：**规划与文档阶段**

目标是先把项目范围、规则、阶段拆分、内容覆盖方式和进度跟踪文档建立完整，再进入工程实现。

### 2.2 已完成

- [x] 明确项目目标：Windows 本机、Node + MySQL + Vue、monorepo
- [x] 明确约束：暂不使用 Docker，前端可挂 nginx，后端独立运行
- [x] 明确总体方向：个人学习优先
- [x] 明确场景模式：同一场景尽量提供漏洞版与修复版
- [x] 明确脚本目录方向：以场景组织，主要使用 Python 与 TypeScript
- [x] 落地根目录 `README.md`
- [x] 落地项目级 `AGENTS.md`
- [x] 落地执行文档
- [x] 落地项目范围与安全内容清单文档
- [x] 落地当前 TODO 进度文档

### 2.3 进行中

- [ ] 统一文档体系，确保后续实现前文档口径一致

### 2.4 待办清单

#### 文档与设计

- [ ] 补充技术选型与版本策略文档
- [ ] 补充实验元数据结构文档
- [ ] 补充数据库基础表设计文档
- [ ] 补充自动化测试规划文档
- [ ] 补充一期实验清单文档

#### 工程骨架

- [ ] 初始化 monorepo 基础目录
- [ ] 建立 `apps/web`
- [ ] 建立 `apps/server`
- [ ] 建立 `packages/shared`
- [ ] 建立 `labs/` 目录骨架
- [ ] 建立 `tools/lab-scripts/` 目录骨架
- [ ] 建立 `database/` 目录骨架
- [ ] 建立 `nginx/` 目录骨架

#### 一期实验重点

- [ ] Web 层漏洞一期清单
- [ ] 注入类一期清单
- [ ] 认证 / 授权一期清单
- [ ] 漏洞版 / 修复版组织规范落地
- [ ] 学习记录与验证记录结构设计

## 3. 安全内容覆盖跟踪

说明：

- `状态`：是否已纳入项目
- `落地方式`：真实交互靶场 / 脚本实验 / 本机模拟 / 案例化演示
- `当前落点`：当前已经落地的文档或进度位置
- `未来代码位置`：后续计划落到哪个目录

---

## 4. Web 层

| 内容 | 状态 | 落地方式 | 当前落点 | 未来代码位置 |
|---|---|---|---|---|
| XSS | 规划中 | 真实交互靶场 | `docs/design/project-scope-and-security-content.md` | `labs/web/xss/` |
| CSRF | 规划中 | 真实交互靶场 | `docs/design/project-scope-and-security-content.md` | `labs/web/csrf/` |
| 点击劫持 | 规划中 | 真实交互靶场 | `docs/design/project-scope-and-security-content.md` | `labs/web/clickjacking/` |
| SSRF | 规划中 | 真实交互靶场 / 脚本实验 | `docs/design/project-scope-and-security-content.md` | `labs/web/ssrf/` |
| 开放重定向 | 规划中 | 真实交互靶场 | `docs/design/project-scope-and-security-content.md` | `labs/web/open-redirect/` |
| 文件上传漏洞 | 规划中 | 真实交互靶场 | `docs/design/project-scope-and-security-content.md` | `labs/web/file-upload/` |
| 目录遍历 | 规划中 | 真实交互靶场 | `docs/design/project-scope-and-security-content.md` | `labs/web/path-traversal/` |
| 信息泄露 | 规划中 | 真实交互靶场 / 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/web/info-disclosure/` |

## 5. 注入类

| 内容 | 状态 | 落地方式 | 当前落点 | 未来代码位置 |
|---|---|---|---|---|
| SQL 注入 | 规划中 | 真实交互靶场 | `docs/design/project-scope-and-security-content.md` | `labs/web/sql-injection/` |
| NoSQL 注入 | 规划中 | 真实交互靶场 / 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/web/nosql-injection/` |
| 命令注入 | 规划中 | 真实交互靶场 / 脚本实验 | `docs/design/project-scope-and-security-content.md` | `labs/web/command-injection/` |
| LDAP 注入 | 规划中 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/web/ldap-injection/` |
| XPath 注入 | 规划中 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/web/xpath-injection/` |
| CRLF 注入 | 规划中 | 真实交互靶场 / 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/web/crlf-injection/` |
| 模板注入（SSTI） | 规划中 | 真实交互靶场 | `docs/design/project-scope-and-security-content.md` | `labs/web/ssti/` |
| XXE 注入 | 规划中 | 真实交互靶场 | `docs/design/project-scope-and-security-content.md` | `labs/web/xxe/` |

## 6. 认证 / 授权

| 内容 | 状态 | 落地方式 | 当前落点 | 未来代码位置 |
|---|---|---|---|---|
| 暴力破解 | 规划中 | 真实交互靶场 | `docs/design/project-scope-and-security-content.md` | `labs/auth/brute-force/` |
| 凭据填充 | 规划中 | 真实交互靶场 / 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/auth/credential-stuffing/` |
| 会话劫持 | 规划中 | 真实交互靶场 / 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/auth/session-hijacking/` |
| 会话固定 | 规划中 | 真实交互靶场 | `docs/design/project-scope-and-security-content.md` | `labs/auth/session-fixation/` |
| JWT 攻击 | 规划中 | 真实交互靶场 | `docs/design/project-scope-and-security-content.md` | `labs/auth/jwt/` |
| OAuth 漏洞 | 规划中 | 真实交互靶场 / 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/auth/oauth/` |
| 权限提升 | 规划中 | 真实交互靶场 | `docs/design/project-scope-and-security-content.md` | `labs/auth/privilege-escalation/` |
| IDOR | 规划中 | 真实交互靶场 | `docs/design/project-scope-and-security-content.md` | `labs/auth/idor/` |

## 7. 网络 / 传输层

| 内容 | 状态 | 落地方式 | 当前落点 | 未来代码位置 |
|---|---|---|---|---|
| DDoS | 规划中 | 案例化演示 / 本机模拟 | `docs/design/project-scope-and-security-content.md` | `labs/network/ddos/` |
| 中间人攻击 | 规划中 | 本机模拟 / 脚本实验 | `docs/design/project-scope-and-security-content.md` | `labs/network/mitm/` |
| DNS 劫持 / 污染 | 规划中 | 本机模拟 / 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/network/dns-hijack/` |
| ARP 欺骗 | 规划中 | 本机模拟 / 脚本实验 | `docs/design/project-scope-and-security-content.md` | `labs/network/arp-spoofing/` |
| 窃听攻击 | 规划中 | 本机模拟 / 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/network/eavesdropping/` |
| DNS 隧道 | 规划中 | 脚本实验 / 本机模拟 | `docs/design/project-scope-and-security-content.md` | `labs/network/dns-tunnel/` |
| 端口扫描 | 规划中 | 脚本实验 | `docs/design/project-scope-and-security-content.md` | `labs/network/port-scan/` |
| BGP 劫持 | 规划中 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/network/bgp-hijack/` |

## 8. 社会工程学

| 内容 | 状态 | 落地方式 | 当前落点 | 未来代码位置 |
|---|---|---|---|---|
| 网络钓鱼 | 规划中 | 案例化演示 / 仿真页面 | `docs/design/project-scope-and-security-content.md` | `labs/social/phishing/` |
| 鱼叉式钓鱼 | 规划中 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/social/spear-phishing/` |
| 捕鲸攻击 | 规划中 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/social/whaling/` |
| 短信钓鱼 | 规划中 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/social/smishing/` |
| 商业邮件诈骗 | 规划中 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/social/bec/` |
| 水坑攻击 | 规划中 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/social/watering-hole/` |
| 钓鱼 WiFi | 规划中 | 案例化演示 / 本机模拟 | `docs/design/project-scope-and-security-content.md` | `labs/social/rogue-wifi/` |
| 尾随 / 物理入侵 | 规划中 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/social/physical-intrusion/` |

## 9. 恶意软件

| 内容 | 状态 | 落地方式 | 当前落点 | 未来代码位置 |
|---|---|---|---|---|
| 勒索软件 | 规划中 | 案例化演示 / 安全化模拟 | `docs/design/project-scope-and-security-content.md` | `labs/malware/ransomware/` |
| 木马 | 规划中 | 案例化演示 / 安全化模拟 | `docs/design/project-scope-and-security-content.md` | `labs/malware/trojan/` |
| 蠕虫 | 规划中 | 案例化演示 / 安全化模拟 | `docs/design/project-scope-and-security-content.md` | `labs/malware/worm/` |
| 间谍软件 | 规划中 | 案例化演示 / 安全化模拟 | `docs/design/project-scope-and-security-content.md` | `labs/malware/spyware/` |
| 键盘记录器 | 规划中 | 案例化演示 / 安全化模拟 | `docs/design/project-scope-and-security-content.md` | `labs/malware/keylogger/` |
| Rootkit | 规划中 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/malware/rootkit/` |

## 10. 供应链

| 内容 | 状态 | 落地方式 | 当前落点 | 未来代码位置 |
|---|---|---|---|---|
| 依赖混淆 | 规划中 | 案例化演示 / 脚本实验 | `docs/design/project-scope-and-security-content.md` | `labs/supply-chain/dependency-confusion/` |
| 恶意包注入 | 规划中 | 案例化演示 / 脚本实验 | `docs/design/project-scope-and-security-content.md` | `labs/supply-chain/malicious-package/` |
| 更新投毒 | 规划中 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/supply-chain/update-poisoning/` |
| 硬件供应链 | 规划中 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/supply-chain/hardware/` |

## 11. AI / 新型攻击

| 内容 | 状态 | 落地方式 | 当前落点 | 未来代码位置 |
|---|---|---|---|---|
| AI 驱动攻击 | 规划中 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/ai/ai-driven-attacks/` |
| Deepfake | 规划中 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/ai/deepfake/` |
| 对抗性 AI | 规划中 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/ai/adversarial-ai/` |
| 加密劫持 | 规划中 | 案例化演示 / 本机模拟 | `docs/design/project-scope-and-security-content.md` | `labs/ai/cryptojacking/` |
| Prompt 注入 | 规划中 | 可交互演示 | `docs/design/project-scope-and-security-content.md` | `labs/ai/prompt-injection/` |

## 12. 客户端攻击

| 内容 | 状态 | 落地方式 | 当前落点 | 未来代码位置 |
|---|---|---|---|---|
| 驾车式下载 | 规划中 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/client/drive-by-download/` |
| 恶意浏览器插件 | 规划中 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/client/malicious-extension/` |
| Formjacking | 规划中 | 案例化演示 / 仿真页面 | `docs/design/project-scope-and-security-content.md` | `labs/client/formjacking/` |
| 恶意广告 | 规划中 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/client/malvertising/` |
| 浏览器 MITB | 规划中 | 案例化演示 / 本机模拟 | `docs/design/project-scope-and-security-content.md` | `labs/client/mitb/` |

## 13. 基础设施

| 内容 | 状态 | 落地方式 | 当前落点 | 未来代码位置 |
|---|---|---|---|---|
| 配置错误利用 | 规划中 | 本机模拟 / 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/infrastructure/misconfiguration/` |
| 容器逃逸 | 不做真实复现 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/infrastructure/container-escape/` |
| 云安全漏洞 | 规划中 | 案例化演示 / 本机模拟 | `docs/design/project-scope-and-security-content.md` | `labs/infrastructure/cloud-security/` |
| IoT 攻击 | 规划中 | 案例化演示 / 本机模拟 | `docs/design/project-scope-and-security-content.md` | `labs/infrastructure/iot/` |
| 零日漏洞利用 | 不做真实复现 | 案例化演示 | `docs/design/project-scope-and-security-content.md` | `labs/infrastructure/zero-day/` |

## 14. 风险与待确认

- [ ] 一期实验的具体优先级还未最终锁定
- [ ] 技术版本策略还未文档化
- [ ] 数据库表结构尚未定义
- [ ] 自动化测试边界尚未细化到工具级

## 15. 更新规则

后续每次有实质进展时，必须同时更新：

1. 项目级进度
2. 对应攻击类型 / 安全内容的状态
3. 当前落点
4. 未来代码位置

只要某一种内容开始写文档、脚本、页面或后端接口，就要在本文件里体现出来。\n"}}]}ારીઓ to=mcp__filesystem.write_file code  亿贝

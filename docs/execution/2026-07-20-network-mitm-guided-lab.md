<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 中间人攻击受控学习实验执行文档

## 1. 目标

在本机受控环境中完成 `network.mitm` 学习实验，使用固定 `scenarioKey=synthetic-handshake-interception` 对比漏洞版与修复版，帮助学习者理解客户端未验证证书链、主机名或协议降级以及对应防御策略。

本实验模式为 `simulation`，状态达到 `ready` 只代表本项目内固定学习闭环可运行、可观察、可验证，不代表具备对外攻击能力。

## 2. 范围

- 建立标准目录 `labs/network/mitm/`。
- 建立漏洞版 / 修复版通用工作台入口。
- 建立工作台配置 API 与受控评估 API。
- 评估 API 只接受固定 `scenarioKey` 和 `controlKey`。
- 关键动作写入统一 `lab_event_logs` 安全摘要。
- 建立独立只读验证脚本与自动化测试证据。
- 不新增真实目标、自由正文、凭据、Cookie、token、外部 URL、系统命令或第三方平台参数。

## 3. 操作步骤

1. 从共享目录读取 `network.mitm` 的准确字段和固定案例。
2. 生成实验元数据、README、漏洞版 / 修复版 / mock 说明和攻防文档。
3. 将 `/labs/network/mitm/vuln` 与 `/fixed` 接入通用工作台。
4. 将工作台配置和评估请求接入通用受控服务。
5. 漏洞版使用 `peer-verification-disabled` 观察 `network-mitm-risk-accepted`。
6. 修复版使用 `peer-verification-disabled` 观察 `network-mitm-defense-blocked`。
7. 修复版使用 `certificate-identity-verified` 验证正常受控流程仍可继续。
8. 评估结果写入统一事件日志，只记录固定 key、风险标签、决策和学习信号。
9. 运行独立 `verify.ts`、共享目录测试、API 测试和前端测试。

## 4. 实施建议

- 固定案例：合成握手被替换。
- 漏洞根因：客户端未验证证书链、主机名或协议降级。
- 核心防御：验证落实“TLS 身份校验、安全协议基线、证书监控和敏感通道绑定”后的正常受控流程。
- 页面只提供固定选项，不提供任意输入框。
- 未知 key 必须脱敏阻断，不得把原始未知值写入日志或响应。

## 5. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 通用工作台读取错误字段 | 前后端行为漂移 | 只从共享目录读取 `scenarioKey`、`controlKey` 和结果字段 |
| 固定案例被扩展为真实能力 | 超出项目边界 | 只使用内存中的虚拟网络拓扑和固定流量摘要，不扫描、监听或连接真实网络。 |
| 日志保存原始输入 | 产生敏感数据风险 | 只记录固定 key 和计算后的安全摘要 |
| 仅页面可访问但无法验证 | 不能标记 ready | 独立脚本、API 测试和元数据测试同时提供证据 |

## 6. 优化方案

- 复用通用受控服务和工作台，避免重复实现安全校验与日志逻辑。
- 保留本实验独立元数据、文档、固定信号和验证入口，避免共享后失去学习语义。
- 后续若扩展案例，必须先更新共享目录和本执行文档，再同步生成产物与测试。

## 7. 验证方式

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/network/mitm/verify.ts`
- `pnpm --filter @network-safe/shared test`
- 通用服务与 API 测试逐项覆盖 `network.mitm`。
- 前端 API、路由和工作台组件测试。
- `git diff --check`。
- 安全关键词扫描，确认没有外部连接、真实凭据读取、网段扫描、任意命令执行、真实恶意样本或第三方投递能力。

## 8. 完成条件

- 漏洞版和修复版页面均可访问并能观察固定差异。
- API 对固定 key 返回准确结果，对未知 key 脱敏阻断。
- 事件日志只包含安全摘要。
- 元数据、页面、API、文档和脚本入口一致。
- `verify.ts` 输出 `ok: true`。
- 本机受控自动化验证覆盖关键差异。

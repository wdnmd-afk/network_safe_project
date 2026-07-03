# 配置错误固定审计 API 执行文档

## 1. 目标

本轮目标是在 `infrastructure/misconfiguration` planned 元数据基础上，新增后端固定配置审计服务和受控 `audit` API。

API 只接受固定 `configCaseKey` 和固定 `auditPolicyKey`，返回确定性的配置暴露面观察结果，并写入统一 `lab_event_logs` 安全摘要。

本轮不实现前端页面、不新增脚本、不读取真实配置、不修改真实服务、不连接真实管理接口。

## 2. 范围

新增：

- `apps/server/src/services/misconfiguration-lab.ts`
- `apps/server/tests/misconfiguration-lab.test.ts`

修改：

- `apps/server/src/app.ts`
- `labs/infrastructure/misconfiguration/meta.json`
- `labs/infrastructure/misconfiguration/README.md`
- `labs/infrastructure/misconfiguration/vuln/README.md`
- `labs/infrastructure/misconfiguration/fixed/README.md`
- `labs/infrastructure/misconfiguration/mock/README.md`
- `labs/infrastructure/misconfiguration/docs/attack-steps.md`
- `labs/infrastructure/misconfiguration/docs/fix-notes.md`
- `labs/infrastructure/misconfiguration/docs/manual-verification.md`
- `tools/lab-scripts/infrastructure/misconfiguration/README.md`
- `packages/shared/tests/lab-metadata.test.mjs`
- `apps/server/tests/health.test.ts`
- `apps/server/tests/lab-registry.test.ts`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

## 3. 字段与固定样例

请求体只读取：

- `configCaseKey`
- `auditPolicyKey`

固定配置样例：

- `debug-console-exposed`
- `directory-index-enabled`
- `wildcard-cors-with-credentials`
- `public-admin-status`
- `verbose-error-detail`
- `default-credential-hint-visible`

固定审计策略：

- `exposure-review`
- `least-exposure-policy`
- `authenticated-admin-only`
- `strict-cors-audit`
- `safe-error-reporting`

不接收、不过滤、不解析任何真实配置文本、主机、IP、域名、端口、URL、路径、账号、密码、token、Cookie、证书、服务名或云资源 ID。

## 4. 后端实现步骤

1. 新增 `misconfiguration-lab` 服务，使用内存固定样例表和固定策略表。
2. 漏洞版返回配置暴露面可见信号，例如 `misconfiguration-debug-surface-visible`。
3. 修复版返回暴露面收敛、认证要求、CORS 收敛或安全错误信息信号。
4. 未知 key 返回 `misconfiguration-boundary-verified`，并使用 `blocked-config-case` 或 `blocked-audit-policy` 代替原始输入。
5. 在 `app.ts` 中接入 `POST /api/labs/infrastructure/misconfiguration/:variant/audit`。
6. 事件日志摘要只记录固定 key、暴露面类别、风险标签数量、审计动作、是否命中固定样例和学习信号。

## 5. 日志摘要

统一事件日志 `inputSummary` 只允许包含：

- `configCaseKey`
- `auditPolicyKey`
- `exposureCategory`
- `exposureState`
- `authRequired`
- `corsPolicyStatus`
- `errorReportingStatus`
- `riskIndicatorCount`
- `riskIndicators`
- `auditActions`
- `matchedControlledSample`
- `signal`

不得记录：

- 完整配置文件
- 真实路径
- 真实服务地址
- 真实端口清单
- 真实账号、密码、token、Cookie、证书或数据库连接串
- 本机环境、云账号、服务指纹或管理接口信息

## 6. 潜在风险分析

- 如果允许任意配置文本，API 会变成真实配置审计器，可能保存本机敏感信息。
- 如果允许主机、端口、URL 或路径，API 容易演变成扫描、枚举或管理入口探测工具。
- 如果日志保存原始请求体，可能泄露真实配置、凭据或本机路径。
- 如果修复版提供真实配置修改命令，学习者可能误操作本机服务。

本轮通过固定 key、内存样例、日志摘要白名单和安全边界测试降低这些风险。

## 7. 验证方式

最小必要验证：

- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/misconfiguration-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- 配置错误安全关键词扫描，确认未新增真实配置读取、真实配置修改、真实服务扫描、真实管理接口连接、弱口令测试、服务枚举或可复用攻击脚本。

## 8. 本轮完成条件

- 后端固定配置审计服务存在，并只处理固定 key。
- 受控 `audit` API 已接入登录校验和统一事件日志。
- 元数据从 `planned` 更新为 `in-progress`，只登记 docs 和 api 入口。
- 服务端测试覆盖漏洞版信号、修复版收敛、认证要求阻断、未知 key 脱敏阻断、登录要求和日志摘要脱敏。
- 文档同步 API 阶段状态，并继续明确不提供前端页面、脚本、真实配置读取或真实服务扫描能力。

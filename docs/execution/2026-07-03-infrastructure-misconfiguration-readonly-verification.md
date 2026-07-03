# 配置错误只读一致性验证执行文档

## 1. 目标

本轮目标是在 `infrastructure/misconfiguration` 已具备前端固定配置审计工作台、后端受控 `audit` API 和 Playwright 页面级差异验证的基础上，补齐本机只读一致性验证脚本。

验证脚本只读取仓库内元数据、文档、前端、后端和测试文件，确认配置错误实验的入口、固定 key、自动化证据和安全边界保持一致。

本轮不创建 `exploit.py`，不读取真实配置，不修改真实 nginx、MySQL、Node、Windows 服务或云账号配置，不扫描本机端口、局域网、外部 IP、域名、云资源或服务指纹，不连接真实管理接口，不发起 HTTP 请求。

## 2. 范围

本轮新增或修改：

- `docs/execution/2026-07-03-infrastructure-misconfiguration-readonly-verification.md`
- `tools/lab-scripts/infrastructure/misconfiguration/verify.ts`
- `tools/lab-scripts/infrastructure/misconfiguration/README.md`
- `labs/infrastructure/misconfiguration/meta.json`
- `packages/shared/tests/lab-metadata.test.mjs`
- `labs/infrastructure/misconfiguration/README.md`
- `labs/infrastructure/misconfiguration/vuln/README.md`
- `labs/infrastructure/misconfiguration/fixed/README.md`
- `labs/infrastructure/misconfiguration/mock/README.md`
- `labs/infrastructure/misconfiguration/docs/attack-steps.md`
- `labs/infrastructure/misconfiguration/docs/manual-verification.md`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

本轮不包含：

- 不新增攻击脚本、扫描脚本、弱口令测试脚本、服务枚举脚本或配置修改脚本。
- 不新增数据库迁移。
- 不改变后端固定审计 API 字段。
- 不把实验标记为 `ready`。
- 不提供任意配置文本、主机、IP、域名、端口、URL、路径、账号、密码、token、Cookie、证书、上传、下载、扫描、连接、部署或重载入口。

## 3. 已确认上下文

- 元数据实验 key 为 `infrastructure.misconfiguration`，模式为 `simulation`，状态为 `in-progress`。
- 前端页面入口为 `/labs/infrastructure/misconfiguration/vuln` 与 `/labs/infrastructure/misconfiguration/fixed`。
- 后端 API 为 `POST /api/labs/infrastructure/misconfiguration/:variant/audit`。
- 前端请求体只包含固定 `configCaseKey` 和固定 `auditPolicyKey`。
- Playwright 已覆盖漏洞版固定暴露信号与修复版固定审计路径，并断言页面没有文本输入框。
- 当前 scripts 入口为空，本轮将只登记本机只读一致性验证脚本。

## 4. 操作步骤

1. 新增 `tools/lab-scripts/infrastructure/misconfiguration/verify.ts`。
2. 脚本使用共享 `parseLabMetadataJson` 和 `validateLabMetadata` 校验元数据结构。
3. 脚本检查 web 入口、api 入口、docs 入口和 scripts 入口与当前文件一致。
4. 脚本检查 Playwright、API 测试和只读脚本验证三类自动化证据。
5. 脚本检查 `variants[].supportsAutomation` 仍为 `false`，避免把只读脚本误标为攻击脚本自动化。
6. 脚本检查固定 `configCaseKey`、固定 `auditPolicyKey` 和预期学习信号在文档或实现中可见。
7. 脚本检查前端 API client 只提交 `configCaseKey` 和 `auditPolicyKey`。
8. 脚本检查后端路由接入统一事件日志安全摘要。
9. 脚本检查 Playwright 用例仍包含配置错误页面差异验证和无文本输入框断言。
10. 脚本检查不存在 `exploit.py`。
11. 脚本扫描相关实现文件中是否出现真实配置读取、真实服务扫描、真实管理接口连接、命令执行或自由输入控件。
12. 更新元数据 scripts 入口和 `scriptVerification` 自动化证据。
13. 更新共享元数据测试和相关文档。
14. 执行最小必要验证后提交。

## 5. 实施建议

- 复用 `supply-chain/dependency-confusion`、`ai/prompt-injection` 等只读一致性验证脚本的结构。
- 脚本只使用 `readFileSync` 读取仓库内相对路径文件，不读取 `.env`、真实服务配置、系统目录、云凭据或本机路径。
- 脚本不发起 HTTP 请求，不调用前后端 API，不启动服务，不执行系统命令。
- `entrypoints.scripts` 只登记 `misconfiguration-verify`。
- `variants[].supportsAutomation` 保持 `false`，因为该字段代表攻击脚本自动化能力，不代表只读一致性验证。
- 本轮仍保持 `in-progress`，后续如需 `ready` 收口，应另写 ready 审计执行文档。

## 6. 潜在风险

- 如果脚本检查范围过窄，可能无法发现元数据、文档和实现之间的断层。
- 如果脚本检查范围过宽，可能因为其他实验中的本机测试 URL 或历史文档误报。
- 如果把只读验证脚本误解为攻击脚本自动化，会导致元数据语义混乱。
- 如果脚本读取真实配置、系统路径、`.env` 或发起 HTTP 请求，会突破当前安全边界。
- 如果在文档中继续声明未提供 `verify.ts`，会与新增脚本入口矛盾。

## 7. 优化方案

- 本轮先补只读一致性验证，后续可执行 simulation ready 收口审计。
- 后续若 `platform.spec.mjs` 继续膨胀，可按实验类别拆分 e2e spec，再同步验证脚本中的证据路径。
- 后续若配置错误实验进入 `ready`，只读脚本应同步校验 ready 状态和 ready 边界说明。

## 8. 验证方式

本轮最小必要验证：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/infrastructure/misconfiguration/verify.ts`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/web exec vitest run tests/misconfiguration-api.test.ts tests/misconfiguration-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/testing test`
- `pnpm --filter @network-safe/server test -- tests/misconfiguration-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- 配置错误相关变更安全关键词扫描，确认未新增真实配置读取、真实配置修改、真实服务扫描、真实管理接口连接、弱口令测试、服务枚举、攻击脚本或可复用利用流程。

## 9. 本轮完成条件

- 只读一致性验证脚本可输出 `ok: true` 的 JSON 报告。
- 元数据登记 `misconfiguration-verify` scripts 入口和 `scriptVerification` 自动化证据。
- `entrypoints.scripts` 只包含本机只读验证脚本。
- `variants[].supportsAutomation` 仍为 `false`。
- 文档不再把 `verify.ts` 描述为缺失项，而是说明它是只读一致性验证，不是攻击脚本。
- 最小必要验证通过后再提交。
